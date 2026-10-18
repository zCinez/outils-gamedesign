/* ZIP metadata is read first; entries are inflated one at a time in the worker.
 * Checks include bounds, declared/actual sizes and CRC-32 before parsing JSON.
 */
(() => {
  const MiB = 1024 * 1024;
  const limits = { archive: 512 * MiB, entry: 64 * MiB, expanded: 2 * 1024 * MiB, directory: 32 * MiB, entries: 65000 };
  const decoder = new TextDecoder("utf-8");
  const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  async function bytes(file, start, length) {
    if (start < 0 || length < 0 || start + length > file.size) throw new Error("Archive ZIP tronquée ou invalide.");
    const buffer = await file.slice(start, start + length).arrayBuffer();
    if (buffer.byteLength !== length) throw new Error("Lecture incomplète de l’archive.");
    return new Uint8Array(buffer);
  }
  async function directory(file) {
    if (file.size > limits.archive) throw new Error("Ce ZIP dépasse la limite de 512 Mo.");
    if (file.size < 22) throw new Error("Ce fichier n’est pas une archive ZIP valide.");
    const tail = await bytes(file, Math.max(0, file.size - 65557), Math.min(file.size, 65557));
    const view = new DataView(tail.buffer);
    let end = tail.length - 22;
    for (; end >= 0; end--) {
      if (view.getUint32(end, true) === 0x06054b50 && end + 22 + view.getUint16(end + 20, true) === tail.length) break;
    }
    if (end < 0) throw new Error("Archive ZIP invalide : répertoire introuvable.");
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error("Les ZIP répartis sur plusieurs volumes ne sont pas pris en charge.");
    const count = view.getUint16(end + 10, true);
    const size = view.getUint32(end + 12, true);
    const offset = view.getUint32(end + 16, true);
    if (count === 65535 || size === 0xffffffff || offset === 0xffffffff) throw new Error("Cet export utilise ZIP64. Fournis un ZIP standard de moins de 65 000 fichiers.");
    if (count !== view.getUint16(end + 8, true) || count > limits.entries || size > limits.directory) throw new Error("Le répertoire ZIP dépasse les limites de l’import.");
    const endOffset = file.size - tail.length + end;
    if (offset + size > endOffset) throw new Error("Le répertoire de l’archive est endommagé.");
    const content = await bytes(file, offset, size);
    const central = new DataView(content.buffer);
    const entries = [];
    let cursor = 0, expanded = 0;
    for (let index = 0; index < count; index++) {
      if (cursor + 46 > size || central.getUint32(cursor, true) !== 0x02014b50) throw new Error("Entrée ZIP invalide.");
      const nameLength = central.getUint16(cursor + 28, true);
      const next = cursor + 46 + nameLength + central.getUint16(cursor + 30, true) + central.getUint16(cursor + 32, true);
      if (next > size) throw new Error("Nom de fichier ZIP tronqué.");
      const name = decoder.decode(content.subarray(cursor + 46, cursor + 46 + nameLength));
      if (StatGMImportFormat.isPlayerFile(name)) {
        const entry = {
          name, flags: central.getUint16(cursor + 8, true), method: central.getUint16(cursor + 10, true),
          crc: central.getUint32(cursor + 16, true), compressed: central.getUint32(cursor + 20, true),
          size: central.getUint32(cursor + 24, true), offset: central.getUint32(cursor + 42, true), directoryOffset: offset
        };
        if (entry.flags & 1) throw new Error("Les archives protégées par un mot de passe ne sont pas prises en charge.");
        if (![0, 8].includes(entry.method)) throw new Error("Compression ZIP non prise en charge. Utilise un ZIP standard (Deflate).");
        if (entry.size > limits.entry) throw new Error(`${name} dépasse la limite de 64 Mo par fichier joueur.`);
        if (entry.offset + 30 > offset || entry.compressed > file.size) throw new Error("Emplacement de fichier ZIP invalide.");
        expanded += entry.size;
        if (expanded > limits.expanded) throw new Error("Les données décompressées dépassent la limite de 2 Go.");
        entries.push(entry);
      }
      cursor = next;
    }
    if (!entries.length) throw new Error("Aucun fichier gdstats_<UUID>.json trouvé dans cette archive.");
    return { entries, ignored: count - entries.length, expanded };
  }
  async function readJSON(file, entry) {
    const header = await bytes(file, entry.offset, 30);
    const view = new DataView(header.buffer);
    if (view.getUint32(0, true) !== 0x04034b50 || view.getUint16(8, true) !== entry.method || (view.getUint16(6, true) & 1)) throw new Error("En-tête ZIP invalide.");
    const start = entry.offset + 30 + view.getUint16(26, true) + view.getUint16(28, true);
    if (start + entry.compressed > entry.directoryOffset) throw new Error("Données ZIP tronquées.");
    const text = new TextDecoder("utf-8", { fatal: true });
    const chunks = [];
    let crc = 0xffffffff, size = 0;
    function consume(chunk) {
      size += chunk.length;
      if (size > entry.size || size > limits.entry) throw new Error("La taille réelle dépasse celle annoncée dans le ZIP.");
      for (const byte of chunk) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
      chunks.push(text.decode(chunk, { stream: true }));
    }
    const inflate = entry.method === 8 ? new fflate.Inflate(consume) : null;
    // Small slices bound decompression buffers, even for highly compressed exports.
    for (let position = 0; position < entry.compressed; position += 16384) {
      const chunk = await bytes(file, start + position, Math.min(16384, entry.compressed - position));
      if (inflate) inflate.push(chunk, position + chunk.length === entry.compressed);
      else consume(chunk);
    }
    if (!entry.compressed && inflate) inflate.push(new Uint8Array(), true);
    if (size !== entry.size || ((crc ^ 0xffffffff) >>> 0) !== entry.crc) throw new Error("Fichier endommagé : la vérification d’intégrité a échoué.");
    chunks.push(text.decode());
    const source = chunks.join("");
    try { return { data: JSON.parse(source), bytes: size }; }
    catch { throw new Error("Le fichier ne contient pas un JSON valide."); }
  }
  globalThis.StatGMZip = { directory, readJSON, limits };
})();

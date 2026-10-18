/* Versioned, content-addressed gzip blocks. Shared by the browser worker and tests. */
(() => {
  const BLOCK_BYTES = 256 * 1024;
  const MAX_GZIP_BYTES = BLOCK_BYTES + 1024;
  const MAX_JSON_BYTES = 70 * 1024 * 1024;
  const encoder = new TextEncoder();
  const hex = bytes => [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
  async function hash(bytes) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))); }
  function base64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }
  function unbase64(value) {
    if (typeof value !== "string" || value.length > Math.ceil(MAX_GZIP_BYTES / 3) * 4) throw new Error("Bloc cloud trop volumineux.");
    const binary = atob(value), bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  async function encode(bytes) {
    if (bytes.length > BLOCK_BYTES) throw new Error("Bloc décompressé trop volumineux.");
    const compressed = fflate.gzipSync(bytes, { level: 6, mtime: 0 });
    return { hash: await hash(compressed), bytes: compressed.length, rawBytes: bytes.length, data: compressed };
  }
  async function decode(chunk, descriptor) {
    const bytes = chunk.data instanceof Uint8Array ? chunk.data : unbase64(chunk.data);
    if (bytes.length !== descriptor.bytes || bytes.length > MAX_GZIP_BYTES || await hash(bytes) !== descriptor.hash) throw new Error("L’intégrité d’un bloc cloud est incorrecte.");
    // The gzip footer is checked before allocation, then verified against the result.
    if (bytes.length < 18) throw new Error("Bloc gzip invalide.");
    const declared = new DataView(bytes.buffer, bytes.byteOffset + bytes.length - 4, 4).getUint32(0, true);
    if (declared !== descriptor.rawBytes || declared > BLOCK_BYTES) throw new Error("Taille du bloc cloud incorrecte.");
    const raw = fflate.gunzipSync(bytes, { out: new Uint8Array(declared) });
    if (raw.length !== declared) throw new Error("Bloc cloud incomplet.");
    return raw;
  }
  function writer(emit) {
    let buffer = new Uint8Array(BLOCK_BYTES), used = 0;
    async function flush() {
      if (!used) return;
      await emit(await encode(buffer.subarray(0, used)));
      used = 0;
    }
    return {
      async append(value) {
        const bytes = encoder.encode(JSON.stringify(value) + "\n");
        if (bytes.length > MAX_JSON_BYTES) throw new Error("Un fichier joueur dépasse la limite cloud.");
        for (let offset = 0; offset < bytes.length;) {
          const length = Math.min(bytes.length - offset, BLOCK_BYTES - used);
          buffer.set(bytes.subarray(offset, offset + length), used); used += length; offset += length;
          if (used === BLOCK_BYTES) await flush();
        }
      }, flush
    };
  }
  async function readLines(descriptors, getChunk, onLine) {
    let remainder = "", decoder = new TextDecoder("utf-8", { fatal: true });
    for (const descriptor of descriptors) {
      const raw = await decode(await getChunk(descriptor), descriptor);
      remainder += decoder.decode(raw, { stream: true });
      let index;
      while ((index = remainder.indexOf("\n")) !== -1) {
        const line = remainder.slice(0, index); remainder = remainder.slice(index + 1);
        if (line) await onLine(JSON.parse(line), line.length * 2);
      }
      if (remainder.length > MAX_JSON_BYTES) throw new Error("Fichier joueur cloud trop volumineux.");
    }
    remainder += decoder.decode();
    if (remainder) throw new Error("Données cloud incomplètes.");
  }
  globalThis.StatGMCloudCodec = { BLOCK_BYTES, MAX_GZIP_BYTES, encode, decode, hash, base64, unbase64, writer, readLines };
})();

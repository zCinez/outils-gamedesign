importScripts("vendor/fflate-0.8.2.js", "player-history.js?v=20261006c", "archive-db.js?v=20261006c", "import-format.js?v=20261006a", "zip-reader.js?v=20261001a");

self.onmessage = async ({ data: { file, datasetId, previousDatasetId } }) => {
  try {
    const db = StatGMArchiveDB, history = StatGMHistory;
    const previousActive = await db.readActive();
    if (previousDatasetId !== undefined && (previousActive?.datasetId || null) !== previousDatasetId) throw new Error("L’import actif a changé. Réessaie.");
    if (previousActive?.recordsLocal === false) throw new Error("L’historique doit être disponible localement avant l’import.");
    const previous = previousActive ? await db.readPlayers(previousActive.datasetId) : [];
    const oldUUIDs = new Set(previous.map(player=>player.uuid));
    const baseCount = previousActive?.fileCount || 0, importedAt = new Date().toISOString(), exportId = crypto.randomUUID();
    const exportInfo = {exportId,filename:file.name,importedAt,exportedAt:StatGMImportFormat.exportDate(file.name)};
    const hashes = [], archiveUUIDs=new Set();
    const hash = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(byte=>byte.toString(16).padStart(2,"0")).join("");
    postMessage({ type: "progress", percent: 0, label: "Vérification de l’archive…", detail: file.name });
    const directory = await StatGMZip.directory(file);
    await StatGMArchiveDB.open();
    const players = new Map(previous.map(player=>[player.uuid,{...player,datasetId}]));
    const dirty = new Map();
    let records = [], batchBytes = 0, processed = 0, lastProgress = 0, nameless = 0;
    async function flush() {
      if (!records.length) return;
      await StatGMArchiveDB.writeBatch([...dirty.values()], records);
      dirty.clear(); records = []; batchBytes = 0;
    }
    function identityFor(identity, snapshot, sequence, additional) {
      const current=players.get(identity.uuid);
      const newer=!current || (snapshot.sortTime!==null && (current.latestStamp==null || snapshot.sortTime>current.latestStamp)) || (snapshot.sortTime===(current.latestStamp??null) && sequence>=(current.lastSequence??-1));
      const player={...current,datasetId,uuid:identity.uuid,fileCount:(current?.fileCount||0)+additional};
      if(newer) Object.assign(player,{name:identity.hasName?identity.name:current?.name||identity.name,hasName:identity.hasName||current?.hasName||false,grade:identity.grade||current?.grade||"",completion:identity.completion,firstPlayedMs:identity.firstPlayedMs,latestStamp:snapshot.sortTime,lastSequence:sequence});
      players.set(player.uuid,player); dirty.set(player.uuid,player);
    }
    for (const entry of directory.entries) {
      try {
        const { data, bytes } = await StatGMZip.readJSON(file, entry);
        const identity = StatGMImportFormat.parsePlayer(data, entry.name);
        archiveUUIDs.add(identity.uuid);
        const sequence=baseCount+processed, record={datasetId,sequence,uuid:identity.uuid,source:entry.name,bytes,data};
        record.snapshot=history.descriptor(record,exportInfo);
        identityFor(identity,record.snapshot,sequence,1);
        records.push(record); hashes.push(`${identity.uuid}:${await hash(JSON.stringify(data))}`);
        batchBytes += bytes;
        processed++;
        if (records.length >= 100 || batchBytes >= 4 * 1024 * 1024) await flush();
      } catch (error) {
        throw new Error(`${entry.name} : ${error.message}`, { cause: error });
      }
      if (performance.now() - lastProgress > 100 || processed === directory.entries.length) {
        postMessage({ type: "progress", percent: Math.round(processed / directory.entries.length * 65), label: "Import des nouveaux relevés…", detail: `${processed.toLocaleString("fr-FR")} / ${directory.entries.length.toLocaleString("fr-FR")} fichiers · ${players.size.toLocaleString("fr-FR")} joueurs` });
        lastProgress = performance.now();
      }
    }
    const fingerprint=await hash(hashes.sort().join("\n"));
    const previousExports=previousActive?.exports || (previousActive?[{exportId:previousActive.datasetId,filename:previousActive.filename,importedAt:previousActive.importedAt,exportedAt:previousActive.exportedAt,fileCount:previousActive.fileCount}]:[]);
    if(previousExports.some(item=>item.fingerprint===fingerprint)){postMessage({type:"unchanged",message:"Cet export est déjà présent dans l’historique. Aucun relevé ajouté."});return;}
    await flush();
    if(previousActive){
      const legacyHashes=previousExports.length===1 && !previousExports[0].fingerprint ? [] : null;
      let after=null,copied=0;
      do{
        const batch=await db.readRecordPage(previousActive.datasetId,after);
        for(const old of batch.rows){
          const record={...old,datasetId};record.snapshot=history.descriptor(record,previousActive);
          if(legacyHashes)legacyHashes.push(`${record.uuid}:${await hash(JSON.stringify(record.data))}`);
          identityFor(StatGMImportFormat.parsePlayer(record.data,record.source),record.snapshot,record.sequence,0);
          records.push(record);copied++;
        }
        await flush();after=batch.next;
        postMessage({type:"progress",percent:65+Math.round(copied/Math.max(1,baseCount)*30),label:"Conservation de l’historique…",detail:`${copied.toLocaleString("fr-FR")} relevés précédents conservés`});
      }while(after);
      if(copied!==baseCount)throw new Error("L’historique précédent est incomplet. Il est conservé ; l’import n’a pas été activé.");
      if(legacyHashes){
        previousExports[0]={...previousExports[0],fingerprint:await hash(legacyHashes.sort().join("\n"))};
        if(previousExports[0].fingerprint===fingerprint){postMessage({type:"unchanged",message:"Cet export est déjà présent dans l’historique. Aucun relevé ajouté."});return;}
      }
      const inherited=await db.readMeta(`plan:${previousActive.datasetId}`)||await db.readMeta(`manifest:${previousActive.datasetId}`);
      if(inherited?.chunks)await db.writeMeta(`inherited:${datasetId}`,{baseCount,chunks:inherited.chunks.filter(chunk=>chunk.kind==="records"),legacy:previousExports[0]});
    }
    for (const player of players.values()) if (!player.hasName) nameless++;
    postMessage({ type: "ready", summary: {
      datasetId, filename: file.name, archiveBytes: file.size, expandedBytes: directory.expanded,
      importedAt, exportedAt: exportInfo.exportedAt,
      playerCount: players.size, fileCount: baseCount+processed, newFileCount:processed, duplicates: processed-archiveUUIDs.size, ignored: directory.ignored, nameless,
      newPlayerCount:[...players.keys()].filter(uuid=>!oldUUIDs.has(uuid)).length,
      exports:[...previousExports,{...exportInfo,fingerprint,fileCount:processed}],historyVersion:1
    } });
  } catch (error) {
    const quota = error.name === "QuotaExceededError" || error.cause?.name === "QuotaExceededError";
    postMessage({ type: "error", message: quota ? "L’espace disponible dans ce navigateur est insuffisant pour cet export." : error.message });
  }
};

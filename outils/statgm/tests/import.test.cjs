const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { File } = require("node:buffer");
const fflate = require("../vendor/fflate-0.8.2.js");

const context = vm.createContext({ TextDecoder, Uint8Array, Uint32Array, DataView, Date, fflate });
for (const name of ["import-format.js", "zip-reader.js", "player-history.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", name), "utf8"), context);
const format = context.StatGMImportFormat;
const zip = context.StatGMZip;
const uuid = index => `${index.toString(16).padStart(8, "0")}-1234-4000-8000-0123456789ab`;
const filename = "Export_01-10-2026-14-30-450.zip";
const playerPath = index => `Export/players/gdstats_${uuid(index)}.json`;
const encode = data => fflate.strToU8(JSON.stringify(data));
const archive = (files, name = filename, level = 6) => new File([fflate.zipSync(files, { level })], name);

(async () => {
  assert.equal(format.normalizeUUID("853C80EF3C3749FDAA49938B674ADAE6"), "853c80ef-3c37-49fd-aa49-938b674adae6");
  assert.equal(format.normalizeUUID("not-an-uuid"), null);
  assert.equal(format.parsePlayer({ player: { name: "Élodie" } }, playerPath(1)).name, "Élodie");
  assert.equal(format.parsePlayer({ profile: { playerName: "Neo" } }, playerPath(1)).name, "Neo");
  assert.equal(format.parsePlayer({ stats: { kills: 3 } }, playerPath(1)).hasName, false);
  assert.throws(() => format.parsePlayer({ player: { uuid: uuid(2) } }, playerPath(1)), /correspond/);
  assert.throws(() => format.parsePlayer([], playerPath(1)), /objet/);
  assert.ok(format.exportDate(filename));
  assert.equal(format.exportDate("Export_31-02-2026-14-30-450.zip"), null);
  assert.equal(format.exportDate("renamed.zip"), null);
  assert.equal(format.extractCompletion({ progression: { score_0_100: 84, completion_percent: 51 }, quests: { completion_percent: 99 } }), 51);
  assert.equal(format.extractCompletion({ progression: { completion_percent: 0 }, quests: { completion_percent: 51 } }), 0);
  assert.equal(format.extractCompletion({ quests: { completion_percent: '51.5' } }), 51.5);
  for (const value of [undefined, null, '', ' ', false, -1, 101, 'abc', {}, []]) assert.equal(format.extractCompletion({ progression: { completion_percent: value } }), null);
  assert.equal(format.parsePlayer({ quests: { completion_percent: 42 } }, playerPath(1)).completion, 42);
  assert.equal(format.parsePlayer({ player: { first_played_ms: 1779543203380 } }, playerPath(1)).firstPlayedMs, 1779543203380);
  for (const value of [undefined, null, 0, -1, '', '1779543203380', false, Infinity, 8640000000000001]) assert.equal(format.extractFirstPlayed({player:{first_played_ms:value}}), null);

  const files = {};
  for (let index = 1; index <= 5500; index++) {
    files[playerPath(index)] = encode({ player: { uuid: uuid(index), name: `Joueur_${String(index).padStart(4, "0")}`, first_played_ms: 1779543203380 + index }, progression: { completion_percent: index % 101 }, profile: { vault_balance: index * 2 }, stats: { kills: index, data: "x".repeat(512) } });
  }
  files[`duplicate/gdstats_${uuid(1).replace(/-/g, "")}.json`] = encode({ player: { uuid: uuid(1), name: "Joueur_0001" }, other_stats: { coins: 25 } });
  files["readme.txt"] = fflate.strToU8("Non-player metadata");
  files[`__MACOSX/gdstats_${uuid(1)}.json`] = fflate.strToU8("ignored");
  const large = archive(files);
  const started = performance.now();
  const directory = await zip.directory(large);
  assert.equal(directory.entries.length, 5501);
  assert.equal(directory.ignored, 2);
  const identities = new Set();
  for (const entry of directory.entries) {
    const parsed = await zip.readJSON(large, entry);
    identities.add(format.parsePlayer(parsed.data, entry.name).uuid);
  }
  assert.equal(identities.size, 5500);
  console.log(`PASS: 5,501 nested/deflated player files, 5,500 unique UUIDs (${Math.round(performance.now() - started)} ms).`);

  const savedPlayers = new Map(), workerMessages = []; let savedRecords = 0;
  const workerContext = vm.createContext({
    performance, crypto, TextEncoder, Uint8Array, StatGMImportFormat: format, StatGMZip: zip, StatGMHistory:context.StatGMHistory,
    StatGMArchiveDB: { open: async () => {}, readActive:async()=>null, writeBatch: async (players, records) => { for (const player of players) savedPlayers.set(player.uuid, player); savedRecords += records.length; } },
    importScripts() {}, postMessage: message => workerMessages.push(message)
  });
  workerContext.self = workerContext;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'import-worker.js'), 'utf8'), workerContext);
  await workerContext.onmessage({ data: { file: large, datasetId: 'import-test' } });
  assert.equal(workerMessages.at(-1).type, 'ready');
  assert.equal(savedPlayers.size, 5500); assert.equal(savedRecords, 5501);
  assert.equal(savedPlayers.get(uuid(2)).completion, 2);
  assert.equal(savedPlayers.get(uuid(101)).completion, 0);
  assert.equal(savedPlayers.get(uuid(1)).completion, null, 'The last duplicate file defines completion, including unavailable data.');
  assert.equal(savedPlayers.get(uuid(2)).firstPlayedMs, 1779543203382);
  assert.equal(savedPlayers.get(uuid(1)).firstPlayedMs, null, 'First connection follows the last duplicate file shown by default.');
  console.log('PASS: real import worker persists completion and first connection for 5,500 players, preserves unavailable data and uses the last duplicate file.');

  const stored = archive({ [playerPath(1)]: encode({ player: { uuid: uuid(1), name: "Stored" } }) }, filename, 0);
  const storedEntry = (await zip.directory(stored)).entries[0];
  assert.equal((await zip.readJSON(stored, storedEntry)).data.player.name, "Stored");
  const streamChunks = [];
  const zipper = new fflate.Zip((error, chunk) => { if (error) throw error; streamChunks.push(chunk); });
  const streamEntry = new fflate.ZipDeflate(playerPath(1));
  zipper.add(streamEntry);
  streamEntry.push(encode({ player: { uuid: uuid(1), name: "Élodie" } }), true);
  zipper.end();
  const streamed = new File(streamChunks, filename);
  const streamedEntry = (await zip.directory(streamed)).entries[0];
  assert.equal((await zip.readJSON(streamed, streamedEntry)).data.player.name, "Élodie");
  const badCRCBytes = new Uint8Array(await stored.arrayBuffer());
  const headerView = new DataView(badCRCBytes.buffer);
  const dataOffset = 30 + headerView.getUint16(26, true) + headerView.getUint16(28, true);
  badCRCBytes[dataOffset + 4] ^= 1;
  const badCRC = new File([badCRCBytes], "corrupt.zip");
  await assert.rejects(() => zip.readJSON(badCRC, storedEntry), /intégrité/);
  await assert.rejects(() => zip.directory(new File([badCRCBytes.slice(0, -12)], "truncated.zip")), /invalide/);
  await assert.rejects(() => zip.directory(new File(["not a zip"], "fake.zip")), /valide/);
  await assert.rejects(() => zip.directory(archive({ "other.json": encode({}) })), /Aucun fichier/);
  const invalidJSON = archive({ [playerPath(1)]: fflate.strToU8("{broken") });
  await assert.rejects(async () => zip.readJSON(invalidJSON, (await zip.directory(invalidJSON)).entries[0]), /JSON valide/);

  const sizeBytes = new Uint8Array(await stored.arrayBuffer());
  const sizeView = new DataView(sizeBytes.buffer);
  const centralOffset = sizeView.getUint32(sizeBytes.length - 22 + 16, true);
  sizeView.setUint32(centralOffset + 24, zip.limits.entry + 1, true);
  await assert.rejects(() => zip.directory(new File([sizeBytes], "oversized-entry.zip")), /64 Mo/);
  sizeView.setUint32(centralOffset + 24, storedEntry.size - 1, true);
  const forged = new File([sizeBytes], "forged-size.zip");
  await assert.rejects(async () => zip.readJSON(forged, (await zip.directory(forged)).entries[0]), /taille réelle/);
  const encryptedBytes = new Uint8Array(await stored.arrayBuffer());
  new DataView(encryptedBytes.buffer).setUint16(centralOffset + 8, 1, true);
  await assert.rejects(() => zip.directory(new File([encryptedBytes], "encrypted.zip")), /mot de passe/);
  const zip64Bytes = new Uint8Array(await stored.arrayBuffer());
  new DataView(zip64Bytes.buffer).setUint16(zip64Bytes.length - 22 + 10, 65535, true);
  await assert.rejects(() => zip.directory(new File([zip64Bytes], "zip64.zip")), /ZIP64/);
  console.log("PASS: stored/streamed ZIP, UUID conflicts, UTF-8, missing names, dates, CRC errors, truncated archives, invalid JSON, size limits, forged sizes, encryption and ZIP64 rejection.");

  if (process.argv[2]) {
    const target = path.resolve(process.argv[2]);
    fs.mkdirSync(target, { recursive: true });
    const write = async (name, file) => fs.writeFileSync(path.join(target, name), new Uint8Array(await file.arrayBuffer()));
    await write(filename, large);
    await write("corrupt.zip", badCRC);
    const partiallyInvalid = Object.fromEntries(Object.entries(files).slice(0, 150));
    partiallyInvalid[playerPath(151)] = fflate.strToU8("{broken");
    await write("invalid-json.zip", archive(partiallyInvalid));
    await write("uuid-conflict.zip", archive({ [playerPath(1)]: encode({ player: { uuid: uuid(2), name: "Wrong" } }) }));
    await write("renamed.zip", archive({ [playerPath(1)]: encode({ player: { uuid: uuid(1), name: "<img src=x onerror=alert(1)>" }, stats: { value: 42 } }) }));
    const publicUUID = "853c80ef-3c37-49fd-aa49-938b674adae6";
    await write("avatar-demo.zip", archive({ [`gdstats_${publicUUID}.json`]: encode({ player: { uuid: publicUUID, name: "Demo_Minecraft" }, stats: { kills: 10 } }) }));
    console.log(`Browser fixtures: ${target}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),fflate=require('../vendor/fflate-0.8.2.js'),{File}=require('node:buffer');
const context=vm.createContext({Date,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,crypto,performance,fflate});
for(const name of ['player-history.js','import-format.js','zip-reader.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context);
const h=context.StatGMHistory, datasets=new Map(),meta=new Map();let active=null;
const store=id=>{if(!datasets.has(id))datasets.set(id,{players:new Map(),records:new Map()});return datasets.get(id);};
context.StatGMArchiveDB={open:async()=>{},readActive:async()=>active,readPlayers:async id=>[...store(id).players.values()],readMeta:async key=>meta.get(key),writeMeta:async(key,value)=>meta.set(key,value),
 writeBatch:async(players,records)=>{for(const row of players)store(row.datasetId).players.set(row.uuid,structuredClone(row));for(const row of records)store(row.datasetId).records.set(row.sequence,structuredClone(row));},
 readRecordPage:async(id,after)=>({rows:[...store(id).records.values()],next:null})};
context.importScripts=()=>{};context.self=context;const messages=[];context.postMessage=message=>messages.push(message);
vm.runInContext(fs.readFileSync(path.join(root,'import-worker.js'),'utf8'),context);
const uuid=i=>`${String(i).padStart(8,'0')}-1234-4000-8000-0123456789ab`;
const data=(i,date,completion,earned)=>({exported_at_iso:date,player:{uuid:uuid(i),name:`Test_${i}`,first_played_ms:1779543203380},progression:{completion_percent:completion},economy:{vault_gained_total_plugin:earned}});
const zip=(rows,name='Export_06-10-2026-10-00-000.zip')=>new File([fflate.zipSync(Object.fromEntries(rows.map(row=>[`gdstats_${row.player.uuid}.json`,fflate.strToU8(JSON.stringify(row))])))],name);
async function importRows(rows,id){messages.length=0;await context.onmessage({data:{file:rows instanceof File?rows:zip(rows),datasetId:id,previousDatasetId:active?.datasetId||null}});return messages.at(-1);}
(async()=>{
 const initial=[data(1,'2026-10-02T08:00:00',20,100),data(2,'2026-10-02T08:00:00',30,200)];
 let result=await importRows(initial,'first');assert.equal(result.type,'ready');active=result.summary;const before=JSON.stringify([...store('first').records.values()].map(row=>row.data));
 const originalActive=active;active={...active,exports:undefined,historyVersion:undefined};
 result=await importRows(zip(initial,'legacy-renamed.zip'),'legacy-duplicate');assert.equal(result.type,'unchanged','An existing import from before the history feature must not be duplicated.');active=originalActive;
 result=await importRows([data(1,'2026-10-06T08:00:00',51,300)],'second');assert.equal(result.type,'ready');active=result.summary;
 assert.equal(active.playerCount,2);assert.equal(active.fileCount,3);assert.equal(active.exports.length,2);assert.equal(store('second').players.get(uuid(1)).completion,51);
 assert.equal(store('second').players.get(uuid(2)).completion,30,'Players absent from a later export retain their history.');
 result=await importRows([data(1,'2026-09-28T08:00:00',10,50)],'third');assert.equal(result.type,'ready');active=result.summary;
 assert.equal(store('third').players.get(uuid(1)).completion,51,'An older archive imported later must not replace the latest statistics.');
 const snapshots=h.observations([...store('third').records.values()].filter(row=>row.uuid===uuid(1)).map(row=>h.descriptor(row)));
 assert.deepEqual(Array.from(snapshots,row=>row.exportedAt),['2026-09-28T08:00:00','2026-10-02T08:00:00','2026-10-06T08:00:00']);
 result=await importRows(zip([data(1,'2026-10-06T08:00:00',51,300)],'renamed.zip'),'duplicate');assert.equal(result.type,'unchanged');assert.equal(active.datasetId,'third');
 const invalid=new File([fflate.zipSync({[`gdstats_${uuid(1)}.json`]:fflate.strToU8(JSON.stringify(data(2,'2026-10-06T09:00:00',99,400)))})],'invalid.zip');
 result=await importRows(invalid,'failed');assert.equal(result.type,'error');assert.equal(active.datasetId,'third');assert.equal(JSON.stringify([...store('first').records.values()].map(row=>row.data)),before);
 const first={job_resources:{MINEUR:[{resource_key:'stone',amount:10},{resource_key:'coal',amount:20}]},economy:{vault_gained_total_plugin:100},progression:{completion_percent:20},playtime:{play_seconds:100,play_seconds_source:'cache'}};
 const last={job_resources:{MINEUR:[{resource_key:'coal',amount:35},{resource_key:'stone',amount:12}]},economy:{vault_gained_total_plugin:90},progression:{completion_percent:51},playtime:{play_seconds:200,play_seconds_source:'vanilla'}};
 const compared=h.compare(first,last);assert.equal(compared.find(row=>row.key.includes('[coal].amount')).delta,15,'Resource reordering must not compare different resources.');
 const metrics=h.metricValues(first,last);assert.equal(metrics.find(row=>row.key==='completion').delta,31);assert.match(metrics.find(row=>row.key==='earned').warning,/baisse/);assert.equal(metrics.find(row=>row.key==='playtime').delta,null);
 assert.equal(h.metricValues(null,last).find(row=>row.key==='earned').delta,null,'First connection is not a fabricated zero baseline.');
 console.log('PASS: successive exports, omitted players, chronological latest values, renamed duplicate, failed-import isolation, immutable JSON, keyed resource comparisons, percentage points, counter resets and changed time sources.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({console,Date});
for(const file of ['player-history.js','global-evolution-model.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
const model=context.StatGMGlobalEvolution,h=context.StatGMHistory;
const data=(earned,spent,coins,balance)=>({economy:{vault_gained_total_plugin:earned,vault_spent_total_plugin:spent},profile:{coins_skript:coins,vault_balance:balance}});
const snapshot=(uuid,sequence,exportId,date)=>({uuid,sequence,exportId,archive:`${exportId}.zip`,exportedAt:date,sortTime:h.stamp(date)});
const fixtures=[
  [snapshot('a',8,'old','2026-10-01T12:00:00'),data(100,80,10,1000)],
  [snapshot('a',9,'old','2026-10-01T14:00:00'),data(110,90,11,15)],
  [snapshot('b',2,'old','2026-10-01T13:00:00'),data(200,120,20,25)],
  [snapshot('a',0,'middle','2026-10-02T12:00:00'),data(150,95,12,30)],
  [snapshot('b',1,'middle','2026-10-02T13:00:00'),data(250,180,0,0)],
  [snapshot('c',3,'middle','2026-10-02T12:00:00'),data(0,0,-2,-5)],
  [snapshot('a',4,'new','2026-10-09T12:00:00'),data(999,100,null,999)],
  [snapshot('a',5,'new','2026-10-09T12:00:00'),data(undefined,110,30,undefined)],
  [snapshot('b',6,'new','2026-10-09T13:00:00'),data(300,200,25,100)]
];
const original=JSON.stringify(fixtures),players=['a','b','c'].map(uuid=>({uuid}));
let active={datasetId:'test',ownerId:'owner',fileCount:9,exports:[{exportId:'new',filename:'New.zip',fileCount:3},{exportId:'middle',fileCount:3},{exportId:'old',fileCount:3}]},reads=0,inFlight=0,maximum=0;
const db={readActive:async()=>active,readPlayers:async()=>players,readPlayerRecordKeys:async(_,uuid)=>fixtures.filter(([row])=>row.uuid===uuid).map(([row])=>['test',row.sequence]),readPlayerSnapshots:async(_,uuid)=>fixtures.filter(([row])=>row.uuid===uuid).map(([row])=>row),readPlayerRecord:async(_,uuid,sequence)=>{
  reads++;inFlight++;maximum=Math.max(maximum,inFlight);await new Promise(resolve=>setTimeout(resolve,1));inFlight--;
  const record=fixtures.find(([row])=>row.uuid===uuid&&row.sequence===sequence);return record?{data:record[1]}:null;
}};
const vals=(result,key)=>Array.from(result.points,point=>point.values.find(value=>value.key===`metric:${key}`).value);
(async()=>{
  const result=await model.build(db,active);
  assert.deepEqual(Array.from(result.points,point=>point.exportId),['old','middle','new'],'Export dates, not import sequences, determine the timeline.');
  assert.deepEqual(vals(result,'earned'),[310,400,300],'Each point sums one latest observation per UUID within its own export, never earlier totals.');
  assert.deepEqual(vals(result,'spent'),[210,275,310]);vals(result,'coins').forEach((value,i)=>assert.ok(Math.abs(value-[31,10,55][i])<1e-10,'Zero and finite negative balances remain valid.'));
  vals(result,'balance').forEach((value,i)=>assert.ok(Math.abs(value-[40,25,100][i])<1e-10,'Baltop sums actual player balances in each export, independently of earnings and expenses.'));
  const balances=result.points.map(point=>point.values.find(value=>value.key==='metric:balance'));
  assert.equal(balances[1].count,3,'Zero and negative player balances count as reported values.');assert.equal(balances[2].count,1,'Missing latest balances never borrow an older balance.');
  const last=result.points.at(-1);assert.equal(last.values[0].count,1);assert.equal(last.players,2);assert.equal(last.values[0].coverageChanged,true,'Missing fields do not borrow a previous value, even within the same export.');
  assert.equal(result.points[0].exportedAt,'2026-10-01T14:00:00');assert.equal(result.points[0].firstDate,'2026-10-01T13:00:00');
  assert.equal(last.archive,'New.zip');assert.equal(result.duplicates,2);assert.equal(reads,7);assert.ok(maximum<=4);assert.equal(JSON.stringify(fixtures),original);
  const sum=model.accumulator();[1e308,1e308,-1e308].forEach(value=>sum.add(value));assert.equal(sum.result().value,1e308,'Intermediate overflow must not invalidate a finite final sum.');
  const precise=model.accumulator();[1e16,1,-1e16].forEach(value=>precise.add(value));assert.ok(Math.abs(precise.result().value-1)<1e-12);
  const zero=model.accumulator();zero.add(0);assert.equal(zero.result().value,0);assert.equal(zero.result().count,1);
  const empty=model.accumulator();[null,undefined,'5',NaN,Infinity].forEach(value=>empty.add(value));assert.equal(empty.result().value,null);assert.equal(empty.result().count,0);
  const overflow=model.accumulator();[Number.MAX_VALUE,Number.MAX_VALUE].forEach(value=>overflow.add(value));assert.equal(overflow.result().value,null);assert.equal(overflow.result().overflow,true);
  const undatedActive={datasetId:'test',ownerId:'owner',fileCount:2,exports:[{exportId:'one',exportedAt:'2026-10-01T00:00:00',fileCount:1},{exportId:'two',fileCount:1}]};
  const undatedRows=[snapshot('a',0,'one',null),snapshot('a',1,'two',null)];active=undatedActive;
  const undatedDB={...db,readPlayers:async()=>[{uuid:'a'}],readPlayerRecordKeys:async()=>undatedRows.map(row=>['test',row.sequence]),readPlayerSnapshots:async()=>undatedRows,readPlayerRecord:async()=>({data:data(0,null,5)})};
  const undated=await model.build(undatedDB,active);assert.equal(undated.undated,1);assert.equal(undated.points.find(point=>point.exportId==='one').exportedAt,'2026-10-01T00:00:00');assert.ok(undated.points.every(point=>point.values[1].value===null));
  // Equal-size population substitution must still be announced.
  const members=[snapshot('a',0,'one','2026-10-01T00:00:00'),snapshot('b',1,'two','2026-10-02T00:00:00')];
  const membersDB={...undatedDB,readPlayers:async()=>[{uuid:'a'},{uuid:'b'}],readPlayerRecordKeys:async(_,uuid)=>members.filter(row=>row.uuid===uuid).map(row=>['test',row.sequence]),readPlayerSnapshots:async(_,uuid)=>members.filter(row=>row.uuid===uuid)};
  const swapped=await model.build(membersDB,active);assert.equal(swapped.points[1].players,1);assert.equal(swapped.points[1].values[0].coverageChanged,true);
  active={datasetId:'test',ownerId:'owner',fileCount:10};await assert.rejects(()=>model.build(db,active),/incomplet/);
  active={datasetId:'test',ownerId:'owner'};await assert.rejects(()=>model.build({...db,readPlayerRecord:async()=>null},active),/indisponible/);
  await assert.rejects(()=>model.build({...db,readPlayerSnapshots:async()=>[],readPlayerRecordKeys:async()=>[]},active),/ne sont pas disponibles/);
  await assert.rejects(()=>model.build(db,active,()=>{},()=>false),/interrompu/);
  await assert.rejects(()=>model.build({...db,readActive:async()=>({...active,ownerId:'changed'})},active),/import actif a changé/);
  await assert.rejects(()=>model.build({...db,readActive:async()=>({...active,datasetId:'changed'})},active),/import actif a changé/);
  console.log('PASS: per-export totals, latest-per-UUID deduplication, date and sequence ties, chronology, zero/missing/negative values, coverage substitutions, scaled sums, overflow, undated exports, bounded reads, immutable JSON and source/account isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});

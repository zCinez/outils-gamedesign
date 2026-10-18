const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({console,Date,Intl});context.window=context;
for(const file of ['player-history.js','player-stats.js','player-history-chart.js','global-stats-model.js','global-stats-charts.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
const model=context.StatGMGlobalStats,h=context.StatGMHistory;
const snapshot=(sequence,date)=>({sequence,exportId:`export-${sequence}`,exportedAt:date,sortTime:h.stamp(date),archive:'Export.zip'});
const players=Array.from({length:6},(_,i)=>({uuid:`uuid-${i}`,name:['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot'][i]}));
const data=value=>({profile:{vault_balance:value},plot:{farm_rank:value},quests:{milestone_tiers_reached:value,milestone_tiers_total:100},jobs_levels:{Mineur:value},job_resources:{MINEUR:[{resource_key:'stone',amount:value}]},rjobs_stats:{MINEUR:{amount:1000}},stats_store:{economy:{gained_total:999}}});
const inputs=[0,10,20,100,null,NaN].map(data),original=JSON.stringify(inputs),index=model.createIndex(players);
inputs.forEach((data,i)=>index.add(i,snapshot(i,`2026-10-0${i+1}T12:00:00`),data));
for(const limit of [10,20,50,100]){
  const result=index.query('metric:balance',limit);
  assert.equal(result.mean,32.5);assert.equal(result.median,15);assert.equal(result.count,4);assert.equal(result.missing,2);assert.equal(result.total,6);
  assert.equal(result.limit,limit);assert.deepEqual(Array.from(result.rows,row=>row.name),['Delta','Charlie','Bravo','Alpha']);
  assert.equal(result.distribution.bins.reduce((sum,bin)=>sum+bin.count,0),4,'Distribution includes every valid player, including zero, regardless of top size.');
  assert.deepEqual(Array.from(result.rows,row=>row.value),[100,20,10,0],'Zero is included; missing and non-finite values are excluded.');
}
assert.equal(JSON.stringify(inputs),original,'Exports remain unchanged.');
assert.ok(index.metrics().some(metric=>metric.key==='job_resources.MINEUR.[stone].amount'),'Resource metrics are available.');
assert.ok(index.metrics().every(metric=>!['rjobs_stats','stats_store'].includes(metric.category)),'Hidden copies are not reintroduced as global statistics.');
assert.deepEqual(Array.from(index.query('plot.farm_rank').rows,row=>row.value),[10,20,100],'Ranks use the best positive place first and treat zero as unranked.');
assert.equal(index.query('plot.farm_rank').median,20);
assert.equal(index.query('metric:milestones').mean,32.5,'Milestone percentages are calculated per player before aggregation.');
const odd=model.createIndex(players.slice(0,3));[0,1,100].forEach((value,i)=>odd.add(i,snapshot(i,null),data(value)));
assert.equal(odd.query('metric:balance').median,1);assert.equal(odd.context().undated,3);
const huge=model.createIndex(players.slice(0,2));[Number.MAX_VALUE,Number.MAX_VALUE].forEach((value,i)=>huge.add(i,snapshot(i,null),data(value)));
assert.equal(huge.query('metric:balance').mean,Number.MAX_VALUE);assert.equal(huge.query('metric:balance').median,Number.MAX_VALUE,'Even medians do not overflow.');
assert.equal(huge.query('metric:balance').distribution.bins.length,1,'Identical observations use a single bin.');
const skewed=model.createIndex(players.slice(0,4));[0,1,20,1e12].forEach((value,i)=>skewed.add(i,snapshot(i,null),data(value)));
const logarithmic=skewed.query('metric:balance',10),linear=skewed.query('metric:balance',100,'linear');
assert.equal(logarithmic.distribution.mode,'log','Large positive ranges automatically use an explicitly labeled logarithmic scale.');
assert.equal(linear.distribution.mode,'linear');assert.equal(logarithmic.mean,linear.mean);assert.equal(logarithmic.median,linear.median);
for(const result of [logarithmic,linear]){assert.equal(result.distribution.bins.reduce((sum,bin)=>sum+bin.count,0),4);assert.equal(result.distribution.min,0);assert.equal(result.distribution.max,1e12);assert.ok(result.distribution.ticks.every(Number.isFinite));}
assert.equal(JSON.stringify(skewed.query('metric:balance',10,'linear').distribution),JSON.stringify(linear.distribution),'Changing the top leaves population bins and their counts unchanged.');
const signed=model.createIndex(players.slice(0,3));[-100,0,200].forEach((value,i)=>signed.add(i,snapshot(i,null),data(value)));
assert.equal(signed.query('metric:balance',10,'log').distribution.mode,'linear','Negative values cannot silently enter a positive logarithmic scale.');
assert.equal(signed.query('metric:balance').distribution.bins.reduce((sum,bin)=>sum+bin.count,0),3);
const visual=context.StatGMGlobalCharts;
const signedBars=visual.rankingGeometry([{value:-100},{value:0},{value:200}]);
assert.ok(Math.abs(signedBars.zero-100/3)<1e-10);assert.equal(signedBars.rows[1].width,0,'Zero never receives an invented minimum bar length.');
assert.equal(signedBars.rows[0].left,0);assert.ok(Math.abs(signedBars.rows[2].width-200/3)<1e-10);
assert.ok(visual.rankingGeometry([{value:-Number.MAX_VALUE},{value:Number.MAX_VALUE}]).rows.every(row=>Number.isFinite(row.left)&&Number.isFinite(row.width)));
const mixed=model.createIndex(players.slice(0,2));
mixed.add(0,snapshot(1,null),{playtime:{play_seconds:0,play_seconds_source:'cache'}});mixed.add(1,snapshot(2,null),{playtime:{play_seconds:60,play_seconds_source:'vanilla'}});
assert.match(mixed.query('metric:playtime').warning,/plusieurs sources/);
const tied=model.createIndex([{uuid:'b',name:'Même'},{uuid:'a',name:'Même'}]);
for(let i=0;i<2;i++)tied.add(i,snapshot(i,null),data(-20));
assert.deepEqual(Array.from(tied.query('metric:balance').rows,row=>row.uuid),['a','b']);assert.equal(tied.query('metric:balance').mean,-20);
const largePlayers=Array.from({length:5500},(_,i)=>({uuid:String(i).padStart(8,'0'),name:`Joueur ${i}`})),large=model.createIndex(largePlayers);
for(let i=0;i<largePlayers.length;i++)large.add(i,snapshot(i,null),{profile:{vault_balance:i}});
for(const limit of [10,20,50,100]){const result=large.query('metric:balance',limit);assert.equal(result.rows.length,limit);assert.equal(result.rows[0].value,5499);assert.ok(Math.abs(result.mean-2749.5)<1e-9);assert.equal(result.median,2749.5);}
let reads=0,inFlight=0,maximum=0,active={datasetId:'test',ownerId:'owner'},historyReads=0;
const snapshots=[snapshot(9,'2026-10-01T12:00:00'),snapshot(1,'2026-10-09T12:00:00'),snapshot(2,'2026-10-09T12:00:00')];
const db={readActive:async()=>active,readPlayers:async()=>players,readPlayerRecordKeys:async()=>snapshots.map(row=>['test',row.sequence]),readPlayerSnapshots:async()=>{historyReads++;return [...snapshots];},readPlayerRecord:async(_,uuid,sequence)=>{
  reads++;inFlight++;maximum=Math.max(maximum,inFlight);await new Promise(resolve=>setTimeout(resolve,1));inFlight--;
  return {data:sequence===2?uuid==='uuid-0'?{economy:{vault_gained_total_plugin:7}}:data(20):data(99999)};
}};
(async()=>{
  const built=await model.build(db,active);
  assert.equal(reads,6,'Only the latest record per player is read, rather than every export.');assert.equal(historyReads,6);assert.ok(maximum<=4,'Player reads are bounded.');
  assert.equal(built.query('metric:balance').count,5,'A missing latest statistic does not reuse a stale earlier value.');
  assert.equal(built.query('metric:balance').mean,20);assert.equal(built.query('metric:balance').rows[0].exportedAt,'2026-10-09T12:00:00');
  assert.equal(built.query('metric:earned').rows[0].value,7);
  const before=reads;built.query('metric:balance',100);built.query('metric:earned',20);assert.equal(reads,before,'Switching metrics and top sizes reuses numeric columns.');
  active={datasetId:'other',ownerId:'owner'};await assert.rejects(()=>model.build(db,{datasetId:'test',ownerId:'owner'}),/import actif a changé/);
  active={datasetId:'test',ownerId:'other'};await assert.rejects(()=>model.build(db,{datasetId:'test',ownerId:'owner'}),/import actif a changé/);
  const missingDB={...db,readPlayerSnapshots:async()=>[],readPlayerRecordKeys:async()=>[]};active={datasetId:'test',ownerId:'owner'};
  await assert.rejects(()=>model.build(missingDB,active),/ne sont pas disponibles/,'Incomplete source history must not produce a complete-population dashboard.');
  console.log('PASS: latest export by date and sequence, one record per UUID, missing versus zero, odd/even medians, stable means, canonical metrics, rank semantics, deterministic ties, 5500 players, top 10/20/50/100, bounded reads, cache reuse and dataset/account isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});

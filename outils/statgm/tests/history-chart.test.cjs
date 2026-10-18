const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const context = vm.createContext({console, Date, Intl});context.window = context;
for (const file of ['player-history.js', 'player-stats.js', 'player-history-chart.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
const h = context.StatGMHistory, chart = context.StatGMHistoryChart;
const snapshot = (sequence, date) => ({sequence, exportedAt:date, sortTime:h.stamp(date), archive:`Export_${sequence}.zip`, exportId:`export-${sequence}`});
const data = (completion, earned, source = 'cache', time = 100) => ({player:{first_played_ms:1}, export_schema_version:3, progression:{completion_percent:completion}, economy:{vault_gained_total_plugin:earned}, playtime:{play_seconds:time, play_seconds_vanilla_stat:time*2, play_seconds_source:source}, job_resources:{MINEUR:[{resource_key:'stone', amount:completion}]}});
const raw = [
  {snapshot:snapshot(3, '2026-10-06T12:00:00'), data:data(51, 300)},
  {snapshot:snapshot(1, '2026-09-23T12:00:00'), data:data(0, 100)},
  {snapshot:snapshot(2, '2026-09-24T12:00:00'), data:data(10, 200)}
];
const originals = JSON.stringify(raw);
const observations = h.observations(raw.map(row => row.snapshot));
const history = observations.map(item => chart.project(item, raw.find(row => row.snapshot.sequence === item.sequence).data));
const choices = chart.catalog(history), metric = choices.find(item => item.key === 'metric:completion');
assert.ok(metric);
assert.equal(metric.category, 'progression');
assert.equal(choices.find(item => item.key === 'metric:earned').category, 'economy');
assert.ok(choices.filter(item=>item.category!=='jobs').every(item=>item.resourceLabel===''),'Job resource labels must not contaminate search in other categories.');
assert.equal(choices.find(item => item.key === 'job_resources.MINEUR.[stone].amount').job, 'mineur');
const categories = chart.categories(choices);
assert.ok(categories.every(item => !['all','rjobs_stats','stats_store'].includes(item.key)), 'Removed tabs are absent from the navigation.');
assert.equal(categories.filter(item => item.key !== 'overview').reduce((sum, item) => sum + (item.totalCount ?? item.count), 0), choices.length, 'Each visible field belongs to a category, including job details.');
const jobChoices = chart.catalog([chart.project(snapshot(1, '2026-10-01T12:00:00'), {jobs_levels:{Mineur:10,Chasseur:20,'Bûcheron':30,Fermier:40},job_resources:{CHASSEUR:[{resource_key:'dracorne',xp:5}]}})]);
assert.equal(chart.categories(jobChoices).find(item => item.key === 'jobs').count, 4);
assert.equal(chart.jobMetrics(jobChoices).length, 4);
assert.ok(chart.jobMetrics(jobChoices).every(item => item.path.startsWith('jobs_levels.')));
assert.deepEqual(Array.from(chart.jobMetrics(jobChoices, 'chasseur'), item => item.key).sort(), ['job_resources.CHASSEUR.[dracorne].xp', 'jobs_levels.Chasseur']);
assert.equal(chart.jobMetrics(jobChoices, 'bucheron')[0].key, 'jobs_levels.Bûcheron', 'Accented job names remain selectable.');
const detailedJobs={jobs_levels:{Mineur:1,Chasseur:2,'Bûcheron':3,Fermier:4},job_resources:{
  BUCHERON:[{resource_key:'oak_log',xp:0,amount:0,money:0,time_seconds:0,milestone_tier:0,milestone_claimed:0,milestone_tier_total:5},{resource_key:'birch_log',xp:2}],
  CHASSEUR:[{resource_key:'dracorne',amount:2,xp:3},{resource_key:'zombie',xp:4}],
  FERMIER:[{resource_key:'wheat',blocks_broken:4,crafted:2,amount:6}],
  MINEUR:[{resource_key:'stone',amount:10,unknown_count:7},{amount:1}]
}};
const detailedOriginal=JSON.stringify(detailedJobs),detailedHistory=[chart.project(snapshot(1,'2026-10-01T12:00:00'),detailedJobs)],detailedChoices=chart.catalog(detailedHistory);
const woods=chart.jobResources(detailedChoices,'bucheron');
assert.deepEqual(Array.from(woods,resource=>resource.label),['Niveau du métier','Bouleau','Chêne'],'The level comes first, then resources use alphabetical French labels.');
const oak=woods.find(resource=>resource.key==='[oak_log]');
assert.deepEqual(Array.from(oak.metrics,metric=>metric.stat),['amount','xp','money','time_seconds','milestone_tier','milestone_claimed','milestone_tier_total'],'Each resource has a consistent reading order.');
assert.equal(oak.metrics[1].statLabel,'Expérience');
assert.deepEqual(Array.from(chart.jobMetricKinds(oak.metrics),kind=>[kind.key,kind.count]),[['all',7],['activity',1],['xp',1],['money',1],['time',1],['milestones',3]]);
assert.equal(chart.series(detailedHistory,oak.metrics[0]).first.value,0,'Zero activity remains available in a resource.');
assert.equal(chart.summarize([...detailedHistory,chart.project(snapshot(2,'2026-10-02T12:00:00'),{jobs_levels:{'Bûcheron':4}})],oak.metrics[1]).missing,1,'Resource grouping does not fill missing measurements.');
assert.deepEqual(Array.from(chart.jobResources(detailedChoices,'fermier')[1].metrics,metric=>metric.stat),['amount','crafted','blocks_broken']);
const mining=chart.jobResources(detailedChoices,'mineur');
assert.equal(mining.find(resource=>resource.key==='1').label,'Ressource 2','Resources without identity retain their array-index fallback.');
assert.equal(mining.find(resource=>resource.key==='[stone]').metrics.at(-1).statKind,'other','Unknown numeric fields remain accessible.');
const regrouped=['bucheron','chasseur','fermier','mineur'].flatMap(job=>Array.from(chart.jobResources(detailedChoices,job),resource=>Array.from(resource.metrics,metric=>metric.key)).flat());
assert.deepEqual(regrouped.sort(),Array.from(detailedChoices,metric=>metric.key).sort(),'Every job field remains reachable exactly once through its resource.');
assert.equal(new Set(regrouped).size,regrouped.length);
assert.equal(JSON.stringify(detailedJobs),detailedOriginal,'Navigation metadata never changes the source export.');
assert.ok(chart.jobResources(chart.catalog([chart.project(snapshot(1,'2026-10-01T12:00:00'),{job_resources:{CHASSEUR:[{resource_key:'dracorne',xp:1}]}})]),'chasseur').every(resource=>resource.key),'A job with no level can open its first resource.');
assert.ok(!choices.some(item => item.key === 'progression.completion_percent'), 'Canonical fields are offered once.');
assert.ok(!choices.some(item => item.key.startsWith('player.') || item.key === 'export_schema_version'));
assert.ok(choices.some(item => item.key === 'job_resources.MINEUR.[stone].amount'), 'Resource identity remains stable.');
let model = chart.series(history, metric), geometry = chart.geometry(model, 900);
assert.deepEqual(Array.from(model.points, row => row.value), [0, 10, 51]);
assert.equal(model.delta, 51);
assert.equal(chart.summarize(history, metric).delta, model.delta);
assert.equal(chart.summarize(history, metric).count, model.valid.length);
assert.equal(chart.deltaLabel(model.delta, 'percent'), '+51 points');
assert.equal(model.dated, true);
assert.equal(geometry.points[0].x, geometry.left);
assert.equal(geometry.points.at(-1).x, geometry.right);
assert.ok(geometry.points[1].x < geometry.left + (geometry.right - geometry.left) / 10, 'X spacing must reflect elapsed time.');
assert.equal(JSON.stringify(raw), originals, 'Original data must stay immutable.');
const missing = [chart.project(snapshot(1, '2026-10-01T12:00:00'), data(0, 1)), chart.project(snapshot(2, '2026-10-02T12:00:00'), {economy:{vault_gained_total_plugin:2}}), chart.project(snapshot(3, '2026-10-03T12:00:00'), data(50, 3))];
model = chart.series(missing, metric);
assert.equal(model.points[0].value, 0);
assert.equal(model.points[1].value, null);
assert.equal(model.points[1].delta, null);
assert.equal(model.points[2].breakBefore, true, 'Missing measurements interrupt the line.');
assert.equal(model.missing, 1);
assert.equal(chart.summarize(missing, metric).missing, 1);
assert.equal(model.delta, 50);
model = chart.series([history[0]], metric);
assert.equal(model.delta, null, 'One export does not establish an evolution.');
geometry = chart.geometry(model, 320);
assert.equal(geometry.points[0].x, (geometry.left + geometry.right) / 2);
assert.ok(geometry.ticks.every(tick => Number.isFinite(tick.value)));
const timeMetric = choices.find(item => item.key === 'metric:playtime');
assert.equal(timeMetric.category,'progression');
assert.equal(timeMetric.categoryLabel,'Progression');
assert.ok(!choices.some(item=>item.key==='playtime.play_seconds_vanilla_stat'),'The vanilla playtime chart is excluded, including from Everything.');
assert.ok(!categories.some(item=>item.key==='playtime'),'An empty playtime category disappears after moving its main chart.');
assert.equal(chart.series(history,timeMetric).last.value,100,'The retained chart still uses the main playtime counter rather than vanilla.');
assert.equal(history[0].fields.get('playtime.play_seconds_vanilla_stat'),200,'The raw vanilla counter remains available in the preserved source data.');
model = chart.series([chart.project(snapshot(1, '2026-10-01T12:00:00'), data(1, 1, 'cache', 100)), chart.project(snapshot(2, '2026-10-02T12:00:00'), data(2, 2, 'vanilla', 200))], timeMetric);
assert.equal(model.sourceChanged, true);
assert.equal(model.delta, null);
assert.equal(model.points[1].breakBefore, true);
assert.equal(model.points[1].delta, null);
assert.equal(chart.summarize([chart.project(snapshot(1, '2026-10-01T12:00:00'), data(1, 1, 'cache', 100)), chart.project(snapshot(2, '2026-10-02T12:00:00'), data(2, 2, 'vanilla', 200))], timeMetric).delta, null);
model = chart.series([chart.project(snapshot(1, '2026-10-01T12:00:00'), data(1, 100)), chart.project(snapshot(2, null), data(2, 90))], choices.find(item => item.key === 'metric:earned'));
assert.equal(model.dated, false);
assert.equal(model.counterDropped, true);
assert.equal(model.delta, -10);
geometry = chart.geometry(model, 380);
assert.ok(geometry.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
const fallback = chart.project(snapshot(1, '2026-10-01T12:00:00'), {quests:{completion_percent:12}});
assert.equal(chart.series([fallback], metric).first.value, 12);
const milestoneData = (reached, total) => ({progression:{completion_percent:51},quests:{milestone_tiers_reached:reached,milestone_tiers_total:total}});
const milestoneHistory = [[0,574],[undefined,574],[100,574],[265,574]].map(([reached,total], index) => chart.project(snapshot(index, `2026-10-0${index + 1}T12:00:00`), milestoneData(reached,total)));
const milestoneChoices = chart.catalog(milestoneHistory), milestoneMetric = milestoneChoices.find(row => row.key === 'metric:milestones');
assert.equal(milestoneMetric.label, 'Milestones complétés');
assert.equal(milestoneMetric.category, 'quests');
assert.equal(milestoneMetric.unit, 'percent');
model = chart.series(milestoneHistory, milestoneMetric);
assert.deepEqual(Array.from(model.points, point => point.value), [0,null,100 / 574 * 100,265 / 574 * 100], 'Each export uses its reached count and denominator without using general completion.');
assert.equal(chart.format(model.last.value, 'percent'), '46,2 %');
assert.equal(model.points[2].breakBefore, true, 'A missing milestone count interrupts the curve.');
assert.ok(Math.abs(model.points[3].delta - 165 / 574 * 100) < 1e-12);
assert.equal(chart.summarize(milestoneHistory, milestoneMetric).missing, 1);
for (const [reached,total] of [[0,0],[1,0],[-1,10],[11,10],[1,-10],[1,undefined],[undefined,10],['1',10],[1,'10'],[Infinity,10],[1,NaN]]) {
  assert.equal(chart.project(snapshot(1, '2026-10-01T12:00:00'), milestoneData(reached,total)).fields.get('metric:milestones'), null, 'Invalid or absent operands are not turned into a percentage.');
}
assert.equal(chart.project(snapshot(1, '2026-10-01T12:00:00'), milestoneData(574,574)).fields.get('metric:milestones'), 100);
const changingTotal = h.metricValues(milestoneData(5,10),milestoneData(5,20)).find(row => row.key === 'milestones');
assert.equal(changingTotal.before,50);assert.equal(changingTotal.after,25);assert.equal(changingTotal.delta,-25,'Each percentage uses that export’s own available tier count.');
assert.ok(milestoneChoices.some(row => row.key === 'quests.milestone_tiers_reached'), 'The attained tier chart stays available.');
assert.ok(!milestoneChoices.some(row => row.key === 'quests.milestone_tiers_total'), 'The available tier chart is removed while its values still determine the percentage.');
const reachedHistory = [[265,574],[266,574],[266,600]].map(([reached,total], index) => chart.project(snapshot(index, `2026-10-0${index + 1}T12:00:00`), milestoneData(reached,total)));
const reachedMetric = chart.catalog(reachedHistory).find(row => row.key === 'quests.milestone_tiers_reached');
const reachedModel = chart.series(reachedHistory, reachedMetric);
assert.deepEqual(Array.from(reachedModel.points, point => chart.formatPoint(point, reachedMetric)), ['265 / 600','266 / 600','266 / 600'], 'All attained tier values use the maximum from the latest export, including older observations.');
assert.deepEqual(Array.from(reachedModel.points, point => point.value), [265,266,266], 'The curve remains a count of reached tiers.');
assert.equal(reachedModel.delta,1);
assert.equal(chart.formatPoint(chart.summarize(reachedHistory.slice(0,2),reachedMetric).last,reachedMetric),'266 / 600','Browsing an older part of the history retains the latest maximum.');
assert.equal(chart.formatPoint(chart.summarize(reachedHistory,reachedMetric).last,reachedMetric),'266 / 600');
assert.equal(chart.catalog([reachedHistory[2],reachedHistory[0],reachedHistory[1]]).find(row => row.key === reachedMetric.key).total,600,'The latest maximum follows export chronology rather than array or import order.');
const withoutMaximum = [...reachedHistory,chart.project(snapshot(4,'2026-10-04T12:00:00'),milestoneData(266,undefined))];
const missingMaximumMetric = chart.catalog(withoutMaximum).find(row => row.key === reachedMetric.key);
assert.deepEqual(Array.from(chart.series(withoutMaximum,missingMaximumMetric).points,point => chart.formatPoint(point,missingMaximumMetric)), ['265 / Non renseigné','266 / Non renseigné','266 / Non renseigné','266 / Non renseigné'],'A missing latest maximum is not replaced by a stale value.');
assert.equal(chart.formatPoint({value:0},reachedMetric),'0 / 600');
assert.equal(chart.formatPoint({value:null},reachedMetric),'Non renseigné');
const successData = [
  {1:{completed:0,total:18},2:{completed:10,total:18},3:{completed:12,total:16},4:{completed:8,total:15}},
  {1:{completed:7,total:18},2:{completed:11,total:18},3:{total:16},4:{completed:8,total:15}},
  {1:{completed:18,total:20},2:{completed:18,total:22},3:{completed:14,total:19},4:{completed:9,total:18}}
];
const originalSuccessData = JSON.stringify(successData);
const successHistory = successData.map((levels,index) => chart.project(snapshot(index,`2026-10-0${index + 1}T12:00:00`),{quests:{successes_by_level:levels}}));
const successChoices = chart.catalog(successHistory);
assert.equal(successChoices.length,4,'Four success levels produce four charts rather than eight.');
assert.ok(successChoices.every(item => item.key.endsWith('.completed')),'Separate total charts are removed.');
assert.equal(chart.categories(successChoices).find(item => item.key === 'quests').count,4);
assert.ok(!chart.categories(successChoices).some(item => item.key === 'all'));
for (const level of [1,2,3,4]) {
  const successMetric = successChoices.find(item => item.key === `quests.successes_by_level.${level}.completed`);
  const successModel = chart.series(successHistory,successMetric),latestTotal = successData[2][level].total;
  assert.equal(successMetric.label,`Succès de niveau ${level}`);
  assert.equal(successMetric.countUnit,'succès');
  assert.equal(chart.formatPoint(successModel.first,successMetric),`${successData[0][level].completed} / ${latestTotal}`,'Every level uses its own latest maximum, including the first observed value.');
  assert.equal(chart.formatPoint(successModel.last,successMetric),`${successData[2][level].completed} / ${latestTotal}`);
  assert.equal(successModel.last.value,successData[2][level].completed,'The curve retains completed counts instead of turning them into percentages.');
}
const successThree = successChoices.find(item => item.key === 'quests.successes_by_level.3.completed');
const successThreeModel = chart.series(successHistory,successThree);
assert.equal(successThreeModel.points[1].value,null);
assert.equal(successThreeModel.points[2].breakBefore,true,'Missing completed counts interrupt a combined success chart.');
assert.equal(chart.catalog([successHistory[2],successHistory[0],successHistory[1]]).find(item => item.key === successThree.key).total,19,'Success maxima follow the latest export date.');
const withoutSuccessMaximum = [...successHistory,chart.project(snapshot(4,'2026-10-04T12:00:00'),{quests:{successes_by_level:{4:{completed:9}}}})];
const successFourMissing = chart.catalog(withoutSuccessMaximum).find(item => item.key === 'quests.successes_by_level.4.completed');
assert.equal(chart.formatPoint(chart.series(withoutSuccessMaximum,successFourMissing).last,successFourMissing),'9 / Non renseigné','A missing latest maximum is not replaced with another level or an older export.');
assert.equal(JSON.stringify(successData),originalSuccessData,'Combining success charts leaves the source data unchanged.');
const questData = [{main_unlock:0,secondary_completed_count:0},{main_unlock:5,secondary_completed_count:2},{main_unlock:9,secondary_completed_count:4}];
const originalQuestData = JSON.stringify(questData);
const questHistory = questData.map((quests,index) => chart.project(snapshot(index,`2026-10-0${index + 1}T12:00:00`),{quests}));
const questChoices = chart.catalog(questHistory);
assert.equal(questChoices.length,2,'Main and secondary quests each retain one chart.');
for (const [key,total,countUnit,values] of [['main_unlock',9,'étapes',[0,5,9]],['secondary_completed_count',4,'quêtes',[0,2,4]]]) {
  const questMetric = questChoices.find(item => item.key === `quests.${key}`),questModel = chart.series(questHistory,questMetric);
  assert.equal(questMetric.total,total);assert.equal(questMetric.countUnit,countUnit);
  assert.deepEqual(Array.from(questModel.points,point => chart.formatPoint(point,questMetric)),values.map(value=>`${value} / ${total}`),'Quest values use the user-confirmed maximum on every observation.');
  assert.deepEqual(Array.from(questModel.points,point=>point.value),values,'Quest curves retain their raw counts.');
  assert.equal(questModel.delta,total);
  const lowHistory = questHistory.slice(0,2),lowMetric = chart.catalog(lowHistory).find(item=>item.key===questMetric.key);
  assert.equal(lowMetric.total,total,'The maximum does not shrink to the highest observed player score.');
  const absent = chart.project(snapshot(4,'2026-10-04T12:00:00'),{quests:{}});
  assert.equal(chart.formatPoint(chart.series([...questHistory,absent],questMetric).points.at(-1),questMetric),'Non renseigné','Missing quest counts do not become zero.');
}
assert.equal(JSON.stringify(questData),originalQuestData);
const combinedChoices = chart.catalog([...history, ...milestoneHistory]), overview = chart.overviewMetrics(combinedChoices);
assert.ok(overview.some(row => row.key === 'metric:milestones'));
assert.ok(!overview.some(row => row.key === 'metric:playtime'), 'Milestones replace playtime in the overview.');
assert.ok(combinedChoices.some(row => row.key === 'metric:playtime' && row.category === 'progression'), 'Playtime is available in Progression.');
assert.equal(chart.categories(combinedChoices).find(row => row.key === 'overview').count, overview.length);
const monetary = chart.catalog([chart.project(snapshot(1, '2026-10-01T12:00:00'), {plot:{value:100},economy:{average_24h_hourly:2},stats_store:{economy:{sell_total:10,average_count:24,average_index:1}}})]);
for (const key of ['plot.value','economy.average_24h_hourly','stats_store.economy.sell_total']) assert.equal(monetary.find(row => row.key === key).unit, 'money');
for (const key of ['stats_store.economy.average_count','stats_store.economy.average_index']) assert.equal(monetary.find(row => row.key === key).unit, 'number');
const internalSource={economy:{vault_gained_total_plugin:100},rjobs_stats:{MINEUR:{blocks_broken:5}},stats_store:{economy:{gained_total:100}}};
const originalInternalSource=JSON.stringify(internalSource),internalObservation=chart.project(snapshot(1,'2026-10-01T12:00:00'),internalSource),internalChoices=chart.catalog([internalObservation]);
assert.ok(internalChoices.some(item=>item.category==='rjobs_stats')&&internalChoices.some(item=>item.category==='stats_store'),'Source counters remain available in the data model.');
assert.deepEqual(Array.from(chart.categories(internalChoices),item=>item.key),['overview','economy'],'Internal counters do not recreate either removed tab or Everything.');
assert.equal(internalObservation.fields.get('stats_store.economy.gained_total'),100);
assert.equal(JSON.stringify(internalSource),originalInternalSource);
const rankHistory = [80,81,82].map((farm,index)=>chart.project(snapshot(index,`2026-10-0${index+1}T12:00:00`),{plot:{farm_rank:farm,value_rank:[37,37,40][index],farm_score:1000+index*100,value:500+index*100}}));
const rankChoices = chart.catalog(rankHistory);
for(const key of ['plot.farm_rank','plot.value_rank']){
  const rankMetric=rankChoices.find(item=>item.key===key),rankModel=chart.series(rankHistory,rankMetric),rankGeometry=chart.geometry(rankModel,600);
  assert.equal(rankMetric.invertedAxis,true);assert.equal(rankMetric.countUnit,'places');
  assert.ok(rankGeometry.points[0].y<rankGeometry.points.at(-1).y,'A larger rank number is drawn lower.');
  assert.ok(rankGeometry.ticks.every(tick=>Number.isInteger(tick.value)&&tick.value>=1),'Rank graduations are whole positive places.');
  assert.ok(rankGeometry.ticks.slice(1).every((tick,index)=>tick.value>rankGeometry.ticks[index].value&&tick.y>rankGeometry.ticks[index].y),'Smaller rank labels sit higher on the axis.');
  assert.equal(rankModel.points[0].value,key==='plot.farm_rank'?80:37,'Axis inversion leaves exported ranks unchanged.');
  assert.equal(chart.deltaLabel(2,'number',rankMetric),'2 places perdues');
  assert.equal(chart.deltaLabel(-1,'number',rankMetric),'1 place gagnée');
  assert.equal(chart.deltaLabel(0,'number',rankMetric),'Classement inchangé');
  assert.equal(chart.deltaLabel(null,'number',rankMetric),'Non comparable');
  const bestHistory=[chart.project(snapshot(1,'2026-10-01T12:00:00'),{plot:{farm_rank:1,value_rank:1}})];
  const bestGeometry=chart.geometry(chart.series(bestHistory,rankMetric),320);
  assert.ok(bestGeometry.points.every(point=>Number.isFinite(point.y)&&point.y>=bestGeometry.top&&point.y<=bestGeometry.bottom));
  assert.ok(bestGeometry.ticks.every(tick=>Number.isInteger(tick.value)&&tick.value>=1),'Rank one remains valid with a single export.');
}
for(const key of ['plot.farm_score','plot.value']){
  const scoreMetric=rankChoices.find(item=>item.key===key),scoreGeometry=chart.geometry(chart.series(rankHistory,scoreMetric),600);
  assert.equal(scoreMetric.invertedAxis,false);
  assert.ok(scoreGeometry.points[0].y>scoreGeometry.points.at(-1).y,'Increasing scores and monetary values still rise.');
  assert.equal(chart.deltaLabel(2,scoreMetric.unit,scoreMetric),key==='plot.value'?'+2 $':'+2');
}
const missingRankHistory=[rankHistory[0],chart.project(snapshot(1,'2026-10-02T12:00:00'),{plot:{}}),rankHistory[2]];
const missingRankMetric=rankChoices.find(item=>item.key==='plot.farm_rank'),missingRankModel=chart.series(missingRankHistory,missingRankMetric);
assert.equal(chart.geometry(missingRankModel,320).points[1].y,null);
assert.equal(missingRankModel.points[2].breakBefore,true,'Missing rank observations still interrupt the curve.');
for (const values of [[51, 51], [0, 0], [-100, 20], [82_387_529_157.33, 82_387_529_158.33]]) {
  const rows = values.map((value, index) => chart.project(snapshot(index, `2026-10-0${index + 1}T12:00:00`), data(value, value)));
  geometry = chart.geometry(chart.series(rows, metric), 380);
  assert.ok(geometry.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y) && point.y >= geometry.top && point.y <= geometry.bottom));
}
console.log('PASS: all chronological exports, irregular time spacing, zero versus missing, canonical fields and resources, immutable data, one export, changed time source, counter decrease, undated fallback, flat and negative series.');

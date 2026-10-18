const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.value='';this.checked=true;this.hidden=false;this.disabled=false;this.open=false;this.textContent='';this.style={};this.clientWidth=900;this.listeners=new Map();this.attributes=new Map();}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  setAttribute(key,value){this.attributes.set(key,value);}
  addEventListener(type,handler){this.listeners.set(type,handler);}
  closest(){return details;}
  focus(){document.activeElement=this;}
  getBoundingClientRect(){return{height:280};}
  fire(type){this.listeners.get(type)?.({});}
}
const elements=new Map(),details=new Element('details'),modes=['chart'].map(mode=>{const el=new Element('button');el.dataset.mode=mode;return el;});
const find=key=>{if(!elements.has(key))elements.set(key,new Element());return elements.get(key);};
const document={title:'',createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),querySelector:selector=>selector.startsWith('[data-mode=')?modes.find(el=>selector.includes(`"${el.dataset.mode}"`)):find(selector.slice(6,-1)),querySelectorAll:selector=>selector==='[data-mode="chart"]'?modes:[]};
const listeners=new Map(),uuid='12345678-1234-4000-8000-123456789abc';
let dataset='first',inFlight=0,maximumInFlight=0,reads=0;
const snapshots=(id)=>Array.from({length:id==='first'?20:2},(_,sequence)=>({sequence,uuid,datasetId:id,archive:`Export_${id}_${sequence}.zip`,exportId:`${id}-${sequence}`,exportedAt:`2026-09-${String(sequence+1).padStart(2,'0')}T12:00:00`,sortTime:Date.parse(`2026-09-${String(sequence+1).padStart(2,'0')}T12:00:00Z`)}));
const successLevels=(id,sequence)=>Object.fromEntries([18,18,16,15].map((total,index)=>[index+1,{completed:Math.min(sequence,total),total:id==='first'&&sequence===19&&index===0?20:total}]));
const resourceData=(id,sequence)=>{
  const resource=key=>({resource_key:key,amount:sequence,xp:sequence*2,money:sequence*3,time_seconds:sequence*60,milestone_tier:sequence,milestone_claimed:sequence,milestone_tier_total:30});
  return {MINEUR:[{resource_key:'stone',amount:sequence}],BUCHERON:[resource('oak_log'),{resource_key:'birch_log',xp:sequence}],FERMIER:[{resource_key:'wheat',amount:sequence,crafted:sequence,blocks_broken:sequence}],CHASSEUR:[resource('dracorne'),...(id==='first'?[{resource_key:'zombie',amount:sequence,xp:sequence}]:[])]};
};
const db={readActive:async()=>({datasetId:dataset,recordsLocal:true}),readPlayer:async()=>({name:'Test',grade:'fer',firstPlayedMs:1}),readPlayerRecordKeys:async id=>snapshots(id).map(row=>[id,row.sequence]),readPlayerSnapshots:async id=>snapshots(id),readPlayerRecord:async(id,_,sequence)=>{reads++;inFlight++;maximumInFlight=Math.max(maximumInFlight,inFlight);await new Promise(resolve=>setTimeout(resolve,8));inFlight--;return{data:{progression:{completion_percent:sequence+(id==='first'?0:80)},economy:{vault_gained_total_plugin:sequence*100},quests:{main_unlock:Math.min(sequence,9),secondary_completed_count:Math.min(sequence,4),milestone_tiers_reached:sequence,milestone_tiers_total:id==='first'&&sequence===19?200:100,successes_by_level:successLevels(id,sequence)},playtime:{play_seconds:sequence*60,play_seconds_vanilla_stat:sequence*120,play_seconds_source:'cache'},rjobs_stats:{MINEUR:{blocks_broken:sequence}},stats_store:{economy:{gained_total:sequence*100}},plot:{farm_rank:sequence+80,value_rank:sequence+37,farm_score:sequence*100},jobs_levels:{Mineur:sequence,Chasseur:sequence,'Bûcheron':sequence,Fermier:sequence},job_resources:resourceData(id,sequence)}};}};
const observers=[];
class Observer{constructor(callback){this.callback=callback;this.targets=[];observers.push(this);}observe(el){this.targets.push(el);}disconnect(){this.targets=[];}fire(target,isIntersecting){this.callback([{target,isIntersecting}]);}}
const context=vm.createContext({console,Date,Intl,URLSearchParams,setTimeout,clearTimeout,IntersectionObserver:Observer,location:{search:`?uuid=${uuid}`},navigator:{},document,StatGMArchiveDB:db});context.window=context;context.addEventListener=(type,handler)=>listeners.set(type,handler);
context.StatGMHeads={resetObservations(){},create(){return new Element();}};context.StatGMGrades={create(){return new Element();}};
for(const file of ['player-history.js','player-stats.js','player-history-chart.js','progression-joueur.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
async function until(condition){for(let i=0;i<200;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Page did not settle: '+find('state').textContent);}
(async()=>{
  await until(()=>find('state').hidden&&find('chart-count').textContent==='3 graphiques · 20 exports');
  const html=fs.readFileSync(path.join(__dirname,'..','progression-joueur.html'),'utf8');
  assert.doesNotMatch(html,/data-mode="(?:lifetime|compare)"|data-period-controls|data-value-panel/,'Removed modes and their controls are absent.');
  assert.match(html,/data-mode="chart" aria-pressed="true"/,'The remaining chart view is active on arrival.');
  assert.ok(maximumInFlight<=4,'Only four player chart reads should be active.');
  const loadedReads=reads;
  const category=key=>find('chart-categories').children.find(button=>button.dataset.chartCategory===key);
  for(const key of ['all','rjobs_stats','stats_store'])assert.equal(category(key),undefined,'Removed tabs stay absent even when their data is present.');
  const milestones=find('chart-grid').children.find(card=>card.dataset.chartKey==='metric:milestones');
  assert.equal(milestones.children[0].children[0].textContent,'Milestones complétés');
  assert.equal(milestones.children[1].children[0].textContent,'9,5 %');
  assert.match(milestones.children[5].children[1].textContent,/paliers atteints ÷ paliers disponibles × 100/,'The chart explains its calculated source.');
  assert.ok(!find('chart-grid').children.some(card=>card.dataset.chartKey==='metric:playtime'),'The initial overview replaces playtime with milestones.');
  assert.equal(category('overview').children[1].textContent,'3');
  category('quests').fire('click');
  assert.equal(category('quests').children[1].textContent,'8','Quest and success progress each retain a single chart.');
  for(const [key,maximum,unit] of [['main_unlock',9,'étapes'],['secondary_completed_count',4,'quêtes']]){
    const quest=find('chart-grid').children.find(card=>card.dataset.chartKey===`quests.${key}`);
    assert.equal(quest.children[1].children[0].textContent,`${maximum} / ${maximum}`,'The quest summary includes its confirmed maximum.');
    assert.match(quest.children[2].textContent,new RegExp(`^${unit} ·`));
    assert.ok(quest.children[5].children[1].textContent.includes(`Maximum actuel : ${maximum}`));
    observers.at(-1).fire(quest,true);
    assert.equal(quest.children[3].children[0].children[1].children[1].children[1].textContent,`${maximum} / ${maximum}`,'The selected point includes the same quest maximum.');
    quest.children[5].open=true;quest.children[5].fire('toggle');
    const questRows=quest.children[5].children[2].children[0].children[0].children[1].children;
    assert.equal(questRows[0].children[1].textContent,`0 / ${maximum}`,'Older quest values retain their maximum in the exact-value table.');
  }
  const successCards=find('chart-grid').children.filter(card=>card.dataset.chartKey.startsWith('quests.successes_by_level.'));
  assert.equal(successCards.length,4,'All four success levels have a single combined chart.');
  assert.ok(successCards.every(card=>card.dataset.chartKey.endsWith('.completed')),'Separate totals are absent from the page.');
  const successOne=successCards.find(card=>card.dataset.chartKey==='quests.successes_by_level.1.completed');
  assert.equal(successOne.children[0].children[0].textContent,'Succès de niveau 1');
  assert.equal(successOne.children[1].children[0].textContent,'18 / 20');
  assert.match(successOne.children[2].textContent,/^succès · maximum du dernier relevé/,'Success cards use the correct count unit.');
  observers.at(-1).fire(successOne,true);
  const successControls=successOne.children[3].children[0].children[1],successCopy=successControls.children[1].children[1];
  successControls.children[0].fire('click');assert.match(successCopy.textContent,/^18 \/ 20/,'Older success points retain that level’s latest maximum.');
  successOne.children[5].open=true;successOne.children[5].fire('toggle');
  const successRows=successOne.children[5].children[2].children[0].children[0].children[1].children;
  assert.equal(successRows[0].children[1].textContent,'0 / 20');
  const reached=find('chart-grid').children.find(card=>card.dataset.chartKey==='quests.milestone_tiers_reached');
  assert.equal(reached.children[1].children[0].textContent,'19 / 200','Reached tiers include the latest available total in the card summary.');
  assert.match(reached.children[2].textContent,/maximum du dernier relevé/);
  observers.at(-1).fire(reached,true);
  const reachedControls=reached.children[3].children[0].children[1],reachedCopy=reachedControls.children[1].children[1];
  assert.equal(reachedCopy.textContent,'19 / 200','The selected value is separated from the comparison.');
  const reachedComparison=reachedControls.children[1].children[2];
  assert.equal(reachedComparison.children[0].textContent,'+1');
  assert.equal(reachedComparison.children[1].textContent,'Depuis l’export précédent');
  assert.equal(reachedControls.children[1].attributes.get('aria-atomic'),'true','Screen readers announce a complete selected reading.');
  reachedControls.children[0].fire('click');assert.match(reachedCopy.textContent,/^18 \/ 200/,'Browsing older exports retains the maximum of the latest export.');
  for(let index=0;index<18;index++)reachedControls.children[0].fire('click');
  assert.equal(reachedCopy.textContent,'0 / 200');
  assert.equal(reachedComparison.children[0].hidden,true,'The first export does not invent a previous comparison.');
  assert.equal(reachedComparison.children[1].textContent,'Premier relevé conservé');
  assert.equal(reachedControls.children[0].disabled,true);
  reachedControls.children[2].fire('click');assert.equal(reachedComparison.children[0].hidden,false);
  assert.equal(reachedComparison.children[0].textContent,'+1');
  reached.children[5].open=true;reached.children[5].fire('toggle');
  const reachedRows=reached.children[5].children[2].children[0].children[0].children[1].children;
  assert.equal(reachedRows[0].children[1].textContent,'0 / 200','The first export also uses the latest maximum.');
  assert.equal(reachedRows.at(-1).children[1].textContent,'19 / 200','The exact values table also includes the latest available count.');
  assert.equal(category('playtime'),undefined,'The empty playtime category is removed.');
  category('progression').fire('click');
  const playtime=find('chart-grid').children.find(card=>card.dataset.chartKey==='metric:playtime');
  assert.ok(playtime,'The main playtime chart is available in Progression.');
  assert.equal(playtime.children[0].children[1].textContent,'Progression');
  assert.equal(playtime.children[1].children[0].textContent,'19 min 0 s','The main counter is retained rather than the different vanilla value.');
  assert.equal(category('progression').children[1].textContent,'2','The progression badge includes playtime.');
  assert.ok(!find('chart-grid').children.some(card=>card.dataset.chartKey==='playtime.play_seconds_vanilla_stat'));
  category('plot').fire('click');
  const farmRank=find('chart-grid').children.find(card=>card.dataset.chartKey==='plot.farm_rank');
  assert.equal(farmRank.children[1].children[0].textContent,'99','Rank values are retained.');
  assert.equal(farmRank.children[1].children[1].textContent,'19 places perdues sur l’historique');
  assert.match(farmRank.children[2].textContent,/^places · meilleure place en haut/);
  observers.at(-1).fire(farmRank,true);
  assert.equal(farmRank.children[3].children[0].children[1].children[1].children[2].children[0].textContent,'1 place perdue','Selected rank changes explain the direction.');
  farmRank.children[5].open=true;farmRank.children[5].fire('toggle');
  const rankRows=farmRank.children[5].children[2].children[0].children[0].children[1].children;
  assert.equal(rankRows.at(-1).children[2].textContent,'1 place perdue','Exact-value tables use the same rank direction.');
  category('overview').fire('click');assert.equal(find('chart-grid').children.length,3,'Returning to the overview keeps the replacement.');
  category('jobs').fire('click');assert.equal(find('chart-grid').children.length,4,'The jobs overview shows the four levels.');
  assert.equal(document.activeElement,category('jobs'),'Category navigation keeps keyboard focus after rebuilding its buttons.');
  assert.equal(category('jobs').children[1].textContent,'4','The category badge counts levels instead of detailed fields.');
  assert.ok(find('chart-grid').children.every(card=>card.dataset.chartKey.startsWith('jobs_levels.')),'Resource statistics stay in each job detail view.');
  assert.equal(find('chart-jobs').children.length,5,'All four job buttons remain available.');
  find('chart-jobs').children.find(button=>button.dataset.chartJob==='chasseur').fire('click');
  assert.equal(document.activeElement,find('chart-jobs').children.find(button=>button.dataset.chartJob==='chasseur'),'Job navigation also retains keyboard focus.');
  assert.equal(find('chart-grid').children.length,7,'A job opens its first resource.');
  assert.equal(find('chart-grid').children[0].dataset.chartKey,'job_resources.CHASSEUR.[dracorne].amount');
  assert.equal(find('job-resources-panel').hidden,false);
  assert.equal(find('job-stat-kinds').hidden,false);
  assert.equal(find('job-resources').children.length,2,'Only the two resources remain in the browser.');
  assert.ok(find('job-resources').children.every(button=>button.dataset.jobResource),'The removed job-level button is absent.');
  const card=find('chart-grid').children[0],plot=card.children[3];
  assert.equal(plot.children[0].className,'player-history-chart-placeholder','Offscreen plots are not built.');
  observers.at(-1).fire(card,true);assert.equal(plot.children[0].className,'player-history-visual player-history-visual--compact');
  observers.at(-1).fire(card,false);assert.equal(plot.children[0].className,'player-history-chart-placeholder','Offscreen SVG and point models are released.');
  const resource=key=>find('job-resources').children.find(button=>button.dataset.jobResource===key);
  const kind=key=>find('job-stat-kinds').children.find(button=>button.dataset.jobStatKind===key);
  const job=key=>find('chart-jobs').children.find(button=>button.dataset.chartJob===key);
  resource('[dracorne]').fire('click');
  assert.equal(find('chart-grid').children.length,7);
  assert.equal(find('job-focus-title').textContent,'Dracorne');
  assert.equal(find('chart-grid').children[0].children[0].children[0].textContent,'Quantité','Titles stay short within an explicitly selected resource.');
  assert.ok(find('chart-grid').children.every(card=>card.dataset.chartKey.startsWith('job_resources.CHASSEUR.[dracorne].')));
  assert.equal(kind('milestones').children[1].textContent,'3');
  kind('milestones').fire('click');assert.equal(find('chart-grid').children.length,3,'Tier charts stay together.');
  kind('xp').fire('click');assert.equal(find('chart-grid').children.length,1);
  assert.equal(document.activeElement,kind('xp'),'Type filtering retains keyboard focus.');
  assert.equal(find('chart-grid').children[0].dataset.chartKey,'job_resources.CHASSEUR.[dracorne].xp');
  kind('all').fire('click');assert.equal(find('chart-grid').children.length,7);
  resource('[zombie]').fire('click');assert.equal(find('chart-grid').children.length,2);
  assert.equal(document.activeElement,resource('[zombie]'),'Resource navigation retains keyboard focus.');
  kind('xp').fire('click');resource('[dracorne]').fire('click');assert.equal(kind('all').attributes.get('aria-pressed'),'true','A different resource resets the type filter.');
  for(const [key,resourceKey,count] of [['bucheron','[oak_log]',7],['fermier','[wheat]',3],['mineur','[stone]',1]]){
    job(key).fire('click');assert.ok(find('chart-grid').children.every(card=>card.dataset.chartKey.startsWith('job_resources.')),'Each job opens a resource rather than its level.');
    assert.equal(resource(''),undefined,'The level button stays absent for every job.');
    resource(resourceKey).fire('click');assert.equal(find('chart-grid').children.length,count);
    assert.ok(find('chart-grid').children.every(card=>card.dataset.chartKey.includes(resourceKey)));
  }
  job('chasseur').fire('click');resource('[dracorne]').fire('click');
  find('chart-search').value='experience';find('chart-search').fire('input');
  await until(()=>find('chart-grid').children.length===2&&find('chart-grid').children[0].className==='player-history-resource-section');
  assert.deepEqual(find('chart-grid').children.map(section=>section.children[0].textContent),['Dracorne','Zombie'],'Search covers the whole job and separates results by resource.');
  assert.ok(find('chart-grid').children.every(section=>section.children[1].children.length===1));
  assert.ok(find('job-resources').children.every(button=>button.attributes.get('aria-pressed')==='false'),'Search does not falsely select a single resource.');
  find('chart-search').value='introuvable';find('chart-search').fire('input');await until(()=>find('chart-grid').children[0].textContent==='Aucune statistique trouvée dans cette catégorie.');
  find('chart-search').value='';find('chart-search').fire('input');await until(()=>find('chart-grid').children.length===7);
  assert.equal(resource('[dracorne]').attributes.get('aria-pressed'),'true','Clearing search restores the selected resource.');
  find('chart-search').value='zombie';find('chart-search').fire('input');await until(()=>find('chart-grid').children.length===2);
  resource('[zombie]').fire('click');assert.equal(find('chart-search').value,'','Choosing a search result clears the global search.');
  assert.equal(resource(''),undefined);
  find('chart-jobs').children.find(button=>button.dataset.chartJob==='').fire('click');
  assert.equal(find('chart-grid').children.length,4,'Returning to levels restores the overview.');
  assert.equal(find('job-resources-panel').hidden,true,'The resource browser is scoped to a single job.');
  category('progression').fire('click');assert.equal(find('chart-grid').children.length,2,'Remaining categories still display their own charts.');
  assert.ok(!find('chart-grid').children.some(card=>card.dataset.chartKey==='playtime.play_seconds_vanilla_stat'),'The vanilla chart stays removed.');
  assert.equal(reads,loadedReads,'Category and job changes use projected history without rereading JSON.');
  modes[0].fire('click');await until(()=>find('state').hidden);assert.equal(reads,loadedReads,'Refreshing the chart uses its existing compact cache.');
  dataset='second';listeners.get('statgm-data-updated')();await until(()=>find('state').hidden&&find('chart-count').textContent==='2 graphiques · 2 exports');
  const completion=find('chart-grid').children.find(card=>card.dataset.chartKey==='metric:completion');assert.equal(completion.children[1].children[0].textContent,'81 %','New imports invalidate the old series.');
  category('quests').fire('click');
  assert.equal(find('chart-grid').children.find(card=>card.dataset.chartKey==='quests.milestone_tiers_reached').children[1].children[0].textContent,'1 / 100','A new import refreshes the current maximum.');
  assert.equal(find('chart-grid').children.find(card=>card.dataset.chartKey==='quests.successes_by_level.1.completed').children[1].children[0].textContent,'1 / 18','A new import refreshes each success level’s maximum.');
  category('progression').fire('click');
  const readsBefore=reads;dataset='first';listeners.get('statgm-data-updated')();await until(()=>reads>=readsBefore+2);
  dataset='second';listeners.get('statgm-data-updated')();await until(()=>find('state').hidden&&find('chart-count').textContent==='2 graphiques · 2 exports');
  assert.equal(find('chart-grid').children.find(card=>card.dataset.chartKey==='metric:completion').children[1].children[0].textContent,'81 %','An interrupted history read must not overwrite the newer import.');
  for(const key of ['all','rjobs_stats','stats_store'])assert.equal(category(key),undefined,'New imports do not recreate removed tabs.');
  category('jobs').fire('click');find('chart-jobs').children.find(button=>button.dataset.chartJob==='chasseur').fire('click');
  find('chart-search').value='dracorne experience';find('chart-search').fire('input');await until(()=>find('chart-grid').children.length===1&&find('chart-grid').children[0].dataset.chartKey==='job_resources.CHASSEUR.[dracorne].xp');
  assert.equal(find('chart-grid').children[0].dataset.chartKey,'job_resources.CHASSEUR.[dracorne].xp','Search supports multiple words and accents.');
  dataset='first';find('chart-search').value='';listeners.get('statgm-data-updated')();await until(()=>find('state').hidden&&find('snapshot-count').textContent==='20 relevés');
  resource('[zombie]').fire('click');assert.equal(find('chart-grid').children.length,2);
  dataset='second';listeners.get('statgm-data-updated')();await until(()=>find('state').hidden&&find('snapshot-count').textContent==='2 relevés');
  assert.equal(find('chart-grid').children[0].dataset.chartKey,'job_resources.CHASSEUR.[dracorne].amount','An import removing the selected resource returns to the first available resource.');
  assert.equal(resource('[zombie]'),undefined,'A resource from an old dataset is not retained.');
  listeners.get('pagehide')();
  console.log('PASS: chart-only arrival, bounded player-only reads, interrupted import race, all 20 exports, four job resource browsers and statistic filters, grouped global search, lazy SVG creation and release, cache reuse and resource invalidation.');
})().catch(error=>{console.error(error);process.exitCode=1;});

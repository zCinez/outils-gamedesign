const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;this.textContent='';this.style={};this.attributes=new Map();this.listeners=new Map();}
  append(...children){this.children.push(...children);}replaceChildren(...children){this.children=[...children];}setAttribute(key,value){this.attributes.set(key,value);}addEventListener(type,callback){this.listeners.set(type,callback);}focus(){document.activeElement=this;}fire(type){this.listeners.get(type)?.({});}
}
const elements=new Map(),find=key=>{if(!elements.has(key))elements.set(key,new Element());return elements.get(key);};
for(const value of [10,20,50,100]){const button=new Element('button');button.dataset.top=String(value);find('top-sizes').append(button);}
for(const value of ['linear','log']){const button=new Element('button');button.dataset.scale=value;find('distribution-scales').append(button);}
const document={baseURI:'http://localhost/outils/statgm/statistiques-globales.html',createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),querySelector:selector=>find(selector.slice(6,-1))};
const listeners=new Map(),workers=[];let active={datasetId:'first',ownerId:'owner',playerCount:105,recordsLocal:true},hydrations=0,hydrationFails=false;
const context=vm.createContext({console,Date,Intl,URL,document,setTimeout,clearTimeout});context.window=context;context.addEventListener=(type,handler)=>listeners.set(type,handler);
for(const file of ['player-history.js','player-stats.js','player-history-chart.js','global-stats-model.js','global-stats-charts.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
function makeIndex(extra=0){const players=Array.from({length:105},(_,i)=>({uuid:`12345678-1234-4000-8000-${String(i).padStart(12,'0')}`,name:`Joueur ${i}`})),index=context.StatGMGlobalStats.createIndex(players);
  players.forEach((_,i)=>index.add(i,{exportedAt:'2026-10-09T12:00:00',sortTime:0},{progression:{completion_percent:i%101+extra},profile:{vault_balance:i+extra},plot:{farm_rank:i},jobs_levels:{Mineur:i,Chasseur:i,'Bûcheron':i,Fermier:i},job_resources:{MINEUR:[{resource_key:'stone',amount:i,xp:i*2},{resource_key:'diamond',amount:i,xp:i*2}],CHASSEUR:[{resource_key:'dracorne',xp:i}],BUCHERON:[{resource_key:'oak_log',amount:i}],FERMIER:[{resource_key:'wheat',amount:i}]}}));return index;}
const indexes={first:makeIndex(),second:makeIndex(10)};
class Worker{
  constructor(){this.terminated=false;this.loads=0;this.queries=[];workers.push(this);}
  terminate(){this.terminated=true;}
  emit(data,delay=1,evenTerminated=false){setTimeout(()=>{if(!this.terminated||evenTerminated)this.onmessage?.({data});},delay);}
  postMessage(message){if(message.type==='load'){this.loads++;this.index=indexes[message.datasetId];this.emit({type:'progress',done:4,total:105});this.emit({type:'ready',metrics:this.index.metrics(),context:this.index.context()},3);}else{this.queries.push(message);this.emit({type:'result',request:message.request,result:this.index.query(message.key,message.limit,message.scale)},message.request%2?6:1);}}
}
context.Worker=Worker;context.StatGMArchiveDB={readActive:async()=>active};
context.StatGMCloud={prepareHistoryForImport:async()=>{hydrations++;if(hydrationFails)throw Error('Cloud indisponible');active={...active,recordsLocal:true};}};
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','statistiques-globales.js'),'utf8'),context);
async function until(condition){for(let i=0;i<150;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Page did not settle: '+find('state-detail').textContent);}
const button=(key,dataKey,value)=>find(key).children.find(item=>item.dataset[dataKey]===value);
const rows=()=>find('leaderboard').children[0]?.children[2].children||[];
(async()=>{
  await until(()=>find('ranking').attributes.get('aria-busy')==='false');
  assert.equal(find('global-content').hidden,false);assert.equal(find('metric-title').textContent,'Complétion');assert.equal(rows().length,10);
  assert.match(find('coverage').textContent,/105 \/ 105/);
  assert.match(find('calculation-note').textContent,/indépendamment du top\. Zéros inclus/);
  assert.equal(find('rank-chart').children[0].children[1].children.length,10,'Ranking defaults to bars with one row per player.');
  assert.equal(find('distribution-chart').children[0].children[0].attributes.get('role'),'img','The population histogram has an accessible description.');
  const originalBins=JSON.stringify(indexes.first.query('metric:completion').distribution);
  for(const size of [20,50,100,10]){button('top-sizes','top',String(size)).fire('click');await until(()=>rows().length===size);assert.equal(find('mean').textContent,context.StatGMHistoryChart.format(indexes.first.query('metric:completion').mean,'percent'),'Top size never changes the overall average.');}
  assert.equal(JSON.stringify(indexes.first.query('metric:completion',100).distribution),originalBins,'Distribution also remains independent of the selected top.');
  const previousMean=find('mean').textContent;button('distribution-scales','scale','log').fire('click');await until(()=>find('ranking').attributes.get('aria-busy')==='false');assert.equal(find('mean').textContent,previousMean);
  assert.equal(button('distribution-scales','scale','log').attributes.get('aria-pressed'),'true');
  button('categories','category','economy').fire('click');await until(()=>find('metric-title').textContent==='Argent au moment du relevé'&&find('ranking').attributes.get('aria-busy')==='false');
  assert.equal(find('median').textContent,'52 $');assert.equal(rows()[0].children[2].textContent,'104 $');assert.match(rows()[0].children[1].children[0].href,/fiche-joueur\.html\?uuid=/);
  assert.equal(document.activeElement,button('categories','category','economy'));
  button('categories','category','plot').fire('click');await until(()=>find('metric-title').textContent==='Classement par farm'&&find('ranking').attributes.get('aria-busy')==='false');
  assert.equal(find('coverage').textContent,'104 / 105');assert.match(find('calculation-note').textContent,/Places positives uniquement · Rang 0 non classé exclu/);
  const rankDescription=find('distribution-chart').children[0].children[0].attributes.get('aria-label');assert.match(rankDescription,/rang 0 non classé exclu/);assert.doesNotMatch(rankDescription,/Zéros inclus/);
  const moneyResult={count:4,mean:250000000000,median:10,distribution:context.StatGMGlobalStats.distribution([0,1,20,1e12].map(value=>({value})),10,'log')};
  const moneyChart=context.StatGMGlobalCharts.distribution(moneyResult,{unit:'money'},301).children[0];
  const moneyTicks=moneyChart.children.filter(item=>item.tagName==='text'&&item.attributes.get('y')==='242');
  assert.ok(moneyTicks.length<=3,'Narrow charts reduce tick density for long money labels.');assert.equal(moneyTicks[0].textContent,'0 $');assert.equal(moneyTicks.at(-1).textContent,context.StatGMGlobalCharts.compact(1e12,'money'),'The last monetary endpoint is preserved.');
  button('categories','category','jobs').fire('click');assert.equal(find('metrics').children.length,4);
  for(const job of ['bucheron','chasseur','fermier','mineur']){button('jobs','job',job).fire('click');assert.equal(find('resources-panel').hidden,false);assert.ok(find('resources').children.every(item=>item.dataset.resource),'The level button does not reappear in resource navigation.');}
  button('resources','resource','[stone]').fire('click');button('metrics','metric','job_resources.MINEUR.[stone].xp').fire('click');
  await until(()=>find('ranking').attributes.get('aria-busy')==='false'&&find('metric-title').textContent.includes('Expérience'));
  assert.equal(find('median').textContent,'104');assert.equal(workers.length,1);assert.equal(workers[0].loads,1,'Navigation does not rebuild or reread the dataset.');
  assert.equal(find('selection').open,false,'Choosing a statistic closes the compact filters.');assert.equal(document.activeElement,find('selection-summary'));
  button('categories','category','economy').fire('click');button('categories','category','overview').fire('click');button('metrics','metric','metric:completion').fire('click');
  await until(()=>find('ranking').attributes.get('aria-busy')==='false');assert.notEqual(find('median').textContent,'52 $','An old query cannot overwrite a newer metric.');
  const previousWorker=workers[0];active={...active,datasetId:'second',recordsLocal:false};listeners.get('statgm-data-updated')();
  await until(()=>workers.length===2&&find('ranking').attributes.get('aria-busy')==='false'&&find('mean').textContent===context.StatGMHistoryChart.format(indexes.second.query('metric:completion').mean,'percent'));assert.equal(hydrations,1);assert.equal(previousWorker.terminated,true);
  assert.equal(find('mean').textContent,context.StatGMHistoryChart.format(indexes.second.query('metric:completion').mean,'percent'));
  previousWorker.emit({type:'failed',message:'Stale failure'},1,true);await new Promise(resolve=>setTimeout(resolve,12));assert.equal(find('global-state').hidden,true,'A previous dataset cannot replace the current page.');
  let rejectStaleRead;const readActive=context.StatGMArchiveDB.readActive;
  context.StatGMArchiveDB.readActive=()=>new Promise((_,reject)=>{rejectStaleRead=reject;});listeners.get('statgm-data-updated')();context.StatGMArchiveDB.readActive=readActive;
  const beforeReturn=workers.at(-1);listeners.get('pagehide')();assert.equal(beforeReturn.terminated,true);
  listeners.get('pageshow')({persisted:true});await until(()=>workers.length===3&&find('ranking').attributes.get('aria-busy')==='false');
  rejectStaleRead(Error('Old database failure'));await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(find('global-state').hidden,true,'A stale metadata read failure cannot clear the restored page.');
  button('top-sizes','top','20').fire('click');await until(()=>rows().length===20);assert.equal(workers.at(-1).loads,1,'Browser-back restoration recreates the worker and keeps controls usable.');
  active={...active,ownerId:'other',recordsLocal:false};hydrationFails=true;listeners.get('statgm-data-updated')();await until(()=>!find('retry').hidden);
  assert.equal(find('global-content').hidden,true,'An unavailable complete source never exposes partial-population results.');assert.match(find('state-detail').textContent,/Cloud indisponible/);
  active=null;listeners.get('statgm-data-updated')();await until(()=>!find('import-link').hidden);assert.equal(find('toolbar-count').textContent,'0');
  for(const file of ['index.html','joueurs.html','statistiques-globales.html'])assert.match(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),/href="statistiques-globales\.html"/,'The new tab is reachable through the existing toolbar.');
  listeners.get('pagehide')();assert.ok(workers.every(worker=>worker.terminated));
  console.log('PASS: global tab navigation, top 10/20/50/100, population-wide summaries, profile links, four job/resource views, focus, cache reuse, query races, new imports, full cloud hydration, source errors, empty state, browser-back restoration and worker cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});

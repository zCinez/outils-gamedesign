const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;this.disabled=false;this.textContent='';this.style={};this.clientWidth=900;this.attributes=new Map();this.listeners=new Map();}
  append(...children){this.children.push(...children);}replaceChildren(...children){this.children=[...children];}setAttribute(key,value){this.attributes.set(key,String(value));}addEventListener(type,callback){this.listeners.set(type,callback);}focus(){document.activeElement=this;}fire(type){this.listeners.get(type)?.({});}
}
const elements=new Map(),find=key=>{if(!elements.has(key))elements.set(key,new Element());return elements.get(key);};
const document={baseURI:'http://localhost/outils/statgm/evolution-globale.html',createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),querySelector:selector=>find(selector.slice(6,-1))};
const listeners=new Map(),workers=[];let active={datasetId:'first',ownerId:'owner',recordsLocal:true,playerCount:3},hydrations=0,hydrationFails=false;
const context=vm.createContext({console,Date,Intl,URL,document,setTimeout,clearTimeout});context.window=context;context.addEventListener=(type,callback)=>listeners.set(type,callback);
for(const file of ['player-history.js','player-stats.js','player-history-chart.js','global-evolution-model.js','global-evolution-format.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
const offsets={'metric:earned':0,'metric:spent':1,'metric:coins':2,'metric:balance':3};
const result=(extra=0)=>({players:3,recordsRead:6,duplicates:0,undated:0,metrics:context.StatGMGlobalEvolution.metrics,points:[0,1,2].map(i=>({exportId:`export-${i}`,archive:`Export${i}.zip`,exportedAt:`2026-10-0${i+1}T12:00:00`,sortTime:Date.parse(`2026-10-0${i+1}T12:00:00Z`),players:3,values:context.StatGMGlobalEvolution.metrics.map(metric=>({key:metric.key,value:i===1&&metric.key==='metric:coins'?null:(i+1)*100+offsets[metric.key]+extra,count:i===1&&metric.key==='metric:coins'?0:3,coverageChanged:i===1&&metric.key==='metric:coins',overflow:false}))}))});
class Worker{
  constructor(){this.terminated=false;this.loads=[];workers.push(this);}terminate(){this.terminated=true;}
  emit(data,evenTerminated=false){setTimeout(()=>{if(!this.terminated||evenTerminated)this.onmessage?.({data});},2);}
  postMessage(message){this.loads.push(message);this.emit({type:'progress',done:1,total:3,records:2});this.emit({type:'ready',result:result(message.datasetId==='second'?1000:0)});}
}
context.Worker=Worker;context.StatGMArchiveDB={readActive:async()=>active};context.StatGMCloud={prepareHistoryForImport:async()=>{hydrations++;if(hydrationFails)throw Error('Cloud indisponible');active={...active,recordsLocal:true};}};
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','evolution-globale.js'),'utf8'),context);
async function until(condition){for(let i=0;i<200;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Page did not settle: '+find('state-detail').textContent);}
const button=key=>find('metrics').children.find(item=>item.dataset.metric===`metric:${key}`);
(async()=>{
  await until(()=>!find('evolution-content').hidden);
  assert.equal(find('metric-title').textContent,'Argent gagné total');assert.equal(find('latest-value').textContent,'300 $');assert.equal(workers[0].loads[0].ownerId,'owner');
  assert.equal(find('metrics').children.length,4);assert.match(find('coverage').textContent,/3 \/ 3/);assert.match(find('population').textContent,/3 exports/);
  assert.equal(find('evolution-chart').children[0].children[1].children[1].children[3].textContent,'3 / 3 joueurs renseignés','The selected-point footer keeps coverage without the ZIP filename.');
  const pointDetails=()=>find('evolution-chart').children[0].children[1];
  const change=()=>pointDetails().children[1].children[2].children[0];
  assert.equal(change().textContent,'+100 $ (+50 %)','The latest point compares with the immediately preceding export.');
  pointDetails().children[0].fire('click');assert.equal(change().textContent,'+100 $ (+100 %)','Changing the selected point updates its own percentage.');
  pointDetails().children[0].fire('click');assert.equal(change().hidden,true,'The first export has no percentage comparison.');
  const exactRows=find('values').children[0].children[1].children;assert.equal(exactRows[1].children[3].children[0].textContent,'+100 %');assert.equal(exactRows[2].children[3].children[0].textContent,'+50 %');
  button('balance').fire('click');assert.equal(find('metric-title').textContent,'Argent détenu par les joueurs');assert.equal(find('latest-value').textContent,'303 $');assert.equal(change().textContent,'+100 $ (+49,26 %)');assert.match(find('source').textContent,/profile.vault_balance/);assert.match(find('metric-context').textContent,/Somme des soldes des joueurs/);
  button('spent').fire('click');assert.equal(find('metric-title').textContent,'Argent dépensé total');assert.equal(find('latest-value').textContent,'301 $');assert.equal(document.activeElement,button('spent'));
  button('coins').fire('click');assert.equal(find('latest-value').textContent,'302');assert.match(find('warning').textContent,/partiels/);
  const rendered=find('evolution-chart').children[0],svg=rendered.children[0].children[0],line=svg.children.find(item=>item.attributes.get('class')==='player-history-line');
  assert.equal((line.attributes.get('d').match(/M/g)||[]).length,2,'A missing export creates a gap rather than a zero or an interpolated value.');
  assert.equal(find('values').children[0].children[1].children.length,3,'Every export remains in the exact table, including missing points.');
  const before=find('evolution-chart').children[0];listeners.get('resize')();await until(()=>find('evolution-chart').children[0]!==before);assert.equal(workers[0].loads.length,1,'Metric switches and resize do not reread history.');
  button('earned').fire('click');const first=workers[0];active={...active,datasetId:'second',recordsLocal:false};listeners.get('statgm-data-updated')();
  await until(()=>find('latest-value').textContent==='1,3 millier $');assert.equal(find('latest-value').title,'1 300 $');assert.equal(hydrations,1);assert.equal(first.terminated,true);
  first.emit({type:'failed',message:'Stale error'},true);await new Promise(resolve=>setTimeout(resolve,10));assert.equal(find('evolution-state').hidden,true);
  let rejectStaleRead;const readActive=context.StatGMArchiveDB.readActive;
  context.StatGMArchiveDB.readActive=()=>new Promise((_,reject)=>{rejectStaleRead=reject;});listeners.get('statgm-data-updated')();context.StatGMArchiveDB.readActive=readActive;
  const second=workers.at(-1);listeners.get('pagehide')();assert.equal(second.terminated,true);listeners.get('pageshow')({persisted:true});await until(()=>workers.length===3&&!find('evolution-content').hidden);
  rejectStaleRead(Error('Old metadata error'));await new Promise(resolve=>setTimeout(resolve,10));assert.equal(find('evolution-state').hidden,true);
  button('spent').fire('click');assert.equal(find('latest-value').textContent,'1,3 millier $');assert.equal(find('latest-value').title,'1 301 $');
  active={...active,ownerId:'other',recordsLocal:false};hydrationFails=true;listeners.get('statgm-data-updated')();await until(()=>!find('retry').hidden);assert.match(find('state-detail').textContent,/Cloud indisponible/);assert.equal(find('evolution-content').hidden,true,'Never expose partial-source totals.');
  active=null;listeners.get('statgm-data-updated')();await until(()=>!find('import-link').hidden);assert.equal(find('toolbar-count').textContent,'0');
  for(const file of ['index.html','joueurs.html','statistiques-globales.html','evolution-globale.html'])assert.match(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),/href="evolution-globale\.html"/);
  listeners.get('pagehide')();assert.ok(workers.every(worker=>worker.terminated));
  console.log('PASS: four curve controls including actual player balances, percentages by adjacent export, gaps, complete per-export table, coverage, focus, cache reuse, full cloud hydration, source/account invalidation, stale messages, browser-back restoration and worker cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});

(() => {
  const db=window.StatGMArchiveDB,s=window.StatGMPlayerStats,chart=window.StatGMHistoryChart,visuals=window.StatGMGlobalCharts;
  const find=key=>document.querySelector(`[data-${key}]`),node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  let worker,generation=0,request=0,loadedDataset,loadedOwner,choices=[],category="overview",job="",resource="",metricKey="metric:completion",limit=10,distributionScale="auto",scaleMetric="",lastResult,resizeTimer;
  function focus(key,dataKey,value){[...find(key).children].find(button=>button.dataset[dataKey]===value)?.focus({preventScroll:true});}
  function stop(){worker?.terminate();worker=null;lastResult=null;request++;}
  function state(title,detail,{retry=false,empty=false}={}){
    find("global-content").hidden=true;find("global-state").hidden=false;find("state-title").textContent=title;find("state-detail").textContent=detail;
    find("retry").hidden=!retry;find("import-link").hidden=!empty;find("load-progress").hidden=retry||empty;
  }
  function fail(message){stop();state("Statistiques indisponibles",message,{retry:true});}
  function scopeMetrics(){
    const available=category==="overview"?chart.overviewMetrics(choices):choices.filter(metric=>metric.category===category);
    if(category!=="jobs")return available;
    if(!job)return chart.jobMetrics(available);
    return chart.jobResources(available,job).find(group=>group.key===resource)?.metrics||[];
  }
  function navigation(){
    const categories=chart.categories(choices);
    if(!categories.some(group=>group.key===category)){category=categories[0]?.key||"overview";job="";resource="";}
    find("categories").replaceChildren(...categories.map(group=>{
      const button=node("button","player-history-category");button.type="button";button.dataset.category=group.key;button.setAttribute("aria-pressed",String(category===group.key));
      button.append(node("span","",group.label),node("span","player-history-category-count",String(group.count)));
      button.addEventListener("click",()=>{category=group.key;job="";resource="";navigation();focus("categories","category",category);});return button;
    }));
    const jobs=[...new Set(choices.filter(metric=>metric.category==="jobs").map(metric=>metric.job).filter(Boolean))].sort((a,b)=>s.label(a).localeCompare(s.label(b),"fr"));
    if(!jobs.includes(job))job="";
    find("jobs").hidden=category!=="jobs";
    find("jobs").replaceChildren(...[{key:"",label:"Niveaux des métiers"},...jobs.map(key=>({key,label:s.label(key)}))].map(item=>{
      const button=node("button","player-history-job",item.label);button.type="button";button.dataset.job=item.key;button.setAttribute("aria-pressed",String(job===item.key));
      button.addEventListener("click",()=>{job=item.key;resource="";navigation();focus("jobs","job",job);});return button;
    }));
    const resources=category==="jobs"&&job?chart.jobResources(choices,job).filter(group=>group.key):[];
    if(!resources.some(group=>group.key===resource))resource=resources[0]?.key||"";
    find("resources-panel").hidden=category!=="jobs"||!job||!resources.length;
    find("layout").className="global-layout";
    find("resources-count").textContent=`${resources.length} ressources · ${s.label(job)}`;
    find("resources").replaceChildren(...resources.map(group=>{
      const button=node("button","player-history-resource",group.label);button.type="button";button.dataset.resource=group.key;button.setAttribute("aria-pressed",String(resource===group.key));
      button.addEventListener("click",()=>{resource=group.key;navigation();focus("resources","resource",resource);});return button;
    }));
    const metrics=scopeMetrics();
    if(!metrics.some(metric=>metric.key===metricKey))metricKey=metrics[0]?.key||"";
    find("metrics").replaceChildren(...metrics.map(metric=>{
      const button=node("button","",category==="jobs"&&job?metric.statLabel:metric.label);button.type="button";button.dataset.metric=metric.key;button.setAttribute("aria-pressed",String(metricKey===metric.key));
      button.addEventListener("click",()=>{metricKey=metric.key;navigation();find("selection").open=false;find("selection-summary").focus({preventScroll:true});});return button;
    }));
    if(!metrics.length){find("ranking").hidden=true;find("metrics").append(node("p","player-note","Aucune statistique de ressource disponible pour ce métier."));return;}
    find("ranking").hidden=false;
    const selected=choices.find(metric=>metric.key===metricKey);
    find("selected-stat").textContent=selected.label;
    find("metric-title").textContent=selected.label;
    find("metric-context").textContent=selected.invertedAxis?"Meilleures places en premier. Les barres représentent le rang : plus court = meilleure place.":"Valeurs les plus élevées en premier · Barres à partir de zéro.";
    find("source").textContent=`Source : ${selected.path}${selected.fallback?` (ou ${selected.fallback} selon l’export)`:""}${selected.denominator?` ÷ ${selected.denominator} × 100`:""}.`;
    query();
  }
  function query(){
    if(!worker||!metricKey)return;
    lastResult=null;
    if(scaleMetric!==metricKey){distributionScale="auto";scaleMetric=metricKey;}
    find("ranking").setAttribute("aria-busy","true");
    for(const key of ["mean","median","coverage"])find(key).textContent="…";
    find("warning").hidden=true;for(const key of ["leaderboard","rank-chart","distribution-chart"])find(key).replaceChildren();find("top-count").textContent="Calcul du classement…";
    worker.postMessage({type:"query",request:++request,key:metricKey,limit,scale:distributionScale});
  }
  function render(result){
    lastResult=result;
    const metric=choices.find(metric=>metric.key===result.key);
    find("mean").textContent=chart.format(result.mean,metric.unit);find("median").textContent=chart.format(result.median,metric.unit);
    find("coverage").textContent=`${s.number(result.count,0)} / ${s.number(result.total,0)}`;
    find("calculation-note").textContent=`Sur tous les joueurs renseignés, indépendamment du top. ${metric.invertedAxis?"Places positives uniquement · Rang 0 non classé exclu.":"Zéros inclus, données absentes exclues."}`;
    find("warning").textContent=result.warning;find("warning").hidden=!result.warning;
    find("top-title").textContent=`Top ${result.limit} · ${metric.invertedAxis?"meilleures places":"plus hautes valeurs"}`;
    find("distribution-scales").hidden=!result.distribution.canLog;
    for(const button of find("distribution-scales").children)button.setAttribute("aria-pressed",String(button.dataset.scale===result.distribution.mode));
    find("distribution-chart").replaceChildren(visuals.distribution(result,metric,find("distribution-chart").clientWidth));
    find("top-count").textContent=`${result.rows.length} joueur${result.rows.length>1?"s":""} affiché${result.rows.length>1?"s":""} sur ${s.number(result.count,0)} renseignés${result.missing?` · ${s.number(result.missing,0)} sans valeur pour cette statistique`:""}`;
    if(!result.rows.length){for(const key of ["leaderboard","rank-chart"])find(key).append(node("p","player-note","Aucun joueur ne renseigne cette statistique dans son dernier relevé."));}
    else{
      find("rank-chart").replaceChildren(visuals.ranking(result,metric));
      const table=node("table","global-table"),caption=node("caption","sr-only",`Top ${result.limit} des joueurs — ${metric.label}`),head=node("thead"),header=node("tr"),body=node("tbody");
      for(const label of ["Place","Joueur",metric.unit==="money"?"Montant ($)":metric.unit==="percent"?"Valeur (%)":"Valeur"]){const cell=node("th","",label);cell.scope="col";header.append(cell);}head.append(header);
      for(const player of result.rows){
        const row=node("tr"),identity=node("td"),link=node("a","",player.name);link.href=`fiche-joueur.html?uuid=${encodeURIComponent(player.uuid)}`;link.title=player.uuid;
        const date=node("small","",player.exportedAt?`Relevé du ${s.date(player.exportedAt)}`:"Date du relevé non renseignée");
        identity.append(link,date);row.append(node("td","",String(player.rank)),identity,node("td","",chart.format(player.value,metric.unit)));body.append(row);
      }
      table.append(caption,head,body);find("leaderboard").append(table);
    }
    find("ranking").setAttribute("aria-busy","false");
  }
  async function load(){
    const run=++generation;stop();state("Chargement des statistiques…","Lecture du dernier relevé de chaque joueur.");find("load-progress").value=0;
    try{
      let active=await db.readActive();if(run!==generation)return;
      if(!active){loadedDataset=null;loadedOwner="";find("toolbar-count").textContent="0";state("Aucun joueur importé","Importe tes exports ZIP dans StatGM pour calculer les classements, la moyenne et la médiane.",{empty:true});return;}
      loadedDataset=active.datasetId;loadedOwner=active.ownerId||"";
      find("toolbar-count").textContent=s.number(active.playerCount||0,0);
      if(active.recordsLocal===false){
        find("state-detail").textContent="Récupération de l’historique complet depuis ta sauvegarde cloud…";
        // Reuse the existing complete hydration path; this does not start an import.
        if(!window.StatGMCloud?.prepareHistoryForImport)throw new Error("Récupère la sauvegarde complète ou réimporte tes ZIP.");
        await window.StatGMCloud.prepareHistoryForImport();if(run!==generation)return;
        active=await db.readActive();if(run!==generation)return;
        if(active?.datasetId!==loadedDataset||(active.ownerId||"")!==loadedOwner)throw new Error("L’import actif a changé. Réessaie.");
      }
      worker=new Worker(new URL("global-stats-worker.js?v=20261018c",document.baseURI));
      worker.onerror=event=>{event.preventDefault();if(run===generation)fail("Le calcul a été interrompu. Réessaie ou réimporte tes exports.");};
      worker.onmessage=({data})=>{
        if(run!==generation)return;
        if(data.type==="progress"){
          find("load-progress").value=data.total?data.done/data.total*100:0;
          find("state-detail").textContent=`Lecture des joueurs : ${s.number(data.done,0)} / ${s.number(data.total,0)}. Les exports sont dédoublonnés par joueur.`;
        }else if(data.type==="ready"){
          choices=data.metrics;
          if(!data.context.players){stop();state("Aucun joueur importé","Ajoute tes exports ZIP pour consulter les statistiques globales.",{empty:true});return;}
          if(!choices.length){fail("Aucune statistique numérique disponible dans les derniers relevés.");return;}
          const context=data.context;
          find("toolbar-count").textContent=s.number(context.players,0);
          find("population").textContent=`${s.number(context.players,0)} joueurs · Dernier relevé de chaque joueur${context.firstDate?` · Relevés du ${s.date(context.firstDate)} au ${s.date(context.lastDate)}`:""}${context.undated?` · ${s.number(context.undated,0)} dates absentes`:""}.`;
          find("global-state").hidden=true;find("global-content").hidden=false;navigation();
        }else if(data.type==="result"&&data.request===request)render(data.result);
        else if(data.type==="failed")fail(data.message);
      };
      worker.postMessage({type:"load",datasetId:active.datasetId});
    }catch(error){if(run===generation)fail(error.message);}
  }
  for(const button of find("top-sizes").children)button.addEventListener("click",()=>{limit=Number(button.dataset.top);for(const item of find("top-sizes").children)item.setAttribute("aria-pressed",String(Number(item.dataset.top)===limit));query();});
  for(const button of find("distribution-scales").children)button.addEventListener("click",()=>{distributionScale=button.dataset.scale;query();});
  find("retry").addEventListener("click",()=>void load());
  window.addEventListener("statgm-data-updated",()=>{const run=generation;void db.readActive().then(active=>{if(run===generation&&(active?.datasetId!==loadedDataset||(active?.ownerId||"")!==loadedOwner))void load();}).catch(()=>{if(run===generation)fail("Impossible de lire l’import actif. Réessaie.");});});
  window.addEventListener("pageshow",event=>{if(event.persisted)void load();});
  window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(lastResult){const metric=choices.find(item=>item.key===lastResult.key);find("distribution-chart").replaceChildren(visuals.distribution(lastResult,metric,find("distribution-chart").clientWidth));}},100);});
  window.addEventListener("pagehide",()=>{generation++;clearTimeout(resizeTimer);stop();});void load();
})();

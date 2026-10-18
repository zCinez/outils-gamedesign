(() => {
  const db=window.StatGMArchiveDB,h=window.StatGMHistory,s=window.StatGMPlayerStats,chart=window.StatGMHistoryChart;
  const find=key=>document.querySelector(`[data-${key}]`),node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const uuid=(new URLSearchParams(location.search).get("uuid")||"").toLowerCase();
  let active,summary,snapshots=[],generation=0,renderGeneration=0;
  let chartHistoryPromise,chartHistory,chartChoices=[],chartCategory="overview",chartJob="",chartResource="",chartKind="all",chartSearchTimer,resizeTimer,chartObserver;
  const chartCards=new Map();
  const cache=new Map();
  document.querySelectorAll("[data-profile]").forEach(link=>link.href=`fiche-joueur.html?uuid=${encodeURIComponent(uuid)}`);
  function table(headers){const wrap=node("div","player-table-wrap"),el=node("table","player-table"),head=node("thead"),tr=node("tr"),body=node("tbody");for(const title of headers){const th=node("th","",title);th.scope="col";tr.append(th);}head.append(tr);el.append(head,body);wrap.append(el);return{wrap,body};}
  async function read(sequence,datasetId=active.datasetId){
    const key=`${datasetId}:${sequence}`;
    if(cache.has(key))return cache.get(key);
    const record=await db.readPlayerRecord(datasetId,uuid,sequence);if(!record?.data)throw new Error("Ce relevé n’est pas disponible.");
    if(active?.datasetId===datasetId){cache.set(key,record);if(cache.size>3)cache.delete(cache.keys().next().value);}return record;
  }
  function readChartHistory(){
    if(chartHistoryPromise)return chartHistoryPromise;
    const run=generation,datasetId=active.datasetId,observations=[...snapshots];
    chartHistoryPromise=(async()=>{
      const projected=[];
      for(let index=0;index<observations.length;index+=4){
        if(run!==generation)return null;
        const batch=await Promise.all(observations.slice(index,index+4).map(async snapshot=>chart.project(snapshot,(await read(snapshot.sequence,datasetId)).data)));
        if(run!==generation)return null;
        projected.push(...batch);
        find("state").textContent=`Lecture des exports du joueur… ${projected.length}/${observations.length}`;
      }
      return projected;
    })();
    chartHistoryPromise.catch(()=>{if(run===generation)chartHistoryPromise=null;});
    return chartHistoryPromise;
  }
  const categoryMetrics=()=>chartCategory==="overview"?chart.overviewMetrics(chartChoices):chartChoices.filter(metric=>metric.category===chartCategory);
  function chartButtons(){
    const categories=chart.categories(chartChoices);
    if(!categories.some(group=>group.key===chartCategory)){chartCategory=categories[0]?.key||"overview";chartJob="";}
    find("chart-categories").replaceChildren(...categories.map(group=>{
      const button=node("button","player-history-category");button.type="button";button.dataset.chartCategory=group.key;
      button.setAttribute("aria-pressed",String(group.key===chartCategory));button.append(node("span","",group.label),node("span","player-history-category-count",String(group.count)));
      button.addEventListener("click",()=>{chartCategory=group.key;chartJob="";chartResource="";chartKind="all";clearTimeout(chartSearchTimer);find("chart-search").value="";chartButtons();renderChartGrid();[...find("chart-categories").children].find(item=>item.dataset.chartCategory===chartCategory)?.focus({preventScroll:true});});return button;
    }));
    const jobs=[...new Set(categoryMetrics().map(metric=>metric.job).filter(Boolean))].sort((a,b)=>s.label(a).localeCompare(s.label(b),"fr"));
    if(!jobs.includes(chartJob))chartJob="";
    find("chart-jobs").hidden=!jobs.length;
    find("chart-jobs").replaceChildren(...[{key:"",label:chartCategory==="jobs"?"Niveaux des métiers":"Tous les métiers"},...jobs.map(key=>({key,label:s.label(key)}))].map(job=>{
      const button=node("button","player-history-job",job.label);button.type="button";button.dataset.chartJob=job.key;button.setAttribute("aria-pressed",String(job.key===chartJob));
      button.addEventListener("click",()=>{chartJob=job.key;chartResource="";chartKind="all";clearTimeout(chartSearchTimer);find("chart-search").value="";chartButtons();renderChartGrid();[...find("chart-jobs").children].find(item=>item.dataset.chartJob===chartJob)?.focus({preventScroll:true});});return button;
    }));
  }
  function jobNavigation(available,matches,searching){
    const resources=chart.jobResources(available,chartJob);
    if(!resources.some(resource=>resource.key===chartResource))chartResource=resources[0]?.key||"";
    const selected=resources.find(resource=>resource.key===chartResource);
    const visible=searching?chart.jobResources(matches,chartJob):resources;
    find("job-resources-count").textContent=`${resources.filter(resource=>resource.key).length} ressources · ${s.label(chartJob)}`;
    find("job-resources").replaceChildren(...visible.map(resource=>{
      const button=node("button","player-history-resource");button.type="button";button.dataset.jobResource=resource.key;
      button.setAttribute("aria-pressed",String(!searching&&resource.key===chartResource));button.append(node("span","",resource.label),node("span","player-history-category-count",String(resource.metrics.length)));
      button.addEventListener("click",()=>{chartResource=resource.key;chartKind="all";clearTimeout(chartSearchTimer);find("chart-search").value="";renderChartGrid();[...find("job-resources").children].find(item=>item.dataset.jobResource===chartResource)?.focus();});return button;
    }));
    if(!visible.length)find("job-resources").append(node("p","player-note",searching?"Aucune ressource ne correspond à la recherche.":"Aucune statistique de ressource disponible pour ce métier."));
    find("job-focus-title").textContent=searching?"Résultats de recherche":selected?.label||s.label(chartJob);
    find("job-focus-caption").textContent=searching?`Recherche dans toutes les ressources de ${s.label(chartJob)}.`:selected?`Statistiques de ${selected.label} · ${s.label(chartJob)}. Chaque courbe conserve tous les exports.`:"Le niveau reste accessible dans Niveaux des métiers.";
    const scoped=searching?matches:selected?.metrics||[],kinds=chart.jobMetricKinds(scoped);
    if(!kinds.some(kind=>kind.key===chartKind))chartKind="all";
    find("job-stat-kinds").hidden=kinds.length<=2;
    find("job-stat-kinds").replaceChildren(...kinds.map(kind=>{
      const button=node("button","player-history-stat-kind");button.type="button";button.dataset.jobStatKind=kind.key;button.setAttribute("aria-pressed",String(kind.key===chartKind));
      button.append(node("span","",kind.label),node("span","player-history-category-count",String(kind.count)));
      button.addEventListener("click",()=>{chartKind=kind.key;renderChartGrid();[...find("job-stat-kinds").children].find(item=>item.dataset.jobStatKind===chartKind)?.focus();});return button;
    }));
    return chart.sortJobMetrics(scoped.filter(metric=>chartKind==="all"||metric.statKind===chartKind));
  }
  function chartValues(entry){
    if(!entry.details.open)return;
    const model=entry.model||chart.series(chartHistory,entry.metric);
    const result=table(["Date de l’export","Valeur","Depuis l’export précédent"]);
    for(const point of model.points){
      const row=node("tr");row.title=point.archive || point.source;
      row.append(node("td","",point.exportedAt?s.date(point.exportedAt):"Date non renseignée"),node("td","",chart.formatPoint(point,model.metric)),node("td","",chart.deltaLabel(point.delta,model.metric.unit,model.metric)));result.body.append(row);
    }
    entry.values.replaceChildren(result.wrap);
  }
  function drawChartCard(entry){
    if(!chartCards.has(entry.root))return;
    entry.model ||= chart.series(chartHistory,entry.metric);
    entry.plot.replaceChildren(chart.draw(entry.model,entry.plot.clientWidth,{compact:true}));
  }
  function releaseChartCard(entry){
    if(!entry.model||entry.details.open)return;
    entry.plot.style.minHeight=`${entry.plot.getBoundingClientRect().height}px`;
    entry.plot.replaceChildren(node("p","player-history-chart-placeholder","La courbe se charge à l’affichage."));entry.model=null;
  }
  function clearChartCards(){chartObserver?.disconnect();chartCards.clear();find("chart-grid").replaceChildren();}
  function createChartCard(metric,headingTag="h3"){
    const root=node("article","player-panel player-history-chart-card");root.dataset.chartKey=metric.key;
    const jobDetail=chartCategory==="jobs"&&chartJob;
    const heading=node("div","player-history-card-heading"),title=node(headingTag,"",jobDetail?metric.statLabel:metric.label),scope=node("span","",jobDetail?metric.resource?metric.resourceLabel:s.label(chartJob):metric.categoryLabel);
    heading.append(title,scope);
    const summary=chart.summarize(chartHistory,metric),values=node("div","player-history-card-summary"),value=node("strong","",chart.formatPoint(summary.last,metric));
    value.title=summary.last?.exportedAt?`Dernière valeur disponible : ${s.date(summary.last.exportedAt)}`:"Dernière valeur disponible";
    const change=node("span","player-history-card-change",`${chart.deltaLabel(summary.delta,metric.unit,metric)} sur l’historique`);
    change.title=summary.first?`Première valeur disponible : ${chart.formatPoint(summary.first,metric)}${summary.first.exportedAt?` · ${s.date(summary.first.exportedAt)}`:""}`:"";
    values.append(value,change);
    const unit=metric.countUnit|| (metric.unit==="money"?"$":metric.unit==="duration"?"durée":metric.unit==="percent"?"%":"unités");
    const caption=node("p","player-history-card-caption",`${unit}${metric.invertedAxis?" · meilleure place en haut":""}${metric.totalPath?" · maximum du dernier relevé":""} · ${summary.count}/${snapshots.length} relevés renseignés`);
    const plot=node("div","player-history-card-plot");plot.append(node("p","player-history-chart-placeholder","Chargement de la courbe…"));
    const warnings=[];
    if(summary.count===1)warnings.push("Un seul relevé renseigné : l’évolution n’est pas encore comparable.");
    if(summary.missing)warnings.push(`${summary.missing} export${summary.missing>1?"s":""} sans cette valeur.`);
    if(summary.sourceChanged)warnings.push("Source du temps de jeu différente : courbe interrompue et évolution globale non comparable.");
    if(summary.counterDropped)warnings.push("Compteur en baisse : remise à zéro ou correction possible.");
    const warning=node("p","player-note player-history-warning",warnings.join(" "));warning.hidden=!warnings.length;
    const details=node("details","player-history-chart-values"),exact=node("div"),source=node("p","player-note",metric.denominator?`Calcul : paliers atteints ÷ paliers disponibles × 100. Source : ${metric.path} / ${metric.denominator} × 100.`:`Source : ${metric.path}${metric.totalPath?` / ${metric.totalPath} du dernier relevé conservé`:""}${metric.fallback?` (ou ${metric.fallback} selon l’export)`:""}.${metric.fixedTotal?` Maximum actuel : ${s.number(metric.total,0)} ${metric.countUnit}.`:""}`);
    details.append(node("summary","","Valeurs et source"),source,exact);
    const entry={root,metric,plot,details,values:exact,model:null};details.addEventListener("toggle",()=>chartValues(entry));
    root.append(heading,values,caption,plot,warning,details);chartCards.set(root,entry);return root;
  }
  function renderChartGrid(){
    if(!chartHistory)return;
    clearChartCards();
    const normalize=text=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr");
    const terms=normalize(find("chart-search").value.trim()).split(/\s+/).filter(Boolean);
    const jobDetail=chartCategory==="jobs"&&Boolean(chartJob);
    find("job-layout").className=`player-history-chart-body${jobDetail?" player-history-chart-body--job":""}`;
    for(const key of ["job-resources-panel","job-focus"])find(key).hidden=!jobDetail;
    if(!jobDetail)find("job-stat-kinds").hidden=true;
    const available=(chartCategory==="jobs"?chart.jobMetrics(categoryMetrics(),chartJob):categoryMetrics().filter(metric=>!chartJob||metric.job===chartJob)).filter(metric=>!jobDetail||metric.resource);
    const matches=available.filter(metric=>terms.every(term=>normalize(`${metric.label} ${metric.categoryLabel} ${metric.group} ${metric.path} ${metric.resourceLabel} ${metric.statLabel}`).includes(term)));
    const metrics=jobDetail?jobNavigation(available,matches,Boolean(terms.length)):matches;
    const category=chart.categories(chartChoices).find(group=>group.key===chartCategory),first=snapshots[0],last=snapshots.at(-1);
    find("chart-count").textContent=`${metrics.length} graphique${metrics.length>1?"s":""} · ${snapshots.length} export${snapshots.length>1?"s":""}`;
    find("chart-scope").textContent=`${category?.label||"Statistiques"}${chartJob?` · ${s.label(chartJob)}`:chartCategory==="jobs"?" · Niveaux des métiers":""} · ${first.exportedAt?s.date(first.exportedAt):"Premier relevé"} → ${last.exportedAt?s.date(last.exportedAt):"Dernier relevé"}${chartHistory.every(row=>Number.isFinite(row.sortTime))?"":" · Axe horizontal : ordre des relevés (dates absentes)"}`;
    const resourceGroups=jobDetail&&terms.length?chart.jobResources(metrics,chartJob):[];
    find("chart-grid").className=`player-history-chart-grid${resourceGroups.length>1?" player-history-chart-grid--grouped":""}`;
    if(!metrics.length){find("chart-grid").append(node("p","player-panel player-note","Aucune statistique trouvée dans cette catégorie."));return;}
    if(resourceGroups.length>1){
      find("chart-grid").replaceChildren(...resourceGroups.map(resource=>{
        const section=node("section","player-history-resource-section"),heading=node("h3","",resource.label),grid=node("div","player-history-chart-grid");
        heading.id=`job-result-${encodeURIComponent(resource.key||"level")}`;section.setAttribute("aria-labelledby",heading.id);
        grid.append(...resource.metrics.map(metric=>createChartCard(metric,"h4")));section.append(heading,grid);return section;
      }));
    }else find("chart-grid").replaceChildren(...metrics.map(metric=>createChartCard(metric)));
    if(typeof IntersectionObserver==="function"){
      chartObserver=new IntersectionObserver(entries=>{for(const item of entries){const card=chartCards.get(item.target);if(card){if(item.isIntersecting)drawChartCard(card);else releaseChartCard(card);}}},{rootMargin:"300px 0px"});
      for(const root of chartCards.keys())chartObserver.observe(root);
    }else for(const entry of chartCards.values())drawChartCard(entry);
  }
  async function renderChart(token,run){
    const history=await readChartHistory();
    if(!history||token!==renderGeneration||run!==generation)return;
    chartHistory=history;chartChoices=chart.catalog(history);chartButtons();renderChartGrid();
    find("state").hidden=true;
  }
  async function render(){
    const token=++renderGeneration,run=generation;find("retry").hidden=true;find("state").textContent="Lecture des exports du joueur…";find("state").hidden=false;
    try{
      await renderChart(token,run);
    }catch(error){if(token===renderGeneration&&run===generation){find("state").textContent=error.message;find("retry").hidden=false;clearChartCards();}}
  }
  async function load(){
    const token=++generation;renderGeneration++;cache.clear();find("content").hidden=true;find("retry").hidden=true;find("state").hidden=false;find("state").textContent="Chargement de l’historique…";
    chartHistoryPromise=null;chartHistory=null;chartChoices=[];clearChartCards();
    for(const key of ["chart-count","chart-scope"])find(key).textContent="";
    for(const key of ["chart-categories","chart-jobs"])find(key).replaceChildren();
    try{
      if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(uuid))throw new Error("Choisis un joueur depuis les cartes.");
      const nextActive=await db.readActive();if(token!==generation)return;if(!nextActive)throw new Error("Importe un export ou connecte-toi à ton compte.");
      const nextSummary=await db.readPlayer(nextActive.datasetId,uuid);if(token!==generation)return;if(!nextSummary)throw new Error("Ce joueur ne figure pas dans l’historique du compte.");
      active=nextActive;summary=nextSummary;
      if(active.recordsLocal===false){const hydrate=()=>window.StatGMCloud.ensurePlayerRecords(uuid);if(navigator.locks&&active.ownerId)await navigator.locks.request(`statgm-cloud:${active.ownerId}`,hydrate);else await hydrate();}
      if(token!==generation)return;
      snapshots=h.observations(await h.catalog(db,active,uuid));if(token!==generation)return;if(!snapshots.length)throw new Error("Aucun relevé disponible pour ce joueur.");
      const first=snapshots[0],last=snapshots.at(-1);document.title=`Progression de ${summary.name} — StatGM`;find("name").textContent=summary.name;window.StatGMHeads.resetObservations();find("head").replaceChildren(window.StatGMHeads.create(summary));find("grade").replaceChildren(window.StatGMGrades.create(summary.grade));
      const lastRecord=await read(last.sequence);if(token!==generation)return;
      summary={...summary,firstPlayedMs:summary.firstPlayedMs || lastRecord.data.player?.first_played_ms};
      find("first-connection").textContent=`Première connexion : ${summary.firstPlayedMs?s.date(summary.firstPlayedMs):"non renseignée"}`;find("snapshot-count").textContent=`${snapshots.length} relevé${snapshots.length>1?"s":""}`;
      find("history-range").textContent=`Premier export disponible : ${first.exportedAt?s.date(first.exportedAt):"date non renseignée"}`;
      const list=table(["Date du relevé","Archive"]);for(const snapshot of snapshots.toReversed()){const row=node("tr");row.append(node("td","",snapshot.exportedAt?s.date(snapshot.exportedAt):"Date non renseignée"),node("td","",snapshot.archive));list.body.append(row);}find("history-list").replaceChildren(list.wrap);
      find("content").hidden=false;await render();
    }catch(error){if(token===generation){find("state").textContent=error.message;find("retry").hidden=false;}}
  }
  document.querySelectorAll('[data-mode="chart"]').forEach(button=>button.addEventListener("click",()=>void render()));
  find("chart-search").addEventListener("input",()=>{clearTimeout(chartSearchTimer);chartSearchTimer=setTimeout(renderChartGrid,120);});
  window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{for(const entry of chartCards.values())if(entry.model)drawChartCard(entry);},100);});
  find("retry").addEventListener("click",()=>void load());window.addEventListener("statgm-data-updated",()=>void load());window.addEventListener("pagehide",()=>{generation++;renderGeneration++;chartObserver?.disconnect();clearTimeout(chartSearchTimer);clearTimeout(resizeTimer);});void load();
})();

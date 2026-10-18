(() => {
  const db=window.StatGMArchiveDB,s=window.StatGMPlayerStats,chart=window.StatGMHistoryChart,readable=window.StatGMGlobalEvolutionFormat;
  const find=key=>document.querySelector(`[data-${key}]`),node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  let worker,generation=0,loadedDataset,loadedOwner,result,selected="metric:earned",model,resizeTimer;
  function stop(){worker?.terminate();worker=null;result=null;model=null;}
  function state(title,detail,{retry=false,empty=false}={}){
    find("evolution-content").hidden=true;find("evolution-state").hidden=false;find("state-title").textContent=title;find("state-detail").textContent=detail;
    find("retry").hidden=!retry;find("import-link").hidden=!empty;find("load-progress").hidden=retry||empty;
  }
  function fail(message){stop();state("Évolution indisponible",message,{retry:true});}
  function draw(){if(model)find("evolution-chart").replaceChildren(chart.draw(model,find("evolution-chart").clientWidth,{formatValue:readable.value,formatDelta:readable.comparison,formatTick:readable.tick}));}
  function render(){
    if(!result)return;
    const metric=result.metrics.find(item=>item.key===selected),rows=result.points.map(point=>{
      const value=point.values.find(item=>item.key===selected);
      return {...point,...value,archive:`${s.number(value.count,0)} / ${s.number(point.players,0)} joueurs renseignés`,fields:new Map([[selected,value.value]])};
    });
    model=chart.series(rows,metric);
    for(const button of find("metrics").children)button.setAttribute("aria-pressed",String(button.dataset.metric===selected));
    const last=rows.at(-1),unit=metric.unit==="money"?"$":"Coins";
    find("metric-title").textContent=metric.label;find("latest-value").textContent=readable.value(last.value,metric.unit);find("latest-value").title=chart.format(last.value,metric.unit);
    find("metric-context").textContent=`Un point par export · ${metric.description||"Somme des valeurs renseignées"} · Axe vertical ajusté aux montants`;
    find("coverage").textContent=`${last.exportedAt?s.date(last.exportedAt):"Dernier export non daté"} · ${s.number(last.count,0)} / ${s.number(last.players,0)} joueurs renseignés · ${unit}`;
    find("source").textContent=`Source : somme de ${metric.path} dans chaque export. ${result.duplicates?`${s.number(result.duplicates,0)} doublon(s) de joueur au sein d’un export écarté(s).`:""}`;
    const warnings=[];
    if(rows.some(point=>point.coverageChanged))warnings.push("Les joueurs présents ou les valeurs renseignées varient selon les exports : cela peut aussi faire varier le total.");
    if(rows.some(point=>point.count<point.players))warnings.push("Certains totaux sont partiels : les valeurs absentes sont exclues. Consulte la couverture de chaque point.");
    if(rows.some(point=>point.overflow))warnings.push("Un total dépasse la capacité de calcul et reste indisponible.");
    if(result.undated)warnings.push("Une date d’export est inconnue : l’axe suit l’ordre des relevés, sans représenter leur durée.");
    find("warning").textContent=warnings.join(" ");find("warning").hidden=!warnings.length;
    find("chart-note").textContent=(model.valid.length===1?"Un seul export renseigné : un point est affiché, sans évolution encore comparable.":`${model.valid.length} / ${rows.length} exports renseignés · ${model.dated?"Espacement selon les dates réelles":"Espacement par relevé"} · Tous les points sont conservés.`)+" Nombres arrondis pour faciliter la lecture ; valeurs exactes dans le tableau.";
    draw();
    const table=node("table","evolution-table"),head=node("thead"),header=node("tr"),body=node("tbody");
    for(const label of ["Export",`Total (${unit})`,"Joueurs renseignés","Depuis l’export précédent"]){const cell=node("th","",label);cell.scope="col";header.append(cell);}head.append(header);
    for(const [i,point] of model.points.entries()){
      const row=node("tr"),date=node("td","",point.exportedAt?s.date(point.exportedAt):`Relevé ${i+1} · date inconnue`);
      date.append(node("small","",result.points[i].archive));
      const change=node("td","",i?chart.deltaLabel(point.delta,metric.unit,metric):"Premier export");
      if(i&&point.delta!==null)change.append(node("small","",readable.percentage(model.points[i-1].value,point.value)));
      row.append(date,node("td","",chart.format(point.value,metric.unit)),node("td","",`${s.number(point.count,0)} / ${s.number(point.players,0)}`),change);body.append(row);
    }
    table.append(head,body);find("values").replaceChildren(table);
  }
  function ready(data){
    result=data;
    if(!result.points.length){state("Aucun export disponible","Importe tes ZIP pour suivre l’évolution de l’économie du serveur.",{empty:true});return;}
    find("toolbar-count").textContent=s.number(result.players,0);
    const dated=result.points.filter(point=>point.exportedAt),range=dated.length?` · Du ${s.date(dated[0].exportedAt)} au ${s.date(dated.at(-1).exportedAt)}`:"";
    find("population").textContent=`${result.points.length} exports · ${s.number(result.players,0)} joueurs dans l’historique${range}`;
    find("metrics").replaceChildren(...result.metrics.map(metric=>{
      const button=node("button","",metric.shortLabel||metric.label);button.type="button";button.dataset.metric=metric.key;
      button.addEventListener("click",()=>{selected=metric.key;render();button.focus({preventScroll:true});});return button;
    }));
    find("evolution-state").hidden=true;find("evolution-content").hidden=false;render();
  }
  async function load(){
    const run=++generation;stop();state("Chargement de l’évolution…","Lecture de tous les exports de joueurs.");find("load-progress").value=0;
    try{
      let active=await db.readActive();if(run!==generation)return;
      if(!active){loadedDataset=null;loadedOwner="";find("toolbar-count").textContent="0";state("Aucun export importé","Importe tes ZIP dans StatGM pour calculer l’évolution des totaux.",{empty:true});return;}
      loadedDataset=active.datasetId;loadedOwner=active.ownerId||"";find("toolbar-count").textContent=s.number(active.playerCount||0,0);
      if(active.recordsLocal===false){
        find("state-detail").textContent="Récupération de l’historique complet depuis ta sauvegarde cloud…";
        if(!window.StatGMCloud?.prepareHistoryForImport)throw new Error("Récupère la sauvegarde complète ou réimporte tes ZIP.");
        await window.StatGMCloud.prepareHistoryForImport();if(run!==generation)return;
        active=await db.readActive();if(run!==generation)return;
        if(active?.datasetId!==loadedDataset||(active.ownerId||"")!==loadedOwner)throw new Error("L’import actif a changé. Réessaie.");
      }
      worker=new Worker(new URL("global-evolution-worker.js?v=20261018b",document.baseURI));
      worker.onerror=event=>{event.preventDefault();if(run===generation)fail("Le calcul a été interrompu. Réessaie ou réimporte tes exports.");};
      worker.onmessage=({data})=>{
        if(run!==generation)return;
        if(data.type==="progress"){find("load-progress").value=data.total?data.done/data.total*100:0;find("state-detail").textContent=`Lecture des joueurs : ${s.number(data.done,0)} / ${s.number(data.total,0)} · ${s.number(data.records,0)} relevés analysés.`;}
        else if(data.type==="ready")ready(data.result);
        else if(data.type==="failed")fail(data.message);
      };
      worker.postMessage({type:"load",datasetId:active.datasetId,ownerId:loadedOwner});
    }catch(error){if(run===generation)fail(error.message);}
  }
  find("retry").addEventListener("click",()=>void load());
  window.addEventListener("statgm-data-updated",()=>{const run=generation;void db.readActive().then(active=>{if(run===generation&&(active?.datasetId!==loadedDataset||(active?.ownerId||"")!==loadedOwner))void load();}).catch(()=>{if(run===generation)fail("Impossible de lire l’import actif. Réessaie.");});});
  window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(draw,100);});
  window.addEventListener("pagehide",()=>{generation++;clearTimeout(resizeTimer);stop();});
  window.addEventListener("pageshow",event=>{if(event.persisted)void load();});void load();
})();

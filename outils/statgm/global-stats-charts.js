/* Native StatGM visuals: exact-value ranking bars and full-population histogram. */
(() => {
  const s=window.StatGMPlayerStats,chart=window.StatGMHistoryChart;
  const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const svg=(tag,attributes={},text)=>{const el=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));if(text!==undefined)el.textContent=text;return el;};
  const compactNumber=new Intl.NumberFormat("fr-FR",{notation:"compact",maximumFractionDigits:1});
  function compact(value,unit){
    if(unit==="duration")return Math.abs(value)>=3600?`${s.number(value/3600,1)} h`:`${s.number(value/60,1)} min`;
    return compactNumber.format(value)+(unit==="money"?" $":unit==="percent"?" %":"");
  }
  function rankingGeometry(rows){
    const low=Math.min(0,...rows.map(row=>row.value)),high=Math.max(0,...rows.map(row=>row.value)),scale=Math.max(Math.abs(low),Math.abs(high),1),span=high/scale-low/scale;
    const x=value=>span?(value/scale-low/scale)/span*100:0,zero=x(0);
    return {low,high,zero,rows:rows.map(row=>({...row,left:Math.min(zero,x(row.value)),width:Math.abs(x(row.value)-zero)}))};
  }
  function ranking(result,metric){
    const root=node("div","global-bars"),geometry=rankingGeometry(result.rows);
    const scale=node("div","global-bar-scale");scale.append(node("span","",compact(geometry.low,metric.unit)),node("span","",compact(geometry.high,metric.unit)));root.append(scale);
    const list=node("ol","global-bar-list");list.setAttribute("aria-label",`Top ${result.limit} — ${metric.label}`);
    for(const row of geometry.rows){
      const item=node("li","global-bar-row"),place=node("span","global-bar-place",String(row.rank)),copy=node("div","global-bar-copy"),heading=node("div","global-bar-label"),name=node("a","",row.name),value=node("strong","",chart.format(row.value,metric.unit));
      name.href=`fiche-joueur.html?uuid=${encodeURIComponent(row.uuid)}`;name.title=`${row.uuid}${row.exportedAt?` · Relevé du ${s.date(row.exportedAt)}`:""}`;
      heading.append(name,value);
      const track=node("span","global-bar-track"),zero=node("span","global-bar-zero"),fill=node("span",`global-bar-fill${row.value<0?" global-bar-fill--negative":""}`);
      track.setAttribute("aria-hidden","true");zero.style.left=`${geometry.zero}%`;fill.style.left=`${row.left}%`;fill.style.width=`${row.width}%`;track.append(zero,fill);
      copy.append(heading,track);item.append(place,copy);list.append(item);
    }
    root.append(list);return root;
  }
  function distribution(result,metric,containerWidth=440){
    const data=result.distribution,root=node("figure","global-histogram");
    if(!data?.bins.length){root.append(node("p","player-note","Aucune valeur renseignée pour représenter la répartition."));return root;}
    const width=Math.max(260,containerWidth||440),height=280,left=48,right=width-20,top=28,bottom=218,maxCount=Math.max(...data.bins.map(bin=>bin.count));
    const populationRule=metric.invertedAxis?"Places positives uniquement, rang 0 non classé exclu":"Zéros inclus, données absentes exclues";
    const graph=svg("svg",{viewBox:`0 0 ${width} ${height}`,role:"img","aria-label":`Répartition de ${s.number(result.count,0)} joueurs. Échelle ${data.mode==="log"?"logarithmique":"linéaire"}. ${populationRule}. Moyenne ${chart.format(result.mean,metric.unit)}, médiane ${chart.format(result.median,metric.unit)}.`});
    const magnitude=Math.max(Math.abs(data.min),Math.abs(data.max),1),low=data.mode==="log"?Math.log1p(data.min):data.min/magnitude,high=data.mode==="log"?Math.log1p(data.max):data.max/magnitude;
    const x=value=>left+(data.min===data.max ? .5 : ((data.mode==="log"?Math.log1p(value):value/magnitude)-low)/(high-low))*(right-left);
    const y=count=>bottom-count/maxCount*(bottom-top);
    for(const count of [...new Set([0,Math.ceil(maxCount/2),maxCount])])graph.append(svg("line",{x1:left,x2:right,y1:y(count),y2:y(count),class:"global-hist-guide"}),svg("text",{x:left-8,y:y(count)+4,"text-anchor":"end",class:"global-hist-label"},compactNumber.format(count)));
    const step=(right-left)/data.bins.length;
    for(const [i,bin] of data.bins.entries()){
      const rect=svg("rect",{x:left+i*step+2,y:y(bin.count),width:Math.max(1,step-4),height:bottom-y(bin.count),class:"global-hist-bin"});
      const range=bin.from===bin.to?chart.format(bin.from,metric.unit):`${chart.format(bin.from,metric.unit)} à ${chart.format(bin.to,metric.unit)}${i<data.bins.length-1?" (borne haute exclue)":""}`;
      rect.append(svg("title",{},`${range} : ${s.number(bin.count,0)} joueurs`));graph.append(rect);
    }
    for(const [value,kind] of [[result.mean,"mean"],[result.median,"median"]])graph.append(svg("line",{x1:x(value),x2:x(value),y1:top-12,y2:bottom,class:`global-hist-marker global-hist-marker--${kind}`}));
    graph.append(svg("line",{x1:left,x2:right,y1:bottom,y2:bottom,class:"global-hist-baseline"}),svg("text",{x:left,y:12,class:"global-hist-label"},"Joueurs"));
    let ticks=data.ticks;
    const labelWidth=Math.max(...ticks.map(value=>compact(value,metric.unit).length))*6+12;
    if(ticks.length>3&&(width<=380||(right-left)/(ticks.length-1)<labelWidth))ticks=ticks.filter((_,i)=>i%2===0);
    if(ticks.length>2&&(right-left)/(ticks.length-1)<labelWidth)ticks=[ticks[0],ticks[ticks.length-1]];
    for(const [i,value] of ticks.entries())graph.append(svg("text",{x:x(value),y:bottom+24,"text-anchor":ticks.length===1?"middle":i===0?"start":i===ticks.length-1?"end":"middle",class:"global-hist-label"},compact(value,metric.unit)));
    const caption=node("figcaption","player-note",data.min===data.max?`Tous les joueurs renseignés ont la même valeur : ${chart.format(data.min,metric.unit)}.`:data.mode==="log"?`Échelle logarithmique : les petites valeurs restent visibles. ${populationRule}.`:"Échelle linéaire · Tous les joueurs renseignés.");
    root.append(graph,caption);
    const details=node("details","global-bin-details"),table=node("table","global-table"),head=node("thead"),headers=node("tr"),body=node("tbody");
    details.append(node("summary","","Voir les tranches (bornes arrondies)"));
    for(const label of ["Tranche","Joueurs"]){const th=node("th","",label);th.scope="col";headers.append(th);}head.append(headers);
    for(const [i,bin] of data.bins.entries()){const row=node("tr"),label=bin.from===bin.to?chart.format(bin.from,metric.unit):`[${chart.format(bin.from,metric.unit)} ; ${chart.format(bin.to,metric.unit)}${i===data.bins.length-1?"]":"["}`;row.append(node("td","",label),node("td","",s.number(bin.count,0)));body.append(row);}
    table.append(head,body);details.append(table);root.append(details);return root;
  }
  window.StatGMGlobalCharts={rankingGeometry,ranking,distribution,compact};
})();

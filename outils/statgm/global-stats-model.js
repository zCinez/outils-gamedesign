/* One observation per player; compact numeric columns, never retained raw JSON. */
(() => {
  const scope=globalThis,chart=scope.StatGMHistoryChart,h=scope.StatGMHistory;
  const collator=new Intl.Collator("fr",{sensitivity:"base",numeric:true});
  function distribution(values,median,requested="auto"){
    if(!values.length)return {bins:[],ticks:[],mode:"linear",canLog:false,min:0,max:0,total:0};
    const min=values[0].value,max=values.at(-1).value,canLog=min>=0&&max>0;
    const mode=canLog&&(requested==="log"||requested==="auto"&&max/Math.max(1,Math.abs(median))>=100)?"log":"linear";
    if(min===max)return {bins:[{from:min,to:max,count:values.length}],ticks:[min],mode,canLog,min,max,total:values.length};
    const low=Math.min(0,min),high=Math.max(0,max),scale=Math.max(Math.abs(low),Math.abs(high),1);
    const start=mode==="log"?Math.log1p(low):low/scale,end=mode==="log"?Math.log1p(high):high/scale;
    const invert=ratio=>{if(ratio===0)return low;if(ratio===1)return high;const value=start+(end-start)*ratio;return mode==="log"?Math.min(high,Math.expm1(value)):value*scale;};
    const position=value=>((mode==="log"?Math.log1p(value):value/scale)-start)/(end-start);
    const size=Math.min(12,Math.ceil(Math.sqrt(values.length))),bins=Array.from({length:size},(_,i)=>({from:invert(i/size),to:invert((i+1)/size),count:0}));
    for(const row of values)bins[Math.min(size-1,Math.max(0,Math.floor(position(row.value)*size)))].count++;
    return {bins,ticks:Array.from({length:5},(_,i)=>invert(i/4)),mode,canLog,min:low,max:high,total:values.length};
  }
  function createIndex(players){
    const identities=players.map(player=>({uuid:player.uuid,name:player.name}));
    const columns=new Map(),seen=new Set(),dates=new Array(players.length),sources=new Set();
    let observed=0;
    function add(index,snapshot,data){
      const projected=chart.project(snapshot,data),novel=new Map();
      for(const [key,value] of projected.fields)if(Number.isFinite(value)&&!seen.has(key)){seen.add(key);novel.set(key,value);}
      const candidates=chart.catalog([{...snapshot,fields:novel}]);
      const visible=new Set(chart.categories(candidates).map(category=>category.key));
      for(const metric of candidates)if(visible.has(metric.category))columns.set(metric.key,{metric,values:new Float64Array(players.length).fill(NaN)});
      for(const [key,column] of columns){const value=projected.fields.get(key);if(Number.isFinite(value)&&(!column.metric.invertedAxis||value>0))column.values[index]=value;}
      dates[index]=snapshot.exportedAt||null;observed++;
      if(Number.isFinite(projected.fields.get("metric:playtime")))sources.add(projected.playtimeSource);
    }
    const metrics=()=>[...columns.values()].map(column=>column.metric);
    function query(key,limit=10,scale="auto"){
      const column=columns.get(key);if(!column)throw new Error("Choisis une statistique disponible.");
      const values=[];let mean=0;
      for(let index=0;index<column.values.length;index++)if(Number.isFinite(column.values[index])){
        const value=column.values[index];values.push({index,value});
        // Weighted form avoids overflow from summing very large counters.
        mean=mean*((values.length-1)/values.length)+value/values.length;
      }
      values.sort((a,b)=>a.value-b.value||collator.compare(identities[a.index].name,identities[b.index].name)||identities[a.index].uuid.localeCompare(identities[b.index].uuid));
      const count=values.length,middle=Math.floor(count/2);
      const median=count?count%2?values[middle].value:values[middle-1].value/2+values[middle].value/2:null;
      const ranked=column.metric.invertedAxis?values:[...values].sort((a,b)=>b.value-a.value||collator.compare(identities[a.index].name,identities[b.index].name)||identities[a.index].uuid.localeCompare(identities[b.index].uuid));
      const size=[10,20,50,100].includes(limit)?limit:10;
      return {key,mean:count?mean:null,median,count,missing:players.length-count,total:players.length,limit:size,
        distribution:distribution(values,median,scale),
        rows:ranked.slice(0,size).map((row,index)=>({...identities[row.index],rank:index+1,value:row.value,exportedAt:dates[row.index]})),
        warning:key==="metric:playtime"&&sources.size>1?"Les exports utilisent plusieurs sources de temps de jeu. Ces compteurs peuvent couvrir des périodes différentes.":""};
    }
    function context(){
      const dated=dates.filter(date=>h.stamp(date)!==null).sort((a,b)=>h.stamp(a)-h.stamp(b));
      return {players:players.length,observed,firstDate:dated[0]||null,lastDate:dated.at(-1)||null,undated:players.length-dated.length};
    }
    return {add,metrics,query,context};
  }
  async function build(db,active,onProgress=()=>{},current=()=>true){
    const players=await db.readPlayers(active.datasetId),index=createIndex(players);
    for(let start=0;start<players.length;start+=4){
      if(!current())throw new Error("Calcul interrompu.");
      const latestActive=await db.readActive();
      if(latestActive?.datasetId!==active.datasetId||(latestActive.ownerId||"")!==(active.ownerId||""))throw new Error("L’import actif a changé. Recharge les statistiques.");
      await Promise.all(players.slice(start,start+4).map(async(player,offset)=>{
        const observations=h.observations(await h.catalog(db,active,player.uuid)),latest=observations.at(-1);
        if(!latest)throw new Error("Les relevés de certains joueurs ne sont pas disponibles. Récupère la sauvegarde complète ou réimporte tes ZIP.");
        const record=await db.readPlayerRecord(active.datasetId,player.uuid,latest.sequence);
        if(!record?.data)throw new Error("Un relevé joueur est indisponible. Réessaie après la synchronisation.");
        index.add(start+offset,latest,record.data);
      }));
      onProgress(Math.min(start+4,players.length),players.length);
    }
    return index;
  }
  scope.StatGMGlobalStats={createIndex,build,distribution};
})();

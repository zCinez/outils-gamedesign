/* One total per export; successive snapshots are never added together. */
(() => {
  const h=globalThis.StatGMHistory;
  const metrics=[
    {key:"metric:earned",label:"Argent gagné total",path:"economy.vault_gained_total_plugin",unit:"money"},
    {key:"metric:spent",label:"Argent dépensé total",path:"economy.vault_spent_total_plugin",unit:"money"},
    {key:"metric:balance",label:"Argent détenu par les joueurs",shortLabel:"Argent actuel (Baltop)",path:"profile.vault_balance",unit:"money",description:"Somme des soldes des joueurs au moment de chaque export"},
    {key:"metric:coins",label:"Total des Coins",path:"profile.coins_skript",unit:"number"}
  ];
  const get=(data,path)=>path.split(".").reduce((value,key)=>value?.[key],data);
  // Scaled compensated summation avoids intermediate overflow and absorbs cents.
  function accumulator(){
    let scale=0,sum=0,correction=0,count=0;
    return {add(value){
      if(typeof value!=="number"||!Number.isFinite(value))return false;
      const magnitude=Math.abs(value);
      if(magnitude>scale){const ratio=scale/magnitude;sum*=ratio;correction*=ratio;scale=magnitude;}
      const term=scale?value/scale:0,next=sum+term;
      correction+=Math.abs(sum)>=Math.abs(term)?(sum-next)+term:(term-next)+sum;sum=next;count++;return true;
    },result(){const value=(sum+correction)*scale;return {value:count&&Number.isFinite(value)?value:null,count,overflow:count>0&&!Number.isFinite(value)};}};
  }
  const same=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);
  async function build(db,active,onProgress=()=>{},current=()=>true){
    const players=await db.readPlayers(active.datasetId),groups=new Map(),declared=new Map((active.exports||[]).map(item=>[item.exportId,item]));
    let recordsRead=0,catalogCount=0,duplicates=0;
    async function guard(){
      if(!current())throw new Error("Calcul interrompu.");
      const latest=await db.readActive();
      if(latest?.datasetId!==active.datasetId||(latest.ownerId||"")!==(active.ownerId||""))throw new Error("L’import actif a changé. Recharge l’évolution.");
    }
    for(let start=0;start<players.length;start+=4){
      await guard();
      await Promise.all(players.slice(start,start+4).map(async(player,offset)=>{
        const rows=await h.catalog(db,active,player.uuid),chosen=new Map();catalogCount+=rows.length;
        if(!rows.length)throw new Error("Les relevés de certains joueurs ne sont pas disponibles. Récupère la sauvegarde complète ou réimporte tes ZIP.");
        for(const row of rows){const key=row.exportId||active.datasetId,previous=chosen.get(key);if(!previous||h.compareSnapshots(row,previous)>0)chosen.set(key,row);}
        duplicates+=rows.length-chosen.size;
        for(const [exportId,snapshot] of chosen){
          const record=await db.readPlayerRecord(active.datasetId,player.uuid,snapshot.sequence);
          if(!record?.data)throw new Error("Un relevé de l’historique est indisponible. Récupère la sauvegarde complète ou réimporte tes ZIP.");
          recordsRead++;
          if(!groups.has(exportId))groups.set(exportId,{exportId,archive:declared.get(exportId)?.filename||snapshot.archive||"Export",firstDate:null,exportedAt:null,sortTime:null,sequence:snapshot.sequence,players:[],undated:0,values:metrics.map(()=>({sum:accumulator(),members:[]}))});
          const group=groups.get(exportId),time=h.stamp(snapshot.exportedAt),index=start+offset;
          group.sequence=Math.max(group.sequence,snapshot.sequence);group.players.push(index);
          if(time===null)group.undated++;
          else{
            if(group.sortTime===null||time>group.sortTime){group.sortTime=time;group.exportedAt=snapshot.exportedAt;}
            if(!group.firstDate||time<h.stamp(group.firstDate))group.firstDate=snapshot.exportedAt;
          }
          metrics.forEach((metric,i)=>{if(group.values[i].sum.add(get(record.data,metric.path)))group.values[i].members.push(index);});
        }
      }));
      onProgress(Math.min(start+4,players.length),players.length,recordsRead);
    }
    await guard();
    if(Number.isFinite(active.fileCount)&&catalogCount!==active.fileCount)throw new Error("L’historique disponible est incomplet. Récupère la sauvegarde complète ou réimporte tes ZIP.");
    for(const item of declared.values())if(item.fileCount>0&&!groups.has(item.exportId))throw new Error("Un export de l’historique est indisponible. Récupère la sauvegarde complète ou réimporte tes ZIP.");
    for(const group of groups.values()){
      if(group.sortTime===null){const date=declared.get(group.exportId)?.exportedAt;if(h.stamp(date)!==null){group.sortTime=h.stamp(date);group.exportedAt=date;}}
      group.players.sort((a,b)=>a-b);for(const value of group.values)value.members.sort((a,b)=>a-b);
    }
    const ordered=[...groups.values()].sort(h.compareSnapshots);
    const points=ordered.map((group,i)=>({exportId:group.exportId,archive:group.archive,firstDate:group.firstDate,exportedAt:group.exportedAt,sortTime:group.sortTime,sequence:group.sequence,players:group.players.length,undated:group.undated,
      values:metrics.map((metric,j)=>({...group.values[j].sum.result(),key:metric.key,coverageChanged:i>0&&(!same(group.players,ordered[i-1].players)||!same(group.values[j].members,ordered[i-1].values[j].members))}))}));
    return {metrics,points,players:players.length,recordsRead,duplicates,undated:points.filter(point=>point.sortTime===null).length};
  }
  globalThis.StatGMGlobalEvolution={metrics,accumulator,build};
})();

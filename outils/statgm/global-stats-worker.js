/* Calculations stay off the UI thread. Every metric change reuses this index. */
self.window=self;
importScripts("player-history.js?v=20261007c","player-stats.js?v=20261009c","player-history-chart.js?v=20261017i","archive-db.js?v=20261006c","global-stats-model.js?v=20261018c");
let index,active;
self.onmessage=async({data})=>{
  try{
    if(data.type==="load"){
      active=await StatGMArchiveDB.readActive();
      if(!active||active.datasetId!==data.datasetId||active.recordsLocal===false)throw new Error("L’historique complet doit être disponible avant le calcul.");
      index=await StatGMGlobalStats.build(StatGMArchiveDB,active,(done,total)=>postMessage({type:"progress",done,total}));
      const latest=await StatGMArchiveDB.readActive();
      if(latest?.datasetId!==active.datasetId||(latest.ownerId||"")!==(active.ownerId||""))throw new Error("L’import actif a changé.");
      postMessage({type:"ready",metrics:index.metrics(),context:index.context()});
    }else if(data.type==="query"){
      const latest=await StatGMArchiveDB.readActive();
      if(!index||latest?.datasetId!==active?.datasetId||(latest.ownerId||"")!==(active?.ownerId||""))throw new Error("L’import actif a changé. Recharge les statistiques.");
      postMessage({type:"result",request:data.request,result:index.query(data.key,data.limit,data.scale)});
    }
  }catch(error){postMessage({type:"failed",message:error.message});}
};

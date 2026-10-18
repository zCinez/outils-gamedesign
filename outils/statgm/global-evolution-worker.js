/* Full-history totals stay off the UI thread. */
importScripts("player-history.js?v=20261007c","archive-db.js?v=20261006c","global-evolution-model.js?v=20261018b");
self.onmessage=async({data})=>{
  if(data.type!=="load")return;
  try{
    const active=await StatGMArchiveDB.readActive();
    if(!active||active.datasetId!==data.datasetId||(active.ownerId||"")!==(data.ownerId||"")||active.recordsLocal===false)throw new Error("L’historique complet doit être disponible avant le calcul.");
    const result=await StatGMGlobalEvolution.build(StatGMArchiveDB,active,(done,total,records)=>postMessage({type:"progress",done,total,records}));
    postMessage({type:"ready",result});
  }catch(error){postMessage({type:"failed",message:error.message});}
};

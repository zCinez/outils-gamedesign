(() => {
  const find = selector => document.querySelector(selector);
  const ui = Object.fromEntries([
    "import", "toolbar-count", "zip-input", "dropzone", "progress-panel", "progress-label", "progress-detail", "progress", "cancel", "feedback", "last-import"
  ].map(key => [key, find(`[data-${key}]`)]));
  const db = window.StatGMArchiveDB;
  const number = value => value.toLocaleString("fr-FR");
  let active = null, job = null, ready = false;

  function feedback(message, tone = "info") {
    ui.feedback.textContent = message;
    ui.feedback.dataset.tone = tone;
    ui.feedback.hidden = !message;
  }
  function syncButtons() {
    const disabled = !ready || Boolean(job);
    ui.import.disabled = disabled;
    ui["zip-input"].disabled = disabled;
  }
  function showSummary() {
    ui["last-import"].hidden = !active;
    if (!active) return;
    const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(active.exportedAt || active.importedAt));
    ui["last-import"].textContent = `${active.filename} · ${active.exportedAt ? "Export du" : "Importé le"} ${date} · ${number(active.playerCount)} joueurs · ${number(active.exports?.length || 1)} export(s) conservé(s) · ${number(active.fileCount)} relevés`;
  }
  async function load() {
    active = await db.readActive();
    showSummary();
    ui["toolbar-count"].textContent = number(active?.playerCount || 0);
  }
  async function discard(datasetId) {
    try { await db.discard(datasetId); }
    catch (error) { console.warn("Nettoyage de l’import incomplet reporté.", error); }
  }
  function stopJob(current) {
    current.worker.terminate();
    if (job === current) job = null;
    ui["progress-panel"].hidden = true;
    ui.cancel.disabled = false;
    syncButtons();
    window.StatGMCloud?.setImportBusy(false);
  }
  async function failed(current, message) {
    if (job !== current) return;
    current.worker.terminate();
    ui["progress-label"].textContent = "Nettoyage de l’import…";
    ui.cancel.disabled = true;
    await discard(current.datasetId);
    stopJob(current);
    feedback(`${message} La liste précédente est conservée.`, "error");
  }
  async function importFile(file) {
    if (!ready || job || !file) return;
    if (!/\.zip$/i.test(file.name)) { feedback("Sélectionne une archive au format .zip.", "error"); return; }
    if (file.size > 512 * 1024 * 1024) { feedback("Ce ZIP dépasse la limite de 512 Mo.", "error"); return; }
    let worker;
    try { worker = new Worker(new URL("import-worker.js?v=20261006c", document.baseURI)); }
    catch { feedback("L’import nécessite l’ouverture du site via HTTP. Utilise l’aperçu local ou le site hébergé.", "error"); return; }
    const current = { worker, datasetId: crypto.randomUUID(), committing: false };
    job = current;
    window.StatGMCloud?.setImportBusy(true);
    syncButtons();
    feedback("");
    ui["progress-panel"].hidden = false;
    ui.progress.value = 0;
    ui["progress-label"].textContent = "Préparation de l’import…";
    ui["progress-detail"].textContent = file.name;
    worker.onerror = event => {
      event.preventDefault();
      void failed(current, "Le traitement de l’archive a été interrompu. Réessaie depuis l’aperçu local ou le site hébergé.");
    };
    worker.onmessage = async ({ data }) => {
      if (job !== current) return;
      if (data.type === "progress") {
        ui.progress.value = data.percent;
        ui["progress-label"].textContent = data.label;
        ui["progress-detail"].textContent = data.detail;
      } else if (data.type === "error") {
        await failed(current, data.message);
      } else if(data.type==="unchanged") {
        await discard(current.datasetId); stopJob(current); feedback(data.message,"info");
      } else if (data.type === "ready") {
        current.committing = true;
        ui.cancel.disabled = true;
        ui["progress-label"].textContent = "Finalisation de l’import…";
        const previousId = active?.datasetId;
        try {
          if((await db.readActive())?.datasetId!==current.previousDatasetId)throw new Error("L’import actif a changé.");
          // Only a fully checked and persisted archive becomes the current dataset.
          if(window.StatGMCloud && !await window.StatGMCloud.validateImportAccount(current.ownerId))throw new Error("Le compte a changé pendant l’import.");
          const ownerId = current.ownerId;
          const cloud = ownerId ? await db.readMeta(`cloud:${ownerId}`) : null;
          await db.activate({ ...data.summary, ownerId, pending: true, recordsLocal: true, baseRevision: cloud?.revision || "" },current.previousDatasetId || null);
        } catch (error) {
          await failed(current, error.name === "QuotaExceededError" ? "Espace de stockage insuffisant." : "Impossible de finaliser l’enregistrement.");
          return;
        }
        try {
          await load();
          const summary = data.summary;
          const notes = [];
          if (summary.duplicates) notes.push(`${number(summary.duplicates)} fichier(s) supplémentaire(s) regroupé(s) par UUID`);
          if (summary.ignored) notes.push(`${number(summary.ignored)} fichier(s) hors gdstats ignoré(s)`);
          if (summary.nameless) notes.push(`${number(summary.nameless)} pseudo(s) absent(s), identifié(s) par UUID`);
          feedback(`${number(summary.newFileCount || summary.fileCount)} nouveaux relevés ajoutés. ${number(summary.playerCount)} joueurs et ${number(summary.exports?.length || 1)} exports conservés.${notes.length ? ` ${notes.join(" · ")}.` : ""}`, "success");
          if (previousId) void discard(previousId);
        } catch {
          feedback("Import enregistré. Recharge la page pour afficher la nouvelle liste.", "info");
        } finally { stopJob(current); }
      }
    };
    try {
      current.ownerId=await window.StatGMCloud?.prepareHistoryForImport() || "";
      if(job!==current)return;
      const previous=await db.readActive();current.previousDatasetId=previous?.datasetId;
      worker.postMessage({file,datasetId:current.datasetId,previousDatasetId:previous?.datasetId || null});
    } catch(error) { if(job===current)await failed(current,error.message); }
  }

  ui.import.addEventListener("click", () => ui["zip-input"].click());
  ui["zip-input"].addEventListener("change", () => {
    const file = ui["zip-input"].files[0];
    ui["zip-input"].value = "";
    void importFile(file);
  });
  ui.cancel.addEventListener("click", async () => {
    if (!job || job.committing) return;
    const current = job;
    current.committing = true;
    current.worker.terminate();
    ui.cancel.disabled = true;
    ui["progress-label"].textContent = "Annulation de l’import…";
    await discard(current.datasetId);
    stopJob(current);
    feedback("Import annulé. La liste précédente est conservée.");
  });
  let dragDepth = 0;
  for (const type of ["dragenter", "dragover", "dragleave", "drop"]) ui.dropzone.addEventListener(type, event => {
    event.preventDefault();
    if (type === "dragenter") dragDepth++;
    if (type === "dragleave") dragDepth = Math.max(0, dragDepth - 1);
    if (type === "drop") {
      dragDepth = 0;
      const files = [...event.dataTransfer.files];
      if (files.length !== 1) feedback("Dépose une seule archive ZIP à la fois.", "error");
      else void importFile(files[0]);
    }
    ui.dropzone.classList.toggle("is-dragover", dragDepth > 0 && !job && ready);
  });
  window.addEventListener("beforeunload", event => {
    if (!job) return;
    event.preventDefault(); event.returnValue = "";
  });
  syncButtons();
  window.addEventListener("statgm-data-updated", () => { if (!job) void load(); });
  load().then(() => { ready = true; syncButtons(); }).catch(() => {
    feedback("L’enregistrement local des joueurs est indisponible. L’import est désactivé pour éviter de perdre les données.", "error");
  });
})();

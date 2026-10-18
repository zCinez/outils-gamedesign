(() => {
  const db = window.StatGMArchiveDB;
  const config = window.NEODIUM_SUPABASE_CONFIG || {};
  let ownerId = "", knownEmail = "", job, importBusy = false, lastAttempt = 0, sequence = 0;
  let state = { status: "local", message: "Copie locale disponible", detail: "Connecte-toi au compte Neodium pour sauvegarder dans le cloud." };
  const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("statgm-cloud") : null;
  function render() {
    for (const panel of document.querySelectorAll("[data-cloud-panel]")) {
      panel.dataset.state = state.status;
      panel.querySelector("[data-cloud-message]").textContent = state.message;
      panel.querySelector("[data-cloud-detail]").textContent = state.detail || "";
      const retry = panel.querySelector("[data-cloud-retry]");
      retry.hidden = !ownerId || state.status === "conflict";
      retry.disabled = Boolean(job || importBusy);
      retry.textContent = state.status === "error" ? "Réessayer" : "Synchroniser";
      panel.querySelector("[data-cloud-conflict]").hidden = state.status !== "conflict";
    }
  }
  function setState(next) { state = next; render(); }
  function updated() { window.dispatchEvent(new CustomEvent("statgm-data-updated")); }
  // Local previews can import immediately, even if cloud authentication is unavailable.
  // The local API fixture explicitly opts in to its own fictitious cloud for integration tests.
  if (db.isLocalPreview && config.statgmCloudFixture !== true) {
    const localState = () => setState({ status: "local", message: "Mode de test local", detail: "Importe tes ZIP pour tester les joueurs et leur progression. Les données sont conservées dans ce navigateur." });
    window.StatGMCloud = {
      sync: async () => {}, ensurePlayerRecords: async () => {}, ensureCompletions: async () => {}, ensureCardDetails: async () => {},
      prepareHistoryForImport: async () => "", validateImportAccount: async expectedOwner => expectedOwner === "", getOwnerId: () => "", getState: () => ({ ...state }),
      setImportBusy: value => {
        if (value) setState({ status: "local", message: "Import en local…", detail: "Enregistrement des relevés dans ce navigateur." });
        else { localState(); updated(); channel?.postMessage({ localPreview: true }); }
      }
    };
    channel?.addEventListener("message", ({ data }) => { if (data.localPreview) updated(); });
    window.addEventListener("pagehide", () => channel?.close());
    localState(); return;
  }
  async function getCredentials() {
    const cloud = window.NeodiumCloudSync;
    if (!cloud || !config.url || !config.anonKey) return null;
    await cloud.whenReady();
    const session = await cloud.getSession();
    if (!session?.access_token || !session.user?.id) return null;
    return { url: config.url, apikey: config.anonKey, token: session.access_token, userId: session.user.id, email: session.user.email || cloud.getState()?.email || "" };
  }
  function stop() {
    sequence++;
    if (job) { job.worker.terminate(); job.resolve(); job = null; }
  }
  function runWorker(credentials, options = {}) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL("cloud-worker.js?v=20261006c", document.baseURI));
      const current = { worker, resolve, reject, type:options.type };
      job = current; render();
      function finish(error) {
        worker.terminate(); if (job === current) job = null;
        render(); error ? reject(error) : resolve();
      }
      worker.onerror = event => { event.preventDefault(); finish(new Error("Le traitement de la sauvegarde a été interrompu.")); };
      worker.onmessage = async ({ data }) => {
        if (job !== current) return;
        if (data.type === "state") setState({ status: data.status, message: data.message, detail: data.detail });
        else if (data.type === "refresh") {
          const fresh = await getCredentials().catch(() => null);
          worker.postMessage({ type: "credentials", credentials: fresh?.userId === credentials.userId ? fresh : null });
        } else if (data.type === "updated") {
          updated();
          if (data.committed) channel?.postMessage({ ownerId: credentials.userId });
        } else if (data.type === "conflict") {
          setState({ status: "conflict", message: "Une autre sauvegarde existe dans le cloud", detail: "Choisis l’import à conserver. Les données locales restent disponibles." });
        } else if (data.type === "failed") finish(new Error(data.message));
        else if (data.type === "done") finish();
      };
      worker.postMessage({ type: "sync", ...options, credentials });
    });
  }
  async function sync(options = {}) {
    if (job || importBusy || (!options.check && Date.now() - lastAttempt < 1000)) return;
    lastAttempt = Date.now(); const generation = sequence;
    try {
      const credentials = await getCredentials();
      if (generation !== sequence || importBusy || job) return;
      const nextOwner = credentials?.userId || "";
      knownEmail = credentials?.email || "";
      if (ownerId !== nextOwner) { stop(); ownerId = nextOwner; await db.useAccount(ownerId); updated(); }
      if (!credentials) {
        setState({ status: "local", message: "Sauvegarde locale", detail: "Connecte-toi au compte Neodium pour activer la sauvegarde cloud." }); return;
      }
      if (!navigator.onLine) {
        setState({ status: "error", message: "Sauvegarde cloud en attente", detail: "La copie locale reste disponible. Le transfert reprendra au retour de la connexion." }); return;
      }
      const work = async () => {
        if (importBusy || job || ownerId !== credentials.userId) return;
        await runWorker(credentials, options);
      };
      if (navigator.locks) await navigator.locks.request(`statgm-cloud:${ownerId}`, { ifAvailable: true }, async lock => { if (lock) await work(); });
      else await work();
    } catch (error) {
      setState({ status: "error", message: "Sauvegarde cloud en attente", detail: `${error.message} La copie locale est conservée.` });
    }
  }
  async function ensurePlayerRecords(uuid) {
    const active = await db.readActive();
    if (!active || active.recordsLocal !== false) return;
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(uuid)) throw new Error("UUID du joueur incorrect.");
    const bucket = (parseInt(uuid.slice(0, 2), 16) & 252).toString(16).padStart(2, "0");
    if (await db.readMeta(`bucket:${active.datasetId}:${bucket}`)) return;
    if (job || importBusy) throw new Error("Une synchronisation est en cours. Réessaie dans un instant.");
    const credentials = await getCredentials();
    if (!credentials || credentials.userId !== active.ownerId) throw new Error("Connecte-toi au compte de cette sauvegarde.");
    await runWorker(credentials, { type: "hydrate", uuid });
  }
  async function ensureCompletions() {
    const active = await db.readActive();
    if (!active) return;
    const credentials = await getCredentials();
    if (!credentials || credentials.userId !== active.ownerId) throw new Error("Connecte-toi au compte de cette sauvegarde.");
    const work = async () => {
      if (job || importBusy) throw new Error("Une synchronisation est en cours.");
      if ((await db.readActive())?.datasetId !== active.datasetId) throw new Error("L’import actif a changé.");
      await runWorker(credentials, { type: "completions" });
    };
    if (navigator.locks) await navigator.locks.request(`statgm-cloud:${credentials.userId}`, work);
    else await work();
  }
  async function prepareHistoryForImport() {
    const credentials=await getCredentials();
    const nextOwner=credentials?.userId || "";
    if(ownerId!==nextOwner){ownerId=nextOwner;knownEmail=credentials?.email || "";await db.useAccount(ownerId);updated();}
    const active=await db.readActive();
    if(!active || active.recordsLocal!==false)return nextOwner;
    if(!credentials || credentials.userId!==active.ownerId)throw new Error("Connecte-toi au compte de cet historique avant d’ajouter un export.");
    const work=async()=>{if(job)throw new Error("Une synchronisation est en cours.");await runWorker(credentials,{type:"hydrate-all"});};
    if(navigator.locks)await navigator.locks.request(`statgm-cloud:${credentials.userId}`,work);else await work();
    return nextOwner;
  }
  async function validateImportAccount(expectedOwner) { return ((await getCredentials())?.userId || "") === expectedOwner; }
  function setImportBusy(value) {
    importBusy = value;
    if (value) {
      stop();
      setState({ status: "local", message: "Import en cours", detail: "La sauvegarde cloud démarrera après validation de l’archive." });
    } else { if(job?.type==="hydrate-all")stop(); void sync({ check: true }); }
    render();
  }
  document.querySelectorAll("[data-cloud-retry]").forEach(button => button.addEventListener("click", () => void sync({ check: true })));
  document.querySelectorAll("[data-cloud-keep-local]").forEach(button => button.addEventListener("click", () => void sync({ force: true, check: true })));
  document.querySelectorAll("[data-cloud-use-remote]").forEach(button => button.addEventListener("click", () => void sync({ chooseRemote: true, check: true })));
  window.addEventListener("neodium-cloud-state", () => {
    // Generic localStorage updates must not trigger another StatGM transfer.
    const email = window.NeodiumCloudSync?.getState()?.email || "";
    if (email !== knownEmail) {
      stop(); knownEmail = email; ownerId = "";
      if (!email) void db.useAccount("").then(updated);
      void sync({ check: true });
    } else if (!job) void sync();
  });
  window.addEventListener("online", () => void sync({ check: true }));
  window.addEventListener("offline", () => {
    stop(); setState({ status: "error", message: "Sauvegarde cloud en attente", detail: "Hors connexion · la copie locale reste disponible." });
  });
  function checkOnReturn() { if (document.visibilityState === "visible" && Date.now() - lastAttempt > 60000) void sync({ check: true }); }
  window.addEventListener("focus", checkOnReturn);
  document.addEventListener("visibilitychange", checkOnReturn);
  channel?.addEventListener("message", ({ data }) => { if (data.ownerId === ownerId) { updated(); void sync(); } });
  window.addEventListener("pagehide", () => { stop(); channel?.close(); });
  window.StatGMCloud = { sync, ensurePlayerRecords, ensureCompletions, ensureCardDetails: ensureCompletions, prepareHistoryForImport, validateImportAccount, setImportBusy, getOwnerId: () => ownerId, getState: () => ({ ...state }) };
  render(); void sync();
})();

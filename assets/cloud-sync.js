(function () {
  const config = window.NEODIUM_SUPABASE_CONFIG || {};
  const mode = config.mode || "shared_team_auth";
  const syncKeyPrefixes = Array.isArray(config.syncKeyPrefixes) ? config.syncKeyPrefixes : [];
  const syncKeys = new Set(Array.isArray(config.syncKeys) ? config.syncKeys : []);
  const hasConfig = Boolean(config.url && config.anonKey);
  const storageTable = config.storageTable || "neodium_shared_storage";
  const workspaceId = config.workspaceId || "global";
  const syncStateEventName = "neodium-cloud-state";
  const panelStorageKey = "neodium-cloud-panel-open";
  const reloadStorageKey = "neodium-cloud-last-reload-user";
  const emailStorageKey = "neodium-cloud-last-email";
  const styleElementId = "neodium-cloud-sync-style";
  const localHostname = String(window.location.hostname || "").toLowerCase();

  function isPrivateIpv4Host(hostname) {
    const parts = hostname.split(".");
    if (parts.length !== 4) return false;

    const values = parts.map((part) => Number.parseInt(part, 10));
    if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
      return false;
    }

    return values[0] === 10
      || values[0] === 127
      || values[0] === 0
      || (values[0] === 192 && values[1] === 168)
      || (values[0] === 169 && values[1] === 254)
      || (values[0] === 172 && values[1] >= 16 && values[1] <= 31);
  }

  function isPrivateIpv6Host(hostname) {
    return hostname === "::1"
      || hostname === "[::1]"
      || hostname.startsWith("fe80:")
      || hostname.startsWith("[fe80:")
      || hostname.startsWith("fc")
      || hostname.startsWith("fd")
      || hostname.startsWith("[fc")
      || hostname.startsWith("[fd");
  }

  function isLikelyLocalHostname(hostname) {
    if (!hostname) return false;
    if (hostname === "localhost") return true;
    if (hostname.endsWith(".local") || hostname.endsWith(".lan") || hostname.endsWith(".home")) {
      return true;
    }

    return isPrivateIpv4Host(hostname) || isPrivateIpv6Host(hostname);
  }

  const isLocalRuntime = window.location.protocol === "file:" || isLikelyLocalHostname(localHostname);

  const storageProto = Object.getPrototypeOf(window.localStorage);
  const nativeSetItem = storageProto.setItem;
  const nativeGetItem = storageProto.getItem;
  const nativeRemoveItem = storageProto.removeItem;
  const nativeClear = storageProto.clear;
  const nativeSessionSetItem = window.sessionStorage.setItem.bind(window.sessionStorage);
  const nativeSessionGetItem = window.sessionStorage.getItem.bind(window.sessionStorage);
  const nativeSessionRemoveItem = window.sessionStorage.removeItem.bind(window.sessionStorage);

  const pendingMutations = new Map();
  let suppressTrackedWrites = false;
  let initialSyncComplete = false;
  let supabaseClient = null;
  let authSubscription = null;
  let syncLock = Promise.resolve();
  let currentUserId = "";
  let currentEmail = "";
  let widget = null;

  const state = {
    configured: hasConfig,
    ready: false,
    status: hasConfig ? "booting" : "disabled",
    message: hasConfig ? "Initialisation du cloud equipe..." : "Ajoute Supabase dans assets/supabase-config.js",
    label: "Local",
    email: "",
    localAccessBypass: isLocalRuntime,
    syncing: false,
    pending: 0
  };

  function rawGetLocal(key) {
    return nativeGetItem.call(window.localStorage, key);
  }

  function rawSetLocal(key, value) {
    nativeSetItem.call(window.localStorage, key, value);
  }

  function rawRemoveLocal(key) {
    nativeRemoveItem.call(window.localStorage, key);
  }

  function isTrackedKey(key) {
    if (typeof key !== "string" || !key) return false;
    if (key.startsWith("sb-") || key.startsWith("supabase.") || key.startsWith("neodium-cloud-")) {
      return false;
    }

    if (syncKeys.has(key)) return true;
    return syncKeyPrefixes.some((prefix) => key.startsWith(prefix));
  }

  function getPublicState() {
    return {
      configured: state.configured,
      ready: state.ready,
      status: state.status,
      message: state.message,
      label: state.label,
      email: state.email,
      localAccessBypass: state.localAccessBypass,
      syncing: state.syncing,
      pending: state.pending
    };
  }

  function updateState(patch) {
    Object.assign(state, patch, { pending: pendingMutations.size });
    window.dispatchEvent(new CustomEvent(syncStateEventName, { detail: getPublicState() }));
    renderWidget();
  }

  function queueMutation(type, key, value) {
    if (!isTrackedKey(key) || suppressTrackedWrites) return;
    pendingMutations.set(key, { type, value: value ?? "" });
    updateState({});

    if (initialSyncComplete && currentUserId) {
      void flushPendingMutations();
    }
  }

  if (!window.__NEODIUM_CLOUD_STORAGE_PATCHED__) {
    window.__NEODIUM_CLOUD_STORAGE_PATCHED__ = true;

    storageProto.setItem = function patchedSetItem(key, value) {
      nativeSetItem.call(this, key, value);
      if (this === window.localStorage) {
        queueMutation("set", String(key), String(value));
      }
    };

    storageProto.removeItem = function patchedRemoveItem(key) {
      nativeRemoveItem.call(this, key);
      if (this === window.localStorage) {
        queueMutation("remove", String(key), "");
      }
    };

    storageProto.clear = function patchedClear() {
      const trackedKeys = [];
      if (this === window.localStorage) {
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key && isTrackedKey(key)) trackedKeys.push(key);
        }
      }

      nativeClear.call(this);

      if (this === window.localStorage) {
        trackedKeys.forEach((key) => queueMutation("remove", key, ""));
      }
    };
  }

  function getTrackedSnapshot() {
    const entries = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !isTrackedKey(key)) continue;
      const value = rawGetLocal(key);
      if (value == null) continue;
      entries.push({ key, value });
    }
    return entries;
  }

  function rememberEmail(value) {
    if (!value) return;
    rawSetLocal(emailStorageKey, value);
  }

  function getRememberedEmail() {
    return rawGetLocal(emailStorageKey) || "";
  }

  function setPanelOpen(open) {
    if (open) {
      rawSetLocal(panelStorageKey, "1");
    } else {
      rawRemoveLocal(panelStorageKey);
    }
  }

  function isPanelOpen() {
    return rawGetLocal(panelStorageKey) === "1";
  }

  function getReloadMarker() {
    return nativeSessionGetItem(reloadStorageKey) || "";
  }

  function setReloadMarker(value) {
    if (!value) {
      nativeSessionRemoveItem(reloadStorageKey);
      return;
    }
    nativeSessionSetItem(reloadStorageKey, value);
  }

  function injectStyles() {
    if (document.getElementById(styleElementId)) return;

    const style = document.createElement("style");
    style.id = styleElementId;
    style.textContent = `
      .neodium-cloud {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 1200;
        width: min(340px, calc(100vw - 24px));
        color: #f4f7fb;
        font: 14px/1.45 Arial, Helvetica, sans-serif;
      }

      .neodium-cloud__toggle,
      .neodium-cloud__panel {
        border: 1px solid rgba(233, 239, 246, 0.14);
        border-radius: 8px;
        background: rgba(8, 11, 15, 0.94);
        box-shadow: 0 18px 54px rgba(0, 0, 0, 0.32);
        backdrop-filter: blur(18px);
      }

      .neodium-cloud__toggle {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 48px;
        padding: 0 14px;
        margin-left: auto;
        width: 100%;
        color: #f4f7fb;
        cursor: pointer;
      }

      .neodium-cloud__toggle strong,
      .neodium-cloud__panel strong {
        font-size: 14px;
      }

      .neodium-cloud__toggle span,
      .neodium-cloud__meta,
      .neodium-cloud__hint {
        color: #aab6c4;
        font-size: 12px;
      }

      .neodium-cloud__dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #788697;
        flex: 0 0 auto;
      }

      .neodium-cloud__dot[data-status="ready"] {
        background: #55e0ca;
      }

      .neodium-cloud__dot[data-status="syncing"],
      .neodium-cloud__dot[data-status="booting"] {
        background: #f1bc52;
      }

      .neodium-cloud__dot[data-status="error"] {
        background: #fb7185;
      }

      .neodium-cloud__panel {
        display: none;
        margin-top: 10px;
        padding: 14px;
      }

      .neodium-cloud.is-open .neodium-cloud__panel {
        display: block;
      }

      .neodium-cloud__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .neodium-cloud__header p {
        margin: 4px 0 0;
        color: #aab6c4;
        font-size: 12px;
      }

      .neodium-cloud__close {
        min-width: 34px;
        min-height: 34px;
        border: 1px solid rgba(233, 239, 246, 0.14);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.055);
        color: #f4f7fb;
      }

      .neodium-cloud__status {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }

      .neodium-cloud__field {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }

      .neodium-cloud__field label {
        color: #aab6c4;
        font-size: 12px;
        font-weight: 700;
      }

      .neodium-cloud__field input {
        min-height: 44px;
        width: 100%;
        padding: 0 12px;
        border: 1px solid rgba(233, 239, 246, 0.14);
        border-radius: 8px;
        color: #f4f7fb;
        background: rgba(255, 255, 255, 0.065);
      }

      .neodium-cloud__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .neodium-cloud__button {
        min-height: 40px;
        padding: 0 14px;
        border-radius: 8px;
        border: 1px solid rgba(233, 239, 246, 0.14);
        background: rgba(255, 255, 255, 0.055);
        color: #f4f7fb;
        font-weight: 700;
        cursor: pointer;
      }

      .neodium-cloud__button--primary {
        border-color: transparent;
        background: linear-gradient(135deg, #55e0ca, #6aa7ff);
        color: #061114;
      }

      .neodium-cloud__button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 680px) {
        .neodium-cloud {
          right: 12px;
          bottom: 12px;
          width: calc(100vw - 24px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureWidget() {
    if (widget || !document.body) return;
    injectStyles();

    widget = document.createElement("aside");
    widget.className = "neodium-cloud";
    widget.innerHTML = `
      <button type="button" class="neodium-cloud__toggle" aria-expanded="false">
        <span class="neodium-cloud__dot" data-role="dot"></span>
        <strong>Cloud Neodium</strong>
        <span data-role="toggle-label"></span>
      </button>
      <section class="neodium-cloud__panel" aria-live="polite">
        <div class="neodium-cloud__header">
          <div>
            <strong>Synchronisation Supabase</strong>
            <p data-role="message"></p>
          </div>
          <button type="button" class="neodium-cloud__close" aria-label="Fermer">x</button>
        </div>
        <div class="neodium-cloud__status">
          <div class="neodium-cloud__meta" data-role="meta"></div>
        </div>
        <div class="neodium-cloud__field" data-role="email-field">
          <label for="neodiumCloudEmail">Email</label>
          <input id="neodiumCloudEmail" type="email" placeholder="staff@neodium.fr" autocomplete="email" />
        </div>
        <div class="neodium-cloud__actions" data-role="actions"></div>
        <p class="neodium-cloud__hint" data-role="hint"></p>
      </section>
    `;

    const toggle = widget.querySelector(".neodium-cloud__toggle");
    const close = widget.querySelector(".neodium-cloud__close");

    toggle.addEventListener("click", () => {
      const nextOpen = !widget.classList.contains("is-open");
      widget.classList.toggle("is-open", nextOpen);
      toggle.setAttribute("aria-expanded", String(nextOpen));
      setPanelOpen(nextOpen);
      renderWidget();
    });

    close.addEventListener("click", () => {
      widget.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      setPanelOpen(false);
      renderWidget();
    });

    document.body.appendChild(widget);
    renderWidget();
  }

  function renderWidget() {
    if (!widget) return;

    widget.classList.toggle("is-open", isPanelOpen());

    const dot = widget.querySelector("[data-role='dot']");
    const toggleLabel = widget.querySelector("[data-role='toggle-label']");
    const message = widget.querySelector("[data-role='message']");
    const meta = widget.querySelector("[data-role='meta']");
    const actions = widget.querySelector("[data-role='actions']");
    const hint = widget.querySelector("[data-role='hint']");
    const emailField = widget.querySelector("[data-role='email-field']");
    const emailInput = widget.querySelector("#neodiumCloudEmail");
    const toggle = widget.querySelector(".neodium-cloud__toggle");

    const statusForDot = state.status === "ready"
      ? "ready"
      : state.status === "booting" || state.status === "syncing"
        ? "syncing"
        : state.status === "error"
          ? "error"
          : "idle";

    dot.dataset.status = statusForDot;
    toggle.setAttribute("aria-expanded", String(widget.classList.contains("is-open")));
    toggleLabel.textContent = state.email || state.label;
    message.textContent = state.message;

    if (emailInput && !emailInput.value) {
      emailInput.value = getRememberedEmail();
    }

    if (!state.configured) {
      meta.textContent = state.localAccessBypass
        ? "Acces local actif. Supabase n'est pas configure."
        : "Supabase n'est pas configure.";
      emailField.style.display = "none";
      actions.innerHTML = "";
      hint.textContent = state.localAccessBypass
        ? "Les outils restent accessibles en local. Ajoute Supabase si tu veux aussi la synchronisation cloud."
        : "Ajoute l'URL et la cle publique dans assets/supabase-config.js.";
      return;
    }

    if (state.email) {
      emailField.style.display = "none";
      meta.textContent = `Connecte en tant que ${state.email}`;
      actions.innerHTML = `
        <button type="button" class="neodium-cloud__button neodium-cloud__button--primary" data-action="sync"${state.syncing ? " disabled" : ""}>Synchroniser</button>
        <button type="button" class="neodium-cloud__button" data-action="reload"${state.syncing ? " disabled" : ""}>Recharger le cloud</button>
        <button type="button" class="neodium-cloud__button" data-action="signout"${state.syncing ? " disabled" : ""}>Se deconnecter</button>
      `;
      hint.textContent = "Les utilisateurs autorises partagent les memes donnees une fois connectes.";
    } else {
      emailField.style.display = "";
      meta.textContent = state.localAccessBypass
        ? "Acces local actif sans session cloud"
        : "Pas de session cloud active";
      actions.innerHTML = `
        <button type="button" class="neodium-cloud__button neodium-cloud__button--primary" data-action="signin"${state.syncing ? " disabled" : ""}>Recevoir un lien</button>
      `;
      hint.textContent = state.localAccessBypass
        ? "En local, les outils sont deblocables sans connexion. Connecte le cloud uniquement pour synchroniser les donnees partagees."
        : "Seules les adresses autorisees dans Supabase auront acces aux donnees partagees.";
    }

    actions.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.getAttribute("data-action");
        if (action === "signin") {
          const email = String(emailInput?.value || "").trim();
          await window.NeodiumCloudSync.signInWithMagicLink(email);
          return;
        }
        if (action === "signout") {
          await window.NeodiumCloudSync.signOut();
          return;
        }
        if (action === "sync") {
          await window.NeodiumCloudSync.forceSync();
          return;
        }
        if (action === "reload") {
          await window.NeodiumCloudSync.reloadFromCloud();
        }
      });
    });
  }

  async function flushPendingMutations() {
    if (!supabaseClient || !currentUserId || !initialSyncComplete || pendingMutations.size === 0) {
      updateState({});
      return;
    }

    const operations = [...pendingMutations.entries()];
    pendingMutations.clear();
    updateState({ syncing: true, status: "syncing", message: "Synchronisation partagee..." });

    const upserts = [];
    const deletions = [];

    operations.forEach(([key, mutation]) => {
      if (mutation.type === "remove") {
        deletions.push(key);
        return;
      }

      upserts.push({
        workspace_id: workspaceId,
        storage_key: key,
        storage_value: mutation.value,
        updated_at: new Date().toISOString()
      });
    });

    if (upserts.length) {
      const { error } = await supabaseClient
        .from(storageTable)
        .upsert(upserts, { onConflict: "workspace_id,storage_key" });

      if (error) {
        upserts.forEach((entry) => pendingMutations.set(entry.storage_key, { type: "set", value: entry.storage_value }));
        updateState({ syncing: false, status: "error", message: error.message || "Impossible d'ecrire dans Supabase." });
        return;
      }
    }

    if (deletions.length) {
      const { error } = await supabaseClient
        .from(storageTable)
        .delete()
        .eq("workspace_id", workspaceId)
        .in("storage_key", deletions);

      if (error) {
        deletions.forEach((key) => pendingMutations.set(key, { type: "remove", value: "" }));
        updateState({ syncing: false, status: "error", message: error.message || "Impossible de supprimer dans Supabase." });
        return;
      }
    }

    updateState({
      syncing: false,
      status: "ready",
      message: "Cloud partage synchronise."
    });
  }

  function withSyncLock(task) {
    syncLock = syncLock.then(task, task);
    return syncLock;
  }

  function isUnauthorizedError(error) {
    const message = String(error?.message || "").toLowerCase();
    return message.includes("row-level security") || message.includes("permission denied");
  }

  async function applyRemoteSnapshot(session) {
    if (!session?.user?.id) {
      currentUserId = "";
      currentEmail = "";
      initialSyncComplete = false;
      setReloadMarker("");
      updateState({
        ready: true,
        status: "signed_out",
        syncing: false,
        label: "Local",
        email: "",
        message: state.localAccessBypass
          ? "Acces local actif. Connexion cloud optionnelle."
          : "Connexion cloud disponible."
      });
      return;
    }

    currentUserId = session.user.id;
    currentEmail = session.user.email || "";
    updateState({
      ready: true,
      status: "syncing",
      syncing: true,
      label: "Partage equipe",
      email: currentEmail,
      message: "Chargement du cloud partage..."
    });

    const { data, error } = await supabaseClient
      .from(storageTable)
      .select("storage_key, storage_value")
      .eq("workspace_id", workspaceId)
      .order("storage_key", { ascending: true });

    if (error) {
      updateState({
        ready: true,
        status: "error",
        syncing: false,
        label: "Partage equipe",
        email: currentEmail,
        message: isUnauthorizedError(error)
          ? "Cet email n'est pas autorise pour le partage."
          : (error.message || "Lecture Supabase impossible.")
      });
      return;
    }

    const remoteRows = Array.isArray(data) ? data : [];
    const remoteMap = new Map();
    remoteRows.forEach((row) => {
      if (!row || !isTrackedKey(row.storage_key)) return;
      remoteMap.set(row.storage_key, String(row.storage_value ?? ""));
    });

    let appliedRemoteChanges = false;
    suppressTrackedWrites = true;
    remoteMap.forEach((value, key) => {
      const localValue = rawGetLocal(key);
      if (localValue !== value) {
        rawSetLocal(key, value);
        appliedRemoteChanges = true;
      }
      pendingMutations.delete(key);
    });
    suppressTrackedWrites = false;

    if (remoteMap.size === 0) {
      getTrackedSnapshot().forEach((entry) => {
        pendingMutations.set(entry.key, { type: "set", value: entry.value });
      });
    }

    initialSyncComplete = true;
    updateState({
      ready: true,
      status: "ready",
      syncing: false,
      label: "Partage equipe",
      email: currentEmail,
      message: "Cloud partage connecte."
    });

    await flushPendingMutations();

    const reloadMarker = getReloadMarker();
    if (appliedRemoteChanges && reloadMarker !== currentUserId) {
      setReloadMarker(currentUserId);
      window.location.reload();
      return;
    }

    if (!appliedRemoteChanges && reloadMarker === currentUserId) {
      setReloadMarker("");
    }
  }

  async function syncSession(session) {
    return withSyncLock(async () => {
      await applyRemoteSnapshot(session);
    });
  }

  async function signInWithMagicLink(email) {
    if (!supabaseClient) {
      updateState({ status: "error", message: "Supabase n'est pas pret." });
      return;
    }

    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) {
      updateState({ status: "error", message: "Saisis un email avant de continuer." });
      return;
    }

    rememberEmail(normalizedEmail);
    updateState({ syncing: true, status: "syncing", message: "Envoi du lien magique..." });

    const { error } = await supabaseClient.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: config.emailRedirectTo || (window.location.origin + window.location.pathname)
      }
    });

    if (error) {
      updateState({ syncing: false, status: "error", message: error.message || "Envoi impossible." });
      return;
    }

    updateState({
      syncing: false,
      status: "ready",
      label: "Partage equipe",
      email: "",
      message: `Lien envoye a ${normalizedEmail}.`
    });
  }

  async function signOut() {
    if (!supabaseClient) return;

    updateState({ syncing: true, status: "syncing", message: "Deconnexion..." });
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      updateState({ syncing: false, status: "error", message: error.message || "Deconnexion impossible." });
      return;
    }

    currentUserId = "";
    currentEmail = "";
    initialSyncComplete = false;
    setReloadMarker("");
    updateState({
      ready: true,
      syncing: false,
      status: "signed_out",
      label: "Local",
      email: "",
      message: state.localAccessBypass
        ? "Deconnecte. Acces local conserve, cloud optionnel."
        : "Deconnecte. Les outils restent utilisables en local."
    });
  }

  async function forceSync() {
    getTrackedSnapshot().forEach((entry) => {
      pendingMutations.set(entry.key, { type: "set", value: entry.value });
    });
    updateState({ syncing: true, status: "syncing", message: "Synchronisation manuelle..." });
    await flushPendingMutations();
  }

  async function initSupabase() {
    if (!hasConfig) {
      updateState({ ready: true });
      return;
    }

    try {
      const module = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      supabaseClient = module.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        updateState({ ready: true, status: "error", message: error.message || "Session Supabase indisponible." });
      } else {
        await syncSession(data.session);
      }

      const authListener = supabaseClient.auth.onAuthStateChange((_event, session) => {
        void syncSession(session);
      });
      authSubscription = authListener?.data?.subscription || null;
    } catch (error) {
      updateState({
        ready: true,
        status: "error",
        syncing: false,
        message: error instanceof Error ? error.message : "Chargement Supabase impossible."
      });
    }
  }

  window.NeodiumCloudSync = {
    getState: getPublicState,
    signInWithMagicLink,
    signOut,
    forceSync,
    reloadFromCloud: async () => {
      if (!supabaseClient) return;
      const { data } = await supabaseClient.auth.getSession();
      await syncSession(data?.session || null);
    },
    whenReady: () => syncLock,
    unsubscribe: () => authSubscription?.unsubscribe?.()
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureWidget, { once: true });
  } else {
    ensureWidget();
  }

  void initSupabase();
})();

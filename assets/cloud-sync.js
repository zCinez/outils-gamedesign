(function () {
  const config = window.NEODIUM_SUPABASE_CONFIG || {};
  const mode = config.mode || "shared_public";
  const syncKeyPrefixes = Array.isArray(config.syncKeyPrefixes) ? config.syncKeyPrefixes : [];
  const syncKeys = new Set(Array.isArray(config.syncKeys) ? config.syncKeys : []);
  const hasConfig = Boolean(config.url && config.anonKey);
  const storageTable = config.storageTable || "neodium_shared_storage";
  const workspaceId = config.workspaceId || "global";
  const syncStateEventName = "neodium-cloud-state";
  const panelStorageKey = "neodium-cloud-panel-open";
  const styleElementId = "neodium-cloud-sync-style";

  const storageProto = Object.getPrototypeOf(window.localStorage);
  const nativeSetItem = storageProto.setItem;
  const nativeGetItem = storageProto.getItem;
  const nativeRemoveItem = storageProto.removeItem;
  const nativeClear = storageProto.clear;

  const pendingMutations = new Map();
  let suppressTrackedWrites = false;
  let initialSyncComplete = false;
  let supabaseClient = null;
  let syncLock = Promise.resolve();
  let widget = null;

  const state = {
    configured: hasConfig,
    ready: false,
    status: hasConfig ? "booting" : "disabled",
    message: hasConfig ? "Initialisation du cloud partage..." : "Ajoute Supabase dans assets/supabase-config.js",
    label: mode === "shared_public" ? "Partage equipe" : "Cloud",
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

  function updateState(patch) {
    Object.assign(state, patch, { pending: pendingMutations.size });
    window.dispatchEvent(new CustomEvent(syncStateEventName, { detail: getPublicState() }));
    renderWidget();
  }

  function getPublicState() {
    return {
      configured: state.configured,
      ready: state.ready,
      status: state.status,
      message: state.message,
      label: state.label,
      syncing: state.syncing,
      pending: state.pending
    };
  }

  function queueMutation(type, key, value) {
    if (!isTrackedKey(key) || suppressTrackedWrites) return;
    pendingMutations.set(key, { type, value: value ?? "" });
    updateState({});
    if (initialSyncComplete && supabaseClient) {
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
    toggleLabel.textContent = state.label;
    message.textContent = state.message;

    if (!state.configured) {
      meta.textContent = "Supabase n'est pas configure.";
      actions.innerHTML = "";
      hint.textContent = "Ajoute l'URL et la cle publique dans assets/supabase-config.js.";
      return;
    }

    meta.textContent = mode === "shared_public"
      ? "Tous les visiteurs du portail partagent les memes donnees."
      : "Mode cloud actif.";

    actions.innerHTML = `
      <button type="button" class="neodium-cloud__button neodium-cloud__button--primary" data-action="sync"${state.syncing ? " disabled" : ""}>Synchroniser</button>
      <button type="button" class="neodium-cloud__button" data-action="reload"${state.syncing ? " disabled" : ""}>Recharger le cloud</button>
    `;
    hint.textContent = mode === "shared_public"
      ? "Toute modification sur le portail peut etre retrouvee par les autres visiteurs."
      : "Synchronisation cloud active.";

    actions.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.getAttribute("data-action");
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
    if (!supabaseClient || !initialSyncComplete || pendingMutations.size === 0) {
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

  async function loadSharedSnapshot() {
    return withSyncLock(async () => {
      if (!supabaseClient) return;

      updateState({
        ready: true,
        syncing: true,
        status: "syncing",
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
          syncing: false,
          status: "error",
          message: error.message || "Lecture Supabase impossible."
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
        syncing: false,
        status: "ready",
        message: "Cloud partage connecte."
      });

      await flushPendingMutations();

      if (appliedRemoteChanges) {
        window.location.reload();
      }
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
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      await loadSharedSnapshot();
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
    forceSync,
    reloadFromCloud: loadSharedSnapshot,
    whenReady: () => syncLock
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureWidget, { once: true });
  } else {
    ensureWidget();
  }

  void initSupabase();
})();

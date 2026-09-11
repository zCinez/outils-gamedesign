(function () {
  const rootUrl = new URL("../", document.currentScript.src);
  const pending = new Map();
  let counter = 0;
  let showTimer;
  let slowTimer;
  let noticeTimer;
  let navigationDone;
  let cloudDone;

  const status = document.createElement("div");
  status.className = "neodium-loading";
  status.hidden = true;
  status.innerHTML = '<span class="neodium-spinner" aria-hidden="true"></span><span role="status" aria-live="polite"></span><button type="button" aria-label="Masquer l’indicateur de chargement">×</button>';
  const message = status.querySelector('[role="status"]');
  document.body.append(status);
  status.querySelector("button").addEventListener("click", () => {
    status.hidden = true;
    clearTimeout(showTimer);
    clearTimeout(slowTimer);
    clearTimeout(noticeTimer);
  });

  function render() {
    clearTimeout(showTimer);
    clearTimeout(slowTimer);
    clearTimeout(noticeTimer);
    if (!pending.size) {
      status.hidden = true;
      return;
    }
    status.classList.remove("is-notice");
    message.textContent = [...pending.values()].at(-1);
    // Fast operations do not flash a spinner; slow ones never block the form.
    showTimer = setTimeout(() => { status.hidden = false; }, 180);
    slowTimer = setTimeout(() => {
      message.textContent = "Le chargement prend plus de temps que prévu. Tu peux continuer à utiliser l’outil.";
      status.classList.add("is-notice");
    }, 30000);
  }

  function begin(label = "Chargement en cours…") {
    const id = ++counter;
    pending.set(id, label);
    render();
    let finished = false;
    return () => {
      if (finished) return;
      finished = true;
      pending.delete(id);
      render();
    };
  }

  function notice(text) {
    clearTimeout(showTimer);
    clearTimeout(slowTimer);
    clearTimeout(noticeTimer);
    message.textContent = text;
    status.classList.add("is-notice");
    status.hidden = false;
    noticeTimer = setTimeout(render, 8000);
  }

  window.NeodiumLoading = {
    begin,
    notice,
    async track(label, operation) {
      const done = begin(label);
      try { return await operation(); }
      finally { done(); }
    }
  };

  const pageDone = begin("Chargement de la page…");
  if (document.readyState === "complete") pageDone();
  else window.addEventListener("load", pageDone, { once: true });

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self") || link.classList.contains("is-disabled") || link.getAttribute("aria-disabled") === "true") return;
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin || (target.pathname === location.pathname && target.search === location.search)) return;
    navigationDone?.();
    navigationDone = begin("Ouverture de la page…");
    // Navigation may be cancelled by the browser's unsaved-changes prompt.
    setTimeout(() => { navigationDone?.(); navigationDone = null; }, 12000);
  });

  window.addEventListener("pageshow", () => {
    navigationDone?.();
    navigationDone = null;
    pageDone();
  });

  function updateCloud(state) {
    const busy = state?.syncing || state?.status === "booting";
    if (busy && !cloudDone) cloudDone = begin("Synchronisation cloud…");
    if (!busy && cloudDone) {
      cloudDone();
      cloudDone = null;
      if (state?.status === "error") notice("Synchronisation cloud échouée. Consulte le panneau Cloud Neodium.");
    }
  }
  window.addEventListener("neodium-cloud-state", event => updateCloud(event.detail));
  updateCloud(window.NeodiumCloudSync?.getState?.());

  const footer = document.createElement("footer");
  footer.className = "neodium-legal-footer";
  const brand = document.createElement("span");
  brand.textContent = "Neodium · zCinez";
  footer.append(brand);
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Informations légales");
  for (const [text, path] of [["Conditions générales d’utilisation", "conditions-utilisation.html"], ["Politique de confidentialité", "confidentialite.html"]]) {
    const link = document.createElement("a");
    link.textContent = text;
    link.href = new URL(path, rootUrl).href;
    nav.append(link);
  }
  footer.append(nav);
  document.body.append(footer);
})();

(function () {
  const script = document.currentScript;
  if (!script) return;

  const assetsUrl = new URL(script.src, window.location.href);
  const rootUrl = new URL("../", assetsUrl);
  const currentPath = window.location.pathname.toLowerCase();
  const rootPath = rootUrl.pathname.toLowerCase();
  const rootIndexPath = new URL("index.html", rootUrl).pathname.toLowerCase();

  const isCdcPage = () => /\/outils\/generateur-cdc(?:\/|\.html|$)/.test(currentPath);
  const isStatGmPage = () => /\/outils\/statgm(?:\/|\.html|$)/.test(currentPath);
  const isTodoPage = () => /\/outils\/todo-gamedesign\.html$/.test(currentPath);
  const isSuggestionsPage = () => /\/outils\/suggestions\.html$/.test(currentPath);
  const isPortalPage = () => currentPath === rootPath || currentPath === rootIndexPath;
  const isOtherToolPage = () => /\/outils\//.test(currentPath) && ![isCdcPage, isStatGmPage, isTodoPage, isSuggestionsPage].some((matcher) => matcher());

  const links = [
    {
      label: "CDC",
      href: new URL("outils/generateur-cdc/index.html", rootUrl).href,
      isActive: isCdcPage,
      requiresCloudAccess: true
    },
    {
      label: "StatGM",
      href: new URL("outils/statgm/index.html", rootUrl).href,
      isActive: isStatGmPage,
      requiresCloudAccess: true
    },
    {
      label: "Todo",
      href: new URL("outils/todo-gamedesign.html", rootUrl).href,
      isActive: isTodoPage,
      requiresCloudAccess: true
    },
    {
      label: "Suggestions",
      href: new URL("outils/suggestions.html", rootUrl).href,
      isActive: isSuggestionsPage,
      requiresCloudAccess: true
    },
    {
      label: "Voir les outils",
      href: new URL("index.html", rootUrl).href,
      isActive: () => isPortalPage() || isOtherToolPage(),
      requiresCloudAccess: false
    }
  ];

  const header = document.createElement("header");
  header.className = "neodium-global-header";
  header.innerHTML = `
    <div class="neodium-global-header__inner">
      <a class="neodium-global-header__brand" href="${new URL("index.html", rootUrl).href}" aria-label="Retour à l'accueil Neodium">
        <span class="neodium-global-header__logo">
          <img src="${new URL("outils/statgm/logo-neodium.png", rootUrl).href}" alt="Logo Neodium" />
        </span>
        <span class="neodium-global-header__copy">
          <strong>Neodium</strong>
          <span>Outils internes de game design</span>
        </span>
      </a>
      <nav class="neodium-global-header__nav" aria-label="Navigation globale">
        ${links.map((link) => {
          const isActive = link.isActive();
          const className = isActive ? "neodium-global-header__link is-active" : "neodium-global-header__link";
          const cloudAttribute = link.requiresCloudAccess ? ' data-cloud-protected="true"' : "";
          return `<a class="${className}" href="${link.href}"${cloudAttribute}>${link.label}</a>`;
        }).join("")}
      </nav>
    </div>
  `;

  document.body.classList.add("neodium-global-header-active");
  if (document.querySelector(".legacy-topbar")) {
    document.body.classList.add("neodium-global-header-hide-legacy");
  }

  document.body.prepend(header);

  const protectedLinks = Array.from(header.querySelectorAll("[data-cloud-protected='true']"));

  function hasSharedCloudAccess(state) {
    return Boolean(
      state &&
      state.configured &&
      state.ready &&
      state.email &&
      state.status !== "signed_out" &&
      state.status !== "error"
    );
  }

  function updateProtectedLinks(state) {
    const shouldHide = !hasSharedCloudAccess(state);
    protectedLinks.forEach((link) => {
      link.classList.toggle("is-cloud-hidden", shouldHide);
      link.setAttribute("aria-hidden", shouldHide ? "true" : "false");
      link.tabIndex = shouldHide ? -1 : 0;
    });
  }

  window.addEventListener("neodium-cloud-state", (event) => {
    updateProtectedLinks(event.detail || {});
  });

  updateProtectedLinks(window.NeodiumCloudSync?.getState?.() || {});

  window.NeodiumCloudSync?.whenReady?.()
    ?.then(() => updateProtectedLinks(window.NeodiumCloudSync?.getState?.() || {}))
    ?.catch(() => updateProtectedLinks(window.NeodiumCloudSync?.getState?.() || {}));
})();

(function () {
  const script = document.currentScript;
  if (!script) return;

  const assetsUrl = new URL(script.src, window.location.href);
  const rootUrl = new URL("../", assetsUrl);
  const currentPath = window.location.pathname.toLowerCase();
  const rootPath = rootUrl.pathname.toLowerCase();
  const rootIndexPath = new URL("index.html", rootUrl).pathname.toLowerCase();

  const links = [
    {
      label: "CDC",
      href: new URL("outils/generateur-cdc/index.html", rootUrl).href,
      isActive: () => /\/outils\/generateur-cdc(?:\/|\.html|$)/.test(currentPath)
    },
    {
      label: "StatGM",
      href: new URL("outils/statgm/index.html", rootUrl).href,
      isActive: () => /\/outils\/statgm(?:\/|\.html|$)/.test(currentPath)
    },
    {
      label: "Todo",
      href: new URL("outils/todo-gamedesign.html", rootUrl).href,
      isActive: () => /\/outils\/todo-gamedesign\.html$/.test(currentPath)
    },
    {
      label: "Suggestions",
      href: new URL("outils/suggestions.html", rootUrl).href,
      isActive: () => /\/outils\/suggestions\.html$/.test(currentPath)
    },
    {
      label: "Voir les outils",
      href: new URL("index.html", rootUrl).href,
      isActive: () => currentPath === rootPath || currentPath === rootIndexPath
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
          return `<a class="${className}" href="${link.href}">${link.label}</a>`;
        }).join("")}
      </nav>
    </div>
  `;

  document.body.classList.add("neodium-global-header-active");
  if (document.querySelector(".legacy-topbar")) {
    document.body.classList.add("neodium-global-header-hide-legacy");
  }

  document.body.prepend(header);
})();

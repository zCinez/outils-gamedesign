(function () {
  const TRANSITION_DURATION_MS = 180;
  const NAV_TAB_ROLES = ["home", "project", "editor", "presets", "settings"];
  function getCurrentPageMeta() {
    const currentPath = window.location.pathname.split("/").pop().toLowerCase();

    if (!currentPath || currentPath === "index.html") {
      return {
        activeTab: "home",
        subtitle: "Accueil",
      };
    }

    if (currentPath === "projects.html") {
      return {
        activeTab: "project",
        subtitle: "Gestion des projets",
      };
    }

    if (currentPath === "cdc-library.html") {
      return {
        activeTab: "project",
        subtitle: "Projet en cours",
      };
    }

    if (currentPath === "cdc-generator.html") {
      return {
        activeTab: "editor",
        subtitle: "Éditeur",
      };
    }

    if (currentPath === "gui-presets.html") {
      return {
        activeTab: "presets",
        subtitle: "Presets",
      };
    }

    if (currentPath === "settings.html") {
      return {
        activeTab: "settings",
        subtitle: "Paramètres",
      };
    }

    if (currentPath === "settings-template.html") {
      return {
        activeTab: "settings",
        subtitle: "Architecture template",
      };
    }

    return {
      activeTab: "",
      subtitle: "Navigation",
    };
  }

  function syncTopTabActiveState(navElement, activeTab) {
    if (!navElement) return;

    const tabs = [...navElement.querySelectorAll(".top-tab")];
    tabs.forEach((tab, index) => {
      const isActive = NAV_TAB_ROLES[index] === activeTab;
      tab.classList.toggle("is-active", isActive);
      if (isActive) {
        tab.setAttribute("aria-current", "page");
      } else {
        tab.removeAttribute("aria-current");
      }
    });
  }

  function setupPersistentNavigation() {
    const navShell = document.querySelector(".top-tabs-shell");
    const navElement = navShell?.querySelector(".top-tabs");

    if (!navShell || !navElement) return;

    if (!navElement.querySelector("[data-portal-link]")) {
      const portalLink = document.createElement("a");
      portalLink.className = "top-tab cdc-portal-tab";
      portalLink.href = "../../index.html";
      portalLink.dataset.portalLink = "true";
      portalLink.textContent = "Portail outils";
      navElement.append(portalLink);
    }

    const pageMeta = getCurrentPageMeta();
    syncTopTabActiveState(navElement, pageMeta.activeTab);
  }

  function markPageReady() {
    document.body.classList.add("page-nav");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.body.classList.add("page-nav-ready");
        document.body.classList.remove("page-nav-leaving");
      });
    });
  }

  function isInternalNavigation(link) {
    if (!link) return false;
    if (link.classList.contains("is-disabled")) return false;
    if (link.getAttribute("aria-disabled") === "true") return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return false;

    const targetUrl = new URL(link.href, window.location.href);
    return targetUrl.origin === window.location.origin;
  }

  function navigateToPage(url) {
    if (!url) return;

    const targetUrl = new URL(url, window.location.href);
    const currentUrl = new URL(window.location.href);
    const isSameDocument =
      targetUrl.origin === currentUrl.origin
      && targetUrl.pathname === currentUrl.pathname
      && targetUrl.search === currentUrl.search;

    if (isSameDocument && targetUrl.hash) {
      const targetElement = document.querySelector(targetUrl.hash);
      if (targetElement) {
        history.replaceState(null, "", targetUrl.hash);
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (targetUrl.href === currentUrl.href) return;

    document.body.classList.remove("page-nav-ready");
    document.body.classList.add("page-nav-leaving");

    window.setTimeout(() => {
      window.location.href = targetUrl.href;
    }, TRANSITION_DURATION_MS);
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (link?.classList.contains("is-disabled") || link?.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }
    if (!isInternalNavigation(link)) return;

    event.preventDefault();
    navigateToPage(link.href);
  });

  window.addEventListener("pageshow", () => {
    markPageReady();
  });

  window.navigateToPage = navigateToPage;
  setupPersistentNavigation();
  markPageReady();
})();

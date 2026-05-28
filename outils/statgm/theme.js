const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const processedNumberInputs = new WeakSet();

const setTheme = (theme) => {
  const nextTheme = theme === "light" ? "light" : "dark";
  root.dataset.theme = nextTheme;

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", nextTheme === "light");
    themeToggle.setAttribute("aria-label", nextTheme === "light" ? "Passer en mode sombre" : "Passer en mode clair");
  }

  localStorage.setItem("statgm-theme", nextTheme);
};

setTheme(localStorage.getItem("statgm-theme"));

const injectPortalLink = () => {
  const nav = document.querySelector(".nav");
  if (!nav || nav.querySelector("[data-portal-link]")) return;

  const portalLink = document.createElement("a");
  portalLink.href = "../../index.html";
  portalLink.dataset.portalLink = "true";
  portalLink.textContent = "Portail outils";
  nav.append(portalLink);
};

injectPortalLink();

const enhanceNumberInput = (input) => {
  if (!(input instanceof HTMLInputElement) || input.type !== "number" || processedNumberInputs.has(input)) {
    return;
  }

  processedNumberInputs.add(input);
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";

  input.addEventListener("beforeinput", (event) => {
    if (event.data === ".") {
      event.preventDefault();
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.setRangeText(",", start, end, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
};

const enhanceNumberInputs = (scope = document) => {
  scope.querySelectorAll?.('input[type="number"]').forEach(enhanceNumberInput);
};

enhanceNumberInputs();

const inputObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.matches?.('input[type="number"]')) {
        enhanceNumberInput(node);
      }
      enhanceNumberInputs(node);
    });
  });
});

inputObserver.observe(document.body, {
  childList: true,
  subtree: true
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    setTheme(root.dataset.theme === "light" ? "dark" : "light");
  });
}

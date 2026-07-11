const root = document.documentElement;
const processedNumberInputs = new WeakSet();

const applyTheme = () => {
  root.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
};

localStorage.removeItem("statgm-theme");
applyTheme();

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

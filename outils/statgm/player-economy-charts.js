/* Small, local SVG charts: no chart library, network request or animation loop. */
(() => {
  const stats = window.StatGMPlayerStats;
  const node = (tag, className = "", text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const svgNode = (tag, attributes = {}, text) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function compactMoney(value, unit = value) {
    if (stats.numeric(value) === null) return "—";
    const amount = Math.abs(unit);
    const [divider, suffix] = amount >= 1e9 ? [1e9, "Md"] : amount >= 1e6 ? [1e6, "M"] : amount >= 1e3 ? [1e3, "k"] : [1, ""];
    return `${stats.number(value / divider)}${suffix ? ` ${suffix}` : ""} $`;
  }
  const shareLabel = value => value > 0 && value < .01 ? "< 0,01 %" : value < 100 && value > 99.99 ? "> 99,99 %" : `${stats.number(value)} %`;
  function donut(model) {
    const root = node("div", "player-donut-layout"), figure = node("figure", "player-donut-figure");
    const chart = svgNode("svg", { viewBox: "0 0 320 320", "aria-hidden": "true", class: "player-donut" });
    chart.append(svgNode("circle", { cx: 160, cy: 160, r: 138, fill: "none", "stroke-width": 32, class: "player-donut-track" }));
    const arcs = new Map(); let offset = 0;
    for (const slice of model.slices) {
      const arc = svgNode("circle", { cx: 160, cy: 160, r: 138, fill: "none", stroke: slice.color, "stroke-width": 32, pathLength: 100, "stroke-dasharray": `${slice.share} ${100 - slice.share}`, "stroke-dashoffset": -offset, transform: "rotate(-90 160 160)", class: "player-donut-arc" });
      arc.append(svgNode("title", {}, `${slice.label} : ${stats.money(slice.value)} · ${shareLabel(slice.share)}`));
      chart.append(arc); arcs.set(slice.key, arc); offset += slice.share;
    }
    const center = node("figcaption", "player-donut-center");
    center.append(node("span", "", "ARGENT TOTAL GAGNÉ"), node("strong", "", stats.number(model.total)), node("small", "", "$ · cumulés"));
    center.title = `Source : ${model.comparison[0].source}`;
    figure.append(chart, center); root.append(figure);
    const legend = node("div", "player-chart-legend"); legend.setAttribute("aria-label", "Catégories incluses dans l’argent total gagné");
    const detail = node("p", "player-chart-selection", "Sélectionne une catégorie pour voir sa part du total.");
    detail.setAttribute("role", "status"); detail.setAttribute("aria-live", "polite");
    const buttons = new Map();
    function select(key) {
      const slice = model.slices.find(row => row.key === key), module = slice || model.modules.find(row => row.key === key);
      if (!module) return;
      for (const [other, button] of buttons) button.setAttribute("aria-pressed", String(other === key));
      for (const [other, arc] of arcs) arc.style.opacity = other === key ? "1" : ".3";
      const share = slice ? `${shareLabel(slice.share)} du total` : module.value === 0 && !model.issue ? "0 % du total" : "Part non renseignée";
      detail.textContent = `${module.label} · ${module.value === null ? "Non renseigné" : stats.money(module.value)} · ${share}`;
    }
    const rows = [...model.slices.filter(row => row.key === "other"), ...model.modules];
    for (const row of rows) {
      const button = node("button", "player-chart-module"); button.type = "button"; button.setAttribute("aria-pressed", "false"); button.title = `Source : ${row.source}`;
      const label = node("span", "player-chart-module-label"), dot = node("i", "player-chart-dot"), amounts = node("span", "player-chart-module-amount");
      dot.style.backgroundColor = row.color; dot.setAttribute("aria-hidden", "true"); label.append(dot, node("span", "", row.label));
      const slice = model.slices.find(slice => slice.key === row.key);
      const share = slice ? shareLabel(slice.share) : row.value === 0 && !model.issue ? "0 %" : "—";
      amounts.append(node("strong", "", row.value === null ? "Non renseigné" : stats.money(row.value)), node("small", "", share));
      button.append(label, amounts); button.addEventListener("click", () => select(row.key)); button.addEventListener("focus", () => select(row.key));
      button.addEventListener("pointerenter", () => select(row.key)); buttons.set(row.key, button); legend.append(button);
      arcs.get(row.key)?.addEventListener("pointerenter", () => select(row.key));
      arcs.get(row.key)?.addEventListener("click", () => { select(row.key); button.focus(); });
    }
    const side = node("div", "player-donut-details"); side.append(legend, detail); root.append(side);
    if (model.issue) root.append(node("p", "player-note player-chart-note", model.issue));
    else if (model.total === 0) root.append(node("p", "player-note player-chart-note", "Aucun gain cumulé : les montants renseignés sont à 0 $."));
    else if (model.partial) root.append(node("p", "player-note player-chart-note", "Certaines catégories sont absentes de l’export. Le reste du total figure dans les gains non ventilés."));
    return root;
  }
  function bars(model) {
    const root = node("div", "player-money-bars");
    const values = model.comparison.map(row => row.value).filter(value => value !== null && value >= 0), max = Math.max(0, ...values);
    // Shared linear axis anchored at zero, including when one counter is missing.
    const magnitude = max > 0 ? 10 ** Math.floor(Math.log10(max / 4)) : 1;
    const rough = max / 4 / magnitude;
    const step = [1, 2, 2.5, 5, 10].find(value => value >= rough) * magnitude || 1;
    const proposed = Math.ceil(max / step) * step;
    const ceiling = max ? Number.isFinite(proposed) ? proposed : max : 1;
    const chart = svgNode("svg", { viewBox: "0 0 480 310", role: "img", "aria-label": `Compteurs cumulés de l’export : argent total gagné ${stats.money(model.comparison[0].value)}, argent dépensé ${stats.money(model.comparison[1].value)}. Échelle commune depuis zéro.`, class: "player-bar-chart" });
    const top = 30, bottom = 255, left = 74, right = 460;
    for (let i = 0; i <= 4; i++) {
      const value = ceiling / 4 * i, y = bottom - (bottom - top) * i / 4;
      chart.append(svgNode("line", { x1: left, x2: right, y1: y, y2: y, class: i ? "player-chart-guide" : "player-chart-baseline" }), svgNode("text", { x: left - 10, y: y + 4, "text-anchor": "end", class: "player-chart-tick" }, compactMoney(value, ceiling)));
    }
    for (const [i, row] of model.comparison.entries()) {
      const x = 165 + i * 190, valid = row.value !== null && row.value >= 0;
      const height = valid ? row.value / ceiling * (bottom - top) : 0, y = bottom - height;
      if (height > 0) {
        const bar = svgNode("rect", { x: x - 41, y, width: 82, height, rx: 3, fill: row.color, class: "player-chart-bar" });
        bar.append(svgNode("title", {}, `${row.label} : ${stats.money(row.value)}`)); chart.append(bar);
      }
      chart.append(svgNode("text", { x, y: valid ? Math.max(18, y - 12) : bottom - 12, "text-anchor": "middle", class: "player-chart-value" }, valid ? compactMoney(row.value, ceiling) : row.value === null ? "Non renseigné" : "Non représenté"), svgNode("text", { x, y: 284, "text-anchor": "middle", class: "player-chart-category" }, row.label));
    }
    root.append(chart);
    const exact = node("dl", "player-chart-totals");
    for (const row of model.comparison) {
      const entry = node("div"); entry.title = `Source : ${row.source}`; entry.append(node("dt", "", row.label), node("dd", "", stats.money(row.value))); exact.append(entry);
    }
    root.append(exact);
    if (values.length !== 2) root.append(node("p", "player-note", "Les compteurs absents ou négatifs ne sont pas représentés par une barre."));
    const difference = node("div", "player-chart-difference");
    difference.append(node("span", "", "Gains − dépenses"), node("strong", "", stats.money(model.difference))); root.append(difference);
    root.append(node("p", "player-note", "Ces gains et dépenses sont cumulés. Leur différence ne représente pas le solde actuel du joueur."));
    return root;
  }
  window.StatGMEconomyCharts = { donut, bars };
})();

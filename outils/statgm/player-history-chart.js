/* One player's observed history. No remote chart library or retained raw JSON. */
(() => {
  const h = window.StatGMHistory, s = window.StatGMPlayerStats;
  // Current quest limits confirmed by the user; exports do not include these totals.
  const questLimits = {
    "quests.main_unlock": {total:9, countUnit:"étapes"},
    "quests.secondary_completed_count": {total:4, countUnit:"quêtes"}
  };
  const excludedPaths = new Set([
    "economy.displayed_total_gained", "economy.hourly_total_current_window",
    "progression.rank_among_tracked_players", "progression.tracked_players_count",
    "quests.milestone_tiers_claimed", "quests.milestone_tiers_total",
    "quests.successes_by_level.1.total", "quests.successes_by_level.2.total",
    "quests.successes_by_level.3.total", "quests.successes_by_level.4.total",
    "playtime.play_seconds_vanilla_stat",
    "plot.generated_money", "plot.id", "plot.size", "plot.max_members"
  ]);
  const node = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const svgNode = (tag, attributes = {}, text) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function unitFor(key) {
    const field = key.split(".").at(-1);
    if (field.includes("percent")) return "percent";
    if (field.includes("seconds")) return "duration";
    const internalMoney = key.startsWith("stats_store.economy.") && !/(?:average_count|average_index)$/.test(field);
    return key === "plot.value" || key.startsWith("economy.") || internalMoney || /(?:money|balance|bank|gained|spent|sell.*cumulative)/.test(field) ? "money" : "number";
  }
  const format = (value, unit) => value === null ? "Non renseigné" : unit === "money" ? s.money(value) : unit === "duration" ? s.duration(value) : unit === "percent" ? s.percent(value) : s.number(value);
  function formatPoint(point, metric) {
    const value = format(point?.value ?? null, metric.unit);
    return (metric.totalPath || metric.fixedTotal) && point?.value !== null && point?.value !== undefined ? `${value} / ${format(metric.total ?? null, "number")}` : value;
  }
  function deltaLabel(delta, unit, metric) {
    if (delta === null) return "Non comparable";
    if (metric?.invertedAxis) {
      if (delta === 0) return "Classement inchangé";
      const plural = Math.abs(delta) !== 1 ? "s" : "";
      return `${s.number(Math.abs(delta))} place${plural} ${delta < 0 ? "gagnée" : "perdue"}${plural}`;
    }
    return `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${unit === "percent" ? `${s.number(Math.abs(delta))} points` : format(Math.abs(delta), unit)}`;
  }
  const categoryNames = {economy:"Économie", progression:"Progression", jobs:"Métiers", quests:"Quêtes et succès", playtime:"Temps de jeu", plot:"Plot", profile:"Profil", rjobs_stats:"Compteurs rJobs", stats_store:"Compteurs internes"};
  const hiddenCategories = new Set(["rjobs_stats", "stats_store"]);
  const jobStatOrder = ["amount", "crafted", "blocks_broken", "xp", "money", "time_seconds", "milestone_tier", "milestone_claimed", "milestone_tier_total"];
  const jobStatKinds = {amount:"activity", crafted:"activity", blocks_broken:"activity", xp:"xp", money:"money", time_seconds:"time", milestone_tier:"milestones", milestone_claimed:"milestones", milestone_tier_total:"milestones"};
  const jobKindLabels = {level:"Niveau", activity:"Activité", xp:"Expérience", money:"Argent", time:"Temps", milestones:"Paliers", other:"Autres"};
  function classify(metric) {
    const path = metric.path, root = path.split(".")[0];
    const category = metric.key === "metric:playtime" ? "progression" : metric.key === "metric:balance" || metric.key === "metric:coins" ? "economy" : root === "jobs_levels" || root === "job_resources" ? "jobs" : root;
    const rawJob = path.startsWith("job_resources.") || path.startsWith("jobs_levels.") ? path.split(".")[1] : path.startsWith("rjobs_stats.") ? path.split(".")[1].replace(/^\[/, "") : path.startsWith("stats_store.jobs_raw.") ? path.split(".")[2] : "";
    const job = rawJob.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const resourcePath = path.match(/^job_resources\.[^.]+\.(\[[^\]]+\]|\d+)\.(.+)$/);
    const stat = resourcePath?.[2], level = path.startsWith("jobs_levels.");
    return {...metric, category, categoryLabel:categoryNames[category] || s.label(category), job,
      resource:resourcePath?.[1] || "", resourceLabel:resourcePath ? /^\d+$/.test(resourcePath[1]) ? `Ressource ${Number(resourcePath[1])+1}` : s.label(resourcePath[1].slice(1,-1)) : level ? "Niveau du métier" : "",
      stat, statLabel:level ? "Niveau du métier" : stat ? stat.split(".").map(s.label).join(" · ") : metric.label,
      statKind:level ? "level" : jobStatKinds[stat] || "other"};
  }
  function project(snapshot, data) {
    const fields = new Map(h.compare({}, data).filter(row => !row.key.startsWith("player.") && row.key !== "export_schema_version").map(row => [row.key, row.after]));
    for (const metric of h.metricValues(null, data)) fields.set(`metric:${metric.key}`, metric.after);
    return { ...snapshot, fields, playtimeSource: data.playtime?.play_seconds_source || "non renseignée" };
  }
  function catalog(history) {
    const present = new Set();
    for (const row of history) for (const [key, value] of row.fields) if (value !== null) present.add(key);
    const latest = history.reduce((last, row) => !last || h.compareSnapshots(last, row) < 0 ? row : last, null);
    const mainPaths = new Set(h.metrics.filter(metric => !metric.denominator).flatMap(metric => [metric.path, metric.fallback].filter(Boolean)));
    const main = h.metrics.filter(metric => present.has(`metric:${metric.key}`)).map(metric => ({...metric, key:`metric:${metric.key}`, group:"Indicateurs principaux"}));
    const other = [...present].filter(key => !key.startsWith("metric:") && !mainPaths.has(key) && !excludedPaths.has(key)).sort().map(key => {
      const parts = key.split("."), context = parts.slice(1, -1).map(part => s.label(part.replace(/^\[|\]$/g, "")));
      const successLevel = key.match(/^quests\.successes_by_level\.([1-4])\.completed$/)?.[1];
      const totalPath = successLevel ? `quests.successes_by_level.${successLevel}.total` : key === "quests.milestone_tiers_reached" ? "quests.milestone_tiers_total" : null;
      const questLimit = questLimits[key];
      const invertedAxis = key === "plot.farm_rank" || key === "plot.value_rank";
      return {key, path:key, label:successLevel ? `Succès de niveau ${successLevel}` : [...context, s.label(parts.at(-1))].join(" · "), group:s.label(parts[0]), unit:unitFor(key), counter:/(?:cumulative|vault_(?:gained|spent)_total)/.test(key), totalPath, total:totalPath ? latest?.fields.get(totalPath) ?? null : questLimit?.total ?? null, countUnit:invertedAxis ? "places" : questLimit?.countUnit || (totalPath ? successLevel ? "succès" : "paliers" : null), fixedTotal:Boolean(questLimit), invertedAxis};
    });
    const membersIndex = other.findIndex(metric => metric.key === "plot.member_count");
    if (membersIndex !== -1) {
      const [members] = other.splice(membersIndex, 1);
      const firstPlotIndex = other.findIndex(metric => metric.key.startsWith("plot."));
      other.splice(firstPlotIndex === -1 ? membersIndex : firstPlotIndex + 1, 0, members);
    }
    return [...main, ...other].map(classify);
  }
  function jobMetrics(metrics, job = "") {
    return metrics.filter(metric => metric.category === "jobs" && (job ? metric.job === job : metric.path.startsWith("jobs_levels.")));
  }
  function sortJobMetrics(metrics) {
    const order = metric => metric.statKind === "level" ? -1 : jobStatOrder.includes(metric.stat) ? jobStatOrder.indexOf(metric.stat) : jobStatOrder.length;
    return [...metrics].sort((a,b) => order(a)-order(b) || a.label.localeCompare(b.label,"fr"));
  }
  function jobResources(metrics, job) {
    const groups = new Map();
    for (const metric of jobMetrics(metrics,job)) {
      if (!groups.has(metric.resource)) groups.set(metric.resource,{key:metric.resource,label:metric.resourceLabel,metrics:[]});
      groups.get(metric.resource).metrics.push(metric);
    }
    return [...groups.values()].sort((a,b) => a.key === "" ? -1 : b.key === "" ? 1 : a.label.localeCompare(b.label,"fr")).map(group => ({...group,metrics:sortJobMetrics(group.metrics)}));
  }
  function jobMetricKinds(metrics) {
    return [{key:"all",label:"Toutes",count:metrics.length},...Object.entries(jobKindLabels).map(([key,label])=>({key,label,count:metrics.filter(metric=>metric.statKind===key).length})).filter(kind=>kind.count)];
  }
  function overviewMetrics(metrics) {
    return metrics.filter(metric => metric.key.startsWith("metric:") && metric.overview !== false);
  }
  function categories(metrics) {
    const groups = new Map();
    for (const metric of metrics) {
      if (!groups.has(metric.category)) groups.set(metric.category, {key:metric.category, label:metric.categoryLabel, count:0});
      groups.get(metric.category).count++;
    }
    const ordered = Object.keys(categoryNames);
    return [{key:"overview", label:"Vue d’ensemble", count:overviewMetrics(metrics).length}, ...[...groups.values()].filter(group => !hiddenCategories.has(group.key)).map(group => group.key === "jobs" ? {...group, totalCount:group.count, count:jobMetrics(metrics).length} : group).sort((a, b) => (ordered.indexOf(a.key) < 0 ? 99 : ordered.indexOf(a.key)) - (ordered.indexOf(b.key) < 0 ? 99 : ordered.indexOf(b.key)))].filter(group => group.totalCount || group.count);
  }
  function summarize(history, metric) {
    let first = null, last = null, previous = null, count = 0, sourceChanged = false, counterDropped = false;
    const sources = new Set();
    for (const row of history) {
      const value = row.fields.get(metric.key) ?? null;
      if (value !== null) {
        const point = {value, exportedAt:row.exportedAt};first ||= point;last = point;count++;
        if (metric.key === "metric:playtime") sources.add(row.playtimeSource);
        if (previous !== null && metric.counter && value < previous) counterDropped = true;
      }
      previous = value;
    }
    sourceChanged = sources.size > 1;
    const delta = count > 1 && !sourceChanged && Number.isFinite(last.value - first.value) ? last.value - first.value : null;
    return {first, last, count, delta, missing:history.length - count, sourceChanged, counterDropped};
  }
  function series(history, metric) {
    const points = history.map(row => ({...row, value:row.fields.get(metric.key) ?? null}));
    let previous = null, sourceChanged = false, counterDropped = false;
    for (const point of points) {
      point.breakBefore = point.value === null || !previous || previous.value === null;
      point.delta = null;
      if (point.value !== null && previous && previous.value !== null) {
        const changed = (metric.key === "metric:playtime" || metric.path === "playtime.play_seconds") && point.playtimeSource !== previous.playtimeSource;
        point.breakBefore ||= changed;
        sourceChanged ||= changed;
        const delta = point.value - previous.value;
        point.delta = !changed && Number.isFinite(delta) ? delta : null;
        counterDropped ||= Boolean(metric.counter && point.delta !== null && point.delta < 0);
      }
      previous = point;
    }
    const valid = points.filter(point => point.value !== null), first = valid[0], last = valid.at(-1);
    if (metric.key === "metric:playtime") sourceChanged ||= new Set(valid.map(point => point.playtimeSource)).size > 1;
    const comparable = valid.length > 1 && !sourceChanged && Number.isFinite(last.value - first.value);
    return {metric, points, valid, first, last, sourceChanged, counterDropped, delta:comparable ? last.value - first.value : null, missing:points.length - valid.length, dated:points.every(point => Number.isFinite(point.sortTime))};
  }
  function geometry(model, width = 960, left = 94, height = 332) {
    const right = width - 24, top = 24, bottom = height - 54;
    let min = Infinity, max = -Infinity;
    for (const point of model.valid) {min = Math.min(min, point.value); max = Math.max(max, point.value);}
    if (!model.valid.length) return {points:[], ticks:[], left, right, top, bottom, width};
    const spread = max - min, padding = Math.max(Number.isFinite(spread) ? spread * .12 : 0, Math.abs(max) * .000001, spread === 0 ? Math.max(1, Math.abs(max) * .04) : .000001);
    const low = min >= 0 ? Math.max(0, min - padding) : min - padding, high = max + padding;
    const rough = (high - low) / 4, magnitude = 10 ** Math.floor(Math.log10(rough));
    let step = [1, 2, 2.5, 5, 10].find(value => value >= rough / magnitude) * magnitude;
    if (model.metric.invertedAxis) step = Math.max(1, Math.ceil(step));
    let floor = Math.floor(low / step) * step, ceiling = Math.ceil(high / step) * step;
    if (model.metric.invertedAxis && min >= 1) floor = Math.max(1, floor);
    if (!Number.isFinite(floor) || !Number.isFinite(ceiling) || floor === ceiling) {floor = min; ceiling = max === min ? min + 1 : max;}
    const yFor = value => model.metric.invertedAxis ? top + (value - floor) / (ceiling - floor) * (bottom - top) : bottom - (value - floor) / (ceiling - floor) * (bottom - top);
    const start = model.dated ? model.points[0].sortTime : 0, end = model.dated ? model.points.at(-1).sortTime : model.points.length - 1;
    const points = model.points.map((point, index) => {
      const position = model.dated ? point.sortTime : index;
      return {...point, index, x:end === start ? (left + right) / 2 : left + (position - start) / (end - start) * (right - left), y:point.value === null ? null : yFor(point.value)};
    });
    const tickValues = model.metric.invertedAxis ? Array.from({length:Math.floor((ceiling - floor) / step) + 1}, (_, i) => floor + step * i) : Array.from({length:5}, (_, i) => floor + (ceiling - floor) * i / 4);
    const ticks = tickValues.map(value => ({value, y:yFor(value)}));
    return {points, ticks, left, right, top, bottom, width, floor, ceiling};
  }
  function tickLabel(value, unit, scale, spacing) {
    if (unit === "duration") return Math.abs(scale) >= 3600 ? `${s.number(value / 3600, 1)} h` : `${s.number(value / 60, 1)} min`;
    const magnitude = Math.abs(scale), divider = magnitude >= 1e9 ? 1e9 : magnitude >= 1e6 ? 1e6 : magnitude >= 1e3 ? 1e3 : 1;
    const digits = Math.min(12, Math.max(2, Math.ceil(-Math.log10(spacing / divider)) + 1));
    return `${s.number(value / divider, digits)}${divider === 1e9 ? " Md" : divider === 1e6 ? " M" : divider === 1e3 ? " k" : ""}${unit === "money" ? " $" : unit === "percent" ? " %" : ""}`;
  }
  function draw(model, width, {compact = false, formatValue, formatDelta, formatTick} = {}) {
    const root = node("div", `player-history-visual${compact ? " player-history-visual--compact" : ""}`), figure = node("figure", "player-history-figure");
    root.dataset.historyMetric = model.metric.key;
    if (!model.valid.length) {root.append(node("p", "player-note", "Cette statistique n’est renseignée dans aucun export."));return root;}
    const unit = model.metric.unit;
    const pointText = point => formatValue ? formatValue(point.value, unit) : formatPoint(point, model.metric);
    const changeText = (point, previous) => formatDelta ? formatDelta(point.delta, unit, point, previous) : deltaLabel(point.delta, unit, model.metric);
    const height = compact ? 232 : 332;
    let g = geometry(model, Math.max(280, width || 960), 94, height);
    const axisText = tick => (formatTick || tickLabel)(tick.value, unit, Math.max(Math.abs(g.floor), Math.abs(g.ceiling)), (g.ceiling - g.floor) / 4);
    const labelWidth = Math.max(...g.ticks.map(tick => axisText(tick).length)) * 7 + 18;
    if (labelWidth > g.left) g = geometry(model, g.width, Math.min(labelWidth, g.width * .48), height);
    const svg = svgNode("svg", {viewBox:`0 0 ${g.width} ${height}`, class:"player-history-line-chart", role:"group", "aria-label":`${model.metric.label} : ${model.valid.length} relevés, sur ${model.points.length} exports. Utilise les flèches pour parcourir les points.`});
    for (const tick of g.ticks) svg.append(svgNode("line", {x1:g.left, x2:g.right, y1:tick.y, y2:tick.y, class:"player-chart-guide"}), svgNode("text", {x:g.left - 12, y:tick.y + 4, "text-anchor":"end", class:"player-history-axis-label"}, axisText(tick)));
    svg.append(svgNode("line", {x1:g.left, x2:g.left, y1:g.top, y2:g.bottom, class:"player-chart-baseline"}), svgNode("line", {x1:g.left, x2:g.right, y1:g.bottom, y2:g.bottom, class:"player-chart-baseline"}));
    let path = "", penDown = false;
    for (const point of g.points) {
      if (point.value === null) {penDown = false;continue;}
      path += `${!penDown || point.breakBefore ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;penDown = true;
    }
    svg.append(svgNode("path", {d:path, class:"player-history-line", "aria-hidden":"true"}));
    const middle = g.points[Math.floor((g.points.length - 1) / 2)];
    const candidates = g.points.length === 1 ? [g.points[0]] : [g.points[0], ...(g.width >= 700 && middle.x - g.left > 140 && g.right - middle.x > 140 ? [middle] : []), g.points.at(-1)];
    for (const [i, point] of candidates.entries()) {
      const shortPeriod = model.dated && model.points.at(-1).sortTime - model.points[0].sortTime < 86400000;
      const date = point.exportedAt ? s.date(point.exportedAt).split(",")[shortPeriod ? 1 : 0]?.trim() : `Relevé ${point.index + 1}`;
      svg.append(svgNode("text", {x:point.x, y:g.bottom + 29, "text-anchor":candidates.length === 1 ? "middle" : i === 0 ? "start" : i === candidates.length - 1 ? "end" : "middle", class:"player-history-axis-label"}, model.dated ? date : `Relevé ${point.index + 1}`));
    }
    const cursor = svgNode("line", {x1:0, x2:0, y1:g.top, y2:g.bottom, class:"player-history-cursor", "aria-hidden":"true"});svg.append(cursor);
    const controls = node("div", "player-history-point-detail"), previous = node("button"), next = node("button"), detail = node("div", "player-history-point-copy"), date = node("strong", "player-history-point-date"), value = node("span", "player-history-point-value"), comparison = node("div", "player-history-point-comparison"), change = node("strong", "player-history-point-delta"), comparisonLabel = node("span", "player-history-point-comparison-label"), archive = node("small", "player-history-point-archive");
    previous.type = next.type = "button";previous.setAttribute("aria-label", "Export précédent");next.setAttribute("aria-label", "Export suivant");
    for (const [button, path] of [[previous, "M14 6l-6 6 6 6"], [next, "M10 6l6 6-6 6"]]) {
      const icon = svgNode("svg", {viewBox:"0 0 24 24", width:20, height:20, "aria-hidden":"true", focusable:"false"});
      icon.append(svgNode("path", {d:path, fill:"none", stroke:"currentColor", "stroke-width":2, "stroke-linecap":"round", "stroke-linejoin":"round"}));button.append(icon);
    }
    comparison.append(change, comparisonLabel);
    detail.setAttribute("role", "status");detail.setAttribute("aria-live", "polite");detail.setAttribute("aria-atomic", "true");detail.append(date, value, comparison, archive);controls.append(previous, detail, next);
    let selected = g.points.length - 1;
    const markers = new Map();
    function select(index, focus = false) {
      selected = Math.max(0, Math.min(g.points.length - 1, index));const point = g.points[selected];
      for (const [key, marker] of markers) {marker.setAttribute("data-selected", String(key === selected));marker.setAttribute("tabindex", key === selected ? "0" : "-1");}
      if (point.value === null && markers.size) markers.values().next().value.setAttribute("tabindex", "0");
      date.textContent = point.exportedAt ? s.date(point.exportedAt) : `Relevé ${selected + 1} · date non renseignée`;
      value.textContent = pointText(point);
      if (formatValue) value.title = formatPoint(point, model.metric);
      change.textContent = selected ? changeText(point, g.points[selected - 1]) : "";change.hidden = selected === 0;
      comparisonLabel.textContent = selected ? "Depuis l’export précédent" : "Premier relevé conservé";
      archive.textContent = point.archive || point.source;
      cursor.setAttribute("x1", point.x);cursor.setAttribute("x2", point.x);
      previous.disabled = selected === 0;next.disabled = selected === g.points.length - 1;
      if (focus) markers.get(selected)?.focus();
    }
    for (const point of g.points.filter(point => point.value !== null)) {
      const group = svgNode("g");group.append(svgNode("circle", {cx:point.x, cy:point.y, r:14, class:"player-history-point-hit", "aria-hidden":"true"}));
      const marker = svgNode("circle", {cx:point.x, cy:point.y, r:5, class:"player-history-point", role:"button", tabindex:"-1", "aria-label":`${point.exportedAt ? s.date(point.exportedAt) : `Relevé ${point.index + 1}`} : ${pointText(point)}`});
      marker.append(svgNode("title", {}, `${point.exportedAt ? s.date(point.exportedAt) : "Date non renseignée"} · ${pointText(point)}`));
      group.addEventListener("pointerenter", () => select(point.index));group.addEventListener("click", () => select(point.index));marker.addEventListener("focus", () => select(point.index));
      marker.addEventListener("keydown", event => {
        const available = [...markers.keys()], position = available.indexOf(point.index);
        const keys = {ArrowLeft:available[Math.max(0, position - 1)], ArrowRight:available[Math.min(available.length - 1, position + 1)], Home:available[0], End:available.at(-1)};
        if (event.key in keys) {event.preventDefault();select(keys[event.key], true);}
        else if (event.key === "Enter" || event.key === " ") {event.preventDefault();select(point.index);}
      });
      markers.set(point.index, marker);group.append(marker);svg.append(group);
    }
    previous.addEventListener("click", () => select(selected - 1));next.addEventListener("click", () => select(selected + 1));
    figure.append(svg);root.append(figure, controls);select(selected);return root;
  }
  window.StatGMHistoryChart = {project, catalog, jobMetrics, jobResources, sortJobMetrics, jobMetricKinds, overviewMetrics, categories, summarize, series, geometry, format, formatPoint, deltaLabel, draw};
})();

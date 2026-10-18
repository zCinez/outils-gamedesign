(() => {
  const labels = {
    animateur: "Animateur", builder: "Builder", dev: "Développeur", fermier: "Fermier",
    gamedesigner: "Game Designer", gerant: "Gérant", graphiste: "Graphiste", guide: "Guide",
    modo: "Modérateur", neodym: "Neodym", platine: "Platine", resp: "Responsable",
    rubis: "Rubis", saphir: "Saphir", supermodo: "Super Modérateur", sys: "Système",
    titane: "Titane", videaste: "Vidéaste"
  };
  const tiers = ["i", "ii", "iii", "iv", "v"];
  for (const [key, label] of [["cuivre", "Cuivre"], ["fer", "Fer"], ["or", "Or"], ["diamant", "Diamant"], ["emeraude", "Émeraude"]]) {
    for (const tier of tiers) labels[key + tier] = `${label} ${tier.toUpperCase()}`;
  }
  // Progression: https://wiki.neodium.fr/docs/rang/. Keep legacy export tiers.
  // Cuivre precedes Fer; boutique follows Neodym, as agreed for the global sort.
  const ordered = ["fermier"];
  for (const material of ["cuivre", "fer", "or", "diamant", "emeraude"]) {
    ordered.push(...tiers.map(tier => material + tier));
  }
  ordered.push("neodym", "platine", "titane", "saphir", "rubis");
  const positions = new Map(ordered.map((key, position) => [key, position]));
  const aliases = {
    developpeur: "dev", developer: "dev", developper: "dev", devteam: "dev",
    moderateur: "modo", moderator: "modo", supermoderateur: "supermodo", supermoderator: "supermodo",
    responsable: "resp", sysadmin: "sys", systeme: "sys", administrateursysteme: "sys",
    neodyme: "neodym", neodium: "neodym", gamedesign: "gamedesigner"
  };
  function clean(value) {
    return String(value || "").replace(/(?:§|&)(?:#[a-f0-9]{6}|[a-f0-9k-orx])/gi, "").replace(/<[^>]*>/g, "").trim();
  }
  function describe(value) {
    const text = clean(value);
    let key = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    key = key.replace(/^(?:grade|rank|group)(?=.)/, "");
    key = aliases[key] || key;
    const numbered = /^(cuivre|fer|or|diamant|emeraude)([1-5])$/.exec(key);
    if (numbered) key = numbered[1] + tiers[Number(numbered[2]) - 1];
    // Only known assets can become image URLs; imported text is never a path.
    if (Object.hasOwn(labels, key)) return { key, label: labels[key], src: `grades/${key}.png` };
    return { key: "", label: text || "Grade non renseigné", src: null };
  }
  function create(value, { unavailable = false } = {}) {
    const grade = describe(value);
    const badge = document.createElement("span");
    badge.className = "statgm-player-grade";
    badge.title = grade.label;
    if (grade.src) {
      const image = document.createElement("img");
      image.src = grade.src;
      image.alt = `Grade : ${grade.label}`;
      image.decoding = "async";
      image.addEventListener("error", () => {
        badge.classList.add("statgm-player-grade--text");
        badge.textContent = grade.label;
      }, { once: true });
      badge.append(image);
    } else {
      badge.classList.add("statgm-player-grade--text");
      badge.textContent = value === undefined ? unavailable ? "Grade indisponible" : "Chargement du grade…" : grade.label;
    }
    return badge;
  }
  function sortKey(value) {
    const grade = describe(value);
    const position = positions.get(grade.key);
    // Staff stay after player ranks in either direction, then unknown/missing grades.
    const group = position !== undefined ? 0 : grade.key ? 1 : clean(value) ? 2 : 3;
    return { group, position, label: grade.label };
  }
  globalThis.StatGMGrades = { describe, create, sortKey };
})();

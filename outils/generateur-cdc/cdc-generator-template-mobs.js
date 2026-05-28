function genererTemplateMobs() {
  const mobNom = valeur("mobNom");
  const mobType = valeur("mobType");
  const mobZone = valeur("mobZone");
  const mobPv = valeur("mobPv");
  const mobAttaque = valeur("mobAttaque");
  const mobVitesse = valeur("mobVitesse");
  const mobCooldown = valeur("mobCooldown");
  const mobComportementType = valeur("mobComportementType");
  const mobSpawns = recupererMobSpawns();
  const mobDrops = recupererMobDrops();
  const mobXpGagne = valeur("mobXpGagne");
  const mobNiveauRequis = valeur("mobNiveauRequis");

  const spawnsText = mobSpawns.length === 0
    ? "Aucun"
    : renderNamedEntriesText(
        mobSpawns,
        (spawn, index) => `Spawn ${index + 1} :
- Coordonnées : ${spawn.coordonnees || "Aucune"}
- Intervalle : ${spawn.intervalle || "Aucun"}
- Nombre max : ${spawn.nombreMax || "Aucun"}`,
        "Aucun"
      );

  const dropsText = mobDrops.length === 0
    ? "Aucun"
    : renderNamedEntriesText(
        mobDrops,
        (drop, index) => `Drop ${index + 1} :
- Item : ${drop.item || "Aucun"}
- Quantité : ${drop.quantite || "Aucune"}
- Taux : ${drop.taux || "Aucun"}`,
        "Aucun"
      );

  return `1. Informations générales

Nom du mob : ${mobNom}
Type : ${mobType}
Zone : ${mobZone}

2. Stats

- PV : ${mobPv}
- Attaque : ${mobAttaque}
- Vitesse : ${mobVitesse}
- Cooldown : ${mobCooldown}

3. Comportement

- Type : ${mobComportementType}

4. Spawn

${spawnsText}

5. Drops

${dropsText}

6. XP

- XP gagné : ${mobXpGagne}
- Niveau requis : ${mobNiveauRequis}`;
}

function genererPreviewMobsHtml() {
  const mobNom = valeur("mobNom");
  const mobType = valeur("mobType");
  const mobZone = valeur("mobZone");
  const mobPv = valeur("mobPv");
  const mobAttaque = valeur("mobAttaque");
  const mobVitesse = valeur("mobVitesse");
  const mobCooldown = valeur("mobCooldown");
  const mobComportementType = valeur("mobComportementType");
  const mobSpawns = recupererMobSpawns();
  const mobDrops = recupererMobDrops();
  const mobXpGagne = valeur("mobXpGagne");
  const mobNiveauRequis = valeur("mobNiveauRequis");

  const spawnsHtml = mobSpawns.length === 0
    ? "Aucun"
    : renderNamedEntriesHtml(
        mobSpawns,
        (spawn, index) => `<br><strong>Spawn ${index + 1} :</strong><br>
    - Coordonnées : ${escapeHtml(spawn.coordonnees || "Aucune")}<br>
    - Intervalle : ${escapeHtml(spawn.intervalle || "Aucun")}<br>
    - Nombre max : ${escapeHtml(spawn.nombreMax || "Aucun")}<br>`,
        "Aucun"
      );

  const dropsHtml = mobDrops.length === 0
    ? "Aucun"
    : renderNamedEntriesHtml(
        mobDrops,
        (drop, index) => `<br><strong>Drop ${index + 1} :</strong><br>
    - Item : ${escapeHtml(drop.item || "Aucun")}<br>
    - Quantité : ${escapeHtml(drop.quantite || "Aucune")}<br>
    - Taux : ${escapeHtml(drop.taux || "Aucun")}<br>`,
        "Aucun"
      );

  return `
    <div><strong>1. Informations générales</strong></div><br>
    <div><strong>Nom du mob :</strong> ${escapeHtml(mobNom)}</div><br>
    <div><strong>Type :</strong> ${escapeHtml(mobType)}</div><br>
    <div><strong>Zone :</strong> ${escapeHtml(mobZone)}</div><br>

    <div><strong>2. Stats</strong></div><br>
    <div>- <strong>PV :</strong> ${escapeHtml(mobPv)}</div>
    <div>- <strong>Attaque :</strong> ${escapeHtml(mobAttaque)}</div>
    <div>- <strong>Vitesse :</strong> ${escapeHtml(mobVitesse)}</div>
    <div>- <strong>Cooldown :</strong> ${escapeHtml(mobCooldown)}</div><br>

    <div><strong>3. Comportement</strong></div><br>
    <div>- <strong>Type :</strong> ${escapeHtml(mobComportementType)}</div><br>

    <div><strong>4. Spawn</strong></div><br>
    <div>${spawnsHtml}</div><br>

    <div><strong>5. Drops</strong></div><br>
    <div>${dropsHtml}</div><br>

    <div><strong>6. XP</strong></div><br>
    <div>- <strong>XP gagné :</strong> ${escapeHtml(mobXpGagne)}</div>
    <div>- <strong>Niveau requis :</strong> ${escapeHtml(mobNiveauRequis)}</div>`;
}

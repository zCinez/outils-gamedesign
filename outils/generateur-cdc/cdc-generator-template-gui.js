function genererTemplateGUI() {
  const guiNom = valeur("guiNom");
  const guiNomAffiche = valeur("guiNomAffiche");
  const guiCommande = valeur("guiCommande");
  const guiNPCNom = valeur("guiNPCNom");
  const guiNPCCoordonnee = valeur("guiNPCCoordonnee");
  const guiItemOuverture = valeur("guiItemOuverture");
  const guiOuvertureAutre = valeur("guiOuvertureAutre");
  const guiObjectif = valeur("guiObjectif");
  const guiTailleSelect = valeur("guiTaille");
  const guiTailleAutre = valeur("guiTailleAutre", "");

  const ouvertureCommande = document.getElementById("ouvertureCommande").checked;
  const ouvertureNPC = document.getElementById("ouvertureNPC").checked;
  const ouvertureItem = document.getElementById("ouvertureItem").checked;
  const ouvertureAutreCheck = document.getElementById("ouvertureAutreCheck").checked;

  const tailleFinale = guiTailleSelect === "Autre" ? (guiTailleAutre || "Autre") : guiTailleSelect;
  const items = recupererItemsGUITemplate();
  const imageFile = document.getElementById("guiImage").files[0];
  const imageGUI = imageFile ? imageFile.name : "Aucune image";

  const ouvertureTexte = renderCheckedListText([
    ouvertureCommande ? "☑ Commande" : "",
    ouvertureNPC ? "☑ NPC" : "",
    ouvertureItem ? "☑ Item" : "",
    ouvertureAutreCheck ? "☑ Autre" : ""
  ]);

  const detailsOuverture = [
    ouvertureCommande ? `Commande : ${guiCommande}` : "",
    ouvertureNPC ? `NPC :\n- Nom : ${guiNPCNom}\n- Coordonnée : ${guiNPCCoordonnee}` : "",
    ouvertureItem ? `Item : ${guiItemOuverture}` : "",
    ouvertureAutreCheck ? `Autre : ${guiOuvertureAutre}` : ""
  ].filter(Boolean).join("\n");

  const contenuTexte = renderNamedEntriesText(
    items,
    (it, index) => `Item ${index + 1} :
- Slot : ${it.slot || "Aucun"}
- Item : ${it.item || "Aucun"}
- Nom : ${it.nom || "Aucun"}
- Lore : ${it.lore || "Aucun"}
- Fonction : ${it.fonction || "Aucune"}
- Action au clic : ${it.action || "Aucune"}`,
    "Aucun item"
  );

  return `1. Informations générales

Nom du GUI : ${guiNom}
Nom affiché : ${guiNomAffiche}
Taille : ${tailleFinale}
Objectif :
${guiObjectif}

2. Ouverture

Méthodes d'ouverture :
${ouvertureTexte}
${detailsOuverture ? `\n${detailsOuverture}` : ""}

3. Visuel

Image du GUI : ${imageGUI}

4. Contenu du GUI

${contenuTexte}`;
}

function genererPreviewGUIHtml() {
  const guiNom = valeur("guiNom");
  const guiNomAffiche = valeur("guiNomAffiche");
  const guiCommande = valeur("guiCommande");
  const guiNPCNom = valeur("guiNPCNom");
  const guiNPCCoordonnee = valeur("guiNPCCoordonnee");
  const guiItemOuverture = valeur("guiItemOuverture");
  const guiOuvertureAutre = valeur("guiOuvertureAutre");
  const guiObjectif = valeur("guiObjectif");
  const guiTailleSelect = valeur("guiTaille");
  const guiTailleAutre = valeur("guiTailleAutre", "");
  const lientextureGUI = valeur("lienTextureGUI", "");

  const ouvertureCommande = document.getElementById("ouvertureCommande").checked;
  const ouvertureNPC = document.getElementById("ouvertureNPC").checked;
  const ouvertureItem = document.getElementById("ouvertureItem").checked;
  const ouvertureAutreCheck = document.getElementById("ouvertureAutreCheck").checked;

  const tailleFinale = guiTailleSelect === "Autre" ? (guiTailleAutre || "Autre") : guiTailleSelect;
  const items = recupererItemsGUITemplate();

  let html = `
<div><strong>1. Informations générales</strong></div><br>
<div><strong>Nom du GUI :</strong> ${escapeHtml(guiNom)}</div><br>
<div><strong>Nom affiché :</strong> ${escapeHtml(guiNomAffiche)}</div><br>
<div><strong>Taille :</strong> ${escapeHtml(tailleFinale)}</div><br>
<div><strong>Objectif :</strong><br>${nl2brSafe(guiObjectif)}</div><br>

<div><strong>2. Ouverture</strong></div><br>
<div><strong>Méthodes d'ouverture :</strong><br>${renderCheckedListHtml([
  ouvertureCommande ? "☑ Commande" : "",
  ouvertureNPC ? "☑ NPC" : "",
  ouvertureItem ? "☑ Item" : "",
  ouvertureAutreCheck ? "☑ Autre" : ""
], "Aucune")}</div>`;

  if (ouvertureCommande) html += `<br><div><strong>Commande :</strong> ${escapeHtml(guiCommande)}</div>`;
  if (ouvertureNPC) {
    html += `<br><div><strong>NPC :</strong><br>
    - Nom : ${escapeHtml(guiNPCNom)}<br>
    - Coordonnée : ${escapeHtml(guiNPCCoordonnee)}
    </div>`;
  }
  if (ouvertureItem) html += `<br><div><strong>Item :</strong> ${escapeHtml(guiItemOuverture)}</div>`;
  if (ouvertureAutreCheck) html += `<br><div><strong>Autre :</strong> ${escapeHtml(guiOuvertureAutre)}</div>`;

  html += `
<br><br><div><strong>3. Visuel</strong></div>
${getTemplateGuiImageHtml()}
<div><strong>Lien de la texture :</strong> ${escapeHtml(lientextureGUI)}</div><br>
<div><strong>4. Contenu du GUI</strong><br>${
    renderNamedEntriesHtml(
      items,
      (it, index) => `
<br><strong>Item ${index + 1} :</strong><br>
- Slot : ${escapeHtml(it.slot || "Aucun")}<br>
- Item : ${escapeHtml(it.item || "Aucun")}<br>
- Nom : ${escapeHtml(it.nom || "Aucun")}<br>
- Lore : ${nl2brSafe(it.lore || "Aucun")}<br>
- Fonction : ${escapeHtml(it.fonction || "Aucune")}<br>
- Action au clic : ${escapeHtml(it.action || "Aucune")}<br>`,
      "Aucun item"
    )
  }</div>`;

  return html;
}

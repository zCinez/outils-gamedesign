function genererTemplateCommande() {
  const nomCommande = valeur("nomCommande");
  const commandePrincipale = valeur("commandePrincipale");
  const alias = valeur("alias");
  const description = valeur("description");
  const permission = valeur("permission");
  const argumentsTexte = valeur("arguments");

  const mondeAutorise = valeur("mondeAutorise");
  const niveauRequis = valeur("niveauRequis");
  const argentRequis = valeur("argentRequis");
  const cooldown = valeur("cooldown");
  const fonctionnement = valeur("fonctionnement");

  const typeTexte = renderCheckedListText([
    document.getElementById("typeJoueur").checked ? "☑ Joueur" : "",
    document.getElementById("typeStaff").checked ? "☑ Staff" : "",
    document.getElementById("typeAdmin").checked ? "☑ Admin" : ""
  ]);

  const interfaceChat = document.getElementById("interfaceChat").checked;
  const interfaceGUI = document.getElementById("interfaceGUI").checked;
  const interfaceScoreboard = document.getElementById("interfaceScoreboard").checked;
  const interfaceActionBar = document.getElementById("interfaceActionBar").checked;
  const interfaceSoundDesign = document.getElementById("interfaceSoundDesign").checked;
  const interfaceActionJoueur = document.getElementById("interfaceActionJoueur").checked;

  const interfaceTexte = renderCheckedListText([
    interfaceChat ? "☑ Chat" : "",
    interfaceGUI ? "☑ GUI" : "",
    interfaceScoreboard ? "☑ Scoreboard" : "",
    interfaceActionBar ? "☑ ActionBar" : "",
    interfaceSoundDesign ? "☑ SoundDesign" : "",
    interfaceActionJoueur ? "☑ Action joueur" : ""
  ]);

  const textureGUI = valeur("textureGUICommande", "");
  const contenuScoreboard = valeur("contenuScoreboard", "");
  const actionBarQui = valeur("actionBarQui", "");
  const actionBarMessage = valeur("actionBarMessage", "");
  const soundDesignQuandCommande = valeur("soundDesignQuandCommande", "");
  const soundDesignSonCommande = valeur("soundDesignSonCommande", "");
  const contenuActionJoueur = valeur("contenuActionJoueur", "");

  let blocInterface = "";

  if (interfaceChat) {
    const messages = recupererMessages();
    blocInterface += `4.1 Chat\n${
      renderNamedEntriesText(
        messages,
        (msg) => `${msg.titre} :\n${cleanQuotedText(msg.contenu)}`,
        "Aucun"
      )
    }`;
  }

  if (interfaceGUI) {
    const nomGUICommande = valeur("nomGUICommande", "");
    const imageGUI = getSelectedFileName("imageGUICommande");
    const tailleGUI = valeur("tailleGUICommande", "3 lignes");
    const items = recupererItemsGUICommande();
    const itemsText = renderNamedEntriesText(
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

    blocInterface += `${blocInterface ? "\n\n" : ""}4.2 GUI
Nom du GUI : ${nomGUICommande || "Aucun"}
Taille : ${tailleGUI}
Image du GUI : ${imageGUI}
Texture du GUI : ${textureGUI}

Contenu du GUI :
${itemsText}`;
  }

  if (interfaceScoreboard) {
    blocInterface += `${blocInterface ? "\n\n" : ""}4.3 Scoreboard
${contenuScoreboard}`;
  }

  if (interfaceActionBar) {
    blocInterface += `${blocInterface ? "\n\n" : ""}4.4 ActionBar
QUI : ${actionBarQui || "Aucun"}
Message : ${actionBarMessage || "Aucun"}`;
  }

  if (interfaceSoundDesign) {
    blocInterface += `${blocInterface ? "\n\n" : ""}4.5 SoundDesign
Quand : ${soundDesignQuandCommande || "Aucun"}
Son : ${soundDesignSonCommande || "Aucun"}`;
  }

  if (interfaceActionJoueur) {
    blocInterface += `${blocInterface ? "\n\n" : ""}4.6 Action joueur
${contenuActionJoueur}`;
  }

  return `1. Informations générales

Nom de la commande : ${nomCommande}
Commande principale : ${commandePrincipale}
Alias : ${alias}
Description :
${description}

2. Accès

Type :
${typeTexte}
Permission : ${permission}
Arguments :
${argumentsTexte}

3. Conditions et fonctionnement

Monde autorisé : ${mondeAutorise}
Niveau requis : ${niveauRequis}
Argent requis : ${argentRequis}
Cooldown : ${cooldown}
Fonctionnement :
${fonctionnement}

4. Interface

Interfaces actives :
${interfaceTexte}
${blocInterface ? `\n\n${blocInterface}` : ""}`;
}

function genererPreviewCommandeHtml() {
  const nomCommande = valeur("nomCommande");
  const commandePrincipale = valeur("commandePrincipale");
  const alias = valeur("alias");
  const description = valeur("description");
  const permission = valeur("permission");
  const argumentsTexte = valeur("arguments");

  const mondeAutorise = valeur("mondeAutorise");
  const niveauRequis = valeur("niveauRequis");
  const argentRequis = valeur("argentRequis");
  const cooldown = valeur("cooldown");
  const fonctionnement = valeur("fonctionnement");

  const interfaceChat = document.getElementById("interfaceChat").checked;
  const interfaceGUI = document.getElementById("interfaceGUI").checked;
  const interfaceScoreboard = document.getElementById("interfaceScoreboard").checked;
  const interfaceActionBar = document.getElementById("interfaceActionBar").checked;
  const interfaceSoundDesign = document.getElementById("interfaceSoundDesign").checked;
  const interfaceActionJoueur = document.getElementById("interfaceActionJoueur").checked;

  let html = `
<div><strong>1. Informations générales</strong></div><br>
<div><strong>Nom de la commande :</strong> ${escapeHtml(nomCommande)}</div><br>
<div><strong>Commande principale :</strong> ${escapeHtml(commandePrincipale)}</div><br>
<div><strong>Alias :</strong> ${escapeHtml(alias)}</div><br>
<div><strong>Description :</strong><br>${nl2brSafe(description)}</div><br>

<div><strong>2. Accès</strong></div><br>
<div><strong>Type :</strong><br>${renderCheckedListHtml([
  document.getElementById("typeJoueur").checked ? "☑ Joueur" : "",
  document.getElementById("typeStaff").checked ? "☑ Staff" : "",
  document.getElementById("typeAdmin").checked ? "☑ Admin" : ""
], "Aucune")}</div><br>

<div><strong>Permission :</strong> ${escapeHtml(permission)}</div><br>
<div><strong>Arguments :</strong><br>${nl2brSafe(argumentsTexte)}</div><br>

<div><strong>3. Conditions et fonctionnement</strong></div><br>
<div><strong>Monde autorisé :</strong> ${escapeHtml(mondeAutorise)}</div>
<div><strong>Niveau requis :</strong> ${escapeHtml(niveauRequis)}</div>
<div><strong>Argent requis :</strong> ${escapeHtml(argentRequis)}</div>
<div><strong>Cooldown :</strong> ${escapeHtml(cooldown)}</div><br>
<div><strong>Fonctionnement :</strong><br>${nl2brSafe(fonctionnement)}</div><br>

<div><strong>4. Interface</strong></div><br>
<div><strong>Interfaces actives :</strong><br>${renderCheckedListHtml([
  interfaceChat ? "☑ Chat" : "",
  interfaceGUI ? "☑ GUI" : "",
  interfaceScoreboard ? "☑ Scoreboard" : "",
  interfaceActionBar ? "☑ ActionBar" : "",
  interfaceSoundDesign ? "☑ SoundDesign" : "",
  interfaceActionJoueur ? "☑ Action joueur" : ""
], "Aucune")}</div>`;

  if (interfaceChat) {
    const messages = recupererMessages();
    html += `<br><div><strong>4.1 Chat</strong><br>${
      renderNamedEntriesHtml(
        messages,
        (msg) => `<br><strong>${escapeHtml(msg.titre)} :</strong><br>${nl2brSafe(cleanQuotedText(msg.contenu))}<br>`,
        "Aucun"
      )
    }</div>`;
  }

  if (interfaceGUI) {
    const nomGUICommande = valeur("nomGUICommande", "");
    const tailleGUI = valeur("tailleGUICommande", "3 lignes");
    const textureGUI = valeur("textureGUICommande", "");
    const items = recupererItemsGUICommande();
    html += `<br><div><strong>4.2 GUI</strong></div>`;
    html += `<div><strong>Nom du GUI :</strong> ${escapeHtml(nomGUICommande || "Aucun")}</div>`;
    html += `<div><strong>Taille :</strong> ${escapeHtml(tailleGUI)}</div>`;
    html += getCommandeGuiImageHtml();
    html += `<div><strong>Lien de la texture :</strong> ${escapeHtml(textureGUI)}</div><br>`;
    html += `<div><strong>Contenu du GUI :</strong><br>${
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
  }

  if (interfaceScoreboard) {
    html += `<br><div><strong>4.3 Scoreboard</strong><br>${nl2brSafe(valeur("contenuScoreboard", ""))}</div>`;
  }

  if (interfaceActionBar) {
    html += `<br><div><strong>4.4 ActionBar</strong><br>
    <strong>QUI :</strong> ${escapeHtml(valeur("actionBarQui", "" ) || "Aucun")}<br>
    <strong>Message :</strong> ${escapeHtml(valeur("actionBarMessage", "" ) || "Aucun")}
    </div>`;
  }

  if (interfaceSoundDesign) {
    html += `<br><div><strong>4.5 SoundDesign</strong><br>
    <strong>Quand :</strong> ${escapeHtml(valeur("soundDesignQuandCommande", "" ) || "Aucun")}<br>
    <strong>Son :</strong> ${escapeHtml(valeur("soundDesignSonCommande", "" ) || "Aucun")}
    </div>`;
  }

  if (interfaceActionJoueur) {
    html += `<br><div><strong>4.6 Action joueur</strong><br>${nl2brSafe(valeur("contenuActionJoueur", ""))}</div>`;
  }

  return html;
}

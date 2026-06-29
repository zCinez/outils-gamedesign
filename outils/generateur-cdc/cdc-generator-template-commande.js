function renderGuiCommandeItemText(item, index) {
  const loreVariantesText = renderGuiSharedLoreVariantesText(getGuiSharedLoreVariantesFromItem(item));

  let text = `Item ${index + 1} :
- Slot : ${item.slot || "Aucun"}
- Item : ${item.item || "Aucun"}
- Nom : ${item.nom || "Aucun"}
- Lore : ${item.lore || "Aucun"}`;

  if (loreVariantesText) {
    text += `\n${loreVariantesText}`;
  }

  text += `
- Fonction : ${item.fonction || "Aucune"}
- Action au clic : ${item.action || "Aucune"}`;

  return text;
}

function renderGuiCommandeGroupedItemText(group) {
  const sharedFunction = getGuiSharedValue(group.entries, "fonction", "Aucune");
  const sharedAction = getGuiSharedValue(group.entries, "action", "Aucune");
  const slots = formatGuiSharedSlots(group.entries);
  const itemSummary = getGuiSharedItemSummary(group.entries);
  const loreVariantesText = renderGuiSharedLoreVariantesText(group.loreVariantes);

  let text = `${formatGuiSharedItemRefs(group.entries)} :
- Slots : ${slots}
- ${itemSummary.label} : ${itemSummary.value}
- Nom : ${group.nom || "Aucun"}
- Lore : ${group.lore || "Aucun"}`;

  if (loreVariantesText) {
    text += `\n${loreVariantesText}`;
  }

  if (sharedFunction) {
    text += `\n- Fonction : ${sharedFunction}`;
  } else {
    text += `\n- Fonctions par item :\n${group.entries
      .map(({ item, index }) => `  - Item ${index + 1} : ${item.fonction || "Aucune"}`)
      .join("\n")}`;
  }

  if (sharedAction) {
    text += `\n- Action au clic : ${sharedAction}`;
  } else {
    text += `\n- Actions au clic par item :\n${group.entries
      .map(({ item, index }) => `  - Item ${index + 1} : ${item.action || "Aucune"}`)
      .join("\n")}`;
  }

  return text;
}

function renderGuiCommandeItemHtml(item, index) {
  const loreVariantesHtml = renderGuiSharedLoreVariantesHtml(getGuiSharedLoreVariantesFromItem(item));

  let html = `
<br><strong>Item ${index + 1} :</strong><br>
- Slot : ${escapeHtml(item.slot || "Aucun")}<br>
- Item : ${escapeHtml(item.item || "Aucun")}<br>
- Nom : ${escapeHtml(item.nom || "Aucun")}<br>
- Lore : ${nl2brSafe(item.lore || "Aucun")}<br>`;

  if (loreVariantesHtml) {
    html += loreVariantesHtml;
  }

  html += `- Fonction : ${escapeHtml(item.fonction || "Aucune")}<br>
- Action au clic : ${escapeHtml(item.action || "Aucune")}<br>`;

  return html;
}

function renderGuiCommandeGroupedItemHtml(group) {
  const sharedFunction = getGuiSharedValue(group.entries, "fonction", "Aucune");
  const sharedAction = getGuiSharedValue(group.entries, "action", "Aucune");
  const slots = formatGuiSharedSlots(group.entries);
  const itemSummary = getGuiSharedItemSummary(group.entries);
  const loreVariantesHtml = renderGuiSharedLoreVariantesHtml(group.loreVariantes);

  let html = `
<br><strong>${escapeHtml(formatGuiSharedItemRefs(group.entries))} :</strong><br>
- Slots : ${escapeHtml(slots)}<br>
- ${escapeHtml(itemSummary.label)} : ${escapeHtml(itemSummary.value)}<br>
- Nom : ${escapeHtml(group.nom || "Aucun")}<br>
- Lore : ${nl2brSafe(group.lore || "Aucun")}<br>`;

  if (loreVariantesHtml) {
    html += loreVariantesHtml;
  }

  if (sharedFunction) {
    html += `- Fonction : ${escapeHtml(sharedFunction)}<br>`;
  } else {
    html += `- Fonctions par item :<br>${group.entries
      .map(({ item, index }) => `&nbsp;&nbsp;- Item ${index + 1} : ${escapeHtml(item.fonction || "Aucune")}<br>`)
      .join("")}`;
  }

  if (sharedAction) {
    html += `- Action au clic : ${escapeHtml(sharedAction)}<br>`;
  } else {
    html += `- Actions au clic par item :<br>${group.entries
      .map(({ item, index }) => `&nbsp;&nbsp;- Item ${index + 1} : ${escapeHtml(item.action || "Aucune")}<br>`)
      .join("")}`;
  }

  return html;
}

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
    const groupedItems = buildGuiSharedGroupedEntries(items);
    const itemsText = renderNamedEntriesText(
      groupedItems,
      (entry) => entry.type === "group"
        ? renderGuiCommandeGroupedItemText(entry)
        : renderGuiCommandeItemText(entry.item, entry.index),
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
    const groupedItems = buildGuiSharedGroupedEntries(items);
    html += `<br><div><strong>4.2 GUI</strong></div>`;
    html += `<div><strong>Nom du GUI :</strong> ${escapeHtml(nomGUICommande || "Aucun")}</div>`;
    html += `<div><strong>Taille :</strong> ${escapeHtml(tailleGUI)}</div>`;
    html += getCommandeGuiImageHtml();
    html += `<div><strong>Lien de la texture :</strong> ${escapeHtml(textureGUI)}</div><br>`;
    html += `<div><strong>Contenu du GUI :</strong><br>${
      renderNamedEntriesHtml(
        groupedItems,
        (entry) => entry.type === "group"
          ? renderGuiCommandeGroupedItemHtml(entry)
          : renderGuiCommandeItemHtml(entry.item, entry.index),
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

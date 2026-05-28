function getMetierSelectedTypes() {
  return [
    document.getElementById("metierTypeFermier")?.checked ? "- Fermier" : "",
    document.getElementById("metierTypeChasseur")?.checked ? "- Chasseur" : "",
    document.getElementById("metierTypeMineur")?.checked ? "- Mineur" : "",
    document.getElementById("metierTypeBucheron")?.checked ? "- Bûcheron" : ""
  ].filter(Boolean);
}

function getMetierGuiImageHtml() {
  const input = document.getElementById("metierGuiXpImage");
  const preview = document.getElementById("previewMetierGuiXpImage");

  if (input && input.files && input.files[0] && preview && preview.src) {
    return `
      <div class="preview-image-block">
        <div><strong>Image du GUI XP par item :</strong></div>
        <img src="${preview.src}" alt="Image du GUI XP par item">
      </div>`;
  }

  return `<div><strong>Image du GUI XP par item :</strong> Aucune image</div>`;
}

function genererTemplateMetier() {
  const types = getMetierSelectedTypes();
  const presentation = valeur("metierPresentation");
  const metierItems = recupererMetierItems();
  const metierLevelRewards = recupererMetierLevelRewards();
  const xpMessageChatEnabled = document.getElementById("metierXpMessageChat")?.checked;
  const xpMessageActionBarEnabled = document.getElementById("metierXpMessageActionBar")?.checked;
  const xpMessageBossBarEnabled = document.getElementById("metierXpMessageBossBar")?.checked;
  const xpMessageAutreEnabled = document.getElementById("metierXpMessageAutre")?.checked;
  const xpMessageChatContent = valeur("metierXpMessageChatContent", "");
  const xpMessageActionBarContent = valeur("metierXpMessageActionBarContent", "");
  const xpMessageBossBarContent = valeur("metierXpMessageBossBarContent", "");
  const xpMessageAutreContent = valeur("metierXpMessageAutreContent", "");
  const levelMessageChatContent = valeur("metierLevelMessageChatContent", "");
  const guiItems = recupererMetierGuiItems();
  const guiTexture = valeur("metierGuiTexture");
  const specificite = valeur("metierSpecificite");

  const metierItemsText = metierItems.length === 0
    ? "Aucune ligne"
    : buildTextTable(
        ["Item", "Niveau de déblocage", "XP"],
        metierItems.map(item => [item.item, item.niveau, item.xp])
      );

  const metierLevelRewardsText = metierLevelRewards.length === 0
    ? "Aucune ligne"
    : buildTextTable(
        ["Niveau", "XP", "Récompense"],
        metierLevelRewards.map(entry => [entry.niveau, entry.xp, entry.recompense])
      );

  const guiItemsText = guiItems.length === 0
    ? "Aucun item"
    : renderNamedEntriesText(
        guiItems,
        (item, index) => `Item ${index + 1} :
- Item : ${item.item || "Aucun"}
- Nom : ${item.nom || "Aucun"}
- Lore : ${item.lore || "Aucun"}`,
        "Aucun item"
      );

  const xpMessageText = !xpMessageChatEnabled && !xpMessageActionBarEnabled && !xpMessageBossBarEnabled && !xpMessageAutreEnabled
    ? "Aucun"
    : `${xpMessageChatEnabled ? `4.1 Chat\n${xpMessageChatContent || "Aucun"}\n\n` : ""}${xpMessageActionBarEnabled ? `4.2 ActionBar\n${xpMessageActionBarContent || "Aucun"}\n\n` : ""}${xpMessageBossBarEnabled ? `4.3 BossBar\n${xpMessageBossBarContent || "Aucun"}\n\n` : ""}${xpMessageAutreEnabled ? `4.4 Autre\n${xpMessageAutreContent || "Aucun"}` : ""}`.trimEnd();

  const levelMessageText = `5.1 Chat\n${levelMessageChatContent || "Aucun"}`.trimEnd();

  return `1. Informations générales

Type de métier :
${renderCheckedListText(types)}

Présentation du métier :
${presentation}

2. Progression par item

${metierItemsText}

3. XP + récompenses par niveaux

${metierLevelRewardsText}

4. Message d'évolution d'XP

${xpMessageText}

5. Message gain de niveau

${levelMessageText}

6. Interface joueur

GUI XP par item : ${getSelectedFileName("metierGuiXpImage")}
Texture du GUI : ${guiTexture}

Items du GUI :
${guiItemsText}

7. Spécificité métier

${specificite}`;
}

function genererPreviewMetierHtml() {
  const types = getMetierSelectedTypes();
  const presentation = valeur("metierPresentation");
  const metierItems = recupererMetierItems();
  const metierLevelRewards = recupererMetierLevelRewards();
  const xpMessageChatEnabled = document.getElementById("metierXpMessageChat")?.checked;
  const xpMessageActionBarEnabled = document.getElementById("metierXpMessageActionBar")?.checked;
  const xpMessageBossBarEnabled = document.getElementById("metierXpMessageBossBar")?.checked;
  const xpMessageAutreEnabled = document.getElementById("metierXpMessageAutre")?.checked;
  const xpMessageChatContent = valeur("metierXpMessageChatContent", "");
  const xpMessageActionBarContent = valeur("metierXpMessageActionBarContent", "");
  const xpMessageBossBarContent = valeur("metierXpMessageBossBarContent", "");
  const xpMessageAutreContent = valeur("metierXpMessageAutreContent", "");
  const levelMessageChatContent = valeur("metierLevelMessageChatContent", "");
  const guiItems = recupererMetierGuiItems();
  const guiTexture = valeur("metierGuiTexture");
  const specificite = valeur("metierSpecificite");

  let html = `
    <div><strong>1. Informations générales</strong></div><br>
    <div><strong>Type de métier :</strong><br>${renderCheckedListHtml(types)}</div><br>
    <div><strong>Présentation du métier :</strong><br>${nl2brSafe(presentation)}</div><br>
    <div><strong>2. Progression par item</strong></div><br>`;

  if (metierItems.length === 0) {
    html += `<div>Aucune ligne</div><br>`;
  } else {
    html += `<div class="preview-table-wrapper"><table class="preview-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Niveau de déblocage</th>
          <th>XP</th>
        </tr>
      </thead>
      <tbody>`;

    metierItems.forEach(item => {
      html += `<tr>
        <td>${escapeHtml(item.item)}</td>
        <td>${escapeHtml(item.niveau)}</td>
        <td>${escapeHtml(item.xp)}</td>
      </tr>`;
    });

    html += `</tbody></table></div><br>`;
  }

  html += `<div><strong>3. XP + récompenses par niveaux</strong></div><br>`;

  if (metierLevelRewards.length === 0) {
    html += `<div>Aucune ligne</div><br>`;
  } else {
    html += `<div class="preview-table-wrapper"><table class="preview-table">
      <thead>
        <tr>
          <th>Niveau</th>
          <th>XP</th>
          <th>Récompense</th>
        </tr>
      </thead>
      <tbody>`;

    metierLevelRewards.forEach(entry => {
      html += `<tr>
        <td>${escapeHtml(entry.niveau)}</td>
        <td>${escapeHtml(entry.xp)}</td>
        <td>${escapeHtml(entry.recompense)}</td>
      </tr>`;
    });

    html += `</tbody></table></div><br>`;
  }

  html += `<div><strong>4. Message d'évolution d'XP</strong><br>`;
  if (xpMessageChatEnabled || xpMessageActionBarEnabled || xpMessageBossBarEnabled || xpMessageAutreEnabled) {
    if (xpMessageChatEnabled) {
      html += `<br><strong>4.1 Chat</strong><br>${nl2brSafe(xpMessageChatContent || "Aucun")}`;
    }
    if (xpMessageActionBarEnabled) {
      html += `${xpMessageChatEnabled ? "<br><br>" : "<br>"}<strong>4.2 ActionBar</strong><br>${nl2brSafe(xpMessageActionBarContent || "Aucun")}`;
    }
    if (xpMessageBossBarEnabled) {
      html += `${xpMessageChatEnabled || xpMessageActionBarEnabled ? "<br><br>" : "<br>"}<strong>4.3 BossBar</strong><br>${nl2brSafe(xpMessageBossBarContent || "Aucun")}`;
    }
    if (xpMessageAutreEnabled) {
      html += `${xpMessageChatEnabled || xpMessageActionBarEnabled || xpMessageBossBarEnabled ? "<br><br>" : "<br>"}<strong>4.4 Autre</strong><br>${nl2brSafe(xpMessageAutreContent || "Aucun")}`;
    }
  } else {
    html += `Aucun`;
  }
  html += `</div><br>`;

  html += `<div><strong>5. Message gain de niveau</strong><br><br><strong>5.1 Chat</strong><br>${nl2brSafe(levelMessageChatContent || "Aucun")}</div><br>`;

  const guiItemsHtml = guiItems.length === 0
    ? `Aucun item`
    : renderNamedEntriesHtml(
        guiItems,
        (item, index) => `<br><strong>Item ${index + 1} :</strong><br>
      - Item : ${escapeHtml(item.item || "Aucun")}<br>
      - Nom : ${nl2brSafe(item.nom || "Aucun")}<br>
      - Lore : ${nl2brSafe(item.lore || "Aucun")}<br>`,
        "Aucun item"
      );

  html += `
    <div><strong>6. Interface joueur</strong></div><br>
    ${getMetierGuiImageHtml()}<br>
    <div><strong>Texture du GUI :</strong> ${escapeHtml(guiTexture)}</div><br>
    <div><strong>Items du GUI :</strong><br>${guiItemsHtml}</div><br>
    <div><strong>7. Spécificité métier</strong><br>${nl2brSafe(specificite)}</div>`;

  return html;
}

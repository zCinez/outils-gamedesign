function genererTemplateCaisse() {
  const caisseNom = valeur("caisseNom");
  const caisseNomAffiche = valeur("caisseNomAffiche");
  const rewards = recupererRewardsCaisse();

  const rewardsTexte = rewards.length === 0
    ? "Aucune"
    : buildTextTable(
        ["#", "Item", "Quantité", "Pourcentage"],
        rewards.map((reward, index) => [index + 1, reward.item, reward.quantity, reward.chance])
      );

  return `1. Informations générales

Nom de la caisse : ${caisseNom}
Nom affiché : ${caisseNomAffiche}

2. Récompenses

${rewardsTexte}`;
}

function genererPreviewCaisseHtml() {
  const caisseNom = valeur("caisseNom");
  const caisseNomAffiche = valeur("caisseNomAffiche");
  const rewards = recupererRewardsCaisse();

  let html = `
        <div><strong>1. Informations générales</strong></div><br>
        <div><strong>Nom de la caisse :</strong> ${escapeHtml(caisseNom)}</div><br>
        <div><strong>Nom affiché :</strong> ${escapeHtml(caisseNomAffiche)}</div><br>
        <div><strong>2. Récompenses</strong><br>`;

  if (rewards.length === 0) {
    html += `Aucune`;
  } else {
    html += `<div class="preview-table-wrapper"><table class="preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Quantité</th>
              <th>Pourcentage</th>
            </tr>
          </thead>
          <tbody>`;

    rewards.forEach((reward, index) => {
      html += `<tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(reward.item)}</td>
            <td>${escapeHtml(reward.quantity)}</td>
            <td>${escapeHtml(reward.chance)}</td>
          </tr>`;
    });

    html += `</tbody></table></div>`;
  }

  html += `</div>`;

  return html;
}

function genererTemplateSoundDesign() {
  const entries = recupererSoundDesignEntries();

  const entriesText = renderNamedEntriesText(
    entries,
    (entry, index) => `Son ${index + 1} :
- Événement : ${entry.event}
- Son joué : ${entry.sound}
- Description : ${entry.description}`,
    "Aucun"
  );

  return `1. Éléments sonores

${entriesText}`;
}

function genererPreviewSoundDesignHtml() {
  const entries = recupererSoundDesignEntries();

  let html = `
        <div><strong>1. Éléments sonores</strong><br>`;

  html += renderNamedEntriesHtml(
    entries,
    (entry, index) => `<br><strong>Son ${index + 1} :</strong><br>
          - Événement : ${escapeHtml(entry.event)}<br>
          - Son joué : ${escapeHtml(entry.sound)}<br>
          - Description : ${nl2brSafe(entry.description)}<br>`,
    "Aucun"
  );

  html += `</div>`;

  return html;
}

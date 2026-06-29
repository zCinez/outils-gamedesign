function formatRankUpPrice(price) {
  return price || "Aucun";
}

function formatRankUpRequirements(requirements) {
  return requirements || "Aucun";
}

function formatRankUpImageLink(imageLink) {
  return imageLink || "Aucun";
}

function formatRankUpRewardsText(rewards) {
  if (!rewards.length) {
    return "- Aucune récompense";
  }

  return rewards.map(reward => `- ${reward}`).join("\n");
}

function formatRankUpRewardsHtml(rewards) {
  if (!rewards.length) {
    return `<div>- Aucune récompense</div>`;
  }

  return rewards.map(reward => `<div>- ${escapeHtml(reward)}</div>`).join("");
}

function genererTemplateRankUp() {
  const rankUps = recupererRankUps();

  if (rankUps.length === 0) {
    return "Aucun rank-up";
  }

  return rankUps.map(rankUp => {
    return `${rankUp.name || "Sans nom"}:

( Coût -> $ ) ${formatRankUpPrice(rankUp.price)}
(Requis : ${formatRankUpRequirements(rankUp.requirements)})
Lien de l'image : ${formatRankUpImageLink(rankUp.imageLink)}
${formatRankUpRewardsText(rankUp.rewards)}`;
  }).join("\n\n\n");
}

function genererPreviewRankUpHtml() {
  const rankUps = recupererRankUps();

  if (rankUps.length === 0) {
    return `<div>Aucun rank-up</div>`;
  }

  return rankUps.map(rankUp => {
    return `
      <section class="dynamic-block" style="padding: 18px 20px;">
        <div style="font-size: 34px; font-weight: 800; line-height: 1.1; margin-bottom: 18px;">
          ${escapeHtml(rankUp.name || "Sans nom")}:
        </div>
        <div style="font-size: 22px; margin-bottom: 8px;">
          ( Coût -> $ ) ${escapeHtml(formatRankUpPrice(rankUp.price))}
        </div>
        <div style="font-size: 22px; font-weight: 700; color: #d49cff; margin-bottom: 14px;">
          (Requis : ${escapeHtml(formatRankUpRequirements(rankUp.requirements))})
        </div>
        <div style="font-size: 18px; margin-bottom: 14px;">
          <strong>Lien de l'image :</strong> ${escapeHtml(formatRankUpImageLink(rankUp.imageLink))}
        </div>
        <div style="font-size: 21px; line-height: 1.55;">
          ${formatRankUpRewardsHtml(rankUp.rewards)}
        </div>
      </section>
    `;
  }).join("<div style=\"height: 18px;\"></div>");
}

function ajouterRankUp(data = {}) {
  rankUpIndex++;
  const container = document.getElementById("rankUpContainer");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "gui-item";
  item.dataset.rankUpId = rankUpIndex;
  item.innerHTML = `
    <div class="gui-item-header">
      <div class="gui-item-title">Rank-up</div>
      <button type="button" class="btn-remove" onclick="supprimerRankUp(${rankUpIndex})">Supprimer</button>
    </div>

    <div class="grid-2">
      <div>
        <label for="rankUpName_${rankUpIndex}">Nom du rank-up</label>
        <input type="text" id="rankUpName_${rankUpIndex}" placeholder="Ex : Fer I" value="${escapeHtml(data.name || "")}" />
      </div>

      <div>
        <label for="rankUpPrice_${rankUpIndex}">Prix du rank-up</label>
        <input type="text" id="rankUpPrice_${rankUpIndex}" placeholder="Ex : 50 000 $" value="${escapeHtml(data.price || "")}" />
      </div>
    </div>

    <label for="rankUpRequirements_${rankUpIndex}">Prérequis</label>
    <textarea id="rankUpRequirements_${rankUpIndex}" placeholder="Ex : Tous les métiers niveau 5">${escapeHtml(data.requirements || "")}</textarea>

    <label for="rankUpImageLink_${rankUpIndex}">Lien de l'image</label>
    <input type="text" id="rankUpImageLink_${rankUpIndex}" placeholder="Ex : https://drive.google.com/file/d/.../view?usp=drive_link" value="${escapeHtml(data.imageLink || data.imageUrl || "")}" />

    <div class="dynamic-block">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <h3 style="margin:0;">Récompenses</h3>
        <button type="button" class="btn-small" onclick="ajouterRankUpReward(${rankUpIndex})">+ Ajouter une récompense</button>
      </div>

      <div id="rankUpRewardsContainer_${rankUpIndex}" style="margin-top:14px;"></div>
    </div>
  `;

  container.appendChild(item);
  (data.rewards || []).forEach(reward => ajouterRankUpReward(rankUpIndex, { reward }));
  refreshAfterStructureChange();
}

function supprimerRankUp(id) {
  const item = document.querySelector(`[data-rank-up-id="${id}"]`);
  if (item) item.remove();
  refreshAfterStructureChange();
}

function ajouterRankUpReward(rankUpId, data = {}) {
  rankUpRewardIndex++;
  const container = document.getElementById(`rankUpRewardsContainer_${rankUpId}`);
  if (!container) return;

  const item = document.createElement("div");
  item.className = "gui-item";
  item.dataset.rankUpRewardId = rankUpRewardIndex;
  item.dataset.rankUpOwnerId = rankUpId;
  item.innerHTML = `
    <div class="gui-item-header">
      <div class="gui-item-title">Récompense</div>
      <button type="button" class="btn-remove" onclick="supprimerRankUpReward(${rankUpRewardIndex})">Supprimer</button>
    </div>

    <label for="rankUpReward_${rankUpRewardIndex}">Récompense</label>
    <input type="text" id="rankUpReward_${rankUpRewardIndex}" placeholder="Ex : Boost de 2.5% sur l'XP Job" value="${escapeHtml(data.reward || "")}" />
  `;

  container.appendChild(item);
  refreshAfterStructureChange();
}

function supprimerRankUpReward(id) {
  const item = document.querySelector(`[data-rank-up-reward-id="${id}"]`);
  if (item) item.remove();
  refreshAfterStructureChange();
}

function recupererRankUps() {
  const items = document.querySelectorAll("[data-rank-up-id]");
  const result = [];

  items.forEach(item => {
    const id = item.dataset.rankUpId;
    const rewards = Array.from(item.querySelectorAll("[data-rank-up-reward-id]"))
      .map(rewardItem => {
        const rewardId = rewardItem.dataset.rankUpRewardId;
        return document.getElementById(`rankUpReward_${rewardId}`)?.value.trim() || "";
      })
      .filter(Boolean);

    const data = {
      name: document.getElementById(`rankUpName_${id}`)?.value.trim() || "",
      price: document.getElementById(`rankUpPrice_${id}`)?.value.trim() || "",
      requirements: document.getElementById(`rankUpRequirements_${id}`)?.value.trim() || "",
      imageLink: document.getElementById(`rankUpImageLink_${id}`)?.value.trim() || "",
      rewards
    };

    if (data.name || data.price || data.requirements || data.imageLink || data.rewards.length > 0) {
      result.push(data);
    }
  });

  return result;
}

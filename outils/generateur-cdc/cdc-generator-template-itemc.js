function genererTemplateItemC() {
  const nomItem = valeur("nomItem");
  const itemMc = valeur("itemMc");

  const typeArme = document.getElementById("typeArme").checked;
  const typeOutil = document.getElementById("typeOutil").checked;
  const typeObjet = document.getElementById("typeObjet").checked;
  const typeConsommable = document.getElementById("typeConsommable").checked;
  const typeCle = document.getElementById("typeCle").checked;
  const typeAutre = document.getElementById("typeAutre").checked;

  const obtentionCraft = document.getElementById("obtentionCraft").checked;
  const obtentionRecompense = document.getElementById("obtentionRecompense").checked;
  const obtentionBoutique = document.getElementById("obtentionBoutique").checked;
  const obtentionShop = document.getElementById("obtentionShop").checked;
  const obtentionEvent = document.getElementById("obtentionEvent").checked;
  const obtentionAutre = document.getElementById("obtentionAutre").checked;

  const selectTypeAutre = valeur("selectTypeAutre");
  const itemRole = valeur("itemRole");

  const selectObtentionCraft = getSelectedFileName("selectObtentionCraft");
  const craftRecipeItemCustom = valeur("craftRecipeItemCustom");
  const selectObtentionRecompense = valeur("selectObtentionRecompense");
  const selectObtentionBoutiqueCategory = valeur("selectObtentionBoutiqueCategory");
  const selectObtentionBoutiquePrice = valeur("selectObtentionBoutiquePrice");
  const selectObtentionBoutiqueCondition = valeur("selectObtentionBoutiqueCondition");
  const selectObtentionShopCategory = valeur("selectObtentionShopCategory");
  const selectObtentionShopPrice = valeur("selectObtentionShopPrice");
  const selectObtentionShopCurrency = valeur("selectObtentionShopCurrency");
  const selectObtentionShopCondition = valeur("selectObtentionShopCondition");
  const selectObtentionEventName = valeur("selectObtentionEventName");
  const selectObtentionEventMethod = valeur("selectObtentionEventMethod");
  const selectObtentionEventCondition = valeur("selectObtentionEventCondition");
  const selectObtentionAutre = valeur("selectObtentionAutre");
  const linkTexture = valeur("linkTexture");
  const nameItem = valeur("nameItem");
  const loreItem = valeur("loreItem");
  const durabiliteItem = valeur("durabiliteItem");
  const effectDescription = valeur("effectDescription");

  const textureItemImage = getSelectedFileName("textureItemImage");
  const selectClicDroit = valeur("selectClicDroit");
  const selectClicGauche = valeur("selectClicGauche");
  const selectPassif = valeur("selectPassif");
  const utilisationClickDroit = document.getElementById("utilisationClickDroit").checked;
  const utilisationClickGauche = document.getElementById("utilisationClickGauche").checked;
  const utilisationPassif = document.getElementById("utilisationPassif").checked;

  let itemTexte = "";
  let detailsItem = "";

  if (typeArme) itemTexte += `☑ Arme\n`;
  if (typeOutil) itemTexte += `☑ Outil\n`;
  if (typeObjet) itemTexte += `☑ Objet\n`;
  if (typeConsommable) itemTexte += `☑ Consommable\n`;
  if (typeCle) itemTexte += `☑ Clé\n`;
  if (typeAutre) {
    itemTexte += `☑ Autre\n`;
    detailsItem += `Autre : ${selectTypeAutre}\n`;
  }

  if (!typeArme && !typeOutil && !typeObjet && !typeConsommable && !typeCle && !typeAutre) {
    itemTexte = "Aucune";
    detailsItem = "";
  } else {
    itemTexte = itemTexte.trimEnd();
    detailsItem = detailsItem.trimEnd();
  }

  let obtentionTexte = "";
  let detailsObtention = "";

  if (obtentionCraft) {
    obtentionTexte += `☑ Craft\n`;
    detailsObtention += `Craft : ${selectObtentionCraft}\n`;
    detailsObtention += `Recette : ${craftRecipeItemCustom || "Aucune"}\n`;
  }
  if (obtentionRecompense) {
    obtentionTexte += `☑ Récompense\n`;
    detailsObtention += `Récompense : ${selectObtentionRecompense}\n`;
  }
  if (obtentionBoutique) {
    obtentionTexte += `☑ Boutique\n`;
    detailsObtention += `Boutique :\n`;
    detailsObtention += `- Catégorie : ${selectObtentionBoutiqueCategory || "Aucune"}\n`;
    detailsObtention += `- Prix : ${selectObtentionBoutiquePrice || "Aucun"}\n`;
    detailsObtention += `- Condition : ${selectObtentionBoutiqueCondition || "Aucune"}\n`;
  }
  if (obtentionShop) {
    obtentionTexte += `☑ Shop\n`;
    detailsObtention += `Shop :\n`;
    detailsObtention += `- Catégorie : ${selectObtentionShopCategory || "Aucune"}\n`;
    detailsObtention += `- Prix : ${selectObtentionShopPrice || "Aucun"}\n`;
    detailsObtention += `- Devise : ${selectObtentionShopCurrency || "Aucune"}\n`;
    detailsObtention += `- Condition : ${selectObtentionShopCondition || "Aucune"}\n`;
  }
  if (obtentionEvent) {
    obtentionTexte += `☑ Event\n`;
    detailsObtention += `Event :\n`;
    detailsObtention += `- Nom de l’event : ${selectObtentionEventName || "Aucun"}\n`;
    detailsObtention += `- Méthode d’obtention : ${selectObtentionEventMethod || "Aucune"}\n`;
    detailsObtention += `- Condition : ${selectObtentionEventCondition || "Aucune"}\n`;
  }
  if (obtentionAutre) {
    obtentionTexte += `☑ Autre\n`;
    detailsObtention += `Autre : ${selectObtentionAutre}\n`;
  }

  if (!obtentionCraft && !obtentionRecompense && !obtentionBoutique && !obtentionShop && !obtentionEvent && !obtentionAutre) {
    obtentionTexte = "Aucune";
    detailsObtention = "";
  } else {
    obtentionTexte = obtentionTexte.trimEnd();
    detailsObtention = detailsObtention.trimEnd();
  }

  let clicTexte = "";
  let detailsClic = "";

  if (utilisationClickDroit) {
    clicTexte += `☑ Clic Droit\n`;
    detailsClic += `Clic Droit : ${selectClicDroit}\n`;
  }
  if (utilisationClickGauche) {
    clicTexte += `☑ Clic Gauche\n`;
    detailsClic += `Clic Gauche : ${selectClicGauche}\n`;
  }
  if (utilisationPassif) {
    clicTexte += `☑ Passif\n`;
    detailsClic += `Passif : ${selectPassif}\n`;
  }

  if (!utilisationClickDroit && !utilisationClickGauche && !utilisationPassif) {
    clicTexte = "Aucune";
    detailsClic = "";
  } else {
    clicTexte = clicTexte.trimEnd();
    detailsClic = detailsClic.trimEnd();
  }

  return `1. Informations générales

Nom de l'item : ${nomItem}
Item Minecraft : ${itemMc}
Type d'item :
${itemTexte}
${detailsItem ? `${detailsItem}\n` : ""}Rôle de l'item :
${itemRole}

2. Obtention

Méthodes d'obtention :
${obtentionTexte}
${detailsObtention ? `\n${detailsObtention}` : ""}

3. Apparence

Texture de l'item : ${textureItemImage}
Lien de la texture : ${linkTexture}
Nom affiché : ${nameItem}
Lore :
${loreItem}

4. Caractéristiques

Durabilité : ${durabiliteItem}
Description de l'effet :
${effectDescription}

5. Utilisation

Types d'utilisation :
${clicTexte}
${detailsClic ? `\n${detailsClic}` : ""}`;
}

function genererPreviewItemCHtml() {
  const nomItem = valeur("nomItem");
  const itemMc = valeur("itemMc");

  const typeArme = document.getElementById("typeArme").checked;
  const typeOutil = document.getElementById("typeOutil").checked;
  const typeObjet = document.getElementById("typeObjet").checked;
  const typeConsommable = document.getElementById("typeConsommable").checked;
  const typeCle = document.getElementById("typeCle").checked;
  const typeAutre = document.getElementById("typeAutre").checked;

  const selectTypeAutre = valeur("selectTypeAutre");
  const itemRole = valeur("itemRole");

  const obtentionCraft = document.getElementById("obtentionCraft").checked;
  const obtentionRecompense = document.getElementById("obtentionRecompense").checked;
  const obtentionBoutique = document.getElementById("obtentionBoutique").checked;
  const obtentionShop = document.getElementById("obtentionShop").checked;
  const obtentionEvent = document.getElementById("obtentionEvent").checked;
  const obtentionAutre = document.getElementById("obtentionAutre").checked;

  const craftRecipeItemCustom = valeur("craftRecipeItemCustom");
  const selectObtentionRecompense = valeur("selectObtentionRecompense");
  const selectObtentionBoutiqueCategory = valeur("selectObtentionBoutiqueCategory");
  const selectObtentionBoutiquePrice = valeur("selectObtentionBoutiquePrice");
  const selectObtentionBoutiqueCondition = valeur("selectObtentionBoutiqueCondition");
  const selectObtentionShopCategory = valeur("selectObtentionShopCategory");
  const selectObtentionShopPrice = valeur("selectObtentionShopPrice");
  const selectObtentionShopCurrency = valeur("selectObtentionShopCurrency");
  const selectObtentionShopCondition = valeur("selectObtentionShopCondition");
  const selectObtentionEventName = valeur("selectObtentionEventName");
  const selectObtentionEventMethod = valeur("selectObtentionEventMethod");
  const selectObtentionEventCondition = valeur("selectObtentionEventCondition");
  const selectObtentionAutre = valeur("selectObtentionAutre");
  const linkTexture = valeur("linkTexture");
  const nameItem = valeur("nameItem");
  const loreItem = valeur("loreItem");
  const durabiliteItem = valeur("durabiliteItem");
  const effectDescription = valeur("effectDescription");

  const selectClicDroit = valeur("selectClicDroit");
  const selectClicGauche = valeur("selectClicGauche");
  const selectPassif = valeur("selectPassif");
  const utilisationClickDroit = document.getElementById("utilisationClickDroit").checked;
  const utilisationClickGauche = document.getElementById("utilisationClickGauche").checked;
  const utilisationPassif = document.getElementById("utilisationPassif").checked;

  let html = `

      <div><strong>1. Informations générales</strong></div><br>
      <div><strong>Nom de l'item :</strong> ${escapeHtml(nomItem)}</div><br>
	  <div><strong>Item Minecraft :</strong> ${escapeHtml(itemMc)}</div><br>

      <div><strong>Type d'item :</strong><br>`;

  if (typeArme) html += `☑ Arme<br>`;
  if (typeOutil) html += `☑ Outil<br>`;
  if (typeObjet) html += `☑ Objet<br>`;
  if (typeConsommable) html += `☑ Consommable<br>`;
  if (typeCle) html += `☑ Clé<br>`;
  if (typeAutre) html += `☑ Autre<br>`;

  if (!typeArme && !typeOutil && !typeObjet && !typeConsommable && !typeCle && !typeAutre) {
    html += `Aucune<br>`;
  }

  html += `</div>`;

  if (typeAutre) {
    html += `<br><div><strong>Autre :</strong> ${escapeHtml(selectTypeAutre)}</div>`;
  }

  html += `<br><div><strong>Rôle de l'item :</strong><br>${itemRole ? nl2brSafe(itemRole) : "Aucun"}</div>`;

  html += `
	    <br><div><strong>2. Obtention</strong></div><br><div><strong>Méthodes d'obtention :</strong><br>`;

  if (obtentionCraft) html += `☑ Craft<br>`;
  if (obtentionRecompense) html += `☑ Récompense<br>`;
  if (obtentionBoutique) html += `☑ Boutique<br>`;
  if (obtentionShop) html += `☑ Shop<br>`;
  if (obtentionEvent) html += `☑ Event<br>`;
  if (obtentionAutre) html += `☑ Autre<br>`;

  if (!obtentionCraft && !obtentionRecompense && !obtentionBoutique && !obtentionShop && !obtentionEvent && !obtentionAutre) {
    html += `Aucune<br>`;
  }

  html += `</div>`;

  if (obtentionCraft) {
    html += ` <div><strong>Craft :</strong></div>
		${getTemplateCraftImageHtml()}
        <div><strong>Recette :</strong><br>${craftRecipeItemCustom ? nl2brSafe(craftRecipeItemCustom) : "Aucune"}</div>`;
  }

  if (obtentionRecompense) {
    html += `<br><div><strong>Récompense :</strong> ${escapeHtml(selectObtentionRecompense)}</div>`;
  }

  if (obtentionBoutique) {
    html += `<br><div><strong>Boutique :</strong><br>
        - Catégorie : ${escapeHtml(selectObtentionBoutiqueCategory || "Aucune")}<br>
        - Prix : ${escapeHtml(selectObtentionBoutiquePrice || "Aucun")}<br>
        - Condition : ${escapeHtml(selectObtentionBoutiqueCondition || "Aucune")}
        </div>`;
  }

  if (obtentionShop) {
    html += `<br><div><strong>Shop :</strong><br>
        - Catégorie : ${escapeHtml(selectObtentionShopCategory || "Aucune")}<br>
        - Prix : ${escapeHtml(selectObtentionShopPrice || "Aucun")}<br>
        - Devise : ${escapeHtml(selectObtentionShopCurrency || "Aucune")}<br>
        - Condition : ${escapeHtml(selectObtentionShopCondition || "Aucune")}
        </div>`;
  }

  if (obtentionEvent) {
    html += `<br><div><strong>Event :</strong><br>
        - Nom de l’event : ${escapeHtml(selectObtentionEventName || "Aucun")}<br>
        - Méthode d’obtention : ${escapeHtml(selectObtentionEventMethod || "Aucune")}<br>
        - Condition : ${escapeHtml(selectObtentionEventCondition || "Aucune")}
        </div>`;
  }

  if (obtentionAutre) {
    html += `<br><div><strong>Autre :</strong> ${escapeHtml(selectObtentionAutre)}</div>`;
  }

  html += `
	  <br><div><strong>3. Apparence</strong></div>
	  <div><strong>Texture de l'item :</strong></div> 
	  ${getTemplateTextureItemImageHtml()}
	  
	  <br><div><strong>Lien de la texture :</strong> ${escapeHtml(linkTexture)}</div><br>

	  <div><strong>Nom affiché :</strong> ${escapeHtml(nameItem)}</div><br>

	  <div><strong>Lore :</strong><br>${nl2brSafe(loreItem)}</div><br>
	  <br><div><strong>4. Caractéristiques</strong></div><br>
	  <div><strong>Durabilité :</strong> ${escapeHtml(durabiliteItem)}</div><br>
	  <div><strong>Description de l'effet :</strong><br>${nl2brSafe(effectDescription)}</div><br>

          <div><strong>5. Utilisation</strong></div><br>
          <div><strong>Types d'utilisation :</strong><br>`;

  if (utilisationClickDroit) html += `☑ Clic Droit<br>`;
  if (utilisationClickGauche) html += `☑ Clic Gauche<br>`;
  if (utilisationPassif) html += `☑ Passif<br>`;

  if (!utilisationClickDroit && !utilisationClickGauche && !utilisationPassif) {
    html += `Aucune<br>`;
  }

  if (utilisationClickDroit) {
    html += `<br><div><strong>Description du clic droit :</strong><br>${nl2brSafe(selectClicDroit)}</div>`;
  }

  if (utilisationClickGauche) {
    html += `<br><div><strong>Description du clic gauche :</strong><br>${nl2brSafe(selectClicGauche)}</div>`;
  }

  if (utilisationPassif) {
    html += `<br><div><strong>Description du passif :</strong><br>${nl2brSafe(selectPassif)}</div>`;
  }

  html += `</div>`;

  return html;
}

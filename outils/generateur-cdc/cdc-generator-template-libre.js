function genererTemplateLibre() {
  const nom = valeur("libreNom");
  const categorie = valeur("libreCategorie");
  const presentation = valeur("librePresentation");
  const sections = recupererLibreSections();

  const sectionsText = sections.length === 0
    ? "Aucun bloc"
    : sections.map((section, index) => `${index + 2}. ${section.titre || `Bloc ${index + 1}`}\n\n${section.contenu || "Aucun contenu"}`).join("\n\n");

  return `1. Informations générales

Nom du sujet : ${nom}
Catégorie : ${categorie}

Présentation générale :
${presentation}

${sectionsText}`;
}

function genererPreviewLibreHtml() {
  const nom = valeur("libreNom");
  const categorie = valeur("libreCategorie");
  const presentation = valeur("librePresentation");
  const sections = recupererLibreSections();

  let html = `
    <div><strong>1. Informations générales</strong></div><br>
    <div><strong>Nom du sujet :</strong> ${escapeHtml(nom)}</div><br>
    <div><strong>Catégorie :</strong> ${escapeHtml(categorie)}</div><br>
    <div><strong>Présentation générale :</strong><br>${nl2brSafe(presentation)}</div>`;

  if (sections.length === 0) {
    html += `<br><br><div><strong>2. Blocs libres</strong></div><br><div>Aucun bloc</div>`;
    return html;
  }

  sections.forEach((section, index) => {
    html += `<br><br><div><strong>${index + 2}. ${escapeHtml(section.titre || `Bloc ${index + 1}`)}</strong></div><br>`;
    html += `<div>${nl2brSafe(section.contenu || "Aucun contenu")}</div>`;
  });

  return html;
}

function genererTemplateEvent() {
  const nomEvent = valeur("nomEvent");
  const typeSolo = document.getElementById("typeSolo").checked;
  const typeIle = document.getElementById("typeIle").checked;
  const typeGlobal = document.getElementById("typeGlobal").checked;
  const frequenceJournalier = document.getElementById("frequenceJournalier").checked;
  const frequenceHebdomadaire = document.getElementById("frequenceHebdomadaire").checked;
  const frequenceMensuel = document.getElementById("frequenceMensuel").checked;
  const frequenceAnnuel = document.getElementById("frequenceAnnuel").checked;
  const horraireEvent = valeur("horraireEvent");
  const dureeEvent = valeur("dureeEvent");
  const objectifEvent = valeur("objectifEvent");
  const startEventAuto = document.getElementById("startEventAuto").checked;
  const startEventCommand = document.getElementById("startEventCommand").checked;
  const selectStartEventCommand = valeur("selectStartEventCommand");
  const joueurMinimumEvent = valeur("joueurMinimumEvent");
  const rewardFirstEvent = valeur("rewardFirstEvent");
  const rewardSecondEvent = valeur("rewardSecondEvent");
  const rewardThirdEvent = valeur("rewardThirdEvent");
  const eventInterfaceScoreboard = document.getElementById("eventInterfaceScoreboard").checked;
  const eventInterfaceActionBar = document.getElementById("eventInterfaceActionBar").checked;
  const eventInterfaceBossBar = document.getElementById("eventInterfaceBossBar").checked;
  const eventScoreboardContent = valeur("eventScoreboardContent");
  const eventActionBarContent = valeur("eventActionBarContent");
  const eventBossBarContent = valeur("eventBossBarContent");
  const conditions = recupererConditionsEvent();
  const eventStartMessage = valeur("eventStartMessage", "");
  const eventEndMessage = valeur("eventEndMessage", "");
  const eventNotEnoughPlayersMessage = valeur("eventNotEnoughPlayersMessage", "");
  const eventMessages = recupererMessagesEvent();
  const eventAdminStartCommand = valeur("eventAdminStartCommand", "");
  const eventAdminEndCommand = valeur("eventAdminEndCommand", "");
  const eventAdminForceStartNotEnoughPlayersCommand = valeur("eventAdminForceStartNotEnoughPlayersCommand", "");

  const typeTexte = renderCheckedListText([
    typeSolo ? "☑ Solo" : "",
    typeIle ? "☑ Île" : "",
    typeGlobal ? "☑ Global" : ""
  ]);

  const frequenceTexte = renderCheckedListText([
    frequenceJournalier ? "☑ Journalier" : "",
    frequenceHebdomadaire ? "☑ Hebdomadaire" : "",
    frequenceMensuel ? "☑ Mensuel" : "",
    frequenceAnnuel ? "☑ Annuel" : ""
  ]);

  let declenchementTexte = "";
  let detailsDeclenchement = "";
  if (startEventAuto) declenchementTexte += `☑ Automatique\n`;
  if (startEventCommand) {
    declenchementTexte += `☑ Commande\n`;
    detailsDeclenchement += `Commande : ${selectStartEventCommand}\n`;
  }
  if (!startEventAuto && !startEventCommand) {
    declenchementTexte = "Aucune";
  } else {
    declenchementTexte = declenchementTexte.trimEnd();
    detailsDeclenchement = detailsDeclenchement.trimEnd();
  }

  const conditionsListeTexte = conditions.length === 0
    ? "Aucune"
    : conditions.map(condition => `- ${condition.condition}`).join("\n");

  const interfaceTexte = !eventInterfaceScoreboard && !eventInterfaceActionBar && !eventInterfaceBossBar
    ? "Aucune"
    : `${eventInterfaceScoreboard ? `4.1 ScoreBoard\n${eventScoreboardContent || "Aucun"}\n\n` : ""}${eventInterfaceActionBar ? `4.2 ActionBar\n${eventActionBarContent || "Aucun"}\n\n` : ""}${eventInterfaceBossBar ? `4.3 BossBar\n${eventBossBarContent || "Aucun"}` : ""}`.trimEnd();

  return `1. Informations générales

Nom de l'event : ${nomEvent}
Type :
${typeTexte}
Fréquence :
${frequenceTexte}
Horaire : ${horraireEvent}
Durée : ${dureeEvent}
Objectif joueur :
${objectifEvent}

2. Déclenchement

Mode de déclenchement :
${declenchementTexte}
${detailsDeclenchement ? `\n${detailsDeclenchement}` : ""}
Joueur minimum : ${joueurMinimumEvent}
Autre condition :
${conditionsListeTexte}

3. Récompenses

1er : ${rewardFirstEvent}
2eme : ${rewardSecondEvent}
3eme : ${rewardThirdEvent}

4. Interface joueur

${interfaceTexte}

5. Messages

Message de lancement : ${eventStartMessage || "Aucun"}
Message de fin : ${eventEndMessage || "Aucun"}
Message pas assez de joueurs : ${eventNotEnoughPlayersMessage || "Aucun"}
${eventMessages.length > 0 ? `\nMessages personnalisés :
${eventMessages.map((message, index) => `Message ${index + 1} :
- Titre : ${message.titre}
- Message : ${message.contenu}`).join("\n\n")}` : ""}

6. Partie admin

Commande de lancement: ${eventAdminStartCommand || "Aucune"}
Commande de fin: ${eventAdminEndCommand || "Aucune"}
Commande de forçage si pas assez de joueur: ${eventAdminForceStartNotEnoughPlayersCommand || "Aucune"}`;
}

function genererPreviewEventHtml() {
  const nomEvent = valeur("nomEvent");
  const typeSolo = document.getElementById("typeSolo").checked;
  const typeIle = document.getElementById("typeIle").checked;
  const typeGlobal = document.getElementById("typeGlobal").checked;
  const frequenceJournalier = document.getElementById("frequenceJournalier").checked;
  const frequenceHebdomadaire = document.getElementById("frequenceHebdomadaire").checked;
  const frequenceMensuel = document.getElementById("frequenceMensuel").checked;
  const frequenceAnnuel = document.getElementById("frequenceAnnuel").checked;
  const horraireEvent = valeur("horraireEvent");
  const dureeEvent = valeur("dureeEvent");
  const objectifEvent = valeur("objectifEvent");
  const startEventAuto = document.getElementById("startEventAuto").checked;
  const startEventCommand = document.getElementById("startEventCommand").checked;
  const selectStartEventCommand = valeur("selectStartEventCommand");
  const joueurMinimumEvent = valeur("joueurMinimumEvent");
  const rewardFirstEvent = valeur("rewardFirstEvent");
  const rewardSecondEvent = valeur("rewardSecondEvent");
  const rewardThirdEvent = valeur("rewardThirdEvent");
  const eventInterfaceScoreboard = document.getElementById("eventInterfaceScoreboard").checked;
  const eventInterfaceActionBar = document.getElementById("eventInterfaceActionBar").checked;
  const eventInterfaceBossBar = document.getElementById("eventInterfaceBossBar").checked;
  const eventScoreboardContent = valeur("eventScoreboardContent");
  const eventActionBarContent = valeur("eventActionBarContent");
  const eventBossBarContent = valeur("eventBossBarContent");
  const conditions = recupererConditionsEvent();
  const eventStartMessage = valeur("eventStartMessage", "");
  const eventEndMessage = valeur("eventEndMessage", "");
  const eventNotEnoughPlayersMessage = valeur("eventNotEnoughPlayersMessage", "");
  const eventMessages = recupererMessagesEvent();
  const eventAdminStartCommand = valeur("eventAdminStartCommand", "");
  const eventAdminEndCommand = valeur("eventAdminEndCommand", "");
  const eventAdminForceStartNotEnoughPlayersCommand = valeur("eventAdminForceStartNotEnoughPlayersCommand", "");

  let html = `
        <div><strong>1. Informations générales</strong></div><br>
        <div><strong>Nom de l'event :</strong> ${escapeHtml(nomEvent)}</div><br>

	<div><strong>Type :</strong><br>${renderCheckedListHtml([
    typeSolo ? "☑ Solo" : "",
    typeIle ? "☑ Île" : "",
    typeGlobal ? "☑ Global" : ""
  ], "Aucune")}</div>

	<br><div><strong>Fréquence :</strong><br>${renderCheckedListHtml([
    frequenceJournalier ? "☑ Journalier" : "",
    frequenceHebdomadaire ? "☑ Hebdomadaire" : "",
    frequenceMensuel ? "☑ Mensuel" : "",
    frequenceAnnuel ? "☑ Annuel" : ""
  ], "Aucune")}</div>

	<br><div><strong>Horaire :</strong> ${escapeHtml(horraireEvent)}</div><br>

	<div><strong>Durée :</strong> ${escapeHtml(dureeEvent)}</div><br>

	<div><strong>Objectif joueur :</strong> ${escapeHtml(objectifEvent)}</div><br>`;

  html += `<br><div><strong>2. Déclenchement</strong></div><br>`;
  html += `<div><strong>Mode de déclenchement :</strong><br>${renderCheckedListHtml([
    startEventAuto ? "☑ Automatique" : "",
    startEventCommand ? "☑ Commande" : ""
  ], "Aucune")}`;

  if (startEventCommand) {
    html += `<br><div><strong>Commande :</strong> ${escapeHtml(selectStartEventCommand)}</div>`;
  }

  html += `</div>`;

  html += `<br><div><strong>Joueur minimum :</strong> ${escapeHtml(joueurMinimumEvent)}</div>`;
  if (conditions.length > 0) {
    html += `<br><div><strong>Autre condition :</strong><br>`;
    html += conditions.map(condition => `- ${nl2brSafe(condition.condition)}`).join("<br>");
    html += `</div>`;
  } else {
    html += `<br><div><strong>Autre condition :</strong> Aucune</div>`;
  }

  html += `<br><div><strong>3. Récompenses</strong><br><br>
      1er : ${escapeHtml(rewardFirstEvent)}<br>
      2eme : ${escapeHtml(rewardSecondEvent)}<br>
      3eme : ${escapeHtml(rewardThirdEvent)}
      </div>`;

  html += `<br><div><strong>4. Interface joueur</strong><br>`;
  if (eventInterfaceScoreboard || eventInterfaceActionBar || eventInterfaceBossBar) {
    if (eventInterfaceScoreboard) {
      html += `<br><strong>4.1 ScoreBoard</strong><br>${nl2brSafe(eventScoreboardContent || "Aucun")}`;
    }
    if (eventInterfaceActionBar) {
      html += `${eventInterfaceScoreboard ? "<br><br>" : "<br>"}<strong>4.2 ActionBar</strong><br>${nl2brSafe(eventActionBarContent || "Aucun")}`;
    }
    if (eventInterfaceBossBar) {
      html += `${eventInterfaceScoreboard || eventInterfaceActionBar ? "<br><br>" : "<br>"}<strong>4.3 BossBar</strong><br>${nl2brSafe(eventBossBarContent || "Aucun")}`;
    }
  } else {
    html += `Aucune`;
  }
  html += `</div>`;

  html += `<br><div><strong>5. Messages</strong><br>`;
  html += `<strong>Message de lancement :</strong> ${eventStartMessage ? nl2brSafe(eventStartMessage) : "Aucun"}<br>`;
  html += `<strong>Message de fin :</strong> ${eventEndMessage ? nl2brSafe(eventEndMessage) : "Aucun"}<br>`;
  html += `<strong>Message pas assez de joueurs :</strong> ${eventNotEnoughPlayersMessage ? nl2brSafe(eventNotEnoughPlayersMessage) : "Aucun"}<br>`;

  if (eventMessages.length > 0) {
    html += `<strong>Messages personnalisés :</strong><br>`;
    eventMessages.forEach((message, index) => {
      html += `<br><strong>Message ${index + 1} :</strong><br>
          - Titre : ${escapeHtml(message.titre)}<br>
          - Message : ${nl2brSafe(message.contenu)}<br>`;
    });
  }

  html += `</div>`;

  html += `<br><div><strong>6. Partie admin</strong><br>`;
  html += `<strong>Commande de lancement :</strong> ${eventAdminStartCommand ? nl2brSafe(eventAdminStartCommand) : "Aucune"}<br>`;
  html += `<strong>Commande de fin :</strong> ${eventAdminEndCommand ? nl2brSafe(eventAdminEndCommand) : "Aucune"}<br>`;
  html += `<strong>Commande de forçage si pas assez de joueur :</strong> ${eventAdminForceStartNotEnoughPlayersCommand ? nl2brSafe(eventAdminForceStartNotEnoughPlayersCommand) : "Aucune"}<br>`;
  html += `</div>`;

  return html;
}

window.GUI_PRESETS_MANIFEST = [
  {
    name: "GUI Banque",
    template: "gui",
    fields: {
      guiNom: "GUI Banque",
      guiNomAffiche: "\"&6Banque de l'île\"",
      ouvertureCommande: true,
      ouvertureNPC: false,
      ouvertureItem: false,
      ouvertureAutreCheck: false,
      guiCommande: "/bank",
      guiNPCNom: "",
      guiNPCCoordonnee: "",
      guiItemOuverture: "",
      guiOuvertureAutre: "",
      guiTaille: "3 lignes",
      guiTailleAutre: "",
      lienTextureGUI: "",
      guiObjectif: "Afficher les principales options de gestion bancaire."
    },
    dynamic: {
      guiTemplateItems: [
        {
          slot: "11",
          item: "chest",
          nom: "\"&eDéposer\"",
          lore: "\"&7Clique pour déposer tes ressources.\"",
          fonction: "ouvrir le menu de dépôt",
          action: "ouvrir_depot"
        },
        {
          slot: "15",
          item: "ender_chest",
          nom: "\"&bRetirer\"",
          lore: "\"&7Clique pour retirer des ressources.\"",
          fonction: "ouvrir le menu de retrait",
          action: "ouvrir_retrait"
        }
      ]
    }
  }
];

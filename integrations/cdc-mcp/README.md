# Neodium CDC pour Codex

Connecteur MCP local pour Windows et Node.js 24+, utilisant le compte Neodium de la personne connectée. Il gère les dix modèles du générateur, les projets, les CDC, les paramètres de modèles, les presets GUI/items, le rendu et les exports. Les autres outils Neodium ne sont pas exposés.

## Utilisation

1. Installer une fois avec `./install.ps1` depuis ce dossier. Ce script installe les dépendances verrouillées et ajoute `neodium-cdc` aux serveurs MCP du compte Codex local.
2. Redémarrer les serveurs MCP depuis les paramètres Codex, ou relancer Codex.
3. Demander à l’agent : « Connecte-toi à Neodium CDC avec cdc_connect ».
4. Ouvrir le lien local fourni. Demander l’email de connexion avec une adresse déjà autorisée dans Neodium.
5. Copier le lien de connexion reçu par email **sans l’ouvrir**, puis le coller dans cette page locale. Le code OTP est également accepté si l’email en contient un. Aucun lien ou jeton n’est à coller dans le chat.
6. Après connexion, `cdc_status` doit indiquer le compte connecté. Exemple : « Liste mes projets Neodium puis prépare un CDC de commande avec le template commande. »

L’installation concerne les agents exécutés sur ce PC. Les agents cloud et les autres ordinateurs nécessitent leur propre connexion et un transport adapté ; ce connecteur local ne leur est pas automatiquement disponible.

## Outils

| Outils | Actions |
| --- | --- |
| `cdc_status`, `cdc_connect`, `cdc_disconnect` | Vérifier, connecter et déconnecter le compte |
| `cdc_templates`, `cdc_template`, `cdc_reference` | Modèles, champs, options, exemples de collections et règles natives |
| `cdc_list`, `cdc_get` | Lire projets et CDC cloud |
| `cdc_put_project`, `cdc_put_document` | Créer, renommer, modifier, dupliquer, importer et déplacer |
| `cdc_delete` | Supprimer un CDC ou un projet vide |
| `cdc_render`, `cdc_export` | Rendu natif ; export JSON, texte ou HTML imprimable en PDF depuis un navigateur |
| `cdc_settings`, `cdc_put_setting`, `cdc_delete_setting`, `cdc_presets` | Paramètres des modèles, presets intégrés et personnalisations |

Pour créer : `expectedUpdatedAt: null`. Pour modifier/supprimer : reprendre exactement `updatedAt` de la dernière lecture. Une écriture modifie un seul objet ; elle ne remplace jamais tout l’espace de travail. Pour supprimer un projet et son contenu, supprimer d’abord les CDC liés. Pour dupliquer un CDC, reprendre son contenu sans réutiliser son ID, et créer avec `expectedUpdatedAt: null`.

`cdc_put_document` attend l’état complet du générateur (champs `fields`, collections `dynamic`, images et sélection). Commencer par `cdc_template`, ou par `cdc_get` pour une modification. Les paramètres et presets sont partagés entre les comptes autorisés, comme sur le site ; projets et CDC restent attachés au compte connecté dans Turso.

Les exports JSON sont réimportables dans le générateur. Les exports et sauvegardes avant modification sont dans `.cdc-mcp-private/exports` et `.cdc-mcp-private/backups`, à la racine du projet, hors Git. Le rendu utilise les fichiers locaux du générateur : garder ce dépôt à jour.

**Rafraîchir le site après une écriture Codex.** Un ancien onglet du site peut encore enregistrer son état local complet : éviter les éditions simultanées du même document. Le contrôle de version protège les écritures du connecteur, mais les anciennes opérations de sauvegarde du site restent inchangées.

## Connexion et protection

- Authentification Supabase habituelle par lien/code à usage unique, sans nouveau compte automatique et sans clé administrateur.
- Vérification de l’utilisateur et de la liste `neodium_allowed_emails` avant les opérations cloud. Les policies RLS et l’authentification de l’Edge Function restent actives.
- Session chiffrée via Windows DPAPI, liée au compte Windows, dans `.cdc-mcp-private/session.dpapi`. Renouvellement automatique avec verrou entre processus.
- La page locale n’écoute que `127.0.0.1`, possède une adresse aléatoire, exige la même origine pour les soumissions et expire après 15 minutes. Les jetons ne figurent jamais dans les réponses MCP ou arguments de commande.
- `cdc_disconnect` révoque la session du connecteur. Retirer un email de la liste autorisée empêche les appels cloud suivants. Ne pas partager le dossier privé ni les exports confidentiels.

## Déploiement serveur

La fonction `turso-cdc` inclut l’action `agent_write` et son module `agent-records.js`. Déployer les deux fichiers ensemble. Cette action conserve `requireAllowedUser`, filtre par l’utilisateur connecté et vérifie atomiquement `updated_at` dans SQL. Elle n’ajoute aucune ouverture publique, table ou clé permanente. Le connecteur utilise aussi les accès RLS existants pour les réglages partagés.

## Validation

Lancer `npm test`. Tests du protocole MCP réel, des dix moteurs de rendu, des exports, des contrôles d’accès, du chiffrement Windows, des écritures SQL sur SQLite et des conflits concurrents. Les tests utilisent des données fictives et ne modifient pas les CDC de production. Les tests de boucle locale et DPAPI doivent être lancés dans un processus autorisé à utiliser le réseau local et le compte Windows.

Documentation : [MCP dans Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [authentification Supabase par email](https://supabase.com/docs/guides/auth/auth-email-passwordless).

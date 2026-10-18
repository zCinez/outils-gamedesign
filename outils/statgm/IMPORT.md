# Import StatGM

Ouvrir `index.html` via l’aperçu local du dépôt ou son hébergement HTTP(S).
Sur `localhost`, `127.0.0.1` ou la boucle locale IPv6, StatGM affiche **Mode de
test local** : les imports fonctionnent sans connexion et restent dans le
navigateur, sans transfert StatGM vers le cloud. Une copie locale déjà complète
reste consultable ; les nouveaux imports utilisent un historique de test
distinct, sans remplacer l’ancienne référence de compte. Les données uniquement
présentes dans le cloud doivent être réimportées depuis les ZIP pour ce test.
Sur le site hébergé, la sauvegarde authentifiée continue à fonctionner.
L’import reste sur cette page ; le bouton **Joueurs** ouvre `joueurs.html`, avec
les cartes, la recherche et la pagination des joueurs déjà enregistrés.
L’onglet **Statistiques globales** ouvre `statistiques-globales.html` depuis ces
deux pages. Il propose les catégories habituelles, les détails par métier et
ressource, les Tops **10, 20, 50 et 100**, ainsi que la **moyenne** et la **médiane**.
Un seul relevé est retenu par joueur : le plus récent par date d’export, puis par
ordre d’import à date égale. Les exports successifs ne sont pas additionnés.
Le classement s’affiche en **barres horizontales** avec les pseudos et valeurs
exactes. Un **histogramme de tous les joueurs renseignés** place la moyenne et la
médiane sur la distribution ; sa population ne dépend pas du Top sélectionné.
Les filtres sont regroupés sous **Changer de statistique**. Le tableau et les
dates restent consultables dans **Tableau des valeurs et dates des relevés**.
Les montants positifs très dispersés utilisent une échelle logarithmique annoncée,
zéros inclus, avec un bouton pour revenir à l’échelle linéaire. Les valeurs
négatives restent sur une échelle linéaire et les extrêmes ne sont pas masqués.
Moyenne et médiane utilisent tous les joueurs renseignés, indépendamment du top.
Les zéros sont inclus, les champs absents sont exclus et leur nombre reste visible.
Le dernier relevé peut avoir une date différente selon le joueur ; chaque ligne
affiche sa date et donne accès à la fiche. Les classements du plot affichent les
petites places positives en premier ; les autres statistiques sont décroissantes.
Un worker lit au maximum quatre joueurs à la fois et conserve uniquement des
colonnes numériques. Changer de statistique ou de taille du top ne relit pas les
JSON. Sur un ordinateur restauré depuis le cloud, la récupération complète
existante précède le calcul ; un transfert incomplet ne donne pas de faux total.
Les calculs et règles sont documentés dans `tests/global-stats-contract.md` et
vérifiés par `node outils/statgm/tests/global-stats-model.test.cjs` et
`node outils/statgm/tests/global-stats-page.test.cjs`.

L’onglet **Évolution globale** ouvre `evolution-globale.html`. Ses quatre boutons
affichent les courbes de l’**argent gagné total**, de l’**argent dépensé total**,
de l’**argent actuel (Baltop)** et du **total des Coins**, sur tous les exports conservés. Chaque point additionne
les valeurs des joueurs d’un même ZIP, avec un seul relevé par UUID dans cet
export. Les exports successifs restent séparés. Les zéros comptent ; les valeurs
absentes ne sont ni mises à zéro ni reprises d’un ancien export. La couverture
de chaque point reste visible, car les joueurs présents peuvent varier.
Les dates sont celles des exports, avec espacement temporel réel lorsque toutes
sont connues. Les flèches et les points permettent de parcourir l’historique ;
le tableau repliable donne tous les totaux et leurs couvertures.
Le Baltop correspond à la somme des soldes `profile.vault_balance` des joueurs
au moment de chaque export. La différence en valeur et en pourcentage se calcule
par rapport à l’export immédiatement précédent, avec les totaux non arrondis.
Les grands nombres sont simplifiés dans la courbe et ses résumés, avec les mots
**millions**, **milliards** ou **billions** ; les arrondis sont annoncés et le tableau
conserve les valeurs exactes. Le nom du ZIP reste dans ce tableau, sans encombrer
le bloc de lecture sous la courbe.
Les règles sont décrites dans `tests/global-evolution-contract.md`, avec les tests
`node outils/statgm/tests/global-evolution-model.test.cjs` et
`node outils/statgm/tests/global-evolution-page.test.cjs`.

Le sélecteur **Trier par** propose les pseudos de A à Z ou de Z à A, les grades
croissants ou décroissants, la complétion dans les deux sens et la première
connexion des plus anciennes aux plus récentes ou à l’inverse. Il trie toute la
liste localement avant pagination, conserve la recherche et mémorise le choix.
La complétion provient de `progression.completion_percent`, avec repli sur
`quests.completion_percent`, et figure sur les cartes lorsque ce tri est choisi.
À égalité, les pseudos sont triés A–Z ; les données absentes restent à la fin,
sans les confondre avec 0 %. Le relevé le plus récent par date d’export définit sa complétion.
Le tri de première connexion utilise `player.first_played_ms` dans l’index léger,
avec les dates absentes ou invalides à la fin dans les deux sens et les pseudos
A–Z à égalité. Il ne dépend pas de la date de l’export.
Le pourcentage est stocké dans l’index léger dès l’import et sauvegardé dans le
cloud. Les anciens imports locaux récupèrent ce champ une seule fois dans un
worker. Pour une ancienne sauvegarde cloud sans ce champ, sélectionner ce tri
déclenche une lecture unique des blocs compressés, puis conserve les résultats
en local. Les fiches détaillées continuent à se charger à la demande. Les tris
suivants n’entraînent ni lecture des JSON ni appel réseau.
L’ordre suit <https://wiki.neodium.fr/docs/rang/> : Fermier, Fer I–V, Or I–V,
Diamant I–V, Émeraude I–IV, Neodym ; puis Platine, Titane, Saphir, Rubis.
Pour les exports antérieurs, Cuivre I–V se place après Fermier et avant Fer,
et Émeraude V avant Neodym. Les grades staff restent à la fin, par nom de grade,
suivis des grades inconnus puis absents. À grade égal, les pseudos sont triés A–Z.

Chaque carte ouvre `fiche-joueur.html?uuid=…`. La fiche présente une synthèse,
puis les onglets Économie, Métiers, Quêtes et succès, Plot et Données complètes.
Elle utilise exclusivement l’export actif du compte et trois lectures indexées :
résumé du joueur, clés de ses fichiers, puis fichier sélectionné. Les JSON des
autres joueurs ne sont pas chargés. Les statistiques restaurées depuis le cloud
sont récupérées par le mécanisme existant `ensurePlayerRecords`, sous le même
Web Lock que la synchronisation. Les fichiers déjà disponibles restent utilisables
hors connexion. Les imports ayant plusieurs fichiers pour un UUID proposent un
sélecteur ; chaque fichier est consultable indépendamment, sans addition des relevés.

Le lien **Progression du joueur** ouvre `progression-joueur.html?uuid=…`, une page
dédiée qui ouvre directement les graphiques. La première connexion et la liste
des relevés conservés restent visibles. Les valeurs exactes et les différences
entre exports successifs sont consultables dans chaque graphique. La complétion
évolue en points ; un champ absent reste non comparable, sans devenir zéro.
Un compteur cumulé en baisse signale une remise à zéro ou une correction possible.
Les ressources sont alignées sur leur clé, même si leur ordre change.
L’historique commence au premier export conservé : aucune valeur à la première
connexion ni donnée intermédiaire n’est inventée. Les anciens exports remplacés
avant cette évolution doivent être réimportés pour enrichir l’historique.

**Graphique** affiche tous les exports conservés de ce joueur. Des boutons de
catégories remplacent le menu
d’indicateurs : vue d’ensemble, économie, progression, métiers, quêtes et succès
et plot. Les onglets **Compteurs rJobs**, **Compteurs internes** et **Tout** sont
retirés de cette page. Les données restent conservées et consultables dans les
données complètes de la fiche joueur. La vue d’ensemble inclut
**Milestones complétés** à la place du temps de jeu :
`quests.milestone_tiers_reached / quests.milestone_tiers_total × 100` pour chaque
export. Ce pourcentage reste distinct de la complétion générale. Un total nul ou
des champs absents ou invalides ne deviennent pas 0 %. Le temps de jeu reste
accessible dans **Progression** ; le graphique du temps de jeu vanilla est retiré.
Chaque statistique numérique de
la catégorie dispose de son graphique. **Métiers** affiche les quatre graphiques de
niveau ; les boutons Mineur, Chasseur, Bûcheron et Fermier ouvrent directement la
première ressource du métier choisi. Un navigateur de ressources triées par nom donne accès
aux détails d’une ressource à la fois. Les filtres **Activité**, **Expérience**,
**Argent**, **Temps** et **Paliers** permettent ensuite de cibler les graphiques ;
**Toutes** retrouve l’ensemble des statistiques de cette ressource. Les champs
inconnus restent accessibles dans **Autres**. Sur mobile, la liste des ressources
défile horizontalement. Le bouton « Niveau du métier » est retiré de cette liste ;
**Niveaux des métiers** donne accès aux quatre niveaux.
La recherche filtre la catégorie, ou toutes les ressources du métier choisi ;
ses résultats sont regroupés par ressource. Vider la recherche retrouve la
ressource sélectionnée. Aucun relevé ni compteur n’est supprimé ou recalculé.
Changer de ressource ou de filtre ne relit pas les fichiers JSON. Chaque point permet de
consulter la date et la valeur exacte, avec navigation au clavier et une table
des valeurs par graphique. Les dates espacées gardent
leur distance réelle ; si une date manque, l’axe indique l’ordre des relevés.
Un champ absent interrompt la courbe, de même qu’un changement de source du temps
de jeu. Un seul export affiche un point, sans inventer de progression.

La vue métier utilise `job_resources` et complète les clés absentes avec
`rjobs_stats`, sans additionner leurs copies. Les compteurs de `stats_store`
restent consultables dans les données complètes. Le score, le taux de complétion,
les succès et les paliers restent des mesures distinctes. Un classement ou une date
à zéro est signalé comme non renseigné ; un compteur zéro reste visible comme zéro.
Le temps de jeu affiché vient de `playtime.play_seconds` avec sa source déclarée,
sans conversion du compteur interne `cached_play_minute_ticks`. Les temps des
ressources peuvent se recouvrir et ne représentent pas le temps de connexion.
Les dates d’export sans fuseau conservent leur heure littérale ; les timestamps
absolus sont présentés en Europe/Paris. Une date d’import n’est pas substituée à
une date d’export manquante.

Dans **Économie**, le centre du graphique circulaire affiche **Argent total gagné**
(`economy.vault_gained_total_plugin`). Les ventes via `/sell`, hopper du néant et
sellstick sont des catégories déjà incluses dans ce total : elles ne lui sont
jamais additionnées. **Autres gains** représente le total moins ces trois
catégories ; si certaines catégories sont absentes, le reste est indiqué comme
**Gains non ventilés**. Le solde Vault, les coins, la banque du plot, les copies
internes et `displayed_total_gained` ne modifient pas ce total. Un total manquant
n’est pas reconstitué depuis les catégories ; des catégories dépassant le total
conservent leurs montants exacts sans dessiner une fausse répartition.
Les petites parts ne sont pas agrandies artificiellement. Les boutons de légende
permettent de les sélectionner à la souris ou au clavier.
Le graphique en barres reprend exactement le total central du cercle
(`vault_gained_total_plugin`) et le compare aux dépenses
`vault_spent_total_plugin`, avec un axe linéaire commun depuis zéro.
Les deux graphiques utilisent une seule valeur et une seule source. Les montants
exacts et la différence restent visibles ; cette différence n’est pas le solde
actuel. La date d’export est rappelée à côté des barres : les montants proviennent
du fichier importé, sans liaison en direct avec le jeu. Les deux graphiques
utilisent du SVG local, sans bibliothèque, animation
continue ou requête supplémentaire, et se construisent à l’ouverture de l’onglet.

Les onglets se construisent à leur ouverture. Les tableaux métiers affichent
40 lignes par page ; les données complètes affichent 100 champs par page et
parcourent le JSON par tranches de 500 champs. Chaque champ, y compris inconnu,
reste accessible par section, recherche et pagination. Tous les textes importés
sont affichés avec `textContent`. Le téléchargement du JSON est préparé dans un
worker ; aucun fichier fourni par l’utilisateur n’est embarqué dans le dépôt.
Les cartes affichent aussi **Première connexion**, issue de
`player.first_played_ms`, au format jour/mois/année en Europe/Paris. La date et la
complétion sont conservées dans les résumés légers : afficher une carte ne lit
pas le JSON complet. Une date absente ou à zéro reste **Non renseignée**. Les
anciens imports récupèrent les champs manquants une seule fois dans un worker,
en conservant les statistiques originales ; les prochains index cloud incluent
directement cette date. La récupération d’un ancien index cloud réutilise le
cache de blocs et conserve le chargement des fiches à la demande.

Les cartes affichent l’image du grade fournie dans `grades/`. Le grade est lu
en priorité dans `profile.luckperms_primary_group`, avec prise en charge de champs
`grade`, `rank` et `primary_group`. Les variantes comme `cuivre_1`, `Cuivre I` et
`cuivrei` utilisent la même image. Un grade inconnu conserve son libellé ; un grade
absent est indiqué comme non renseigné. Les anciens imports récupèrent leur grade
depuis les JSON déjà conservés, dans un worker, sans réimporter l’archive.

Le bouton **Importer un ZIP** accepte les fichiers `gdstats_<UUID>.json`, y compris
dans des sous-dossiers. L’UUID du nom de fichier sert de clé ; ses variantes avec
et sans tirets sont regroupées. Si le JSON contient un UUID, il doit correspondre.
Le pseudo est lu notamment dans `player.name`, `profile.name` ou `name`.
Sans pseudo, la carte affiche un identifiant basé sur l’UUID.

Les archives ZIP classiques, non chiffrées, utilisant Store ou Deflate sont
acceptées. Limites : 512 Mio compressés, 64 Mio par fichier joueur, 2 Gio de
données joueur décompressées et 65 000 entrées. ZIP64 et les archives multivolumes
sont refusés avec un message explicite. Le nom `Export_DD-MM-YYYY-HH-mm-ss0.zip`
est reconnu pour dater l’export ; un autre nom ZIP reste accepté.

Chaque entrée est lue et décompressée séparément dans un Web Worker. Les tailles
et le CRC-32 sont vérifiés avant le JSON. Les écritures IndexedDB sont regroupées
par 100 fichiers ou 4 Mio. Les statistiques originales sont conservées dans
`statgm-archives/records`, et les résumés des joueurs dans `players`.
Les cartes ne chargent que les résumés et affichent 48 ou 96 joueurs à la fois.

Un export n’active la nouvelle liste qu’après validation et enregistrement de
tous ses fichiers joueur. Une erreur de JSON, de CRC, d’UUID ou de stockage, ou
une annulation, conserve la liste précédente. Les fichiers hors gdstats sont
ignorés et comptés. Plusieurs fichiers d’un UUID conservent chacun leurs données
originales et produisent une seule carte. Les nouveaux relevés s’ajoutent aux
précédents ; les joueurs absents du nouvel export restent consultables.
Une archive identique, même renommée, est détectée par son empreinte SHA-256 et
n’ajoute aucun doublon. Un export ancien importé après un export récent ne
remplace pas les dernières valeurs des cartes. Les métadonnées des relevés sont
stockées séparément dans `snapshots` ; les vues de valeurs et de comparaison lisent
les JSON des une ou deux dates choisies pour ce joueur. Le mode graphique lit
uniquement les fichiers de ce joueur, par groupes de quatre, puis conserve une
projection numérique en mémoire. Changer d’indicateur ne relit pas les JSON.
Cette projection est invalidée lorsqu’un nouvel import actualise les données.
Les SVG et leurs modèles de points sont créés près de l’écran puis libérés hors
de l’écran, en conservant la hauteur de la carte. Les tables se construisent à
leur ouverture. Changer de catégorie, de métier ou de recherche ne relit pas les JSON.

Les imports restent disponibles dans le navigateur et se sauvegardent automatiquement
dans Turso lorsque le compte Neodium est connecté. La fonction `turso-statgm` réutilise
Supabase Auth, la liste d’emails autorisés et les secrets Turso du générateur CDC.
Les sauvegardes sont associées à l’identifiant du compte, comme celles du CDC.
Sans connexion, l’import local fonctionne ; la synchronisation reprend à la connexion.
Un statut propre à StatGM indique la sauvegarde en cours, confirmée ou en attente.

Les statistiques sont réparties en 64 groupes stables d’UUID, sérialisées par flux,
compressées en blocs de 256 Kio et identifiées par SHA-256. Les blocs déjà présents
dans le cloud ne sont pas renvoyés, même après une interruption. Les requêtes sont
limitées à 2 Mio, avec deux transferts simultanés maximum. Compression, calculs,
sérialisation et réseau s’exécutent dans un worker ; aucun fichier brut ne traverse
le thread de l’interface. L’activation cloud utilise une écriture conditionnelle :
une sauvegarde incomplète ou un import concurrent ne remplace pas la version active.
Un conflit propose de garder l’import local ou de charger la sauvegarde cloud.
Deux sauvegardes complètes sont conservées côté serveur, avec sept jours pour les
transferts incomplets. Les blocs sans référence sont nettoyés après une sauvegarde.

À l’ouverture sur un autre ordinateur, seuls les résumés des joueurs sont récupérés.
`StatGMCloud.ensurePlayerRecords(uuid)` récupère les statistiques du groupe concerné,
les vérifie et les conserve dans IndexedDB pour les futures pages de détail. Les
cartes actuelles n’ont pas besoin de charger ces statistiques. `recordsLocal: false`
signale cette restauration progressive, sans prétendre que toute l’archive est locale.
Le cache évite une nouvelle vérification cloud pendant 60 secondes. Il n’y a pas de
polling : une vérification se fait au retour sur la page, au rétablissement du réseau,
à un changement de compte ou avec le bouton Synchroniser. Web Locks évite les
transferts simultanés entre onglets ; BroadcastChannel actualise leurs listes.
Avant un nouvel import sur un ordinateur restauré depuis le cloud, les anciens
relevés sont récupérés une fois, dans le worker et depuis le cache disponible,
puis copiés par lots dans le nouvel historique. L’ancien import reste actif
jusqu’à validation complète. Les anciens blocs cloud sont réutilisés : seuls
le nouvel index et les nouveaux relevés sont compressés et transférés.
La sauvegarde accepte jusqu’à 2 000 000 relevés pour 65 000 joueurs, sous les
limites globales existantes de taille et de blocs. IndexedDB passe à la version 3
sans effacer les anciens imports.

Tests : `node outils/statgm/tests/cloud-service.test.cjs` vérifie le protocole avec
SQLite réel (intégrité, reprise, isolation, conflits, limites et compression).
`node outils/statgm/tests/local-preview.test.cjs` vérifie que les imports locaux
ne dépendent pas de l’initialisation du compte et ne démarrent aucun transfert
cloud, tout en conservant le fonctionnement authentifié du site hébergé.
`node outils/statgm/tests/player-sort.test.cjs` vérifie les huit tris sur
5 500 joueurs, la pagination, la recherche, les préférences et l’actualisation des grades.
`/outils/statgm/tests/completion-backfill.html` vérifie la récupération des anciens
résumés, les fichiers multiples, les données absentes et les JSON inchangés dans
une base de test distincte.
`node outils/statgm/tests/player-stats.test.cjs` vérifie le modèle de présentation,
les valeurs absentes, les dates, les champs inconnus et les copies de ressources.
`/outils/statgm/tests/economy-charts.html` vérifie les SVG et la sélection des
modules avec des données équilibrées, nulles, absentes, partielles, incohérentes,
négatives et de grands montants.
Un chemin vers `gdstats_zRynex_.json` peut être passé en argument pour vérifier
également les 1 027 champs, les ressources complémentaires et l’économie du fichier
fourni, sans le copier dans le dépôt. `tests/player-records.html` vérifie les lectures
indexées sur 5 500 joueurs dans une base IndexedDB de test distincte.
`node outils/statgm/tests/cloud-test-server.cjs` ouvre une API locale fictive sur le
port 8001 ; `/outils/statgm/tests/cloud-browser.html` vérifie les vrais workers et
IndexedDB avec 5 500 joueurs. Les données du test ne quittent pas la machine.
`/outils/statgm/tests/archive-upgrade.html` vérifie séparément la migration de
5 500 joueurs de la version 1 vers la version 3, dans une base de test privée.
`node outils/statgm/tests/player-history.test.cjs` vérifie les imports successifs,
les exports anciens, les doublons, les erreurs et les comparaisons par ressource.
`node outils/statgm/tests/history-chart.test.cjs` vérifie les séries datées,
les intervalles irréguliers, les zéros, les champs absents et les changements de source.
`node outils/statgm/tests/history-chart-page.test.cjs` vérifie la lecture bornée,
les changements de mode pendant le chargement, le cache et son invalidation à l’import.
Le test cloud vérifie également l’ajout de relevés, la réutilisation des anciens
blocs et la restauration de deux dates avec leurs JSON originaux.

Les têtes 3D
utilisent `https://crafatar-pub.neodium.fr/renders/head/<UUID>?scale=6&overlay`,
puis MCHeads (`/head/<UUID>/96`) et Crafatar public en secours. Les réponses HTTP
en erreur sont rejetées même si elles contiennent une image Steve décodable.
Les cartes visibles déclenchent les chargements, avec quatre requêtes simultanées
au maximum et un cache mémoire de 256 têtes. Un monogramme signale un skin
indisponible lorsque tous les services échouent.

La dépendance fflate 0.8.2 est embarquée dans `vendor/` avec sa licence MIT :
<https://github.com/101arrowz/fflate/tree/v0.8.2>.

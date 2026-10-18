# Neodium Outils pour Android

La base Android ouvre la version Web en ligne dans une Trusted Web Activity
(TWA), avec Android Browser Helper. Les pages, scripts et donnees utilisent le
meme site que sur ordinateur. Il n y a pas de copie du site dans l APK.

Apres un deploiement Web, les changements sont disponibles a la prochaine
navigation ou au rechargement du site dans l application, selon le cache HTTP
de l hebergeur. Une page deja ouverte conserve son etat jusqu au rechargement,
pour ne pas effacer un formulaire en cours. Une modification du nom, de l icone,
du domaine ou des fonctions Android demande une nouvelle compilation de l APK.

## Premiere version

Le site configure est
`https://zcinez.github.io/outils-gamedesign/index.html`, heberge sur GitHub Pages.
La premiere distribution vise un APK a installer directement pour les essais.
Un certificat de signature stable reste necessaire pour la distribution definitive.

Le nom initial est `Neodium Outils`, l identifiant est `fr.neodium.outils`, et
l icone reprend le logo du portail. L application demande Android 7 ou plus,
un navigateur compatible TWA (Chrome recommande) et une connexion Internet.

## Configurer le site

Depuis la racine du depot, avec Node.js 22 ou plus :

```powershell
node mobile/scripts/android-config.cjs configure --url https://zcinez.github.io/outils-gamedesign/index.html
node mobile/scripts/android-config.cjs check
```

Utiliser l URL de base du portail, ou sa page `index.html`, pas un lien de
connexion contenant un jeton. `--name "Neodium Outils"` permet de changer le nom.
La configuration est dans `mobile/android/app-config.json`.
`WEB_APP_URL` permet de remplacer l adresse pour une compilation de test.

## Construire un APK de test sous Windows

Installer Android Studio, Android SDK Platform 36 et Build Tools 35.0.0 avec
son SDK Manager. Utiliser Java 17 ou 21 ; Java 25 ne convient pas a Gradle 8.13.
Le script utilise le Java fourni par Android Studio si `JAVA_HOME` est absent.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File mobile/build-android.ps1
```

Le premier lancement telecharge le wrapper Gradle officiel et verifie son
SHA-256. Gradle telecharge ensuite ses dependances. Le resultat est
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`.
Ce build est signe par le certificat de debug local ; il est reserve aux tests.

Pour imposer un autre Java :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File mobile/build-android.ps1 -JavaHome "C:\chemin\vers\jdk-17"
```

Le projet `mobile/android` peut aussi etre ouvert dans Android Studio. Si
l import demande le wrapper, lancer `mobile/scripts/bootstrap-gradle.ps1`.

Sous Linux/macOS, installer Gradle 8.13 puis executer
`gradle --project-dir mobile/android wrapper --gradle-version 8.13`, ou utiliser
directement `gradle --project-dir mobile/android assembleDebug lintDebug`.

## Construire sur GitHub

Le workflow `Android APK` construit automatiquement un APK de test sur les
pull requests qui modifient les fichiers Android. Il peut aussi etre lance
manuellement dans GitHub Actions ; l adresse du site Neodium est preremplie.
Il produit l APK et son rapport de signature, sans installation du SDK sur le PC.
Le lancement manuel est disponible une fois le workflow integre a la branche
principale du depot GitHub.

Les certificats de debug des executions GitHub sont temporaires : deux APK
issus de runs differents peuvent demander une desinstallation avant de les
reinstaller. Pour distribuer l application durablement, utiliser la meme cle
de signature de release a chaque compilation. Ne pas ajouter cette cle au depot.
Android Studio permet de generer un APK/AAB signe via
`Build > Generate Signed App Bundle / APK`.

## Activer le plein ecran et les liens vers l application

Le navigateur verifie que le site et l APK appartiennent au meme editeur avec
Digital Asset Links. Tant que cette verification n est pas terminee,
l application reste utilisable mais affiche la barre d adresse du navigateur.

1. Compiler et signer l APK.
2. Obtenir le SHA-256 du certificat de cet APK (`gradlew.bat signingReport` pour
   un test local, ou le rapport joint a l artifact GitHub).
3. Generer le fichier de relation :

```powershell
node mobile/scripts/android-config.cjs assetlinks --fingerprint "SHA256_DU_CERTIFICAT"
```

Le fichier est genere dans `mobile/android/build/assetlinks.json`. Il doit etre
servi sans redirection, avec le type `application/json`, exactement a
`https://DOMAINE/.well-known/assetlinks.json`, a la racine du domaine. Le script
affiche cette adresse exacte. Plusieurs `--fingerprint` permettent de declarer
plusieurs certificats. Si un fichier assetlinks existe deja, ajouter la nouvelle
relation en conservant les relations existantes.

Pour ce portail, l adresse obligatoire est
`https://zcinez.github.io/.well-known/assetlinks.json`. Un fichier publie a
`https://zcinez.github.io/outils-gamedesign/.well-known/assetlinks.json` ne convient
pas. Sur GitHub Pages, la racine est publiee depuis le depot utilisateur
`zCinez/zcinez.github.io` : il faut y servir ce fichier et y ajouter `.nojekyll`
pour conserver le dossier `.well-known` si le site est publie directement depuis
une branche. Le portail reste dans son depot `outils-gamedesign`.

Avec Google Play App Signing, declarer l empreinte du certificat de signature
de l app fourni par Play, pas seulement celle de la cle d upload.

Les liens HTTPS vers le portail sont declares dans le manifeste Android pour
que les liens de connexion puissent revenir dans l application apres verification.
La session est celle du navigateur choisi pour la TWA. Si l email ouvre un autre
navigateur, choisir le meme navigateur ou utiliser l ouverture dans l application.
Le parcours de connexion Web reste celui du portail.

## Verification

```powershell
node --test mobile/tests/*.test.cjs
node mobile/scripts/android-config.cjs check
```

Sur un vrai telephone, verifier la connexion par email, la navigation entre
outils, le retour Android, les imports ZIP/JSON et les exports PDF, puis publier
une modification Web et recharger l application pour constater la mise a jour.
Le mode hors connexion n est pas implemente dans cette premiere base.

References : [TWA Android](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities),
[integration et verification du domaine](https://developer.chrome.com/docs/android/trusted-web-activity/integration-guide),
[Android Browser Helper](https://github.com/GoogleChrome/android-browser-helper).

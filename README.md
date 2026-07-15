# outils-gamedesign

Outils internes de game design pour Neodium.

## Apercu local

Pour visualiser le portail sans l'envoyer sur GitHub :

- double-clique sur [preview-local.bat](</C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/preview-local.bat>)
- ou lance [preview-local.ps1](</C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/preview-local.ps1:1>)

Le script demarre un serveur local et ouvre automatiquement :

- `http://127.0.0.1:8000/index.html`

Si le port `8000` est deja pris, il choisit automatiquement un port libre jusqu'a `8010`.

Pour couper l'apercu local :

- lance [stop-preview-local.ps1](</C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/stop-preview-local.ps1:1>)

## Sync cloud

Le portail peut synchroniser les donnees utilisateur via Supabase.

- Setup guide : [SUPABASE_SETUP.md](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/SUPABASE_SETUP.md)
- Turso CDC guide : [TURSO_CDC_SETUP.md](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/TURSO_CDC_SETUP.md)
- SQL schema : [supabase/neodium_user_storage.sql](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/supabase/neodium_user_storage.sql)
- Front config : [assets/supabase-config.js](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/assets/supabase-config.js)

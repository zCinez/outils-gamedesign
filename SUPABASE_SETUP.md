# Supabase setup

Ce portail peut maintenant synchroniser les donnees entre plusieurs PC via Supabase.

## 1. Creer la table

Dans Supabase SQL Editor, execute le script de [supabase/neodium_user_storage.sql](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/supabase/neodium_user_storage.sql).

## 2. Configurer Auth

Dans Authentication > URL Configuration :

- Site URL : l'URL publique de ton portail
- Redirect URLs : ajoute au minimum
  - ton URL publique
  - `http://127.0.0.1:8000/*`
  - `http://localhost:8000/*`

Le portail utilise un lien magique email pour connecter un utilisateur.

## 3. Renseigner la config front

Edite [assets/supabase-config.js](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/assets/supabase-config.js:1) :

- `url`
- `anonKey`

La cle `anon` est publique et peut etre exposee dans le front. Ne mets jamais la `service_role`.

## 4. Tester

1. Lance le portail.
2. Ouvre le panneau `Cloud Neodium` en bas a droite.
3. Entre ton email.
4. Clique sur `Recevoir un lien`.
5. Ouvre le lien magique puis laisse la page se recharger.

Les cles suivies sont celles des outils Neodium (`neodium_`, `neodium-`, `statgm-`).

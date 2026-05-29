# Supabase setup

Ce portail est maintenant configure en mode partage public : tous les visiteurs du site lisent et modifient les memes donnees.

## 1. Creer la table partagee

Dans Supabase SQL Editor, execute le script de [supabase/neodium_user_storage.sql](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/supabase/neodium_user_storage.sql).

## 2. Renseigner la config front

Edite [assets/supabase-config.js](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/assets/supabase-config.js:1) :

- `url`
- `anonKey`
- `mode: "shared_public"`

La cle publique peut etre exposee dans le front. Ne mets jamais la `service_role`.

## 3. Tester

1. Lance le portail.
2. Ouvre le panneau `Cloud Neodium` en bas a droite.
3. Verifie que le statut indique `Cloud partage connecte`.
4. Cree ou modifie une donnee sur un PC.
5. Clique sur `Synchroniser`.
6. Ouvre le site depuis un autre PC et verifie que la meme donnee apparait.

Les cles suivies sont celles des outils Neodium (`neodium_`, `neodium-`, `statgm-`).

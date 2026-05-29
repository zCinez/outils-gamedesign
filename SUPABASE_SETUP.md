# Supabase setup

Ce portail est maintenant configure en mode equipe : plusieurs emails autorises se connectent et partagent les memes donnees.

## 1. Creer les tables et policies

Dans Supabase SQL Editor, execute le script de [supabase/neodium_user_storage.sql](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/supabase/neodium_user_storage.sql).

Le script :

- cree la table partagee `neodium_shared_storage`
- cree la liste blanche `neodium_allowed_emails`
- autorise seulement les emails presents dans cette liste

## 2. Ajouter d'autres emails autorises

Dans Supabase SQL Editor, tu peux ajouter d'autres personnes avec :

```sql
insert into public.neodium_allowed_emails (email)
values
  ('adresse1@example.com'),
  ('adresse2@example.com')
on conflict (email) do nothing;
```

## 3. Renseigner la config front

Edite [assets/supabase-config.js](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/assets/supabase-config.js:1) :

- `url`
- `anonKey`
- `mode: "shared_team_auth"`

La cle publique peut etre exposee dans le front. Ne mets jamais la `service_role`.

## 4. Tester

1. Lance le portail.
2. Ouvre le panneau `Cloud Neodium`.
3. Connecte-toi avec un email autorise.
4. Verifie que le statut indique `Cloud partage connecte`.
5. Cree ou modifie une donnee.
6. Clique sur `Synchroniser`.
7. Ouvre le site sur un autre PC avec un email autorise et verifie que la meme donnee apparait.

Les cles suivies sont celles des outils Neodium (`neodium_`, `neodium-`, `statgm-`).

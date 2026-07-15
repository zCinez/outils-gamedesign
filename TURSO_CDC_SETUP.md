# Turso CDC setup

Le stockage cloud des projets CDC passe maintenant par :

- `Supabase Auth` pour la connexion utilisateur
- une `Supabase Edge Function` pour verifier l'utilisateur autorise
- `Turso` pour stocker les projets et l'historique CDC

Le token Turso ne doit jamais etre expose dans le front.

## 1. Regenerer le token Turso

Le token colle dans le chat doit etre considere comme compromis.

Dans Turso :

1. invalide ou supprime l'ancien token
2. cree un nouveau token :
   - `Expires` : `Never`
   - `Authorization Level` : `Read & Write`

Garde de cote :

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 2. Garder la whitelist Supabase

La fonction s'appuie toujours sur la table `public.neodium_allowed_emails`.

Si ce n'est pas deja fait, execute [supabase/neodium_user_storage.sql](/C:/Users/samgi/Desktop/neodium/Wiki/outils-gamedesign/supabase/neodium_user_storage.sql) dans le SQL Editor Supabase.

## 3. Ajouter les secrets dans Supabase

Si le projet n'est pas encore lie en local :

```bash
supabase login
supabase link --project-ref koslfxkbmcnbgtcyshmh
```

Depuis le projet lie au bon compte Supabase :

```bash
supabase secrets set TURSO_DATABASE_URL="libsql://..."
supabase secrets set TURSO_AUTH_TOKEN="..."
```

Tu peux aussi utiliser le dashboard Supabase si tu preferes renseigner les secrets a la main.

## 4. Deployer la fonction

La fonction a deployer est :

- `supabase/functions/turso-cdc/index.ts`

Raccourci Windows disponible dans le repo :

```bat
deploy-turso-cdc.cmd "libsql://..." "TURSO_AUTH_TOKEN"
```

Ce script :

- lance `supabase login`
- enregistre `TURSO_DATABASE_URL`
- enregistre `TURSO_AUTH_TOKEN`
- deploie `turso-cdc`

Si tu preferes les commandes manuelles :

Commande :

```bash
supabase functions deploy turso-cdc
```

## 5. Ce qui change dans le portail

- les grosses cles CDC ne sont plus synchronisees dans la table Supabase partagee
- l'historique CDC et les projets CDC passent par Turso
- les autosaves restent locaux
- un vrai `Enregistrer` dans l'editeur pousse le CDC vers Turso

## 6. Test rapide

1. ouvre le portail
2. connecte-toi via le panneau cloud
3. cree ou ouvre un projet CDC
4. clique sur `Enregistrer`
5. recharge la page ou ouvre un autre PC connecte au meme compte autorise
6. verifie que le projet et le CDC reviennent bien

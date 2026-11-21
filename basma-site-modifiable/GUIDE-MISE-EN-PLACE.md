# Mise en place du site modifiable (à faire une seule fois, par Reda)

Durée : environ 30 minutes. Tout est gratuit.

## 1. Créer le dépôt GitHub
1. Crée un compte sur github.com (si besoin) avec une adresse e-mail de l'association.
2. Clique sur **New repository** → nom : `basma-iyy-site` → **Public** → Create.
3. Sur la page du dépôt : **uploading an existing file**, puis glisse **tout le contenu** de ce dossier
   (build.js, netlify.toml, admin, content, site, templates…), sans le dossier `dist`.
4. N'oublie pas d'ajouter dans `site/images/` toutes tes photos (tapis-01.jpg…, cartables.png, etc.)
   et dans `site/videos/` la vidéo `video_principal.mp4`. Même noms qu'aujourd'hui.
5. **Commit changes**.

## 2. Relier Netlify au dépôt
1. Dans Netlify : **Add new project → Import an existing project → GitHub** → choisis `basma-iyy-site`.
2. Réglages : Build command `node build.js`, Publish directory `dist` (déjà dans netlify.toml).
3. **Deploy**. Garde ton ancien site tant que le nouveau n'est pas vérifié (pas besoin de supprimer quoi que ce soit).
4. Pour reprendre l'adresse actuelle : *Domain management* sur le nouveau projet.

## 3. Activer la connexion des administrateurs
1. Netlify → ton site → **Identity** (ou *Project configuration → Identity*) → **Enable Identity**.
2. *Registration preferences* : choisis **Invite only**.
3. *Services → Git Gateway* → **Enable Git Gateway**.
4. **Invite users** : saisis les e-mails des responsables. Chacun reçoit un mail, crée son mot de passe, et va sur
   `https://ton-site/admin/`.

## 4. Utilisation
Voir `GUIDE-ADMINISTRATEURS.md`.

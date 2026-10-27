# Comptes Prisme : PHP + MySQL

Tout tient dans `site/api/` (un fichier PHP, aucune bibliothèque) et une base MySQL de 7 tables.

## Sur ton Mac avec MAMP

1. **Dossier du site** : MAMP → *Preferences* (ou *Settings*) → *Server* → *Document Root*
   → choisis le dossier `Lgbt encyclopédie/site`.
2. **Démarrer** MAMP (*Start*). Par défaut : Apache sur le port `8888`, MySQL sur `8889`.
3. **Créer la base** : ouvre phpMyAdmin (bouton *WebStart* → *Tools* → *phpMyAdmin*)
   → onglet **Importer** → choisis [`schema.sql`](schema.sql) → **Exécuter**.
   Tu dois voir la base `prisme` avec 7 tables.
4. **Ouvrir le site** : http://localhost:8888
   (pas en double-cliquant `index.html`, sinon le PHP ne tourne pas).

Les réglages sont dans [`site/api/config.php`](../site/api/config.php). Les valeurs MAMP par défaut y sont déjà
(utilisateur `root`, mot de passe `root`, port `8889`).

### Les e-mails en local

MAMP n'envoie pas d'e-mails. Avec `'mode_email' => 'fichier'`, chaque e-mail est écrit dans
`site/api/emails-dev/` : ouvre le fichier `.html` dans ton navigateur et clique sur le bouton
(confirmation d'inscription, « Accepter », code du mot de passe…).

## Sur ton hébergement

1. Envoie le contenu de `site/` sur le serveur (FTP ou gestionnaire de fichiers).
2. Crée une base MySQL chez ton hébergeur et importe `schema.sql` avec son phpMyAdmin.
   Si l'hébergeur impose un nom de base, retire les deux premières lignes du fichier
   (`CREATE DATABASE` et `USE`) et importe directement dans la base créée.
3. Modifie `api/config.php` **sur le serveur** :
   - `db_dsn` : hôte, port et nom de la base donnés par l'hébergeur
     (ex. `mysql:host=xyz.myd.infomaniak.com;dbname=abc_prisme;charset=utf8mb4`)
   - `db_utilisateur`, `db_mot_de_passe` : ceux de la base
   - `site_url` : `https://ton-domaine.ch`
   - `expediteur` : une adresse de ton domaine, avec un nom neutre (`Calendrier P. <compte@ton-domaine.ch>`)
   - `mode_email` : `'mail'`
4. Active le **HTTPS** (certificat gratuit Let's Encrypt chez presque tous les hébergeurs) :
   indispensable, sinon les mots de passe passent en clair.
5. Vérifie que `https://ton-domaine.ch/api/config.php` affiche une erreur « Forbidden » :
   le fichier [`.htaccess`](../site/api/.htaccess) bloque tout sauf `compte.php`.

Exigences : PHP 8.0 ou plus récent, MySQL 5.7+ ou MariaDB 10.3+ (presque tous les hébergeurs).

## Sécurité déjà en place

- Mots de passe chiffrés avec `password_hash()` (jamais stockés en clair).
- Requêtes SQL préparées partout : pas d'injection SQL.
- Pas de cookie : le jeton de session est gardé dans l'onglet (`sessionStorage`),
  donc déconnexion à la fermeture de l'onglet et pas d'attaque par formulaire envoyé depuis un autre site.
  Le serveur fait aussi expirer les sessions après 12 heures.
- Le site ne dit jamais si une adresse a un compte (inscription et « mot de passe oublié »
  répondent toujours pareil) : impossible de tester l'adresse de quelqu'un pour l'outer.
- Limite d'essais : 10 connexions ratées / 15 minutes par adresse IP (IP gardée sous forme de hash).
- Liens et codes par e-mail à usage unique, avec expiration (15 min à 24 h).
- Orientation et ville : appliquées seulement après « Accepter » dans l'e-mail.
  « Ce n'est pas moi » annule, déconnecte tous les appareils et envoie un lien de nouveau mot de passe.
- Suppression du compte : efface aussi sessions, favoris, pays, agenda et liens (`ON DELETE CASCADE`).

## Pas encore fait

- **Rappel la veille** et **alertes de la région** : les choix sont enregistrés (`agenda.rappel`,
  `utilisateurs.alertes_region`). Pour l'envoi, il faut un petit script lancé chaque jour par une
  tâche planifiée (*cron*) de l'hébergeur.
- **Page de confidentialité** : à rédiger avant la mise en ligne (obligatoire avec la nLPD
  pour des données comme l'orientation).

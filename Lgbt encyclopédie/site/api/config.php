<?php
// Réglages du serveur. Valeurs par défaut de MAMP sur Mac.
// Sur l'hébergement, remplace-les par celles de ton hébergeur.

return [
    // Base de données (MAMP : port 8889, utilisateur root, mot de passe root)
    'db_dsn' => 'mysql:host=127.0.0.1;port=8889;dbname=prisme;charset=utf8mb4',
    'db_utilisateur' => 'root',
    'db_mot_de_passe' => 'root',

    // Adresse du site, sans « / » à la fin (utilisée dans les liens des e-mails)
    'site_url' => 'http://localhost:8888',

    // Expéditeur des e-mails : un nom neutre, pour ne outer personne
    'expediteur' => 'Calendrier P. <compte@ton-domaine.ch>',

    // Comment partent les e-mails :
    //   'popup' : démo sur ton Mac. L'e-mail s'affiche dans une fenêtre sur le site,
    //             avec son bouton. Refusé automatiquement si le site est en ligne.
    //   'smtp'  : vrais e-mails, via une boîte mail (hébergeur, Gmail…). Remplis la partie SMTP.
    //   'mail'  : vrais e-mails avec la fonction mail() de l'hébergeur.
    'mode_email' => 'popup',

    // SMTP (seulement pour 'smtp')
    //   Infomaniak : mail.infomaniak.com, port 465, 'ssl', ton adresse et son mot de passe
    //   Gmail      : smtp.gmail.com, port 465, 'ssl', ton adresse et un « mot de passe d'application »
    'smtp_hote' => 'mail.infomaniak.com',
    'smtp_port' => 465,
    'smtp_securite' => 'ssl', // 'ssl' (port 465), 'tls' (port 587) ou '' (sans chiffrement)
    'smtp_utilisateur' => '',
    'smtp_mot_de_passe' => '',
];

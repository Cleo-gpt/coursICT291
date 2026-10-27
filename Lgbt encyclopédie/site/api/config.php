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

    // 'fichier' : les e-mails sont écrits dans api/emails-dev/ (MAMP n'envoie pas d'e-mails)
    // 'mail'    : les e-mails partent vraiment (sur l'hébergement)
    'mode_email' => 'fichier',
];

-- Prisme — base de données des comptes (MySQL / MariaDB)
-- phpMyAdmin → onglet « Importer » → choisir ce fichier → « Exécuter ».

CREATE DATABASE IF NOT EXISTS prisme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prisme;

-- Comptes. Le mot de passe est chiffré avec password_hash() : jamais en clair.
CREATE TABLE utilisateurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  pseudo VARCHAR(30) NOT NULL,
  avatar VARCHAR(20) NOT NULL DEFAULT 'arc-en-ciel',
  orientation VARCHAR(40) NULL,          -- facultatif
  ville VARCHAR(80) NULL,                -- facultatif
  region ENUM('romande', 'alemanique', 'tessin') NULL,
  alertes_region TINYINT(1) NOT NULL DEFAULT 0,
  email_confirme TINYINT(1) NOT NULL DEFAULT 0,
  cree_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sessions : on ne garde que l'empreinte (hash) du jeton, pas le jeton lui-même
CREATE TABLE sessions (
  jeton_hash CHAR(64) PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  expire_le DATETIME NOT NULL,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Liens et codes envoyés par e-mail (confirmation, nouveau mot de passe…)
CREATE TABLE jetons_email (
  jeton_hash CHAR(64) PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  type ENUM('inscription', 'email', 'modif', 'reset', 'code') NOT NULL,
  donnees TEXT NULL,
  expire_le DATETIME NOT NULL,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE favoris (
  utilisateur_id INT UNSIGNED NOT NULL,
  jour CHAR(3) NOT NULL,
  ajoute_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (utilisateur_id, jour),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pays_favoris (
  utilisateur_id INT UNSIGNED NOT NULL,
  pays VARCHAR(80) NOT NULL,
  ajoute_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (utilisateur_id, pays),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE agenda (
  utilisateur_id INT UNSIGNED NOT NULL,
  manif VARCHAR(80) NOT NULL,
  rappel TINYINT(1) NOT NULL DEFAULT 1,  -- rappel par e-mail la veille
  ajoute_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (utilisateur_id, manif),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Limite d'essais (connexion, inscription…) : l'adresse IP est gardée sous forme de hash
CREATE TABLE tentatives (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cle CHAR(64) NOT NULL,
  moment DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (cle, moment)
) ENGINE=InnoDB;

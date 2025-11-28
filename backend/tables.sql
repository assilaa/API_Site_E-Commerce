-- ===================================
-- Fichier de schéma SQL pour LudoMap (SQLite)
-- ===================================

-- Suppression des tables existantes pour une réinitialisation propre
DROP TABLE IF EXISTS LAISSER_UN_AVIS;
DROP TABLE IF EXISTS AVOIR;
DROP TABLE IF EXISTS HABITER;
DROP TABLE IF EXISTS CREER;
DROP TABLE IF EXISTS MODIFIER;
DROP TABLE IF EXISTS VERIFIER;
DROP TABLE IF EXISTS ACHAT; -- Nouvelle table pour l'historique des achats
DROP TABLE IF EXISTS REGLES;
DROP TABLE IF EXISTS PAIEMENT;
DROP TABLE IF EXISTS EDITEUR;
DROP TABLE IF EXISTS CATEGORIE;
DROP TABLE IF EXISTS JEU;
DROP TABLE IF EXISTS ADMINISTRATEUR;
DROP TABLE IF EXISTS ADRESSE;
DROP TABLE IF EXISTS UTILISATEUR;

-- 1. UTILISATEUR
CREATE TABLE UTILISATEUR (
    id_u INTEGER PRIMARY KEY,
    nom_u TEXT NOT NULL,
    prenom_u TEXT NOT NULL,
    date_naissance DATE,
    num_tel TEXT,
    email_u TEXT UNIQUE NOT NULL,
    pseudo_u TEXT UNIQUE NOT NULL,
    password_u TEXT NOT NULL -- Hash du mot de passe
);

-- 2. ADRESSE
CREATE TABLE ADRESSE (
    id_ad INTEGER PRIMARY KEY,
    numero TEXT,
    rue TEXT NOT NULL,
    ville TEXT NOT NULL,
    code_postal TEXT NOT NULL
);

-- 3. ADMINISTRATEUR
CREATE TABLE ADMINISTRATEUR (
    id_admin INTEGER PRIMARY KEY,
    email_admin TEXT UNIQUE NOT NULL,
    pseudo_admin TEXT UNIQUE NOT NULL,
    password_admin TEXT NOT NULL -- Hash du mot de passe
);

-- 4. CATEGORIE
CREATE TABLE CATEGORIE (
    id_cat INTEGER PRIMARY KEY,
    nom_cat TEXT UNIQUE NOT NULL
);

-- 5. JEU (Produit pour l'achat)
CREATE TABLE JEU (
    id_j INTEGER PRIMARY KEY,
    nom_j TEXT NOT NULL,
    prix REAL NOT NULL,
    note_moyenne REAL,
    users_rated INTEGER,
    quantite INTEGER NOT NULL, -- Stock disponible
    annee_publication INTEGER
);

-- 6. EDITEUR
CREATE TABLE EDITEUR (
    id_editeur INTEGER PRIMARY KEY,
    nom_editeur TEXT UNIQUE NOT NULL
);

-- 7. PAIEMENT
CREATE TABLE PAIEMENT (
    id_paiement INTEGER PRIMARY KEY,
    montant REAL NOT NULL,
    methode TEXT NOT NULL,
    date_paiement DATE NOT NULL
);

-- 8. REGLES
CREATE TABLE REGLES (
    id_r INTEGER PRIMARY KEY,
    nbr_joueurs_min INTEGER NOT NULL,
    nbr_joueurs_max INTEGER NOT NULL
);

-- 9. ACHAT (Historique des achats)

CREATE TABLE ACHAT (
    id_achat INTEGER PRIMARY KEY AUTOINCREMENT,
    id_u INTEGER NOT NULL,
    id_j INTEGER NOT NULL,
    id_point_retrait INTEGER NOT NULL,
    date_achat DATE NOT NULL,
    quantite_achetee INTEGER NOT NULL,
    FOREIGN KEY (id_u) REFERENCES UTILISATEUR (id_u),
    FOREIGN KEY (id_j) REFERENCES JEU (id_j),
    FOREIGN KEY (id_point_retrait) REFERENCES POINT_RETRAIT(id_point)
);


-- TABLES DE LIAISON (Relations)

-- L'administrateur vérifie un paiement
CREATE TABLE VERIFIER (
    id_admin INTEGER NOT NULL,
    id_paiement INTEGER NOT NULL,
    PRIMARY KEY (id_admin, id_paiement),
    FOREIGN KEY (id_admin) REFERENCES ADMINISTRATEUR (id_admin),
    FOREIGN KEY (id_paiement) REFERENCES PAIEMENT (id_paiement)
);

-- L'administrateur modifie un jeu
CREATE TABLE MODIFIER (
    id_admin INTEGER NOT NULL,
    id_j INTEGER NOT NULL,
    PRIMARY KEY (id_admin, id_j),
    FOREIGN KEY (id_admin) REFERENCES ADMINISTRATEUR (id_admin),
    FOREIGN KEY (id_j) REFERENCES JEU (id_j)
);

-- L'éditeur crée un jeu
CREATE TABLE CREER (
    id_editeur INTEGER NOT NULL,
    id_j INTEGER NOT NULL,
    PRIMARY KEY (id_editeur, id_j),
    FOREIGN KEY (id_editeur) REFERENCES EDITEUR (id_editeur),
    FOREIGN KEY (id_j) REFERENCES JEU (id_j)
);

-- L'utilisateur habite à une adresse
CREATE TABLE HABITER (
    id_u INTEGER NOT NULL,
    id_ad INTEGER NOT NULL,
    date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (id_u, id_ad),
    FOREIGN KEY (id_u) REFERENCES UTILISATEUR (id_u),
    FOREIGN KEY (id_ad) REFERENCES ADRESSE (id_ad)
);

-- Un jeu a des règles
CREATE TABLE AVOIR (
    id_j INTEGER NOT NULL,
    id_r INTEGER NOT NULL,
    description TEXT,
    PRIMARY KEY (id_j, id_r),
    FOREIGN KEY (id_j) REFERENCES JEU (id_j),
    FOREIGN KEY (id_r) REFERENCES REGLES (id_r)
);

-- L'utilisateur laisse un avis sur un jeu
CREATE TABLE LAISSER_UN_AVIS (
    id_u INTEGER NOT NULL,
    id_j INTEGER NOT NULL,
    date_publication DATE NOT NULL DEFAULT CURRENT_DATE,
    avis TEXT,
    note INTEGER,
    PRIMARY KEY (id_u, id_j),
    FOREIGN KEY (id_u) REFERENCES UTILISATEUR (id_u),
    FOREIGN KEY (id_j) REFERENCES JEU (id_j)
);

CREATE TABLE IF NOT EXISTS POINT_RETRAIT (
    id_point INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
);

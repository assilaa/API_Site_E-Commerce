-- Le fichier insertion.sql adapté pour SQLite (Achat/Vente)

-- Suppression des commandes MySQL spécifiques
-- USE LudoMap;

-- ===================================
-- 1. UTILISATEUR (Ajout du PSEUDO et du PASSWORD hashé pour le test)
-- Note : Le hashage réel doit être fait par l'application (bcrypt)
-- ===================================
INSERT INTO UTILISATEUR (id_u, nom_u, prenom_u, date_naissance, num_tel, email_u, pseudo_u, password_u) VALUES
(1, 'Dupont', 'Jean', '1985-05-15', '0601020304', 'jean.dupont@example.com', 'JeanD', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'), -- 'password' hashé
(2, 'Martin', 'Marie', '1990-07-22', '0605060708', 'marie.martin@example.com', 'MarieM', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(3, 'Bernard', 'Luc', '1982-03-10', '0611121314', 'luc.bernard@example.com', 'LucB', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(4, 'Dubois', 'Sophie', '1995-11-30', '0615161718', 'sophie.dubois@example.com', 'SophieD', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(5, 'Durand', 'Pierre', '1988-01-25', '0619202122', 'pierre.durand@example.com', 'PierreD', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(6, 'Lefevre', 'Julie', '1992-06-18', '0623242526', 'julie.lefevre@example.com', 'JulieL', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(7, 'Moreau', 'Paul', '1980-09-05', '0627282930', 'paul.moreau@example.com', 'PaulM', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(8, 'Simon', 'Laura', '1987-12-12', '0631323334', 'laura.simon@example.com', 'LauraS', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(9, 'Laurent', 'David', '1993-04-08', '0635363738', 'david.laurent@example.com', 'DavidL', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(10, 'Roux', 'Emma', '1991-08-19', '0639404142', 'emma.roux@example.com', 'EmmaR', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(11, 'Blanc', 'Thomas', '1984-02-14', '0643444546', 'thomas.blanc@example.com', 'ThomasB', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(12, 'Garnier', 'Alice', '1989-05-23', '0647484950', 'alice.garnier@example.com', 'AliceG', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(13, 'Faure', 'Nicolas', '1983-10-01', '0651525354', 'nicolas.faure@example.com', 'NicoF', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(14, 'Chevalier', 'Elise', '1994-03-17', '0655565758', 'elise.chevalier@example.com', 'EliseC', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(15, 'Meyer', 'Antoine', '1986-07-29', '0659606162', 'antoine.meyer@example.com', 'AntoM', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(16, 'Perrin', 'Claire', '1990-11-11', '0663646566', 'claire.perrin@example.com', 'ClaireP', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(17, 'Schmitt', 'Julien', '1981-04-04', '0667686970', 'julien.schmitt@example.com', 'JulienS', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(18, 'Legrand', 'Camille', '1988-08-15', '0671727374', 'camille.legrand@example.com', 'CamiL', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(19, 'Giraud', 'Lucas', '1992-12-25', '0675767778', 'lucas.giraud@example.com', 'LucasG', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(20, 'Boyer', 'Manon', '1985-03-05', '0679808182', 'manon.boyer@example.com', 'ManonB', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(21, 'Joly', 'Hugo', '1987-06-30', '0683848586', 'hugo.joly@example.com', 'HugoJ', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(22, 'Morin', 'Chloe', '1991-09-09', '0687888989', 'chloe.morin@example.com', 'ChloeM', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(23, 'Renaud', 'Maxime', '1983-01-20', '0691929293', 'maxime.renaud@example.com', 'MaximeR', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(24, 'Vidal', 'Lea', '1989-04-14', '0695969798', 'lea.vidal@example.com', 'LeaV', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(25, 'Marchand', 'Adrien', '1994-07-07', '0699000102', 'adrien.marchand@example.com', 'AdrienM', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2');


-- ===================================
-- 2. ADRESSE
-- ===================================
INSERT INTO ADRESSE (id_ad, numero, rue, ville, code_postal) VALUES
(1, '12', 'Rue de la Paix', 'Paris', '75002'),
(2, '5', 'Avenue des Champs-Élysées', 'Paris', '75008'),
(3, '20', 'Boulevard Saint-Germain', 'Paris', '75005'),
(4, '33', 'Rue de Rivoli', 'Paris', '75004'),
(5, '7', 'Rue de la République', 'Lyon', '69002'),
(6, '15', 'Cours Lafayette', 'Lyon', '69003'),
(7, '10', 'Rue Sainte-Catherine', 'Bordeaux', '33000'),
-- CORRECTION : Doublage de l'apostrophe dans 'l'Intendance' pour SQLite
(8, '25', 'Cours de l''Intendance', 'Bordeaux', '33000'),
(9, '8', 'Rue de la Liberté', 'Dijon', '21000'),
(10, '18', 'Rue des Forges', 'Dijon', '21000'),
(11, '22', 'Rue Nationale', 'Lille', '59000'),
(12, '30', 'Rue de Béthune', 'Lille', '59000'),
(13, '3', 'Rue de la Monnaie', 'Lille', '59000'),
(14, '14', 'Rue du Palais', 'Nancy', '54000'),
(15, '9', 'Rue Saint-Jean', 'Nancy', '54000'),
(16, '11', 'Rue des Ponts', 'Nancy', '54000'),
(17, '6', 'Rue de Strasbourg', 'Strasbourg', '67000'),
(18, '28', 'Rue des Grandes Arcades', 'Strasbourg', '67000'),
(19, '4', 'Rue du Vieux-Marché-aux-Poissons', 'Strasbourg', '67000'),
(20, '19', 'Rue de la République', 'Marseille', '13002'),
(21, '21', 'Rue Paradis', 'Marseille', '13006'),
(22, '2', 'Rue Saint-Ferréol', 'Marseille', '13001'),
(23, '16', 'Rue de Rome', 'Marseille', '13001'),
(24, '13', 'Rue de la Canebière', 'Marseille', '13001'),
(25, '1', 'Rue de la Paix', 'Nice', '06000');


-- ===================================
-- 3. ADMINISTRATEUR (Ajout du PSEUDO et du PASSWORD hashé pour le test)
-- ===================================

-- Supprime la définition de table (déjà faite dans tables.sql)
-- CREATE TABLE ADMINISTRATEUR ( ... ); 

INSERT INTO ADMINISTRATEUR (id_admin, email_admin, pseudo_admin, password_admin) VALUES
(1, 'zainab@ludomap.com', 'ZainabAdmin', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'), -- 'password' hashé
(2, 'blandine@ludomap.com', 'BlandineAdmin', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2'),
(3, 'yrvane@ludomap.com', 'YrvaneAdmin', '$2b$10$w8T9H6G5B4A3X2Y1Z0Q8.g0vW0tI4i0N4V1B0C9A5F7E2');

-- ===================================
-- 4. CATEGORIE
-- ===================================
INSERT INTO CATEGORIE (id_cat, nom_cat) VALUES
(1, 'Economic'),
(2, 'Negotiation'),
(3, 'Political'),
(4, 'Card Game'),
(5, 'Fantasy'),
(6, 'Abstract Strategy'),
(7, 'Medieval'),
(8, 'Ancient'),
(9, 'Territory Building'),
(10, 'Civilization'),
(11, 'Nautical'),
(12, 'Exploration'),
(13, 'Travel'),
(14, 'Farming'),
(15, 'Mythology'),
(16, 'Bluffing'),
(17, 'Science Fiction'),
(18, 'Collectible Components'),
(19, 'Dice'),
(20, 'Fighting'),
(21, 'Print & Play'),
(22, 'Maze'),
(23, 'Miniatures'),
(24, 'Racing'),
(25, 'American West'),
(26, 'City Building'),
(27, 'Wargame'),
(28, 'Adventure'),
(29, 'Horror'),
(30, 'Novel-based'),
(31, 'Modern Warfare'),
(32, 'Humor'),
(33, 'Electronic'),
(34, 'Deduction'),
(35, 'Word Game'),
(36, 'Space Exploration'),
(37, 'Puzzle'),
(38, 'Real-time'),
(39, 'Renaissance'),
(40, 'Memory'),
(41, 'Movies / TV / Radio theme'),
(42, 'Party Game');

-- ===================================
-- 5. JEU (Insertion statique pour remplacer la dépendance à jeux.json)
-- ===================================
-- L'ancienne syntaxe SELECT FROM jeux; ne peut pas être utilisée sans le fichier jeux.json et une structure de BDD différente.
-- On insère 5 jeux manuellement pour pouvoir tester les routes :
INSERT INTO JEU (id_j, nom_j, prix, note_moyenne, users_rated, quantite, annee_publication) VALUES
(1, 'Les Colons de Catane', 35.99, 7.2, 10000, 50, 1995),
(2, '7 Wonders', 49.99, 7.8, 8500, 30, 2010),
(3, 'Dixit', 25.50, 7.0, 5000, 100, 2008),
(4, 'Carcassonne', 29.90, 7.4, 9000, 75, 2000),
(5, 'Terraforming Mars', 59.95, 8.4, 7000, 20, 2016);

-- Suppression de 'select * from JEU;'

-- ===================================
-- 6. EDITEUR
-- ===================================
INSERT INTO EDITEUR (id_editeur, nom_editeur) VALUES
(1, 'Hans im Glück'), (2, 'Moskito Spiele'), (3, 'Portal Games'), (4, 'Spielworxx'), (5, 'sternenschimmermeer'), 
(6, 'Stronghold Games'), (7, 'Valley Games, Inc.'), (8, 'YOKA Games'), (9, 'E.S. Lowe'), (10, 'Milton Bradley'), 
(11, 'Fantasy Flight Games'), (12, '999 Games'), (13, 'ABACUSSPIELE'), (14, 'Astrel Games'), (15, 'Ceilikan Jogos'), 
(16, 'Descartes Editeur'), (17, 'Edge Entertainment'), (18, 'Galakta'), (19, 'Hobby Japan'), (20, 'Korea Boardgames Co., Ltd.'), 
(21, 'Lacerta'), (22, 'Lautapelit.fi'), (23, 'Rio Grande Games'), (24, 'Skandinavisk Spil Kompagni'), (25, 'Smart Ltd'), 
(26, 'Wargames Club Publishing'), (27, 'KOSMOS'), (28, '3M'), (29, 'The Avalon Hill Game Co'), (30, 'Avalon Hill Games, Inc.'), 
(31, 'Dujardin'), (32, 'Grow Jogos e Brinquedos'), (33, 'PS-Games'), (34, 'Schmidt France'), (35, 'Schmidt International'), 
(36, 'Schmidt Spiele'), (37, 'Selecta Spel en Hobby'), (38, 'Smart Games, Inc.'), (39, 'Historien Spiele Galerie (Historien Spielegalerie)'), 
(40, 'Brightway Products Ltd'), (41, 'Falomir Juegos'), (42, 'Family Games, Inc.'), (43, 'Gazebo Games UK Ltd.'), (44, 'Gigamic'), 
(45, 'Holzinsel'), (46, 'Lagoon Games'), (47, 'Mattel'), (48, 'Robert P. Moore Games'), (49, 'Yangxin Industrial Company Limited'), 
(50, 'Vendetta'), (51, 'Warfrog Games'), (52, 'AMIGO'), (53, 'Albi'), (54, 'Corfix'), (55, 'Hobby World'), 
(56, 'Midgaard Games'), (57, 'Brädspel.se'), (58, 'Brain Games'), (59, 'Broadway Toys LTD'), (60, 'Copag Cards'), 
(61, 'Fractal Juegos'), (62, 'G3'), (63, 'Giochi Uniti'), (64, 'Kaissa Chess & Games'), (65, 'Kikigagne?'), 
(66, 'Lifestyle Boardgames Ltd'), (67, 'Lookout Games'), (68, 'Mercurio'), (69, 'Möbius Games'), (70, 'Paper Iyagi'), 
(71, 'PaperGames (III)'), (72, 'Piatnik'), (73, 'Stratelibri'), (74, 'Swan Panasia Co., Ltd.'), (75, 'Tempo Games (I)'), 
(76, 'alea'), (77, 'Ravensburger'), (78, '25th Century Games'), (79, 'DiceTree Games'), (80, 'New Games Order, LLC'), 
(81, 'Precisamente'), (82, 'Überplay'), (83, 'Windrider Games'), (84, 'Devir'), (85, 'Dexy Co'), 
(86, 'Eurogames'), (87, 'Filosofia Éditions'), (88, 'Galakta'), (89, 'Giochi Uniti'), (90, 'GP Games'), 
(91, 'HaKubia'), (92, 'Hanayama'), (93, 'Ideal Board Games'), (94, 'Igroljub'), (95, 'IntelliGames.BG'), 
(96, 'Ísöld ehf.'), (97, 'Kaissa Chess & Games'), (98, 'Korea Boardgames Co., Ltd.'), (99, 'L&M Games'), (100, 'Laser plus');

INSERT INTO EDITEUR (id_editeur, nom_editeur) VALUES
(1, 'Hans im Glück'),
(2, 'Moskito Spiele'),
(3, 'Portal Games'),
(4, 'Spielworxx'),
(5, 'Stronghold Games');



-- ===================================
-- 7. PAIEMENT
-- ===================================
INSERT INTO PAIEMENT (id_paiement, montant, methode, date_paiement) VALUES
(1, 99.99, 'Carte de crédit', '2025-04-22'),
(2, 49.50, 'Virement bancaire', '2025-04-21'),
(3, 150.75, 'PayPal', '2025-04-20'),
(4, 29.99, 'Carte de crédit', '2025-04-19'),
(5, 200.00, 'Virement bancaire', '2025-04-18'); 
-- On réduit le nombre de paiements car les tables RESERVATION sont supprimées


-- ===================================
-- 8. REGLES
-- ===================================
INSERT INTO REGLES (id_r, nbr_joueurs_min, nbr_joueurs_max) VALUES
(1, 3, 5), (2, 3, 4), (3, 2, 4), (4, 2, 4), (5, 2, 6), (6, 2, 6), (7, 2, 2), (8, 2, 5), (9, 2, 4), (10, 2, 6), 
(11, 2, 7), (12, 2, 5), (13, 3, 4), (14, 3, 4), (15, 2, 6), (16, 3, 4), (17, 2, 2), (18, 2, 8), (19, 2, 4), (20, 2, 4), 
(21, 1, 7), (22, 1, 16), (23, 2, 6), (24, 2, 6), (25, 2, 6), (26, 3, 6), (27, 2, 6), (28, 2, 8), (29, 2, 4), (30, 1, 4), 
(31, 2, 5), (32, 2, 2), (33, 1, 8), (34, 2, 8), (35, 2, 4), (36, 2, 4), (37, 2, 4), (38, 2, 4), (39, 2, 4), (40, 2, 4), 
(41, 2, 6), (42, 3, 6), (43, 2, 6), (44, 2, 6), (45, 3, 5), (46, 2, 4), (47, 2, 5), (48, 2, 2), (49, 1, 99), (50, 2, 3);


-- ===================================
-- 9. TABLES DE LIAISON (Relations)
-- ===================================

-- Suppression des insertions pour RESERVATION, EFFECTUER, CORRESPONDRE

INSERT INTO VERIFIER (id_admin, id_paiement) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 5);
-- Réduction des insertions de VERIFIER

INSERT INTO MODIFIER (id_admin, id_j) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 5);
-- Réduction des insertions de MODIFIER aux 5 jeux créés

-- Pour les 5 jeux créés (id_j 1 à 5)
INSERT INTO CREER (id_editeur, id_j) VALUES
(1, 1), (13, 1), (27, 1), 
(2, 2), (12, 2), 
(3, 3), (44, 3), 
(4, 4), (12, 4), 
(5, 5), (6, 5), (101, 5);
-- Simplification des insertions CREER

INSERT INTO HABITER (id_u, id_ad) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10), 
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15), (16, 16), (17, 17), (18, 18), (19, 19), (20, 20), 
(21, 21), (22, 22), (23, 23), (24, 24), (25, 25);

INSERT INTO AVOIR (id_j, id_r, description) VALUES
(1, 13, 'Jeu de gestion de ressources sur une île.'),
(2, 10, 'Jeu de cartes et de civilisation rapide.'),
(3, 5, 'Jeu de communication et d''imagination.'), -- CORRECTION : Doublage de l'apostrophe dans d'imagination
(4, 9, 'Jeu de pose de tuiles pour contrôler le territoire.'),
(5, 27, 'Jeu de stratégie et de pose de tuiles sur Mars.');
-- Réduction des insertions AVOIR

INSERT INTO LAISSER_UN_AVIS (id_u, id_j, date_publication, avis, note) VALUES
(1, 1, '2024-04-01', 'Le classique des jeux de plateau, un must-have!', 9),
(2, 2, '2024-04-02', 'Excellent pour les gros groupes, très rejouable.', 8),
(3, 3, '2024-04-03', 'Parfait pour le côté créatif et simple à apprendre.', 7),
(4, 4, '2024-04-04', 'Toujours un plaisir, idéal pour les débutants.', 8),
(5, 5, '2024-04-05', 'Complexe et profond, le meilleur jeu de l''année !', 10); -- CORRECTION : Doublage de l'apostrophe dans l'année
-- Réduction des insertions d'avis


INSERT INTO POINT_RETRAIT (nom, adresse, latitude, longitude) VALUES
('Relais Paris République', '12 Rue Bouchardon 75010 Paris', 48.8699, 2.3609),
('Relais Belleville', '103 Rue de Belleville 75019 Paris', 48.8778, 2.3884),
('Relais Bastille', '7 Rue de la Roquette 75011 Paris', 48.8534, 2.3710),
('Relais Nation', '25 Cours de Vincennes 75020 Paris', 48.8481, 2.4060),
('Relais Châtelet', '5 Rue Saint-Denis 75001 Paris', 48.8593, 2.3488);

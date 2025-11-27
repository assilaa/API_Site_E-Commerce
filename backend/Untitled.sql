select * from JEU;



INSERT INTO JEU (id_j, nom_j, prix, note_moyenne, users_rated, quantite, annee_publication)
SELECT 
  id, 
  `primary`, 
  Prix, 
  average, 
  users_rated, 
  1, 
  yearpublished
FROM jeux;


UPDATE JEU
SET id_j = (SELECT id_j FROM details);

WHERE table1.id = table2.id)
WHERE condition;

INSERT INTO JEU (id_j, nom_j, prix, note_moyenne, users_rated, quantite, annee_publication)
SELECT 
  id_j,
  nom_j,
  ROUND(1 + (RAND() * 4), 2),               -- prix entre 1.00 et 5.00 €
  ROUND(5 + (RAND() * 4.5), 2),             -- note entre 5.00 et 9.50
  FLOOR(100 + RAND() * 9900),              -- users_rated entre 100 et 10000
  FLOOR(1 + RAND() * 50),                  -- quantite entre 1 et 50
  année_publication
FROM details;



select * from details;

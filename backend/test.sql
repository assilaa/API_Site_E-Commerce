CREATE OR REPLACE VIEW vue_jeux_infos AS
SELECT 
  JEU.id_j AS id,
  JEU.nom_j AS nom,
  COALESCE(ANY_VALUE(REGLES.nbr_joueurs_max), 4) AS nb_joueurs,
  MIN(CATEGORIE.id_cat) AS id_cat,  -- pour permettre le filtrage
  GROUP_CONCAT(DISTINCT CATEGORIE.nom_cat ORDER BY CATEGORIE.nom_cat) AS categorie,  -- pour affichage
  48.85 + (RAND() / 100) AS lat,
  2.35 + (RAND() / 100) AS lng,
  GROUP_CONCAT(DISTINCT RESERVATION.date_debut ORDER BY date_debut) AS dates
FROM JEU
LEFT JOIN AVOIR ON JEU.id_j = AVOIR.id_j
LEFT JOIN REGLES ON AVOIR.id_r = REGLES.id_r
LEFT JOIN SE_TROUVER ON JEU.id_j = SE_TROUVER.id_j
LEFT JOIN CATEGORIE ON SE_TROUVER.id_cat = CATEGORIE.id_cat
LEFT JOIN EFFECTUER ON JEU.id_j = EFFECTUER.id_res
LEFT JOIN RESERVATION ON EFFECTUER.id_res = RESERVATION.id_res
GROUP BY 
  JEU.id_j, 
  JEU.nom_j
LIMIT 50;
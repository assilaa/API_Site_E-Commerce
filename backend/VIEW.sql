-- Cette vue peut afficher l'historique complet des locations, avec des informations sur les jeux et les utilisateurs qui les ont loués.
CREATE VIEW vue_historique_locations AS
SELECT 
    r.id_res, r.date_debut, r.date_fin, r.statut,
    u.nom_u AS utilisateur_nom, u.email_u AS utilisateur_email
FROM RESERVATION r
JOIN EFFECTUER e ON r.id_res = e.id_res
JOIN UTILISATEUR u ON e.id_u = u.id_u;


-- Cette vue peut afficher les jeux disponibles dans le stock, en excluant ceux qui sont actuellement loués.(en prévision d'expansion)
CREATE VIEW vue_jeux_disponibles AS
SELECT 
    j.id_j, j.nom_j, j.annee_publication, j.quantite, j.note_moyenne, j.users_rated, j.prix
FROM JEU j
WHERE j.quantite > 0;


-- Cette vue pourrait être utile pour avoir un aperçu complet des jeux disponibles et leurs éditeurs, afin de voir quelles éditions sont associées à chaque jeu.
CREATE VIEW vue_jeux_avec_editeurs AS
SELECT 
    j.id_j, j.nom_j, j.annee_publication, j.prix, j.note_moyenne,
    e.nom_editeur
FROM JEU j
JOIN CREER c ON j.id_j = c.id_j
JOIN EDITEUR e ON c.id_editeur = e.id_editeur;

-- Cela permettrait de voir quels jeux chaque utilisateur a loués et leur date de retour.
CREATE VIEW vue_historique_par_utilisateur AS
SELECT 
    u.id_u AS utilisateur_id,
    u.nom_u AS utilisateur_nom,
    r.id_res, r.date_debut, r.date_fin, r.statut
FROM UTILISATEUR u
JOIN EFFECTUER e ON u.id_u = e.id_u
JOIN RESERVATION r ON e.id_res = r.id_res;






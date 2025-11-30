-- 
DELIMITER $$

CREATE PROCEDURE louer_jeu (
    IN p_id_j INT,
    IN p_id_u INT,
    IN p_date_debut DATE,
    IN p_date_fin DATE
)
BEGIN
    DECLARE stock_actuel INT;
    DECLARE new_id_res INT;

    -- Vérifier le stock du jeu
    SELECT quantite INTO stock_actuel FROM JEU WHERE id_j = p_id_j;

    IF stock_actuel <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jeu actuellement indisponible.';
    ELSE
        -- Calculer l'ID de réservation suivant (évite le SELECT dans l'INSERT)
        SELECT IFNULL(MAX(id_res), 0) + 1 INTO new_id_res FROM RESERVATION;

        -- Insérer dans RESERVATION
        INSERT INTO RESERVATION (id_res, date_debut, date_fin, statut)
        VALUES (new_id_res, p_date_debut, p_date_fin, 'a venir');

        -- Lier l'utilisateur à la réservation
        INSERT INTO EFFECTUER (id_u, id_res) VALUES (p_id_u, new_id_res);

        -- Décrémenter le stock du jeu
        UPDATE JEU SET quantite = quantite - 1 WHERE id_j = p_id_j;
    END IF;
END$$

DELIMITER ;


-- 
DELIMITER $$

CREATE PROCEDURE retourner_jeu (
    IN p_id_j INT,
    IN p_id_u INT
)
BEGIN
    DECLARE res_id INT;

    -- Récupérer la dernière réservation de l'utilisateur
    SELECT r.id_res INTO res_id
    FROM RESERVATION r
    JOIN EFFECTUER e ON r.id_res = e.id_res
    WHERE e.id_u = p_id_u
    ORDER BY r.date_debut DESC
    LIMIT 1;

    -- Mettre à jour le statut de la réservation
    UPDATE RESERVATION SET statut = 'fini' WHERE id_res = res_id;

    -- Remettre le jeu en stock
    UPDATE JEU SET quantite = quantite + 1 WHERE id_j = p_id_j;
END$$

DELIMITER ;

-- Louer le jeu 2 pour l’utilisateur 1 du 2025-04-23 au 2025-04-30
CALL louer_jeu(2, 1, '2025-04-23', '2025-04-30');

-- Retour du jeu 2 par l’utilisateur 1
CALL retourner_jeu(2, 1);



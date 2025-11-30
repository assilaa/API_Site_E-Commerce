-- Ce trigger remplit automatiquement le champ statut d'une réservation à l'insertion.
DELIMITER $$

CREATE TRIGGER trg_maj_statut_reservation
BEFORE INSERT ON RESERVATION
FOR EACH ROW
BEGIN
    DECLARE today DATE;
    SET today = CURDATE();

    IF NEW.date_debut > today THEN
        SET NEW.statut = 'a venir';
    ELSEIF NEW.date_debut <= today AND NEW.date_fin >= today THEN
        SET NEW.statut = 'en cours';
    ELSE
        SET NEW.statut = 'fini';
    END IF;
END$$

DELIMITER ;

-- Automatiser les champs note_moyenne et users_rated.
DELIMITER $$

CREATE TRIGGER trg_maj_note_jeu
AFTER INSERT ON LAISSER_UN_AVIS
FOR EACH ROW
BEGIN
    UPDATE JEU
    SET 
        note_moyenne = (
            SELECT AVG(note)
            FROM LAISSER_UN_AVIS
            WHERE id_j = NEW.id_j
        ),
        users_rated = (
            SELECT COUNT(*)
            FROM LAISSER_UN_AVIS
            WHERE id_j = NEW.id_j
        )
    WHERE id_j = NEW.id_j;
END$$

DELIMITER ;





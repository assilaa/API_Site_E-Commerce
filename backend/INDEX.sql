-- Pour les recherches par nom
CREATE INDEX idx_jeu_nom ON JEU(nom_j);

-- Pour trier ou filtrer les jeux par note.
CREATE INDEX idx_jeu_note ON JEU(note_moyenne);

-- Pour consulter l’historique ou les réservations futures.
CREATE INDEX idx_reservation_dates ON RESERVATION(date_debut, date_fin);



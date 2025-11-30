import db from "../database.js"; // ← ton fichier de connexion MySQL

// 1) Obtenir les avis d’un jeu
export const getAvisByGame = (req, res) => {
  const { id_j } = req.params;

  db.query(
    "SELECT A.*, U.nom FROM AVIS A JOIN UTILISATEUR U ON A.id_user = U.id_user WHERE id_j = ?",
    [id_j],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result);
    }
  );
};

// 2) Créer avis + MAJ note moyenne
export const createAvis = (req, res) => {
  const { id_j, id_user, note, commentaire } = req.body;

  db.query(
    "INSERT INTO AVIS (id_j, id_user, note, commentaire) VALUES (?, ?, ?, ?)",
    [id_j, id_user, note, commentaire],
    (err) => {
      if (err) return res.status(500).json({ error: err });

      // ⬇ Mise à jour automatique de la note moyenne du jeu
      db.query(
        "UPDATE JEU SET note_moyenne = (SELECT AVG(note) FROM AVIS WHERE id_j = ?) WHERE id_j = ?",
        [id_j, id_j]
      );

      res.json({ message: "Avis ajouté avec succès." });
    }
  );
};

// 3) Supprimer un avis
export const deleteAvis = (req, res) => {
  const { id_avis } = req.params;

  db.query("DELETE FROM AVIS WHERE id_avis = ?", [id_avis], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ message: "Avis supprimé." });
  });
};

// backend/controller/avisController.js

import db from "../database.js"; // Connexion MySQL (inchangé)

// 1) Obtenir les avis d’un jeu
//    Accessible à tout utilisateur authentifié (middleware JWT appliqué dans les routes)
export const getAvisByGame = (req, res) => {
  const { id_j } = req.params;

  if (!id_j) {
    return res.status(400).json({ error: "Identifiant de jeu manquant." });
  }

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
//    L’id utilisateur vient du token JWT (req.user.id), pas du body
export const createAvis = (req, res) => {
  const { id_j, note, commentaire } = req.body;

  // req.user est rempli par ton middleware d’authentification JWT
  const user = req.user;

  if (!user || !user.id) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const id_user = user.id;

  if (!id_j || !note || commentaire == null) {
    return res.status(400).json({ error: "Données d'avis incomplètes." });
  }

  // Nettoyage simple du commentaire (tu peux ajouter xss, validator…)
  const commentaireNettoye = commentaire.toString().trim().slice(0, 1000);

  db.query(
    "INSERT INTO AVIS (id_j, id_user, note, commentaire) VALUES (?, ?, ?, ?)",
    [id_j, id_user, note, commentaireNettoye],
    (err) => {
      if (err) return res.status(500).json({ error: err });

      // Mise à jour de la note moyenne du jeu
      db.query(
        "UPDATE JEU SET note_moyenne = (SELECT AVG(note) FROM AVIS WHERE id_j = ?) WHERE id_j = ?",
        [id_j, id_j],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2 });
          res.json({ message: "Avis ajouté avec succès." });
        }
      );
    }
  );
};

// 3) Supprimer un avis
//    Idéalement : autoriser admin OU auteur de l’avis
export const deleteAvis = (req, res) => {
  const { id_avis } = req.params;
  const user = req.user; // { id, role } depuis le JWT

  if (!user || !user.id) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  if (!id_avis) {
    return res.status(400).json({ error: "Identifiant d'avis manquant." });
  }

  // Si admin, suppression directe
  if (user.role === "admin") {
    return db.query(
      "DELETE FROM AVIS WHERE id_avis = ?",
      [id_avis],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Avis supprimé." });
      }
    );
  }

  // Sinon : vérifier que l’avis appartient à l’utilisateur connecté
  db.query(
    "SELECT id_user FROM AVIS WHERE id_avis = ?",
    [id_avis],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Avis introuvable." });
      }

      const avis = rows[0];
      if (avis.id_user !== user.id) {
        return res.status(403).json({ error: "Suppression non autorisée." });
      }

      db.query(
        "DELETE FROM AVIS WHERE id_avis = ?",
        [id_avis],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2 });
          res.json({ message: "Avis supprimé." });
        }
      );
    }
  );
};

const express = require("express");
const router = express.Router();
const db = require("../database.js");

// Ajouter un avis
router.post("/", (req, res) => {
  const { id_j, id_user, note, commentaire } = req.body;

  // Vérification champs obligatoires
  if (!id_j || !id_user || !note) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  db.run(
    `INSERT INTO AVIS (id_j, id_user, note, commentaire, date_avis)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [id_j, id_user, note, commentaire],

    function (err) {
      if (err) {
        return res.status(500).json({
          error: "Erreur SQL : " + err.message,
        });
      }

      return res.json({
        success: true,
        id_avis: this.lastID,
      });
    }
  );
});

router.get("/:id_j", (req, res) => {
  const { id_j } = req.params;

  db.all(
    `SELECT * FROM AVIS WHERE id_j = ? ORDER BY date_avis DESC`,
    [id_j],
    (err, rows) => {
      if (err)
        return res.status(500).json({ error: "Erreur SQL : " + err.message });

      return res.json(rows);
    }
  );
});

module.exports = router;

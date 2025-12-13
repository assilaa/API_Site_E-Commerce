const express = require("express");
const router = express.Router();
const db = require("../database.js");
const { sanitizeUserInput } = require("./utils/security");

const pseudoSanitize = sanitizeUserInput(req.body.pseudo);


/* GET Avis d’un jeu */
router.get("/:id_j", (req, res) => {
  const { id_j } = req.params;

  const sql = `
    SELECT 
      A.id_avis,
      A.id_j,
      A.id_user,
      A.note,
      A.commentaire,
      A.date_avis,
      U.pseudo_u AS nom_user
    FROM AVIS A
    LEFT JOIN UTILISATEUR U ON U.id_u = A.id_user
    WHERE A.id_j = ?
    ORDER BY A.date_avis DESC
  `;

  db.all(sql, [id_j], (err, rows) => {
    if (err) {
      console.error("Erreur SQL GET AVIS:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(rows);
  });
});

/* POST Ajouter un avis */
router.post("/", (req, res) => {
  const { id_j, id_user, note, commentaire } = req.body;

  if (!id_j || !id_user || !note) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  const sql = `
    INSERT INTO AVIS (id_j, id_user, note, commentaire, date_avis)
    VALUES (?, ?, ?, ?, datetime('now'))
  `;

  db.run(sql, [id_j, id_user, note, commentaire], function (err) {
    if (err) {
      console.error("Erreur SQL POST AVIS:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, id_avis: this.lastID });
  });
});

/* DELETE Supprimer un avis (auteur uniquement) */
router.delete("/:id_avis/:id_user", (req, res) => {
  const { id_avis, id_user } = req.params;

  const checkSql = `SELECT id_user FROM AVIS WHERE id_avis = ?`;

  db.get(checkSql, [id_avis], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Avis introuvable" });
    if (String(row.id_user) !== String(id_user))
      return res.status(403).json({ error: "Non autorisé" });

    const deleteSql = `DELETE FROM AVIS WHERE id_avis = ?`;

    db.run(deleteSql, [id_avis], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      return res.json({ success: true });
    });
  });
});

module.exports = router;

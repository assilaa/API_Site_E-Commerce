const express = require("express");
const router = express.Router();
const db = require("../database.js");
const tf = require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");
const { sanitizeUserInput } = require("./utils/security");

const pseudoSanitize = sanitizeUserInput(req.body.pseudo);


let model = null;

// Charger le modèle une seule fois
(async () => {
  model = await use.load();
  console.log("🤖 Modèle IA chargé !");
})();

// Similarité cosinus simple
function cosine(A, B) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < A.length; i++) {
    dot += A[i] * B[i];
    normA += A[i] ** 2;
    normB += B[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ---------------------------------------------------
   🔥 1) IA : Trouver recommandations basées SUR AVIS
-----------------------------------------------------*/
router.get("/from-user/:id_user", (req, res) => {
  const id_user = req.params.id_user;

  // Sélectionner les jeux que l’utilisateur a bien notés
  const sqlUserLiked = `
    SELECT J.id_j, J.nom_j, J.embedding, J.categories, J.minplayers, J.maxplayers
    FROM AVIS A
    JOIN JEU J ON J.id_j = A.id_j
    WHERE A.id_user = ? AND A.note >= 7
  `;

  db.all(sqlUserLiked, [id_user], (err, likedGames) => {
    if (err) return res.status(500).json({ error: err.message });

    if (likedGames.length === 0) return res.json([]);

    db.all("SELECT * FROM JEU", async (err2, allGames) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const reco = [];

      for (const game of allGames) {
        if (!game.embedding) continue;

        const embGame = JSON.parse(game.embedding);

        let score = 0;

        for (const userGame of likedGames) {
          const embUser = JSON.parse(userGame.embedding);
          const similarity = cosine(embUser, embGame);

          // Bonus IA sur catégories + joueurs similaires
          let bonus = 0;

          if (userGame.categories === game.categories) bonus += 0.3;

          const overlap =
            Math.min(userGame.maxplayers, game.maxplayers) -
            Math.max(userGame.minplayers, game.minplayers);

          if (overlap >= 0) bonus += 0.2;

          score += similarity + bonus;
        }

        if (score > 0.75) {
          reco.push({
            ...game,
            score: score.toFixed(3),
          });
        }
      }

      reco.sort((a, b) => b.score - a.score);

      res.json(reco.slice(0, 10));
    });
  });
});

/* ---------------------------------------------------
   🔥 2) Sauvegarder une recommandation utilisateur
-----------------------------------------------------*/
router.post("/save", async (req, res) => {
  const { id_user, id_j } = req.body;

  if (!id_user || !id_j)
    return res.status(400).json({ error: "Champs manquants." });

  try {
    await db.run(
      "INSERT INTO RECOMMANDATION_USER (id_user, id_j) VALUES (?, ?)",
      [id_user, id_j]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------
   🔥 3) Lire les recommandations sauvegardées
-----------------------------------------------------*/
router.get("/user/:id_user", (req, res) => {
  const { id_user } = req.params;

  db.all(
    `SELECT r.id_j, j.nom_j, j.categories, j.description,
            j.minplayers, j.maxplayers, j.prix
     FROM RECOMMANDATION_USER r
     JOIN JEU j ON j.id_j = r.id_j
     WHERE r.id_user = ?
     ORDER BY r.id_rec DESC`,
    [id_user],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const db = require("../database");

// function cosineSimilarity(a, b) {
//   let dot = 0,
//     na = 0,
//     nb = 0;
//   for (let i = 0; i < a.length; i++) {
//     dot += a[i] * b[i];
//     na += a[i] * a[i];
//     nb += b[i] * b[i];
//   }
//   return dot / (Math.sqrt(na) * Math.sqrt(nb));
// }

// router.get("/jeu/:id_j", (req, res) => {
//   const id_j = req.params.id_j;

//   db.all(`SELECT id_j, nom_j, embedding FROM JEU`, async (err, jeux) => {
//     if (err) return res.status(500).json({ error: err.message });

//     const jeuSource = jeux.find((j) => j.id_j == id_j);
//     if (!jeuSource || !jeuSource.embedding) return res.json([]);

//     const embSource = JSON.parse(jeuSource.embedding);

//     let scores = [];

//     for (const jeu of jeux) {
//       if (jeu.id_j == id_j) continue;
//       const emb = JSON.parse(jeu.embedding);
//       const sim = cosineSimilarity(embSource, emb);
//       scores.push({ ...jeu, score: sim });
//     }

//     scores.sort((a, b) => b.score - a.score);

//     res.json(scores.slice(0, 5)); // top 5
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../database.js");
const tf = require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");

let model = null;

// Charger le modèle IA une seule fois
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
   🔥 ROUTE DEMANDÉE PAR TON FRONT :
      /api/recommandations/utilisateur/:id_user
-----------------------------------------------------*/
router.get("/utilisateur/:id_user", (req, res) => {
  const id_user = req.params.id_user;

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

      res.json(reco.slice(0, 3));
    });
  });
});

/* ------------------------------------------
   AUTRES ROUTES (optionnel)
-------------------------------------------*/
router.post("/save", (req, res) => {
  const { id_user, id_j } = req.body;

  if (!id_user || !id_j)
    return res.status(400).json({ error: "Champs manquants." });

  db.run(
    "INSERT INTO RECOMMANDATION_USER (id_user, id_j) VALUES (?, ?)",
    [id_user, id_j],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

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

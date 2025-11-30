const express = require("express");
const router = express.Router();
const db = require("../database");

function cosineSimilarity(a, b) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

router.get("/jeu/:id_j", (req, res) => {
  const id_j = req.params.id_j;

  db.all(`SELECT id_j, nom_j, embedding FROM JEU`, async (err, jeux) => {
    if (err) return res.status(500).json({ error: err.message });

    const jeuSource = jeux.find((j) => j.id_j == id_j);
    if (!jeuSource || !jeuSource.embedding) return res.json([]);

    const embSource = JSON.parse(jeuSource.embedding);

    let scores = [];

    for (const jeu of jeux) {
      if (jeu.id_j == id_j) continue;
      const emb = JSON.parse(jeu.embedding);
      const sim = cosineSimilarity(embSource, emb);
      scores.push({ ...jeu, score: sim });
    }

    scores.sort((a, b) => b.score - a.score);

    res.json(scores.slice(0, 5)); // top 5
  });
});

module.exports = router;

// routes/recommend.js
const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const tf = require("@tensorflow/tfjs-node");
const { sanitizeUserInput } = require("./utils/security");

const pseudoSanitize = sanitizeUserInput(req.body.pseudo);


router.get("/:id_user", async (req, res) => {
  try {
    const id_user = req.params.id_user;

    const db = await open({
      filename: "./bdd.db",
      driver: sqlite3.Database,
    });

    // 1️⃣ Récupère les jeux achetés par l'utilisateur
    const achats = await db.all(
      `
        SELECT DISTINCT id_j FROM ACHAT WHERE id_user = ?
    `,
      [id_user]
    );

    if (achats.length === 0) {
      return res.json([]); // pas de recommandations
    }

    // 2️⃣ Récupère embeddings des jeux achetés
    const achetes = await db.all(`
        SELECT id_j, embedding FROM JEU WHERE id_j IN (${achats
          .map((a) => a.id_j)
          .join(",")})
    `);

    // Moyenne des embeddings comme "profil utilisateur"
    const embedList = achetes.map((j) => JSON.parse(j.embedding));
    const userProfile = tf.tensor([
      embedList.reduce((a, b) => a.map((v, i) => v + b[i])),
    ]);
    const avg = userProfile.div(embedList.length);

    // 3️⃣ Récupère tous les autres jeux
    const jeux = await db.all(`
        SELECT id_j, nom_j, prix, embedding 
        FROM JEU 
        WHERE embedding IS NOT NULL
    `);

    let recommandations = [];

    for (const jeu of jeux) {
      const v = tf.tensor([JSON.parse(jeu.embedding)]);
      const score = tf.losses.cosineDistance(avg, v, 1).dataSync()[0];

      recommandations.push({
        id_j: jeu.id_j,
        nom_j: jeu.nom_j,
        prix: jeu.prix,
        score,
      });
    }

    recommandations.sort((a, b) => a.score - b.score);

    res.json(recommandations.slice(0, 10));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur interne" });
  }
});

module.exports = router;

// // const use = require("@tensorflow-models/universal-sentence-encoder");
// // const tf = require("@tensorflow/tfjs-node");
// // const sqlite3 = require("sqlite3");
// // const { open } = require("sqlite");

// // (async () => {
// //   let db;
// //   try {
// //     console.log("Chargement du modèle USE…");
// //     const model = await use.load();
// //     console.log("✅ Modèle USE chargé.");

// //     db = await open({
// //       filename: "./bdd.db",
// //       driver: sqlite3.Database,
// //     });

// //     // Active les foreign keys
// //     await db.exec("PRAGMA foreign_keys = ON;");

// //     // Vérification/Ajout de la colonne 'embedding'
// //     await db
// //       .exec(
// //         `
// //         ALTER TABLE JEU
// //           ADD COLUMN embedding TEXT;
// //       `
// //       )
// //       .catch(() => {});

// //     // Récupération des jeux sans embedding existant (on ne sélectionne pas la description pour l'encodage)
// //     const jeux = await db.all(
// //       "SELECT id_j, nom_j FROM JEU WHERE embedding IS NULL OR embedding = ''"
// //     );

// //     console.log(`➡ ${jeux.length} jeux à traiter.`);

// //     if (jeux.length === 0) {
// //       console.log("Aucun nouveau jeu sans embedding trouvé. Terminé.");
// //       return;
// //     }

// //     for (const jeu of jeux) {
// //       try {
// //         // ENCODAGE : Utilise uniquement le nom du jeu
// //         const text = jeu.nom_j;

// //         console.log(`Encodage : ${jeu.nom_j}…`);

// //         const embedding = await model.embed([text]);
// //         const vector = embedding.arraySync()[0];

// //         await db.run(`UPDATE JEU SET embedding = ? WHERE id_j = ?`, [
// //           JSON.stringify(vector),
// //           jeu.id_j,
// //         ]);
// //       } catch (err) {
// //         console.error(`Erreur sur le jeu ID ${jeu.id_j}:`, err);
// //       }
// //     }

// //     console.log("✅ Embeddings générés !");
// //   } catch (globalError) {
// //     console.error(
// //       "🛑 Erreur critique lors de l'exécution du script:",
// //       globalError
// //     );
// //   } finally {
// //     // Fermeture de la BDD
// //     if (db) await db.close();
// //   }
// // })();

// // generate_embeddings.js
// const use = require("@tensorflow-models/universal-sentence-encoder");
// const tf = require("@tensorflow/tfjs-node");
// const sqlite3 = require("sqlite3");
// const { open } = require("sqlite");
// const path = require("path");

// (async () => {
//   const DB_FILE = path.join(__dirname, "bdd.db");

//   let db;
//   try {
//     console.log("Chargement du modèle USE…");
//     const model = await use.load();
//     console.log("✅ Modèle USE chargé.");

//     db = await open({
//       filename: DB_FILE,
//       driver: sqlite3.Database,
//     });

//     await db.exec("PRAGMA foreign_keys = ON;");

//     // Sélection des jeux qui n'ont pas d'embedding
//     const jeux = await db.all(
//       `SELECT id_j, nom_j, description, categories, minplayers, maxplayers
//        FROM JEU
//        WHERE embedding IS NULL OR embedding = ''`
//     );

//     console.log(`➡ ${jeux.length} jeux à encoder...`);

//     for (const jeu of jeux) {
//       try {
//         const players =
//           jeu.minplayers && jeu.maxplayers
//             ? `${jeu.minplayers}-${jeu.maxplayers}`
//             : jeu.minplayers
//             ? `${jeu.minplayers}`
//             : "";
//         const text = `${jeu.nom_j || ""} . ${
//           jeu.description || ""
//         } . Categories: ${jeu.categories || ""} . Players: ${players}`;

//         console.log(`Encodage : ${jeu.nom_j}…`);
//         const embTensor = await model.embed([text]);
//         const vector = embTensor.arraySync()[0];
//         embTensor.dispose();

//         await db.run(`UPDATE JEU SET embedding = ? WHERE id_j = ?`, [
//           JSON.stringify(vector),
//           jeu.id_j,
//         ]);
//       } catch (e) {
//         console.error(`Erreur encodage jeu id ${jeu.id_j}:`, e.message || e);
//       }
//     }

//     console.log("✅ Embeddings générés.");
//   } catch (e) {
//     console.error("Erreur critique:", e);
//   } finally {
//     if (db) await db.close();
//   }
// })();

const use = require("@tensorflow-models/universal-sentence-encoder");
const tf = require("@tensorflow/tfjs-node");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

(async () => {
  let db;
  try {
    console.log("Chargement du modèle USE…");
    const model = await use.load();
    console.log("✅ Modèle USE chargé.");

    db = await open({
      filename: "./bdd.db",
      driver: sqlite3.Database,
    });

    await db.exec("PRAGMA foreign_keys = ON;");

    await db
      .exec(
        `
      ALTER TABLE JEU ADD COLUMN embedding TEXT;
    `
      )
      .catch(() => {});

    const jeux = await db.all(`
      SELECT id_j, nom_j, description, categories, minplayers, maxplayers
      FROM JEU
      WHERE embedding IS NULL OR embedding = ''
    `);

    console.log(`➡ ${jeux.length} jeux à encoder...`);

    for (const jeu of jeux) {
      const texte =
        `${jeu.nom_j}. ${jeu.description}. ` +
        `Catégories : ${jeu.categories}. ` +
        `Joueurs : ${jeu.minplayers}-${jeu.maxplayers}`;

      console.log("Encodage :", jeu.nom_j);

      const emb = await model.embed([texte]);
      const vecteur = emb.arraySync()[0];

      await db.run("UPDATE JEU SET embedding = ? WHERE id_j = ?", [
        JSON.stringify(vecteur),
        jeu.id_j,
      ]);
    }

    console.log("🔥 Embeddings mis à jour !");
  } finally {
    if (db) db.close();
  }
})();

// const sqlite3 = require("sqlite3").verbose();
// const path = require("path");

// // ⚠ adapte le chemin si besoin (ici on suppose que jeux.json est dans le même dossier)
// const JEUX_JSON_PATH = path.join(__dirname, "jeux.json");

// // Chargement du JSON
// const jeux = require(JEUX_JSON_PATH);

// // Connexion à la base
// const db = new sqlite3.Database(path.join(__dirname, "bdd.db"));

// db.serialize(() => {
//   console.log("🗑 Suppression des anciens jeux...");
//   db.run("DELETE FROM JEU;", (err) => {
//     if (err) {
//       console.error("Erreur DELETE FROM JEU :", err.message);
//       process.exit(1);
//     }

//     console.log("📥 Insertion des jeux depuis jeux.json...");

//     const stmt = db.prepare(`
//       INSERT INTO JEU (id_j, nom_j, prix, note_moyenne, users_rated, quantite, annee_publication)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `);

//     jeux.forEach((g) => {
//       const id = parseInt(g.id, 10);
//       const nom = g.primary;
//       const prix = parseFloat(g.Prix || 0);
//       const note = parseFloat(g.average || 0);
//       const users = parseInt(g.users_rated || 0, 10);
//       const year = parseInt(g.yearpublished || 0, 10);
//       const quantite = 50;

//       stmt.run(id, nom, prix, note, users, quantite, year, (err2) => {
//         if (err2) {
//           console.error(
//             `Erreur insertion jeu id=${id} (${nom}) :`,
//             err2.message
//           );
//         }
//       });
//     });

//     stmt.finalize((err3) => {
//       if (err3) {
//         console.error("Erreur finalisation statement :", err3.message);
//       } else {
//         console.log("✅ Import des jeux terminé avec succès.");
//       }
//       db.close();
//     });
//   });
// });

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// ⚠ adapte le chemin si besoin
const JEUX_JSON_PATH = path.join(__dirname, "jeux.json");

// Chargement du JSON
if (!fs.existsSync(JEUX_JSON_PATH)) {
  console.error("❌ ERREUR : jeux.json introuvable !");
  process.exit(1);
}
const jeux = require(JEUX_JSON_PATH);

// Connexion BDD
const db = new sqlite3.Database(path.join(__dirname, "bdd.db"));

db.serialize(async () => {
  console.log("🔧 Vérification des colonnes…");

  // Vérifier colonnes existantes
  const tableInfo = await new Promise((resolve) => {
    db.all("PRAGMA table_info('JEU');", (err, rows) => resolve(rows || []));
  });

  const columns = tableInfo.map((c) => c.name);

  // Fonction utilitaire : ajouter colonne si manquante
  function addColumn(name, def) {
    if (!columns.includes(name)) {
      console.log(`➕ Ajout colonne ${name}`);
      db.run(`ALTER TABLE JEU ADD COLUMN ${name} ${def};`);
    }
  }

  addColumn("description", "TEXT");
  addColumn("categories", "TEXT");
  addColumn("minplayers", "INTEGER");
  addColumn("maxplayers", "INTEGER");
  addColumn("embedding", "TEXT"); // utilisé par l'IA

  console.log("🗑 Suppression des anciens jeux...");
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM JEU;", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log("📥 Insertion des jeux depuis jeux.json...");

  // Nouvelle insertion complète
  const stmt = db.prepare(`
    INSERT INTO JEU (
      id_j, nom_j, prix, note_moyenne, users_rated, quantite,
      annee_publication, description, categories, minplayers, maxplayers
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const g of jeux) {
    const id = parseInt(g.id, 10);
    const nom = g.primary || g.name || "Sans nom";

    const prix = parseFloat(g.Prix || 0);
    const note = parseFloat(g.average || 0);
    const users = parseInt(g.users_rated || 0, 10);
    const year = parseInt(g.yearpublished || 0, 10);
    const quantite = 50;

    const description = (g.description || "").trim();

    // --- Catégories ---
    let cats = "";
    try {
      if (
        typeof g.boardgamecategory === "string" &&
        g.boardgamecategory.startsWith("[")
      ) {
        cats = JSON.parse(g.boardgamecategory.replace(/'/g, '"')).join(", ");
      } else if (Array.isArray(g.boardgamecategory)) {
        cats = g.boardgamecategory.join(", ");
      } else {
        cats = String(g.boardgamecategory || "");
      }
    } catch {
      cats = String(g.boardgamecategory || "");
    }

    // --- Joueurs ---
    const minp = g.minplayers ? parseInt(g.minplayers) : null;
    const maxp = g.maxplayers ? parseInt(g.maxplayers) : null;

    stmt.run(
      id,
      nom,
      prix,
      note,
      users,
      quantite,
      year,
      description,
      cats,
      minp,
      maxp,
      (err) => {
        if (err) {
          console.error(`❌ Erreur insertion jeu ID=${id} :`, err.message);
        }
      }
    );
  }

  stmt.finalize((err) => {
    if (err) {
      console.error("❌ Erreur finalisation :", err.message);
    } else {
      console.log("✅ Import terminé !");
      console.log(
        "ℹ Tu peux maintenant exécuter : node generate_embeddings.js"
      );
    }

    db.close();
  });
});

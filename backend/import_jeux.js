const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ⚠ adapte le chemin si besoin (ici on suppose que jeux.json est dans le même dossier)
const JEUX_JSON_PATH = path.join(__dirname, "jeux.json");

// Chargement du JSON
const jeux = require(JEUX_JSON_PATH);

// Connexion à la base
const db = new sqlite3.Database(path.join(__dirname, "bdd.db"));

db.serialize(() => {
  console.log("🗑 Suppression des anciens jeux...");
  db.run("DELETE FROM JEU;", (err) => {
    if (err) {
      console.error("Erreur DELETE FROM JEU :", err.message);
      process.exit(1);
    }

    console.log("📥 Insertion des jeux depuis jeux.json...");

    const stmt = db.prepare(`
      INSERT INTO JEU (id_j, nom_j, prix, note_moyenne, users_rated, quantite, annee_publication)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    jeux.forEach((g) => {
      const id = parseInt(g.id, 10);
      const nom = g.primary;
      const prix = parseFloat(g.Prix || 0);
      const note = parseFloat(g.average || 0);
      const users = parseInt(g.users_rated || 0, 10);
      const year = parseInt(g.yearpublished || 0, 10);
      const quantite = 50;

      stmt.run(id, nom, prix, note, users, quantite, year, (err2) => {
        if (err2) {
          console.error(
            `Erreur insertion jeu id=${id} (${nom}) :`,
            err2.message
          );
        }
      });
    });

    stmt.finalize((err3) => {
      if (err3) {
        console.error("Erreur finalisation statement :", err3.message);
      } else {
        console.log("✅ Import des jeux terminé avec succès.");
      }
      db.close();
    });
  });
});

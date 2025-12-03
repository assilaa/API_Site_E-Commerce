const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const JEUX_JSON_PATH = path.join(__dirname, "jeux.json");
const jeux = require(JEUX_JSON_PATH);

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
      INSERT INTO JEU 
      (id_j, nom_j, prix, note_moyenne, users_rated, quantite, annee_publication, categorie, min_players, max_players, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jeux.forEach((g) => {
      const id = parseInt(g.id, 10);
      const nom = g.primary;
      const prix = parseFloat(g.Prix || 0);
      const note = parseFloat(g.average || 0);
      const users = parseInt(g.users_rated || 0, 10);
      const year = parseInt(g.yearpublished || 0, 10);
      const quantite = 50;

      // NOUVEAU ↓↓↓
      const categorie = (() => {
        if (!g.boardgamecategory) return "";

        // Exemple : "['Negotiation']"
        let raw = g.boardgamecategory;

        // Nettoyage : enlever [ ] et ' '
        raw = raw.replace(/[\[\]']+/g, "");

        // Garder le premier élément si plusieurs catégories séparées par virgules
        return raw.split(",")[0].trim();
      })();

      const minPlayers = g.minplayers || null;
      const maxPlayers = g.maxplayers || null;
      const description = g.description || "Aucune description disponible";

      stmt.run(
        id,
        nom,
        prix,
        note,
        users,
        quantite,
        year,
        categorie,
        minPlayers,
        maxPlayers,
        description,
        (err2) => {
          if (err2) {
            console.error(`Erreur insertion jeu id=${id} (${nom}) :`, err2.message);
          }
        }
      );
    });

    stmt.finalize(() => {
      console.log("✅ Import terminé.");
      db.close();
    });
  });
});

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./bdd.db", (err) => {
  if (err) console.error("❌ Erreur connexion SQLite :", err.message);
  else console.log("📌 Connecté à la base SQLite !");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS AVIS (
      id_avis INTEGER PRIMARY KEY AUTOINCREMENT,
      id_j INTEGER NOT NULL,
      id_user INTEGER NOT NULL,
      note INTEGER CHECK (note BETWEEN 1 AND 10),
      commentaire TEXT,
      date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_j) REFERENCES JEU(id_j),
      FOREIGN KEY (id_user) REFERENCES UTILISATEUR(id_user)
    );
  `);
});

module.exports = db;

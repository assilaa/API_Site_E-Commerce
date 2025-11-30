const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./bdd.db");

const columns = {
  description: "TEXT",
  categories: "TEXT",
  minplayers: "INTEGER",
  maxplayers: "INTEGER",
  embedding: "TEXT",
};

db.serialize(() => {
  db.all("PRAGMA table_info('JEU');", (err, rows) => {
    if (err) throw err;

    const existing = rows.map((r) => r.name);

    for (const col in columns) {
      if (!existing.includes(col)) {
        console.log("➕ Ajout colonne", col);
        db.run(`ALTER TABLE JEU ADD COLUMN ${col} ${columns[col]};`);
      } else {
        console.log("✔ Colonne déjà présente :", col);
      }
    }

    db.close();
  });
});

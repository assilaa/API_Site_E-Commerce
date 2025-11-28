const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./bdd.db");

const tablesSql = fs.readFileSync("./tables.sql", "utf8");
const insertSql = fs.readFileSync("./insertion.sql", "utf8");

db.exec(tablesSql, err => {
  if (err) return console.error("Erreur tables.sql :", err);

  console.log("Tables créées.");

  db.exec(insertSql, err2 => {
    if (err2) return console.error("Erreur insertion.sql :", err2);

    console.log("Données insérées.");
    console.log("✔ Base SQLite prête !");
    db.close();
  });
});

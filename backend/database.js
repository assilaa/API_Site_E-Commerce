import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./bdd.db", (err) => {
  if (err) console.error("❌ Erreur connexion SQLite :", err.message);
  else console.log("📌 Connecté à la base SQLite !");
});

export default db;

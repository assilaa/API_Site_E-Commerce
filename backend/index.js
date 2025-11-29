const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");
 
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // ton frontend
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
const port = 3000;
const db = new sqlite3.Database("./bdd.db");

// Active les foreign keys dans SQLite
db.run("PRAGMA foreign_keys = ON;");

// Middleware JSON et CORS
app.use(express.json());
app.use(cors());

// ===============================================
// UTILITAIRES SQLITE ASYNC
// ===============================================
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// ===============================================
//  ROUTES API
// ===============================================

// 1. Lecture des jeux (liste tout le stock produit pour achat)
app.get("/api/jeux", async (req, res) => {
  try {
    const jeux = await dbAll("SELECT * FROM JEU");
    res.json(jeux);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des jeux." });
  }
});

// 2. Authentification utilisateur/admin par pseudo et mot de passe
app.post("/api/login", async (req, res) => {
  const { pseudo, password } = req.body;
  if (!pseudo || !password) {
    return res.status(400).json({ error: "Pseudo et mot de passe requis." });
  }
  try {
    // Admin d'abord
    const admins = await dbAll(
      "SELECT id_admin, password_admin FROM ADMINISTRATEUR WHERE pseudo_admin = ?",
      [pseudo]
    );
    if (admins.length > 0) {
      const admin = admins[0];
      const match = await bcrypt.compare(password, admin.password_admin.trim());
      if (match) {
        return res.json({
          role: "admin",
          userId: admin.id_admin,
          message: "Connexion Admin réussie",
        });
      }
    }
    // Utilisateur ensuite
    const users = await dbAll(
      "SELECT id_u, password_u FROM UTILISATEUR WHERE pseudo_u = ?",
      [pseudo]
    );
    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(password, user.password_u.trim());
      if (match) {
        return res.json({
          role: "user",
          userId: user.id_u,
          message: "Connexion Utilisateur réussie",
        });
      }
    }
    res.status(401).json({ error: "Identifiants invalides" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
});

// 3. ACHAT jeu (transactionnelle, logique achat/vente)
app.post("/api/acheter", (req, res) => {
  const { id_jeu, id_user, quantite_achetee, id_point_retrait } = req.body;
  
  // Vérification des données d'achat
  if (!id_jeu || !id_user || !quantite_achetee || quantite_achetee <= 0 || !id_point_retrait) {
    return res.status(400).json({ error: "Données d'achat incomplètes ou invalides." });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");

    // Récupérer les informations sur le jeu et vérifier la disponibilité du stock
    db.get("SELECT quantite, prix FROM JEU WHERE id_j = ?", [id_jeu], (err, row) => {
      if (err || !row) {
        console.log("❌ SQL ERROR SELECT:", err);
        db.run("ROLLBACK;");
        return res.status(500).json({ error: "Jeu introuvable ou erreur de stock." });
      }
      
      if (row.quantite < quantite_achetee) {
        db.run("ROLLBACK;");
        return res.status(409).json({ error: "Stock insuffisant pour cet achat." });
      }

      const nouveauStock = row.quantite - quantite_achetee;
      const montantTotal = row.prix * quantite_achetee;

      // Mettre à jour le stock du jeu
      db.run("UPDATE JEU SET quantite = ? WHERE id_j = ?", [nouveauStock, id_jeu], (err2) => {
        if (err2) {
          console.log("❌ SQL ERROR UPDATE JEU:", err2);
          db.run("ROLLBACK;");
          return res.status(500).json({ error: "Erreur lors de la mise à jour du stock." });
        }

        // Enregistrer l'achat avec le point de retrait
        db.run(
          'INSERT INTO ACHAT (id_u, id_j, id_point_retrait, date_achat, quantite_achetee) VALUES (?, ?, ?, DATE("now"), ?)',
          [id_user, id_jeu, id_point_retrait, quantite_achetee],
          (err3) => {
            if (err3) {
              console.log("❌ SQL ERROR INSERT ACHAT:", err3);
              db.run("ROLLBACK;");
              return res.status(500).json({ error: "Erreur lors de l'enregistrement de l'achat." });
            }
            db.run("COMMIT;", (err4) => {
              if (err4) {
                return res.status(500).json({ error: "Erreur lors de la finalisation de l'achat." });
              }

              res.json({
                message: `Achat de ${quantite_achetee} unités enregistré. Stock mis à jour à ${nouveauStock}. Montant total: ${montantTotal.toFixed(2)}€. Point de retrait sélectionné : ${id_point_retrait}`,
                nouveau_stock: nouveauStock,
              });
            });
          }
        );
      });
    });
  });
});


// (Optionnel) Reset password pour debug dev uniquement
app.post("/api/reset-password-test", async (req, res) => {
  const userId = 1;
  const newPlainPassword = "password";
  const saltRounds = 10;
  try {
    const newHash = await bcrypt.hash(newPlainPassword, saltRounds);
    await dbRun("UPDATE UTILISATEUR SET password_u = ? WHERE id_u = ?", [
      newHash,
      userId,
    ]);
    await dbRun(
      "UPDATE ADMINISTRATEUR SET password_admin = ? WHERE id_admin = 1",
      [newHash]
    );
    res.json({
      message: `SUCCESS: Hachage réinitialisé pour l'utilisateur 1 et l'Admin 1.`,
      newHashSample: newHash.substring(0, 20) + "...",
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur serveur lors de la réinitialisation du hachage.",
    });
  }
});

app.post("/api/signup", async (req, res) => {
  const { pseudo, password, email, nom, prenom } = req.body;

  if (!pseudo || !password || !email || !nom || !prenom) {
    return res.status(400).json({ error: "Données d'inscription incomplètes." });
  }

  try {
    // Vérifier unicité pseudo/email
    const existing = await dbAll(
      "SELECT 1 FROM UTILISATEUR WHERE pseudo_u = ? OR email_u = ?",
      [pseudo, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Pseudo ou email déjà utilisé." });
    }

    // Hash du mot de passe
    const hash = await bcrypt.hash(password, 10);

    await dbRun(
      "INSERT INTO UTILISATEUR (pseudo_u, password_u, email_u, nom_u, prenom_u) VALUES (?, ?, ?, ?, ?)",
      [pseudo, hash, email, nom, prenom]
    );

    res.json({ message: "Inscription réussie." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

// Charger les catégories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await dbAll("SELECT * FROM CATEGORIE");
    res.json(categories);
  } catch (error) {
    console.log("ERREUR /api/categories :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des catégories." });
  }
});



// ===============================================
// Lancement serveur Express
// ===============================================
db.on("open", () => {
  console.log("Connecté à la base de données SQLite.");

  app.listen(port, () => {
    console.log(
      `Serveur backend LudoMap (Achat/Vente) lancé sur http://localhost:${port}`
    );
  });
});
db.on("error", (err) => {
  console.error("Erreur de connexion à la base de données:", err.message);
});

app.get("/api/mes-achats/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const achats = await dbAll(
      `SELECT a.id_achat, a.date_achat, a.quantite_achetee, j.nom_j, j.prix
       FROM ACHAT a
       JOIN JEU j ON a.id_j = j.id_j
       WHERE a.id_u = ?
       ORDER BY a.date_achat DESC`,
      [userId]
    );
    res.json(achats);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des achats." });
  }
});

// Fonction helper : calcul Haversine
// Fonction helper : calcul Haversine
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}




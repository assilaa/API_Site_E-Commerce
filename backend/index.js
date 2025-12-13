const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit"); 
const xss = require("xss");



const app = express();
const port = 3000;
const JWT_SECRET = "superSecret"; 
const db = new sqlite3.Database("./bdd.db");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: "Trop de tentatives de connexion, réessayez plus tard." },
});

// ===============================================
// MIDDLEWARE JWT
// ===============================================
const authJwt = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide." });
  }
};

// ===============================================
// MIDDLEWARE
// ===============================================
app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));
app.use(express.json());

const helmet = require("helmet");
app.use(helmet());


// ===============================================
// UTILITAIRES SQLITE ASYNC
// ===============================================
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(`Erreur SQL dans dbAll (${sql}):`, err.message);
        reject(err);
      } else {
        resolve(rows);
      }
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

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ===============================================
// INITIALISATION BDD
// ===============================================
function initializeDatabaseAndLaunchServer() {
  try {
    console.log("Connecté à la base de données SQLite.");
    const tablesSql = fs.readFileSync("./tables.sql", "utf8");
    const insertSql = fs.readFileSync("./insertion.sql", "utf8");

    db.exec(tablesSql, (err) => {
      if (err) {
        return console.error("Erreur tables.sql:", err);
      }
      console.log("Tables créées.");

      db.exec(insertSql, (err2) => {
        if (err2) {
          return console.error("Erreur insertion.sql:", err2);
        }
        console.log("Données insérées. ✔ Base SQLite prête !");
        app.listen(port, () => {
          console.log(`Serveur LudoMap lancé sur http://localhost:${port}`);
        });
      });
    });
  } catch (e) {
    console.error("Erreur fichiers SQL:", e.message);
  }
}

// Active foreign keys
db.run("PRAGMA foreign_keys = ON;");

// ===============================================
// ROUTES API (PROTÉGÉES PAR JWT)
// ===============================================
// Panier
app.post("/api/panier/ajouter", authJwt, async (req, res) => {
  const { id_jeu, quantite_demandee } = req.body;
  const id_user = req.user.id;

  if (!id_jeu || !quantite_demandee || quantite_demandee <= 0) {
    return res.status(400).json({ error: "Données panier invalides." });
  }

  try {
    const jeu = await dbGet("SELECT quantite FROM JEU WHERE id_j = ?", [id_jeu]);
    if (!jeu || jeu.quantite < quantite_demandee) {
      return res.status(409).json({ error: "Stock insuffisant." });
    }

    const ligneExistante = await dbGet(
      "SELECT id_panier_ligne, quantite_panier FROM PANIER WHERE id_u = ? AND id_j = ?",
      [id_user, id_jeu]
    );

    if (ligneExistante) {
      const nouvelleQuantite = ligneExistante.quantite_panier + quantite_demandee;
      await dbRun(
        "UPDATE PANIER SET quantite_panier = ?, date_ajout = ? WHERE id_panier_ligne = ?",
        [nouvelleQuantite, new Date().toISOString(), ligneExistante.id_panier_ligne]
      );
      return res.json({ message: "Panier mis à jour." });
    } else {
      await dbRun(
        "INSERT INTO PANIER (id_u, id_j, quantite_panier, date_ajout) VALUES (?, ?, ?, ?)",
        [id_user, id_jeu, quantite_demandee, new Date().toISOString()]
      );
      return res.status(201).json({ message: "Article ajouté au panier." });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur panier." });
  }
});

app.get("/api/panier/:id_user", authJwt, async (req, res) => {
  const userId = req.params.id_user;
  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: "Accès non autorisé." });
  }

  try {
    const panier = await dbAll(
      `SELECT p.id_panier_ligne, p.id_j, p.quantite_panier, j.nom_j, j.prix, j.quantite AS stock_dispo
       FROM PANIER p JOIN JEU j ON p.id_j = j.id_j WHERE p.id_u = ?`,
      [userId]
    );
    res.json(panier);
  } catch (err) {
    res.status(500).json({ error: "Erreur panier." });
  }
});

// Commandes
app.post("/api/commander", authJwt, async (req, res) => {
  const { id_point, nom_point, lat, lon, paiement } = req.body;
  const id_user = req.user.id;

  // Validation paiement
  if (!paiement || !paiement.expiration || !paiement.numero || !paiement.cvv || !paiement.titulaire) {
    return res.status(400).json({ error: "Données paiement incomplètes." });
  }

  try {
    const [mois, annee] = paiement.expiration.split("/");
    const dateExp = new Date(parseInt(`20${annee}`), parseInt(mois), 0);
    if (dateExp < new Date()) {
      return res.status(400).json({ error: "Carte expirée." });
    }

    const numeroNettoye = paiement.numero.replace(/\s/g, "");
    if (numeroNettoye.length !== 16 || !/^\d{16}$/.test(numeroNettoye)) {
      return res.status(400).json({ error: "Numéro carte invalide." });
    }
    if (!/^\d{3}$/.test(paiement.cvv)) {
      return res.status(400).json({ error: "CVV invalide." });
    }
  } catch (e) {
    return res.status(400).json({ error: "Format paiement invalide." });
  }

  await dbRun("BEGIN TRANSACTION;");
  try {
    const panierItems = await dbAll(
      `SELECT p.id_j, p.quantite_panier, j.quantite AS stock_dispo, j.prix 
       FROM PANIER p JOIN JEU j ON p.id_j = j.id_j WHERE p.id_u = ?`,
      [id_user]
    );

    if (panierItems.length === 0) {
      await dbRun("ROLLBACK;");
      return res.status(400).json({ error: "Panier vide." });
    }

    await dbRun("INSERT OR IGNORE INTO POINT_RETRAIT (id_point, nom_point, lat, lon) VALUES (?, ?, ?, ?)",
      [id_point, nom_point, lat, lon]);

    let montantTotal = 0;
    for (const item of panierItems) {
      if (item.quantite_panier > item.stock_dispo) {
        await dbRun("ROLLBACK;");
        return res.status(409).json({ error: `Stock insuffisant jeu ${item.id_j}` });
      }

      montantTotal += item.prix * item.quantite_panier;
      await dbRun(
        "INSERT INTO ACHAT (id_u, id_j, id_point_retrait, date_achat, quantite_achetee) VALUES (?, ?, ?, ?, ?)",
        [id_user, item.id_j, id_point, new Date().toISOString(), item.quantite_panier]
      );
      await dbRun("UPDATE JEU SET quantite = ? WHERE id_j = ?", 
        [item.stock_dispo - item.quantite_panier, item.id_j]);
    }

    await dbRun("DELETE FROM PANIER WHERE id_u = ?", [id_user]);
    await dbRun("COMMIT;");

    res.status(201).json({
      message: `✅ Commande validée ! ${montantTotal.toFixed(2)}€`,
      id_commande: Date.now()
    });
  } catch (error) {
    await dbRun("ROLLBACK;");
    res.status(500).json({ error: "Erreur commande." });
  }
});

app.get("/api/mes-achats/:id", authJwt, async (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  try {
    const achats = await dbAll(
      `SELECT a.id_achat, a.date_achat, a.quantite_achetee, j.nom_j, j.prix, p.nom_point
       FROM ACHAT a JOIN JEU j ON a.id_j = j.id_j JOIN POINT_RETRAIT p ON a.id_point_retrait = p.id_point 
       WHERE a.id_u = ? ORDER BY a.date_achat DESC`,
      [userId]
    );
    res.json(achats);
  } catch (err) {
    res.status(500).json({ error: "Erreur achats." });
  }
});

// ===============================================
// ROUTES PUBLIQUES
// ===============================================
app.get("/api/jeux", async (req, res) => {
  try {
    const jeux = await dbAll("SELECT * FROM JEU");
    res.json(jeux);
  } catch (err) {
    res.status(500).json({ error: "Erreur jeux." });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await dbAll("SELECT * FROM CATEGORIE");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Erreur catégories." });
  }
});
app.post("/api/login", loginLimiter, async (req, res) => {
  const { pseudo, password } = req.body;

  // ✅ Validation serveur simple (optimisée)
  if (typeof pseudo !== "string" || pseudo.trim().length === 0 || pseudo.trim().length > 50) {
    return res.status(400).json({ error: "Pseudo invalide." });
  }
  if (typeof password !== "string" || password.length < 4 || password.length > 100) {
    return res.status(400).json({ error: "Mot de passe invalide." });
  }

  // Utilise pseudo.trim() pour éviter les espaces
  const pseudoClean = pseudo.trim();

  try {
    // Admin
    const admins = await dbAll(
      "SELECT id_admin, password_admin FROM ADMINISTRATEUR WHERE pseudo_admin = ?",
      [pseudoClean]
    );
    if (admins.length > 0) {
      const admin = admins[0];
      if (await bcrypt.compare(password, admin.password_admin.trim())) {
        const token = jwt.sign(
          { id: admin.id_admin, role: "admin" },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.json({ role: "admin", userId: admin.id_admin, token });
      }
    }

    // User
    const users = await dbAll(
      "SELECT id_u, password_u FROM UTILISATEUR WHERE pseudo_u = ?",
      [pseudoClean]
    );
    if (users.length > 0) {
      const user = users[0];
      if (await bcrypt.compare(password, user.password_u.trim())) {
        const token = jwt.sign(
          { id: user.id_u, role: "user" },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        return res.json({ role: "user", userId: user.id_u, token });
      }
    }

    res.status(401).json({ error: "Identifiants invalides" });
  } catch (error) {
    res.status(500).json({ error: "Erreur login." });
  }
});
;

app.post("/api/signup", async (req, res) => {
  const { pseudo, password, email, nom, prenom } = req.body;

  // SANITIZATION XSS
  const pseudoSanitize = xss(pseudo);
  const emailSanitize = xss(email);
  const nomSanitize = xss(nom);
  const prenomSanitize = xss(prenom);

  // Validation serveur
  if (typeof pseudoSanitize !== "string" || pseudoSanitize.trim().length === 0 || pseudoSanitize.trim().length > 50) {
    return res.status(400).json({ error: "Pseudo invalide." });
  }
  if (typeof password !== "string" || password.length < 4 || password.length > 100) {
    return res.status(400).json({ error: "Mot de passe invalide." });
  }
  if (typeof emailSanitize !== "string" || !emailSanitize.includes("@") || emailSanitize.length > 100) {
    return res.status(400).json({ error: "Email invalide." });
  }
  if (typeof nomSanitize !== "string" || nomSanitize.trim().length === 0 || nomSanitize.length > 50) {
    return res.status(400).json({ error: "Nom invalide." });
  }
  if (typeof prenomSanitize !== "string" || prenomSanitize.trim().length === 0 || prenomSanitize.length > 50) {
    return res.status(400).json({ error: "Prénom invalide." });
  }

  try {
    // Vérification doublons pseudo/email
    const existing = await dbAll("SELECT 1 FROM UTILISATEUR WHERE pseudo_u = ? OR email_u = ?", [pseudoSanitize.trim(), emailSanitize]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Pseudo/email existant." });
    }

    // Génération hash du mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Insertion en BDD avec données nettoyées et hash du mdp
    await dbRun(
      "INSERT INTO UTILISATEUR (pseudo_u, password_u, email_u, nom_u, prenom_u) VALUES (?, ?, ?, ?, ?)",
      [pseudoSanitize.trim(), hash, emailSanitize, nomSanitize.trim(), prenomSanitize.trim()]
    );

    res.json({ message: "Inscription réussie." });
  } catch (error) {
    res.status(500).json({ error: "Erreur inscription." });
  }
});




// Routes externes
//app.use("/api/avis", require("./routes/avis.js"));
//app.use("/api/recommandations", require("./routes/recommandations.js"));

// ===============================================
// DÉMARRAGE SERVEUR
// ===============================================
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='CATEGORIE'", (err, row) => {
  if (err || !row) {
    console.log("BDD vide. Initialisation...");
    initializeDatabaseAndLaunchServer();
  } else {
    console.log("BDD initialisée. Lancement serveur.");
    app.listen(port, () => {
      console.log(`Serveur LudoMap sur http://localhost:${port}`);
    });
  }
});

db.on("error", (err) => {
  console.error("Erreur DB:", err.message);
});

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs"); // AJOUT : Import du module File System

const app = express();

import avisRoutes from "./routes/avis.js";
app.use("/api/avis", avisRoutes);


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
// ATTENTION: cors est déjà configuré au début, ce second appel est redondant. Je le laisse pour ne pas modifier la structure.
app.use(cors()); 

// ===============================================
// UTILITAIRES SQLITE ASYNC
// ===============================================

/**
 * Exécute une requête SELECT retournant toutes les lignes.
 * @param {string} sql La requête SQL.
 * @param {Array} params Les paramètres de la requête.
 * @returns {Promise<Array>} Les lignes retournées.
 */
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      // Log l'erreur pour le debug si une table est manquante
      if (err) {
        console.error(`Erreur SQL dans dbAll (${sql}):`, err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Exécute une requête d'écriture (INSERT, UPDATE, DELETE).
 * @param {string} sql La requête SQL.
 * @param {Array} params Les paramètres de la requête.
 * @returns {Promise<object>} L'objet de contexte (avec lastID).
 */
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    // Notez l'utilisation de 'this' pour récupérer les informations comme lastID
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * Exécute une requête SELECT retournant une seule ligne.
 * @param {string} sql La requête SQL.
 * @param {Array} params Les paramètres de la requête.
 * @returns {Promise<object|undefined>} La ligne retournée.
 */
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}


// ===============================================
// FONCTION D'INITIALISATION DE LA BDD ET DE LANCEMENT DU SERVEUR
// ===============================================

/**
 * Lit les fichiers SQL, exécute la création des tables et l'insertion des données,
 * puis lance le serveur Express.
 */
function initializeDatabaseAndLaunchServer() {
    try {
        console.log("Connecté à la base de données SQLite.");
        // Lecture synchronisée des fichiers pour garantir l'ordre
        // Ces fichiers doivent se trouver dans le même répertoire que server.js
        const tablesSql = fs.readFileSync("./tables.sql", "utf8");
        const insertSql = fs.readFileSync("./insertion.sql", "utf8");
        
        // 1. Créer les tables
        db.exec(tablesSql, err => {
            if (err) {
                return console.error("Erreur tables.sql (Vérifiez la syntaxe SQL):", err);
            }
            console.log("Tables créées.");

            // 2. Insérer les données
            // NOTE: Assurez-vous que votre 'insertion.sql' contient les mots de passe hachés pour fonctionner.
            db.exec(insertSql, err2 => {
                if (err2) {
                    return console.error("Erreur insertion.sql (Vérifiez les données):", err2);
                }

                console.log("Données insérées.");
                console.log("✔ Base SQLite prête !");
                
                // 3. Lancer le serveur UNIQUEMENT après l'initialisation complète
                app.listen(port, () => {
                    console.log(
                        `Serveur backend LudoMap (Achat/Vente) lancé sur http://localhost:${port}`
                    );
                });
            });
        });
    } catch (e) {
        console.error("Erreur critique lors de la lecture des fichiers SQL:", e.message);
    }
}


// ===============================================
//  ROUTES API
// ===============================================

// 1. Lecture des jeux (liste tout le stock produit pour achat)
app.get("/api/jeux", async (req, res) => {
  try {
    // Note: Assurez-vous que la colonne 'quantite' existe dans la table JEU
    const jeux = await dbAll("SELECT * FROM JEU"); 
    res.json(jeux);
  } catch (err) {
    // Note: L'erreur peut venir du fait que la table JEU n'existe pas encore
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
      // Le trim() est nécessaire pour retirer les espaces si les hashs sont stockés comme CHAR(60)
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
app.post("/api/acheter", async (req, res) => {
  // Extraction étendue des données pour le point de retrait
  const { id_jeu, id_user, quantite_achetee, id_point, nom_point, lat, lon } = req.body;
  
  // 1. Vérification des données d'achat (OK, renvoie 400 si KO)
  if (!id_jeu || !id_user || !quantite_achetee || quantite_achetee <= 0 || !id_point || !nom_point || !lat || !lon) {
    return res.status(400).json({ error: "Données d'achat incomplètes ou invalides (manque jeu, utilisateur, quantité ou détails du point de retrait)." });
  }

  // 2. Logique métier et Enregistrement en base de données (Transactionnel)
  try {
    // Démarrer la transaction SQLite
    await dbRun("BEGIN TRANSACTION;");

    // A. Récupérer les informations sur le jeu et vérifier la disponibilité du stock
    const row = await dbGet("SELECT quantite, prix FROM JEU WHERE id_j = ?", [id_jeu]);
    
    if (!row) {
        await dbRun("ROLLBACK;");
        return res.status(404).json({ error: "Jeu introuvable." });
    }
    
    if (row.quantite < quantite_achetee) {
        await dbRun("ROLLBACK;");
        return res.status(409).json({ error: "Stock insuffisant pour cet achat." });
    }

    const nouveauStock = row.quantite - quantite_achetee;
    const montantTotal = row.prix * quantite_achetee;
    
    // Date/heure actuelle formatée pour insertion SQLite
    const date_achat = new Date().toISOString(); 

    // B. Enregistrer/Mettre à jour le point de retrait pour satisfaire la clé étrangère
    // NOTE : Le point de retrait est inséré s'il n'existe pas déjà (basé sur id_point, ici Overpass ID).
    // Les noms des colonnes ici ('nom_point', 'lat', 'lon') doivent correspondre aux noms dans votre tables.sql
    await dbRun(
      'INSERT OR IGNORE INTO POINT_RETRAIT (id_point, nom_point, lat, lon) VALUES (?, ?, ?, ?)',
      [id_point, nom_point, lat, lon]
    );

    // C. Mettre à jour le stock du jeu
    await dbRun("UPDATE JEU SET quantite = ? WHERE id_j = ?", [nouveauStock, id_jeu]);

    // D. Enregistrer l'achat
    const insertResult = await dbRun(
      'INSERT INTO ACHAT (id_u, id_j, id_point_retrait, date_achat, quantite_achetee) VALUES (?, ?, ?, ?, ?)',
      [id_user, id_jeu, id_point, date_achat, quantite_achetee]
    );
    
    // Finaliser la transaction
    await dbRun("COMMIT;");
    
    // 3. Réponse en cas de Succès (201 Created)
    return res.status(201).json({
      message: `Achat de ${quantite_achetee} unités enregistré. Stock mis à jour à ${nouveauStock}. Montant total: ${montantTotal.toFixed(2)}€. Point de retrait sélectionné : ${nom_point} (${id_point})`,
      nouveau_stock: nouveauStock,
      id_achat: insertResult.lastID
    });

  } catch (error) {
    // 4. Gestion des Erreurs (Renvoie 500 Internal Server Error)
    // IMPORTANT: Tenter le ROLLBACK pour nettoyer la transaction si elle est en cours.
    try {
        await dbRun("ROLLBACK;");
    } catch (rollbackError) {
        console.error("Erreur lors du ROLLBACK :", rollbackError);
    }
    
    console.error("ERREUR CRITIQUE D'ENREGISTREMENT DE L'ACHAT :", error); 
    
    // Retourne un 500 au client avec un message générique.
    return res.status(500).json({ 
        error: "Erreur lors de l'enregistrement de l'achat.",
        // Afficher les détails de l'erreur seulement en environnement de développement
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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


// --- MISE À JOUR : Mes Commandes (utilise toujours la table ACHAT) ---
app.get("/api/mes-achats/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const achats = await dbAll(
      `SELECT a.id_achat, a.date_achat, a.quantite_achetee, j.nom_j, j.prix, p.nom_point
       FROM ACHAT a
       JOIN JEU j ON a.id_j = j.id_j
       -- 💡 Jointure sur la table POINT_RETRAIT
       JOIN POINT_RETRAIT p ON a.id_point_retrait = p.id_point 
       WHERE a.id_u = ?
       ORDER BY a.date_achat DESC`,
      [userId]
    );
    res.json(achats);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur lors de la récupération des commandes." });
  }
});

// Fonction helper : calcul Haversine (non utilisée dans ce fichier, mais bonne à garder)
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

// ===============================================
// DÉMARRAGE : Vérifie si la BDD est déjà initialisée
// ===============================================

// On vérifie l'existence d'une table clé (CATEGORIE) pour savoir si on doit initialiser
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='CATEGORIE'", (err, row) => {
    if (err || !row) {
        // La table CATEGORIE n'existe pas, on initialise
        console.log("Base de données vide ou manquante. Initialisation...");
        initializeDatabaseAndLaunchServer();
    } else {
        // La base de données existe et est initialisée, on lance directement le serveur
        console.log("Base de données déjà initialisée. Lancement direct du serveur.");
        app.listen(port, () => {
            console.log(
                `Serveur backend LudoMap (Achat/Vente) lancé sur http://localhost:${port}`
            );
        });
    }
});

db.on("error", (err) => {
  console.error("Erreur de connexion à la base de données:", err.message);
});

// ➕ Route : Ajouter au Panier

app.post("/api/panier/ajouter", async (req, res) => {
    const { id_jeu, id_user, quantite_demandee } = req.body;

    if (!id_jeu || !id_user || !quantite_demandee || quantite_demandee <= 0) {
        return res.status(400).json({ error: "Données requises (jeu, utilisateur, quantité) manquantes ou invalides." });
    }

    try {
        // 1. Vérifier le stock disponible du jeu
        const jeu = await dbGet("SELECT quantite FROM JEU WHERE id_j = ?", [id_jeu]);
        
        if (!jeu) {
            return res.status(404).json({ error: "Jeu introuvable." });
        }
        
        if (jeu.quantite < quantite_demandee) {
            return res.status(409).json({ error: "Stock insuffisant pour cette quantité." });
        }

        // 2. Vérifier si l'article est déjà dans le panier de l'utilisateur
        const ligneExistante = await dbGet(
            "SELECT id_panier_ligne, quantite_panier FROM PANIER WHERE id_u = ? AND id_j = ?", 
            [id_user, id_jeu]
        );

        if (ligneExistante) {
            // 3. Si l'article existe, mettre à jour la quantité (et revérifier le stock total)
            const nouvelleQuantite = ligneExistante.quantite_panier + quantite_demandee;
            
            if (jeu.quantite < nouvelleQuantite) {
                return res.status(409).json({ error: "L'ajout dépasse le stock disponible." });
            }

            await dbRun(
                "UPDATE PANIER SET quantite_panier = ?, date_ajout = ? WHERE id_panier_ligne = ?",
                [nouvelleQuantite, new Date().toISOString(), ligneExistante.id_panier_ligne]
            );
            return res.status(200).json({ message: "Quantité mise à jour dans le panier." });
            
        } else {
            // 4. Si l'article n'existe pas, l'insérer
            await dbRun(
                "INSERT INTO PANIER (id_u, id_j, quantite_panier, date_ajout) VALUES (?, ?, ?, ?)",
                [id_user, id_jeu, quantite_demandee, new Date().toISOString()]
            );
            return res.status(201).json({ message: "Article ajouté au panier." });
        }

    } catch (error) {
        console.error("Erreur lors de l'ajout au panier :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'ajout au panier." });
    }
});

// --- NOUVELLE ROUTE : Passer la Commande ---
// --- ROUTE MODIFIÉE : Passer la Commande avec VALIDATION DATE CARTE ---
app.post("/api/commander", async (req, res) => {
    const { id_user, id_point, nom_point, lat, lon, paiement } = req.body; 
    
    // ✅ VALIDATION DES DONNÉES + PAIEMENT
    if (!id_user || !id_point || !nom_point || !lat || !lon || !paiement) {
        return res.status(400).json({ error: "Données incomplètes (utilisateur, point relais ou paiement manquant)." });
    }

    // ✅ VALIDATION DATE D'EXPIRATION CARTE
    try {
        const [mois, annee] = paiement.expiration.split('/'); // "MM/AA"
        const moisExp = parseInt(mois);
        const anneeExp = parseInt(`20${annee}`); // AA → 20AA
        
        const dateExp = new Date(anneeExp, moisExp, 0); // Dernier jour du mois
        const dateAujourdHui = new Date();
        
        if (dateExp < dateAujourdHui) {
            return res.status(400).json({ 
                error: "La date d'expiration de la carte est dépassée.",
                date_exp: paiement.expiration
            });
        }
        
        // ✅ VALIDATION NUMÉRO CARTE (16 chiffres)
        const numeroNettoye = paiement.numero.replace(/\s/g, '');
        if (numeroNettoye.length !== 16 || !/^\d{16}$/.test(numeroNettoye)) {
            return res.status(400).json({ error: "Numéro de carte invalide (16 chiffres requis)." });
        }
        
        // ✅ VALIDATION CVV (3 chiffres)
        if (!/^\d{3}$/.test(paiement.cvv)) {
            return res.status(400).json({ error: "CVV invalide (3 chiffres requis)." });
        }
        
    } catch (e) {
        return res.status(400).json({ error: "Format de carte invalide (MM/AA requis)." });
    }

    // Démarrer la transaction
    await dbRun("BEGIN TRANSACTION;");
    
    try {
        const date_commande = new Date().toISOString(); 

        // 1. Récupérer le contenu du panier
        const panierItems = await dbAll(
            `SELECT p.id_j, p.quantite_panier, j.quantite AS stock_dispo, j.prix 
             FROM PANIER p 
             JOIN JEU j ON p.id_j = j.id_j 
             WHERE p.id_u = ?`, 
            [id_user]
        );

        if (panierItems.length === 0) {
            await dbRun("ROLLBACK;");
            return res.status(400).json({ error: "Le panier est vide." });
        }

        // 2. Enregistrer le point de retrait
        await dbRun(
            'INSERT OR IGNORE INTO POINT_RETRAIT (id_point, nom_point, lat, lon) VALUES (?, ?, ?, ?)',
            [id_point, nom_point, lat, lon]
        );

        let montantTotal = 0;
        
        // 3. Traiter chaque article
        for (const item of panierItems) {
            if (item.quantite_panier > item.stock_dispo) {
                await dbRun("ROLLBACK;");
                return res.status(409).json({ error: `Stock insuffisant pour le jeu ID ${item.id_j}.` });
            }

            montantTotal += item.prix * item.quantite_panier;

            // Enregistrement dans ACHAT
            await dbRun(
                'INSERT INTO ACHAT (id_u, id_j, id_point_retrait, date_achat, quantite_achetee) VALUES (?, ?, ?, ?, ?)',
                [id_user, item.id_j, id_point, date_commande, item.quantite_panier]
            );

            // Mise à jour stock
            const nouveauStock = item.stock_dispo - item.quantite_panier;
            await dbRun("UPDATE JEU SET quantite = ? WHERE id_j = ?", [nouveauStock, item.id_j]);
        }
        
        // 4. Vider le panier
        await dbRun("DELETE FROM PANIER WHERE id_u = ?", [id_user]);
        
        // 5. Enregistrer infos paiement (NOUVELLE TABLE ?)
        // Pour l'instant on log, tu peux ajouter une table PAIEMENT si besoin
        console.log(`💳 PAIEMENT ID ${id_user}:`, {
            numero: paiement.numero.replace(/./g, '*').slice(-4), // **** **** **** 1234
            expiration: paiement.expiration,
            titulaire: paiement.titulaire
        });
        
        // 6. Finaliser
        await dbRun("COMMIT;");

        return res.status(201).json({
            message: `✅ Commande et paiement validés ! Montant: ${montantTotal.toFixed(2)}€`,
            id_commande: Date.now(), // ID simulé
            montant_total: montantTotal.toFixed(2)
        });

    } catch (error) {
        await dbRun("ROLLBACK;");
        console.error("ERREUR COMMANDE :", error); 
        return res.status(500).json({ error: "Erreur lors de la finalisation de la commande." });
    }
});


// --- NOUVELLE ROUTE : Lire le contenu du Panier ---
app.get("/api/panier/:id_user", async (req, res) => {
    const userId = req.params.id_user;
    try {
        const panier = await dbAll(
            `SELECT p.id_panier_ligne, p.id_j, p.quantite_panier, j.nom_j, j.prix, j.quantite AS stock_dispo
             FROM PANIER p
             JOIN JEU j ON p.id_j = j.id_j
             WHERE p.id_u = ?`,
            [userId]
        );
        res.json(panier);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération du panier." });
    }
});
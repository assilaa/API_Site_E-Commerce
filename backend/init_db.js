const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path'); // Ajout du module path pour gérer les chemins

// Nom du fichier de la base de données
const DB_FILE = './bdd.db';
// Chemin du fichier de schéma SQL. 
// Nous utilisons path.join pour construire un chemin sûr.
// __dirname est le répertoire où se trouve init_db.js (donc 'backend/')
// Nous supposons que tables.sql se trouve DANS le même répertoire 'backend/'
const SCHEMA_FILE = path.join(__dirname, 'tables.sql');

// 1. Lire le contenu du fichier SQL
// Le chemin est maintenant correctement résolu
try {
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');

    // 2. Ouvrir la connexion à la base de données
    // L'option sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE garantit qu'il est créé s'il n'existe pas.
    const db = new sqlite3.Database(DB_FILE, (err) => {
        if (err) {
            console.error("Erreur à l'ouverture de la base de données:", err.message);
        } else {
            console.log(`Connecté à la base de données ${DB_FILE}`);

            // 3. Exécuter toutes les requêtes du fichier de schéma
            db.exec(schema, (err) => {
                if (err) {
                    // En cas d'erreur lors de l'exécution (ex: syntaxe SQL)
                    console.error("Erreur lors de l'initialisation du schéma:", err.message);
                } else {
                    console.log("Schéma de la base de données initialisé avec succès (tables créées).");
                }
                
                // 4. Fermer la connexion
                db.close();
                console.log("Connexion fermée.");
            });
        }
    });

} catch (e) {
    // Si la lecture du fichier SQL échoue, afficher une erreur plus claire
    console.error(`Erreur : Impossible de lire le fichier de schéma à l'emplacement ${SCHEMA_FILE}. Assurez-vous qu'il existe et que le chemin est correct.`, e.message);
}
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // <-- NÉCESSITE npm install bcrypt

// Nom du fichier de la base de données
const DB_FILE = './bdd.db';
// Chemin du fichier d'insertion SQL.
const INSERTION_FILE = path.join(__dirname, 'insertion.sql');
const HASH_PASSWORD = 'password'; // Le mot de passe en clair que l'on veut hacher
const SALT_ROUNDS = 10; // Niveau de salage pour bcrypt

// Fonction principale asynchrone pour gérer le hachage
async function insertData() {
    try {
        // 1. Lire le contenu du fichier SQL
        let data = fs.readFileSync(INSERTION_FILE, 'utf8');

        // 2. Hacher le mot de passe de test 'password'
        const hashedPassword = await bcrypt.hash(HASH_PASSWORD, SALT_ROUNDS);

        // 3. Remplacer les mots de passe en clair par le hash dans le script SQL
        // Nous cherchons la chaîne en clair 'password' (avec les guillemets) et la remplaçons par le hash.
        // ATTENTION: Assurez-vous que le mot de passe 'password' est bien la valeur que vous utilisez
        // dans votre fichier insertion.sql pour les utilisateurs/admins.
        const replacePattern = /'password'/g;
        
        // Si votre insertion.sql utilise des guillemets doubles, utilisez /"password"/g
        // Si vous utilisez un autre mot de passe que 'password', remplacez-le ici.
        data = data.replace(replacePattern, `'${hashedPassword}'`);

        // --- Connexion à la base de données ---
        const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error("Erreur à l'ouverture de la base de données pour insertion:", err.message);
                return;
            }
            console.log(`Connecté à la base de données ${DB_FILE} pour insertion.`);

            // Exécuter toutes les requêtes d'insertion
            db.exec(data, (err) => {
                if (err) {
                    // Si l'erreur provient d'une contrainte, cela signifie que la base est déjà remplie
                    // ou que le SQL a une erreur de syntaxe.
                    console.error("Erreur lors de l'insertion des données (vérifiez la syntaxe de tables.sql et insertion.sql):", err.message);
                } else {
                    console.log("Données de test insérées avec succès (mots de passe hachés).");
                }
                
                db.close();
                console.log("Connexion fermée après insertion.");
            });
        });

    } catch (e) {
        // Cette erreur est souvent liée à un problème de lecture de fichier ou de hachage (bcrypt)
        console.error(`Erreur lors de la lecture du fichier d'insertion ou du hachage (Avez-vous fait 'npm install bcrypt'?):`, e.message);
    }
}

insertData();
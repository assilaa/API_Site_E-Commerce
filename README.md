# API_Site_E-Commerce


## 1. Prérequis et dépendances

- Node.js (version récente recommandée, par exemple ≥ 18).  
- npm (installé avec Node.js).  
- SQLite3 (pour la base de données locale).  
- Navigateur web moderne (Chrome, Firefox, Edge…).  

Dépendances principales côté backend (installées via `npm install`) :  
- express : serveur HTTP et routes API.  
- sqlite3 : accès à la base SQLite.  
- bcryptjs : hashage des mots de passe.  
- jsonwebtoken : gestion des JWT.  
- cors : configuration CORS pour autoriser le front.  
- helmet : sécurisation des en-têtes HTTP.  
- express-rate-limit : limitation de débit (rate limiting).  
- xss : sanitization des entrées utilisateur.

Dépendances principales côté frontend :  
- Vue.js (via Vite ou similar).  
- axios ou fetch pour appeler l’API.  
- Bibliothèques de carte (si utilisées) pour OpenStreetMap.

***

## 2. Compilation et exécution du projet

### 2.1 Lancer le backend (API Node.js)

1. Ouvrir une première fenêtre de terminal à la racine du projet.  
2. Aller dans le dossier backend :

   ```bash
   cd backend
   ```

3. Installer les dépendances (si ce n’est pas déjà fait) :

   ```bash
   npm install
   ```

4. Lancer le serveur Node.js :

   ```bash
   node index.js
   ```

Le serveur API démarre sur `http://localhost:3000`.  
À la première exécution, la base SQLite est initialisée (création des tables + insertion de données de test si prévu).

***

### 2.2 Lancer le frontend (Vue)

1. Ouvrir une **deuxième** fenêtre de terminal, toujours à la racine du projet.  
2. Aller dans le dossier frontend :

   ```bash
   cd frontend
   ```

3. Installer les dépendances front (si ce n’est pas déjà fait) :

   ```bash
   npm install
   ```

4. Lancer le serveur de développement :

   ```bash
   npm run dev
   ```

5. Cliquer sur le lien affiché dans le terminal (en général `http://localhost:5173`) pour ouvrir l’application dans le navigateur.

***

## 3. Instructions d’utilisation

1. **Créer un compte utilisateur**  
   - Depuis l’interface web, aller sur la page d’inscription.  
   - Renseigner les champs demandés (pseudo, email, mot de passe, nom, prénom).  
   - Soumettre le formulaire : un utilisateur est créé en base avec un mot de passe hashé.

2. **Se connecter**  
   - Aller sur la page de connexion.  
   - Entrer le pseudo et le mot de passe créés à l’étape précédente.  
   - En cas de succès, un token JWT est récupéré et stocké côté frontend pour accéder aux routes protégées (panier, commande, historique d’achats).

3. **Naviguer dans les jeux et gérer le panier**  
   - Consulter la liste des jeux disponibles.  
   - Ajouter un ou plusieurs jeux au panier (quantité contrôlée par rapport au stock).  
   - Visualiser le contenu du panier (quantités, prix, total).

4. **Passer une commande avec point de retrait**  
   - Depuis le panier, accéder au formulaire de commande.  
   - Choisir un point de retrait via la carte (OpenStreetMap) ou la liste associée.  
   - Renseigner les informations de paiement simulé (numéro, date d’expiration, CVV).  
   - Valider : la commande est enregistrée, le stock mis à jour et le panier vidé.

5. **Consulter ses achats**  
   - Accéder à la page “Mes achats” pour voir l’historique des commandes (date, jeux achetés, point de retrait, montants).

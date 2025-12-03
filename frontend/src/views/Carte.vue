<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="logo">LUDOMAP</div>
      <button class="hamburger" @click="menuOpen = !menuOpen">☰</button>
      <ul :class="{ open: menuOpen }">
        <li><router-link to="/carte">Carte</router-link></li>
        <li><router-link to="/mon-panier">Mon Panier</router-link></li>
        <li><router-link to="/mon-compte">Mon Compte</router-link></li>
        <li><router-link to="/recommandations">Recommandations</router-link></li>
        <li><a href="#" @click.prevent="logout">Déconnexion</a></li>
      </ul>
    </div>
  </nav>

  <div class="page-carte">
    <div class="filtres">
      <input v-model="filtreNom" placeholder="Nom du jeu" />
      <input
        v-model.number="filtreJoueurs"
        type="number"
        placeholder="Nombre de joueurs"
      />
      <select v-model="filtreCategorie">
        <option value="">Toutes les catégories</option>
        <option
          v-for="cat in categories"
          :key="cat.id_cat"
          :value="cat.nom_cat"
        >
          {{ cat.nom_cat }}
        </option>
      </select>

    </div>

    <div class="liste-jeux">
      <div v-for="jeu in jeuxFiltres" :key="jeu.id_j" class="carte-jeu">
        <h3>{{ jeu.nom_j }}</h3>
        <p>Catégorie : {{ jeu.categorie }}</p>
        <p>Nombre de joueurs : {{ jeu.min_players }}–{{ jeu.max_players }}</p>
        <p>Prix unitaire : {{ jeu.prix }} €</p>
        <p>En stock : {{ jeu.quantite }}</p>
        <p class="description">{{ jeu.description || "Aucune description disponible." }}</p>


        <button :disabled="jeu.quantite < 1" @click="ouvrirPopup(jeu)">
          Ajouter au Panier
        </button>
        <button class="btn-avis" @click="ouvrirPopupAvis(jeu)">
          Avis/Noter
        </button>

      </div>
    </div>
  </div>

  <!-- ✅ POPUP SIMPLIFIÉ : plus de point relais -->
  <div v-if="showPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerPopup">&times;</span>
      <h3>Ajouter au Panier</h3>

      <form @submit.prevent="ajouterAuPanier">
        <p><strong>Nom :</strong> {{ jeuDetails.nom_j }}</p>
        <p><strong>Quantité disponible :</strong> {{ jeuDetails.quantite }}</p>
        <p><strong>Prix unitaire :</strong> {{ jeuDetails.prix }} €</p>

        <label for="quantiteAchat">Quantité à ajouter</label>
        <input
          id="quantiteAchat"
          type="number"
          v-model.number="quantiteAchat"
          min="1"
          :max="jeuDetails.quantite"
          required
        />

        <button id="submit" type="submit">Ajouter au Panier</button>
        <button id="close" type="button" @click="fermerPopup">Annuler</button>

        <p v-if="panierErreur" style="color: red;">{{ panierErreur }}</p>
        <p v-if="panierSucces" style="color: green;">{{ panierSucces }}</p>
      </form>
    </div>
  </div>

  <!-- ⭐ POPUP AVIS ⭐ -->
  <div v-if="showAvisPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerAvis">&times;</span>

      <h3>Avis pour {{ jeuAvis.nom_j }}</h3>

      <!-- Liste des avis -->
      <div class="avis-liste">
        <h4>Commentaires :</h4>
        <div v-if="avisListe.length === 0">Aucun avis pour ce jeu.</div>

        <div v-for="avis in avisListe" :key="avis.id_u + '-' + avis.id_j" class="avis-item">
          <p><strong>Note :</strong> {{ avis.note }}/10</p>
          <p>{{ avis.avis }}</p>

          <!-- Bouton supprimer si c’est l’avis de l'utilisateur -->
          <button 
            v-if="Number(avis.id_u) === Number(userId)" 
            class="supp-avis"
            @click="supprimerAvis(avis.id_j, avis.id_u)"
          >
            Supprimer
          </button>

        </div>
      </div>

      <!-- Formulaire ajouter un avis -->
      <form @submit.prevent="envoyerAvis">
        <label>Note (sur 10)</label>
        <input type="number" v-model.number="avisNote" min="1" max="10" required />

        <label>Commentaire</label>
        <textarea v-model="avisTexte" rows="3" required></textarea>

        <button id="submit" type="submit">Envoyer mon avis</button>
        <button id="close" type="button" @click="fermerAvis">Annuler</button>

        <p v-if="avisError" style="color:red">{{ avisError }}</p>
        <p v-if="avisSuccess" style="color:green">{{ avisSuccess }}</p>
      </form>
    </div>
  </div>

</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "PageCarte",

  data() {
    return {
      filtreNom: "",
      filtreCategorie: "",
      filtreJoueurs: null,

      categories: [],
      jeux: [],
      menuOpen: false,

      // popup ajout panier (SIMPLIFIÉ)
      showPopup: false,
      jeuDetails: null,
      quantiteAchat: 1,
      panierErreur: "",
      panierSucces: "",

      // ⭐ Avis
      showAvisPopup: false,
      jeuAvis: null,
      avisListe: [],
      avisNote: "",
      avisTexte: "",
      avisError: "",
      avisSuccess: "",
      userId: localStorage.getItem("userId"),

    };
  },

  computed: {
    jeuxFiltres() {
      return this.jeux.filter((j) => {
        // 🔍 Filtre NOM
        const matchNom =
          this.filtreNom === "" ||
          (j.nom_j || "").toLowerCase().includes(this.filtreNom.toLowerCase());

        // 🔍 Filtre CATEGORIE (texte)
        const matchCategorie =
          this.filtreCategorie === "" ||
          (
            j.categorie &&
            j.categorie.toLowerCase() === this.filtreCategorie.toLowerCase()
          );

        // 🔍 Filtre NOMBRE DE JOUEURS
        const matchJoueurs =
          !this.filtreJoueurs ||
          (
            Number(j.min_players) <= Number(this.filtreJoueurs) &&
            Number(j.max_players) >= Number(this.filtreJoueurs)
          );

        return matchNom && matchCategorie && matchJoueurs;
      });
    },
  },



  methods: {
    logout() {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      this.$router.push("/");
    },

    /* ---------------- AVIS ---------------- */
    ouvrirPopupAvis(jeu) {
      this.jeuAvis = jeu;
      this.avisNote = "";
      this.avisTexte = "";
      this.avisError = "";
      this.avisSuccess = "";
      this.showAvisPopup = true;
      this.chargerAvis(jeu.id_j);
    },

    fermerAvis() {
      this.showAvisPopup = false;
    },

    async chargerAvis(id_j) {
      try {
        const res = await fetch(`http://localhost:3000/api/avis/${id_j}`);
        this.avisListe = await res.json();
      } catch {
        this.avisListe = [];
      }
    },

   async envoyerAvis() {
      const id_user = this.userId;
      if (!id_user)
        return (this.avisError = "Connectez-vous pour poster un avis.");

      try {
        const res = await fetch("http://localhost:3000/api/avis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_j: this.jeuAvis.id_j,
            id_user,
            note: this.avisNote,
            commentaire: this.avisTexte,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.avisError = data.error;
          return;
        }

        // -------------------------
        // 👍 Avis ajouté avec succès
        // -------------------------
        this.avisSuccess = "Avis envoyé !";
        this.chargerAvis(this.jeuAvis.id_j);

        // -------------------------
        // ⭐ LIKE AUTOMATIQUE SI NOTE >= 7
        // -------------------------
        if (this.avisNote >= 7) {
          await fetch("http://localhost:3000/api/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_user,
              id_j: this.jeuAvis.id_j,
            }),
          });
        }

        setTimeout(() => this.fermerAvis(), 800);

      } catch {
        this.avisError = "Erreur serveur.";
      }
    },

    async supprimerAvis(id_j, id_u) {
      try {
        const res = await fetch(`http://localhost:3000/api/avis/${id_j}/${id_u}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Erreur lors de la suppression.");
          return;
        }

        this.chargerAvis(this.jeuAvis.id_j);
      } catch (err) {
        alert("Erreur serveur.");
      }
    },

    // Recommandation
    async fetchRecommandations(id_j) {
      try {
        const res = await fetch(
          `http://localhost:3000/api/recommandations/jeu/${id_j}`
        );
        const reco = await res.json();
        if (reco.length > 0) {
          alert("Nous vous recommandons aussi : " + reco[0].nom_j);
        }
      } catch {
        console.error("Erreur recommandation");
      }
    },


    ouvrirPopup(jeu) {
      this.jeuDetails = jeu;
      this.quantiteAchat = 1;
      this.panierErreur = "";
      this.panierSucces = "";
      this.showPopup = true;
    },

    fermerPopup() {
      this.showPopup = false;
    },

    async ajouterAuPanier() {
      const id_user = localStorage.getItem("userId");

      if (!id_user) {
        this.panierErreur = "Veuillez vous connecter.";
        return;
      }

      if (this.quantiteAchat <= 0 || this.quantiteAchat > this.jeuDetails.quantite) {
        this.panierErreur = "Quantité invalide.";
        return;
      }

      this.panierErreur = "";
      this.panierSucces = "";

      try {
        const res = await fetch("http://localhost:3000/api/panier/ajouter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_jeu: this.jeuDetails.id_j,
            id_user: id_user,
            quantite_demandee: this.quantiteAchat,
            // ✅ Plus de point relais ici
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.panierErreur =
            data.error || "Erreur inconnue lors de l'ajout au panier.";
        } else {
          this.panierSucces = `Article ajouté au panier ! Quantité : ${this.quantiteAchat}.`;
          setTimeout(() => {
            this.fermerPopup();
          }, 1000);
        }
      } catch (e) {
        this.panierErreur = "Erreur réseau lors de l'ajout au panier.";
      }
    },

    async fetchCategories() {
      try {
        const res = await fetch("http://localhost:3000/api/categories");
        const data = await res.json();
        this.categories = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("Erreur chargement catégories :", e);
        this.categories = [];
      }
    },

    async fetchJeux() {
      try {
        const res = await fetch("http://localhost:3000/api/jeux");
        const data = await res.json();

        // Reconstruit id_cat si manquant
        this.jeux = data.map(j => {
          // Si l’ID existe déjà → rien à faire
          if (j.id_cat) return j;

          // Cherche la catégorie correspondante
          const cat = this.categories.find(c =>
            c.nom_cat.toLowerCase() === (j.categorie || "").toLowerCase()
          );

          return {
            ...j,
            id_cat: cat ? cat.id_cat : null
          };
        });

        console.log("JEUX APRES RECONSTRUCTION :", this.jeux);
      } catch (e) {
        console.error("Erreur chargement jeux :", e);
        this.jeux = [];
      }
    },
  },

  mounted() {
    this.fetchCategories();
    this.fetchJeux().then(() => {
      console.log("JEUX RECUS DU BACKEND :", this.jeux);
      console.log("Une catégorie de test :", this.jeux[0]?.categorie);
    });
  },
};
</script>

<style scoped>
/* ----------- NAVBAR (inchangé) ----------- */
.navbar {
  background-color: #333;
  color: white;
  padding: 1rem;
}

.navbar-container {
  max-width: 1200px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
}

.hamburger {
  display: none;
  font-size: 24px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

ul {
  list-style: none;
  display: flex;
  gap: 20px;
}

ul li a {
  color: white;
  text-decoration: none;
}

ul li a:hover {
  text-decoration: underline;
}

/* ----------- RESPONSIVE NAV ----------- */
@media (max-width: 768px) {
  .hamburger {
    display: block;
  }

  ul {
    display: none;
    flex-direction: column;
    background-color: #444;
    position: absolute;
    top: 70px;
    right: 0;
    width: 200px;
    padding: 1rem;
  }

  ul.open {
    display: flex;
  }
}

/* ----------- PAGE ----------- */
.page-carte {
  padding: 20px;
}

/* ----------- FILTRES ----------- */
.filtres {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filtres input,
.filtres select {
  padding: 10px;
  font-size: 16px;
}

/* ----------- LISTE DES JEUX ----------- */
.liste-jeux {
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(430px, 1fr)); 
  gap: 60px; /* espace propre entre les cartes */
  width: 100%;
  max-width: 1600px; /* pour occuper la page sans coller les bords */
  margin-left: auto;
  margin-right: auto;
  justify-items: center;
}




/* ----------- STYLE EXACT DE LA CARTE ----------- */
.carte-jeu {
  background: white;
  border-radius: 22px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #e5e5e5;

  max-width: 500px; /* plus large */
  width: 100%;      /* occupe toute la colonne */
}


.carte-jeu h3 {
  color: #1A4DFF;
  font-size: 22px;
  margin-bottom: 15px;
}

.carte-jeu p {
  font-size: 16px; /* au lieu de 18px */
  margin: 10px 0;
  color: #111;
}


/* ----------- BOUTON AJOUT PANIER ----------- */
.carte-jeu button {
  width: 100%;
  padding: 14px;   /* au lieu de 16 */
  font-size: 18px; /* réduit */
  border-radius: 40px;
  margin-top: 10px;
  font-weight: 600;
}


.carte-jeu button:first-of-type {
  background: black;
  color: white;
}

.carte-jeu button:first-of-type:hover {
  background: #222;
}

/* ----------- BOUTON AVIS — STYLE EXACT ----------- */
.btn-avis {
  width: 100%;
  background-color: #2927AE;
  color: white;
  font-size: 18px;
  padding: 14px 0;
  border: none;
  border-radius: 40px; 
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.25s;
}

.btn-avis:hover {
  background-color: #1E1C80;
}

.btn-avis::before {
  content: "⭐";
  font-size: 20px;
}

/* ----------- POPUPS ----------- */
.Pupop {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
}

.pupop-container {
  background-color: #fff;
  padding: 30px 20px;
  border-radius: 12px;
  width: 350px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  position: relative;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  font-size: 16px;
  text-align: left;
}

input, textarea {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ccc;
  font-size: 16px;
}

/* ----------- BOUTONS POPUP ----------- */
#submit {
  padding: 14px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

#submit:hover {
  background-color: #333399;
}

#close {
  background-color: gray;
  padding: 14px;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
}

#close:hover {
  background-color: #999;
}

/* ----------- AVIS ----------- */
.avis-item {
  background: #f1f1f1;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.supp-avis {
  background-color: red;
  color: white;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 5px;
  cursor: pointer;
}

.description {
  max-height: 120px;      /* limite l’espace vertical */
  overflow-y: auto;       /* active le scroll vertical */
  padding-right: 8px;     /* pour éviter que le texte colle au bord */
  white-space: pre-line;  /* gère correctement les retours ligne du JSON */
}


</style>

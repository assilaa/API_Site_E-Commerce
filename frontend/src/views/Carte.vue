<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="logo">LUDOMAP</div>
      <button class="hamburger" @click="menuOpen = !menuOpen">☰</button>
      <ul :class="{ open: menuOpen }">
        <li><router-link to="/carte">Carte</router-link></li>
        <li><router-link to="/mon-panier">Mon Panier</router-link></li>
        <li><router-link to="/mon-compte">Mon Compte</router-link></li>
        <li>
          <router-link to="/recommandations">Mes Recommandations</router-link>
        </li>
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
        <option v-for="cat in categories" :key="cat.id_cat" :value="cat.id_cat">
          {{ cat.nom_cat }}
        </option>
      </select>
    </div>

    <div class="liste-jeux">
      <div v-for="jeu in jeuxFiltres" :key="jeu.id_j" class="carte-jeu">
        <h3>{{ jeu.nom_j }}</h3>
        <p>Catégories : {{ jeu.categories || "Non renseigné" }}</p>
        <p>Joueurs : {{ jeu.minplayers }} - {{ jeu.maxplayers }}</p>
        <p>Prix unitaire : {{ jeu.prix }} €</p>
        <p>En stock : {{ jeu.quantite }}</p>

        <button :disabled="jeu.quantite < 1" @click="ouvrirPopup(jeu)">
          Ajouter au Panier
        </button>
        <button style="margin-top: 8px" @click="ouvrirPopupAvis(jeu)">
          ⭐ Avis / Noter
        </button>
      </div>
    </div>
  </div>

  <div v-if="showPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerPopup">&times;</span>
      <h3>Ajouter au Panier</h3>

      <form @submit.prevent="ajouterAuPanier">
        <p><strong>Nom :</strong> {{ jeuDetails.nom_j }}</p>
        <p><strong>Quantité disponible :</strong> {{ jeuDetails.quantite }}</p>
        <p><strong>Prix unitaire :</strong> {{ jeuDetails.prix }} €</p>

        <label>Quantité à ajouter</label>
        <input
          type="number"
          v-model.number="quantiteAchat"
          min="1"
          :max="jeuDetails.quantite"
          required
        />

        <button id="submit" type="submit">Ajouter au Panier</button>
        <button id="close" type="button" @click="fermerPopup">Annuler</button>

        <p v-if="panierErreur" style="color: red">{{ panierErreur }}</p>
        <p v-if="panierSucces" style="color: green">{{ panierSucces }}</p>
      </form>
    </div>
  </div>

  <div v-if="showAvisPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerAvis">&times;</span>

      <h3>Laisser un avis</h3>
      <p><strong>Jeu :</strong> {{ jeuAvis.nom_j }}</p>

      <h4>Avis des autres utilisateurs</h4>

      <div v-if="avisListe.length === 0" class="no-avis">
        <p>Aucun avis pour le moment.</p>
      </div>

      <div v-for="a in avisListe" :key="a.id_avis" class="avis-item">
        <strong>Note : {{ a.note }}/10</strong>
        <p>{{ a.commentaire }}</p>
        <small>{{ new Date(a.date_avis).toLocaleString() }}</small>
        <button
          v-if="String(a.id_user) === String(userId)"
          class="delete-btn"
          @click="supprimerAvis(a.id_avis)"
        >
          🗑 Supprimer
        </button>
        <hr />
      </div>

      <form @submit.prevent="envoyerAvis">
        <label>Note (1 à 10)</label>
        <input
          type="number"
          v-model.number="avisNote"
          min="1"
          max="10"
          required
        />

        <label>Commentaire</label>
        <textarea
          v-model="avisTexte"
          placeholder="Votre avis..."
          rows="3"
          class="avis-textarea"
          required
        ></textarea>

        <button id="submit" type="submit">Envoyer</button>
        <button id="close" type="button" @click="fermerAvis">Annuler</button>

        <p v-if="avisError" style="color: red">{{ avisError }}</p>
        <p v-if="avisSuccess" style="color: green">{{ avisSuccess }}</p>
      </form>
    </div>
  </div>
</template>

<script>
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

      /* PANIER */
      showPopup: false,
      jeuDetails: null,
      quantiteAchat: 1,
      panierErreur: "",
      panierSucces: "",

      /* AVIS */
      showAvisPopup: false,
      jeuAvis: null,
      avisNote: null,
      avisTexte: "",
      avisError: "",
      avisSuccess: "",
      avisListe: [],
      userId: localStorage.getItem("userId"),
    };
  },

  computed: {
    jeuxFiltres() {
      // Note: La logique de filtrage ici utilise j.nb_joueurs (qui n'est pas dans le template) et j.id_cat
      // Si les données de l'API ont été mises à jour pour utiliser minplayers/maxplayers/categories,
      // la logique de computed doit être ajustée en conséquence. Je garde l'ancienne logique pour l'instant
      // pour éviter de casser la fonctionnalité si l'API n'a pas été modifiée.
      return this.jeux.filter(
        (j) =>
          (this.filtreNom === "" ||
            j.nom_j.toLowerCase().includes(this.filtreNom.toLowerCase())) &&
          (this.filtreCategorie === "" ||
            Number(j.id_cat) === Number(this.filtreCategorie)) &&
          (!this.filtreJoueurs || j.nb_joueurs === this.filtreJoueurs)
      );
    },
  },

  methods: {
    logout() {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      this.$router.push("/");
    },

    /* ---------------- PANIER ---------------- */
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
      if (!id_user) return (this.panierErreur = "Veuillez vous connecter.");

      try {
        const res = await fetch("http://localhost:3000/api/panier/ajouter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_jeu: this.jeuDetails.id_j,
            id_user,
            quantite_demandee: this.quantiteAchat,
          }),
        });
        const data = await res.json();
        if (!res.ok) this.panierErreur = data.error;
        else {
          this.panierSucces = "Ajouté au panier !";
          this.fetchRecommandations(this.jeuDetails.id_j); // Déclencher la reco
          setTimeout(() => this.fermerPopup(), 800);
        }
      } catch {
        this.panierErreur = "Erreur de connexion.";
      }
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
        const data = await res.json();
        this.avisListe = data;
      } catch {
        this.avisListe = [];
      }
    },

    async envoyerAvis() {
      const id_user = localStorage.getItem("userId");
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

        if (!res.ok) this.avisError = data.error;
        else {
          this.avisSuccess = "Avis envoyé !";
          this.chargerAvis(this.jeuAvis.id_j);

          // Déclencher la recommandation si la note est bonne
          if (this.avisNote >= 7) {
            this.fetchRecommandations(this.jeuAvis.id_j);
          }

          setTimeout(() => this.fermerAvis(), 800);
        }
      } catch {
        this.avisError = "Erreur serveur.";
      }
    },
    async supprimerAvis(id_avis) {
      const id_user = this.userId;

      try {
        const res = await fetch(
          `http://localhost:3000/api/avis/${id_avis}/${id_user}`,
          {
            method: "DELETE",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Erreur lors de la suppression.");
          return;
        }

        // rafraîchir la liste des avis
        this.chargerAvis(this.jeuAvis.id_j);
      } catch (err) {
        alert("Erreur serveur.");
      }
    },

    async fetchCategories() {
      const r = await fetch("http://localhost:3000/api/categories");
      this.categories = await r.json();
    },
    async fetchJeux() {
      const r = await fetch("http://localhost:3000/api/jeux");
      this.jeux = await r.json();
    },

    // Fonction de recommandation (ajoutée)
    async fetchRecommandations(id_j) {
      try {
        const res = await fetch(
          `http://localhost:3000/api/recommandations/jeu/${id_j}`
        );
        const reco = await res.json();

        if (reco.length > 0) {
          // Afficher la recommandation dans une alerte
          alert("Nous vous recommandons aussi : " + reco[0].nom_j);
        }
      } catch {
        console.error("Erreur recommandation");
      }
    },
  },

  mounted() {
    this.fetchCategories();
    this.fetchJeux();
  },
};
</script>

<style scoped>
/* ------------------------------------------- */
/* NAVIGATION BAR */
/* ------------------------------------------- */
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

/* ------------------------------------------- */
/* PAGE ET FILTRES */
/* ------------------------------------------- */
.page-carte {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filtres {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Assure que les filtres passent à la ligne sur mobile */
}

.filtres input,
.filtres select {
  padding: 10px;
  font-size: 16px;
  flex-grow: 1;
  min-width: 150px;
}

/* ------------------------------------------- */
/* LISTE DES JEUX (Utilisation de CSS Grid) */
/* ------------------------------------------- */
.liste-jeux {
  margin-top: 30px;
  display: grid;
  /* Affichage en colonnes: 1 colonne sur mobile, 2 colonnes minimum sur desktop */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.carte-jeu {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.carte-jeu h3 {
  color: #007bff; /* Couleur pour le titre du jeu */
  margin-top: 0;
  margin-bottom: 10px;
}

/* ------------------------------------------- */
/* POPUP GÉNÉRAL (Pupop) */
/* ------------------------------------------- */
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
  width: 90%; /* Prend plus de place sur mobile */
  max-width: 400px; /* Limite la taille sur desktop */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  position: relative;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #333;
}

/* ------------------------------------------- */
/* FORMULAIRE ET INPUTS */
/* ------------------------------------------- */
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  font-size: 16px;
  text-align: left;
  margin-top: 5px;
}

input,
textarea {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.avis-textarea {
  min-height: 80px;
  resize: vertical;
}

/* ------------------------------------------- */
/* BOUTONS DANS LE FORMULAIRE ET LES CARTES */
/* ------------------------------------------- */

/* Bouton Principal (Ajouter au panier / Envoyer) */
#submit,
.carte-jeu button {
  padding: 12px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  transition: background-color 0.3s;
}

#submit:hover,
.carte-jeu button:hover {
  background-color: #333399;
}

/* Bouton Secondaire (Annuler / Fermer) */
#close {
  background-color: gray;
  padding: 12px;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

#close:hover {
  background-color: #999;
}

/* Bouton Supprimer Avis */
.delete-btn {
  background-color: #dc3545;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  margin-top: 5px;
  align-self: flex-start;
}
.delete-btn:hover {
  background-color: #c82333;
}

/* Styles pour les avis dans le popup */
.avis-item {
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
  margin-bottom: 10px;
}
.no-avis {
  color: #999;
  font-style: italic;
  margin-bottom: 15px;
}
</style>

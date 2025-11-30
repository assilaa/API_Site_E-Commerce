<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="logo">LUDOMAP</div>
      <button class="hamburger" @click="menuOpen = !menuOpen">☰</button>
      <ul :class="{ open: menuOpen }">
        <li><router-link to="/carte">Carte</router-link></li>
        <li><router-link to="/mon-panier">Mon Panier</router-link></li>
        <li><router-link to="/mon-compte">Mon Compte</router-link></li>
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
        <p>Catégorie : {{ jeu.categorie }}</p>
        <p>Nombre de joueurs : {{ jeu.nb_joueurs || "..." }}</p>
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

  <!-- 🛒 POPUP PANIER (identique) -->
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

  <!-- ⭐ POPUP AVIS -->
  <!-- <div v-if="showAvisPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerAvis">&times;</span>
      <h3>Laisser un avis</h3>

      <p><strong>Jeu :</strong> {{ jeuAvis.nom_j }}</p>

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
  </div> -->
  <!-- POPUP AVIS -->
  <div v-if="showAvisPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerAvis">&times;</span>

      <h3>Laisser un avis</h3>
      <p><strong>Jeu :</strong> {{ jeuAvis.nom_j }}</p>

      <!-- ⭐ Avis existants -->
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

      <!-- ⭐ Formulaire d'ajout d'avis -->
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

<!-- <script>
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
    };
  },

  computed: {
    jeuxFiltres() {
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

    /* PANIER */
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
          setTimeout(() => this.fermerPopup(), 800);
        }
      } catch {
        this.panierErreur = "Erreur de connexion.";
      }
    },

    /* AVIS */
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
          setTimeout(() => this.fermerAvis(), 800);
          this.chargerAvis(this.jeuAvis.id_j);
        }
      } catch {
        this.avisError = "Erreur serveur.";
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
  },
  chargerAvis(id_j) {
    fetch(`http://localhost:3000/api/avis/${id_j}`)
      .then((res) => res.json())
      .then((data) => {
        this.avisListe = data;
      })
      .catch(() => {
        this.avisListe = [];
      });
  },

  mounted() {
    this.fetchCategories();
    this.fetchJeux();
  },
};
</script> -->

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
  },

  mounted() {
    this.fetchCategories();
    this.fetchJeux();
  },
};
</script>

<!-- ✅ TOUT LE CSS SUPPRIMÉ (map-modal, carte-button, etc.) -->
<style scoped>
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

.page-carte {
  padding: 20px;
}

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

.liste-jeux {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.carte-jeu {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: #f8f8f8;
}

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
  width: 320px;
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

input {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ccc;
  font-size: 16px;
}

#submit {
  padding: 12px;
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
  padding: 12px;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
}

#close:hover {
  background-color: #999;
}

.avis-textarea {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ccc;
  font-size: 15px;
}
</style>

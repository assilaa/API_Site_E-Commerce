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
        <option
          v-for="cat in categories"
          :key="cat.id_cat"
          :value="cat.id_cat"
        >
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
    };
  },

  computed: {
    jeuxFiltres() {
      return this.jeux.filter((j) => {
        const matchNom =
          this.filtreNom === "" ||
          j.nom_j.toLowerCase().includes(this.filtreNom.toLowerCase());

        const matchCategorie =
          this.filtreCategorie === "" ||
          Number(j.id_cat) === Number(this.filtreCategorie);

        const matchJoueurs =
          !this.filtreJoueurs || j.nb_joueurs === this.filtreJoueurs;

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
        this.jeux = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("Erreur chargement jeux :", e);
        this.jeux = [];
      }
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
</style>

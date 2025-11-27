<template>
  <div class="page-carte">
    <div class="filtres">
      <input v-model="filtreNom" placeholder="Nom du jeu" />
      <input v-model.number="filtreJoueurs" type="number" placeholder="Nombre de joueurs" />
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
        <p>Nombre de joueurs : {{ jeu.nb_joueurs || '...' }}</p>
        <p>Prix unitaire : {{ jeu.prix }} €</p>
        <p>En stock : {{ jeu.quantite }}</p>
        <button :disabled="jeu.quantite < 1" @click="ouvrirPopup(jeu)">Acheter</button>
      </div>
    </div>
  </div>

  <!-- POPUP ACHAT -->
  <div v-if="showPopup" class="Pupop">
    <div class="pupop-container">
      <span class="close" @click="fermerPopup">&times;</span>
      <h3>Acheter le jeu</h3>
      <form @submit.prevent="validerAchat">
        <p><strong>Nom :</strong> {{ jeuDetails.nom_j }}</p>
        <p><strong>Quantité disponible :</strong> {{ jeuDetails.quantite }}</p>
        <p><strong>Prix unitaire :</strong> {{ jeuDetails.prix }} €</p>

        <label for="quantiteAchat">Quantité à acheter</label>
        <input
          type="number"
          v-model.number="quantiteAchat"
          min="1"
          :max="jeuDetails.quantite"
          required
        />

        <button id="submit" type="submit">Acheter</button>
        <button id="close" type="button" @click="fermerPopup">Annuler</button>
        <p v-if="achatErreur" style="color: red;">{{ achatErreur }}</p>
        <p v-if="achatSucces" style="color: green;">{{ achatSucces }}</p>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      center: [48.8566, 2.3522],
      filtreNom: "",
      filtreCategorie: "",
      filtreJoueurs: null,
      categories: [],
      jeux: [],
      menuOpen: false,

      // popup achat
      showPopup: false,
      jeuDetails: null,
      quantiteAchat: 1,
      achatErreur: "",
      achatSucces: "",
    };
  },
  computed: {
    jeuxFiltres() {
      return this.jeux.filter(j => {
        const matchNom = this.filtreNom === "" || j.nom_j.toLowerCase().includes(this.filtreNom.toLowerCase());
        const matchCategorie = this.filtreCategorie === "" || Number(j.id_cat) === Number(this.filtreCategorie);
        const matchJoueurs = !this.filtreJoueurs || (j.nb_joueurs && j.nb_joueurs === this.filtreJoueurs);
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
      this.achatErreur = "";
      this.achatSucces = "";
      this.showPopup = true;
    },
    fermerPopup() {
      this.showPopup = false;
    },
    async validerAchat() {
      const id_user = localStorage.getItem("userId");
      if (!id_user) {
        this.achatErreur = "Utilisateur non authentifié.";
        return;
      }
      if (this.quantiteAchat < 1 || this.quantiteAchat > this.jeuDetails.quantite) {
        this.achatErreur = "Quantité invalide.";
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/api/acheter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_jeu: this.jeuDetails.id_j,
            id_user: id_user,
            quantite_achetee: this.quantiteAchat,
          })
        });
        const data = await res.json();
        if (!res.ok) {
          this.achatErreur = data.error || "Erreur lors de l'achat.";
          this.achatSucces = "";
        } else {
          this.achatErreur = "";
          this.achatSucces = data.message || "Achat effectué.";
          // MAJ stock affiché
          this.jeuDetails.quantite -= this.quantiteAchat;
          const jeuIndex = this.jeux.findIndex(j => j.id_j === this.jeuDetails.id_j);
          if (jeuIndex !== -1)
            this.jeux[jeuIndex].quantite = this.jeuDetails.quantite;
        }
      } catch (err) {
        this.achatErreur = "Erreur réseau.";
        this.achatSucces = "";
      }
    },
  },
  mounted() {
    fetch("http://localhost:3000/api/categories")
      .then(res => res.json())
      .then(data => this.categories = data)
      .catch(err => console.error("Erreur chargement catégories :", err));

    fetch("http://localhost:3000/api/jeux")
      .then(res => res.json())
      .then(data => this.jeux = data)
      .catch(err => console.error("Erreur chargement jeux :", err));
  },
};
</script>



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

/* Titre + bouton au centre */
.text-box {
  width: 90%;
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.text-box h1 {
  font-size: 62px;
  margin-bottom: 10px;
}

.text-box p {
  font-size: 24px;
  margin-bottom: 30px;
}

/* Boutons d'action */
.hero-btn {
  display: inline-block;
  color: white;
  border: 2px solid white;
  padding: 10px 30px;
  font-size: 18px;
  background: transparent;
  border-radius: 50px;
  margin: 10px;
  transition: 0.3s ease;
}

.hero-btn:hover {
  background-color: #333399;
  border-color: #333399;
}

/* Popup fond */
.Pupop {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
}

/* Contenu du popup */
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

input, select {
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

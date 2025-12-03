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
          <router-link to="/recommandations">Recommandations</router-link>
        </li>
        <li><a href="#" @click.prevent="logout">Déconnexion</a></li>
      </ul>
    </div>
  </nav>

  <div class="page-reco">
    <h2>Vos recommandations personnalisées</h2>

    <div v-if="loading">Chargement des recommandations...</div>

    <div v-if="reco.length === 0 && !loading">
      <p>
        Aucune recommandation disponible pour le moment. Aimez des jeux pour
        obtenir des suggestions !
      </p>
    </div>

    <div class="liste-jeux">
      <div v-for="j in reco" :key="j.id_j" class="carte-jeu">
        <h3>{{ j.nom_j }}</h3>
        <p>Catégorie : {{ j.categories }}</p>
        <p>Joueurs : {{ j.minplayers }}–{{ j.maxplayers }}</p>
        <p>{{ j.description }}</p>

        <!-- <button @click="chargerAvis(j.id_j)">Voir les avis</button> -->

        <!-- AFFICHAGE DES AVIS -->
        <div class="avis-block" v-if="avis[j.id_j] && avis[j.id_j].length > 0">
          <h4>Avis :</h4>
          <div class="avis-item" v-for="a in avis[j.id_j]" :key="a.id_avis">
            <p>
              <strong>Note : {{ a.note }}/10</strong>
            </p>
            <p>{{ a.commentaire }}</p>
            <small>{{ a.date_avis }}</small>
            <hr />
          </div>
        </div>

        <div v-else-if="avis[j.id_j] && avis[j.id_j].length === 0">
          <p>Aucun avis pour ce jeu.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Recommandations",

  data() {
    return {
      reco: [],
      avis: {}, // <-- liste des avis par jeu
      loading: true,
      menuOpen: false,
    };
  },

  methods: {
    logout() {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      this.$router.push("/");
    },

    async chargerAvis(id_j) {
      try {
        const res = await fetch(`http://localhost:3000/api/avis/${id_j}`);
        const data = await res.json();

        this.$set(this.avis, id_j, data); // Vue 2 compatible
      } catch (err) {
        console.error("Erreur récupération avis:", err);
      }
    },
  },

  async mounted() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      this.loading = false;
      console.warn(
        "Utilisateur non connecté. Impossible de charger les recommandations."
      );
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/api/recommandations/utilisateur/${userId}`
      );
      const data = await res.json();

      if (res.ok) {
        this.reco = data;
      } else {
        console.error(
          "Erreur API reco:",
          data.error || "Impossible de récupérer les recommandations."
        );
        this.reco = [];
      }
    } catch (e) {
      console.error(
        "Erreur de connexion lors du fetch des recommandations:",
        e
      );
      this.reco = [];
    }
    this.loading = false;
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
/* PAGE ET LISTE DE RECOMMANDATIONS */
/* ------------------------------------------- */
.page-reco {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.liste-jeux {
  margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.carte-jeu {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: #f8f8f8;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Avis */
.avis-block {
  margin-top: 10px;
  background: #ffffff;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #ddd;
}

.avis-item {
  margin-bottom: 10px;
}

/* Bouton */
.carte-jeu button {
  padding: 12px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 15px;
  transition: background-color 0.3s;
}

.carte-jeu button:hover {
  background-color: #333399;
}

.carte-jeu {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 350px; /* Limite la hauteur */
  overflow: hidden; /* Cache le dépassement */
}

.carte-jeu p {
  overflow-y: auto; /* Scroll si texte long */
  max-height: 160px; /* Limite la description */
}

.liste-jeux {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(240px, 1fr)
  ); /* Cartes plus petites */
  gap: 20px;
}
</style>

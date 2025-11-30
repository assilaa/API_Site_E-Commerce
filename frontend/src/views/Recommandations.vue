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
    <h2>🎯 Vos recommandations personnalisées</h2>

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

        <button>Voir Détails</button>
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
/* NAVIGATION BAR (Copie de Carte.vue) */
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
  max-width: 1200px; /* Ajout d'une largeur max pour centrer le contenu */
  margin: 0 auto;
}

.liste-jeux {
  margin-top: 30px;
  display: grid; /* Utilisation de Grid pour un affichage plus moderne */
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.carte-jeu h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 10px;
}

.carte-jeu p {
  margin: 5px 0;
  font-size: 15px;
}

/* ------------------------------------------- */
/* BOUTONS (Basé sur le style du popup) */
/* ------------------------------------------- */
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
</style>

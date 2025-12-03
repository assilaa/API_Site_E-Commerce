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

  <div class="page-reco">
    <h2> Vos recommandations personnalisées</h2>

    <div v-if="loading">Chargement des recommandations...</div>

    <div v-else-if="reco.length === 0">
      <p>
        Aucune recommandation disponible pour le moment.<br />
        Laissez des avis avec une note <strong>≥ 7</strong> sur des jeux pour en
        obtenir !
      </p>
    </div>

    <div v-else class="liste-jeux">
      <div v-for="j in reco" :key="j.id_j" class="carte-jeu">
        <h3>{{ j.nom_j }}</h3>

        <p><strong>Catégorie :</strong> {{ j.categorie || "Non renseignée" }}</p>
        <p><strong>Joueurs :</strong> 
            <span v-if="j.min_players && j.max_players">
                {{ j.min_players }} – {{ j.max_players }}
            </span>
            <span v-else>-</span>
        </p>
        
        <p v-if="j.prix != null"><strong>Prix :</strong> {{ j.prix }} €</p>
        <p class="description">{{ j.description || "Aucune description disponible." }}</p>


        <button @click="chargerAvis(j.id_j)">Voir les avis</button>

        <!-- AVIS POUR CE JEU -->
        <div
          class="avis-block"
          v-if="avis[j.id_j] && avis[j.id_j].length > 0"
        >
          <h4>Avis des joueurs :</h4>
          <div
            class="avis-item"
            v-for="a in avis[j.id_j]"
            :key="a.id_u + '-' + a.id_j"
          >
            <p><strong>Note : {{ a.note }}/10</strong></p>
            <p>{{ a.avis }}</p>
            <small>
              Publié le {{ a.date_publication }} par
              {{ a.prenom_u }} {{ a.nom_u }}
            </small>
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
      avis: {}, // avis[ id_j ] = [ ... ]
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
        // Vue 3 : affectation directe = réactive
        this.avis[id_j] = data;
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

.page-reco {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-reco h2 {
  margin-bottom: 20px;
}

.liste-jeux {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
}

.carte-jeu {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background-color: #fdfdfd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
}

.carte-jeu h3 {
  margin-bottom: 10px;
}

.carte-jeu p {
  margin: 4px 0;
}

.carte-jeu button {
  padding: 10px 16px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 15px;
  margin-top: 12px;
}

.carte-jeu button:hover {
  background-color: #333399;
}

/* Avis */
.avis-block {
  margin-top: 12px;
  background: #ffffff;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #ddd;
}

.avis-item {
  margin-bottom: 10px;
}

.description {
  max-height: 120px;      /* limite l’espace vertical */
  overflow-y: auto;       /* active le scroll vertical */
  padding-right: 8px;     /* pour éviter que le texte colle au bord */
  white-space: pre-line;  /* gère correctement les retours ligne du JSON */
}


</style>

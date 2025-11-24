<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="logo">LUDOMAP</div>
      <button class="hamburger" @click="menuOpen = !menuOpen">☰</button>
      <ul :class="{ open: menuOpen }">
        <li><router-link to="/carte">Carte</router-link></li>
        <li><router-link to="/mon-compte">Mon Compte</router-link></li>
        <li><a href="#" @click.prevent="logout">Déconnexion</a></li>
      </ul>
    </div>
  </nav>
  
  <div class="mon-compte">
    <h1>Mon Compte</h1>

    <div v-if="achats.length > 0">
      <h2>Mes Achats</h2>
      <ul>
        <li v-for="achat in achats" :key="achat.id_achat">
          <p>
            Jeu: {{ achat.nom_j }}<br>
            Date d'achat: {{ achat.date_achat }}<br>
            Quantité: {{ achat.quantite_achetee }}<br>
            Prix unitaire: {{ achat.prix }} €<br>
            Montant total: {{ (achat.quantite_achetee * achat.prix).toFixed(2) }} €
          </p>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>Aucun achat trouvé.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuOpen: false,
      achats: []
    }
  },
  mounted() {
    this.getAchats();
  },
  methods: {
    getAchats() {
      const userId = localStorage.getItem("userId");
      if (userId) {
        fetch(`http://localhost:3000/api/mes-achats/${userId}`)
          .then(res => res.json())
          .then(data => { this.achats = data; })
          .catch(err => {
            console.error("Erreur lors de la récupération des achats", err);
          });
      } else {
        alert("Veuillez vous connecter.");
        this.$router.push({ name: "Login" });
      }
    },
    logout() {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      this.$router.push({ name: "Login" });
    },
  }
}
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
</style>
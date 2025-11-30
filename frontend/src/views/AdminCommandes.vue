<template>
  <div>

    <!-- NAVBAR FULL WIDTH -->
    <nav class="navbar">
      <div class="navbar-container">
        <div class="logo">LUDOMAP</div>
         <ul :class="{ open: menuOpen }">
          <li><router-link to="/admin">Jeux</router-link></li>
          <li><router-link to="/admin/commandes">Commandes</router-link></li>
          <li><a href="#" @click.prevent="logout">Déconnexion</a></li>
        </ul>
      </div>
    </nav>

    <!-- TITRE -->
    <h1 class="page-title">Commandes des utilisateurs</h1>

    <!-- LISTE DES COMMANDES -->
    <div class="commandes-container">

      <div 
        v-for="cmd in commandes" 
        :key="cmd.id_achat" 
        class="commande-card">

        <h2 class="commande-title">Commande #{{ cmd.id_achat }}</h2>

        <div class="commande-grid">

          <div class="commande-info">
            <p><strong>Date :</strong> {{ formatDate(cmd.date_achat) }}</p>
            <p><strong>Utilisateur :</strong> {{ cmd.utilisateur }} ({{ cmd.email }})</p>
            <p><strong>Point de retrait :</strong> {{ cmd.nom_point }}</p>
            <p><strong>Jeu :</strong> {{ cmd.nom_j }}</p>
            <p><strong>Quantité :</strong> {{ cmd.quantite_achetee }}</p>
            <p><strong>Total :</strong> {{ (cmd.quantite_achetee * cmd.prix).toFixed(2) }} €</p>
          </div>

          <div class="commande-statut">
            <label><strong>Statut :</strong></label>
            <select 
              v-model="cmd.statut" 
              @change="updateStatut(cmd)" 
              class="statut-select">
              <option>Payé</option>
              <option>En préparation</option>
              <option>Expédié</option>
              <option>Livré</option>
              <option>Annulé</option>
            </select>
          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      commandes: [],
      menuOpen: false
    };
  },
  created() {
    this.loadCommandes();
  },
  methods: {
    logout() {
      localStorage.clear();
      this.$router.push({ name: "Login" });
    },

    async loadCommandes() {
      const res = await fetch("http://localhost:3000/api/admin/commandes");
      this.commandes = await res.json();
    },

    async updateStatut(c) {
    await fetch(`http://localhost:3000/api/achats/${c.id_achat}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: c.statut })
    });
    alert("Statut mis à jour !");
    },

    formatDate(d) {
      const date = new Date(d);
      return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
};
</script>

<style>


.logo {
  font-size: 24px;
  font-weight: bold;
}

/* TITRE PAGE */
.page-title {
  text-align: center;
  margin-top: 30px;
  font-size: 32px;
  font-weight: bold;
}

/* LISTE DES COMMANDES */
.commandes-container {
  max-width: 900px;
  margin: 30px auto;
}

/* CARTE COMMANDE */
.commande-card {
  background: white;
  padding: 25px;
  margin-bottom: 30px;
  border-radius: 20px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

.commande-title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
}

.commande-grid {
  display: flex;
  justify-content: space-between;
}

.commande-info {
  font-size: 16px;
  line-height: 1.8;
}

.commande-statut {
  text-align: right;
}

.statut-select {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #bbb;
  margin-top: 10px;
}

/* NAVBAR FIX — style identique à Admin.vue */
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

/* UL et LI fix */
.navbar ul {
  list-style: none;                         /* Enlève les bullets */
  display: flex;                            /* les éléments en ligne */
  gap: 20px;                                /* espacement */
  margin: 0;
  padding: 0;
}

/* Style des liens */
.navbar ul li a {
  color: white;
  text-decoration: none;                    /* pas de soulignement */
  font-size: 17px;
  font-weight: 500;
}

.navbar ul li a:hover {
  text-decoration: underline;
}


</style>

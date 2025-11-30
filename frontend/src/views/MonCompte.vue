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
  
  <div class="mon-compte">
    <h1>Mon Compte</h1>

    <div v-if="commandes.length > 0" class="commandes-liste">
      <div 
        v-for="commande in commandes" 
        :key="commande.id_commande"
        class="commande-card"
      >
        <!-- EN-TÊTE COMMANDE -->
        <div class="commande-header" @click="toggleDetails(commande.id_commande)">
          <div class="commande-info">
            <h3>Commande #{{ commande.id_commande }}</h3>
            <p class="date-commande">
              {{ formatDate(commande.date_commande) }}
            </p>
            <p class="total-commande">
              💰 {{ commande.total.toFixed(2) }} €
            </p>
          </div>
          <button class="toggle-btn">
            {{ commande.showDetails ? '−' : '+' }}
          </button>
        </div>

        <!-- DÉTAILS DÉROULANTS -->
        <div v-if="commande.showDetails" class="commande-details">
          <div class="details-grid">
            <div class="point-retrait">
              <h4>📍 Point de retrait</h4>
              <p><strong>{{ commande.nom_point }}</strong></p>
            </div>
            <div class="articles-liste">
              <h4>📦 Articles</h4>
              <div 
                v-for="article in commande.articles" 
                :key="article.id_achat"
                class="article-detail"
              >
                <span>{{ article.nom_j }}</span>
                <span>{{ article.quantite_achetee }} × {{ article.prix }}€</span>
                <span class="article-total">{{ (article.quantite_achetee * article.prix).toFixed(2) }}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Aucune commande trouvée.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuOpen: false,
      commandes: []
    }
  },
  
  mounted() {
    this.getAchats();
  },
  
  methods: {
    getAchats() {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        this.$router.push({ name: "Login" });
        return;
      }

      fetch(`http://localhost:3000/api/mes-achats/${userId}`)
        .then(res => res.json())
        .then(data => {
          const commandesGroupées = this.groupByCommande(data);
          this.commandes = commandesGroupées;
        })
        .catch(err => {
          console.error("Erreur achats:", err);
        });
    },

    groupByCommande(achats) {
      const commandes = {};
      
      achats.forEach(achat => {
        const dateKey = achat.date_achat.split('T')[0];
        
        if (!commandes[dateKey]) {
          commandes[dateKey] = {
            id_commande: this.genererIdCommande(dateKey),
            date_commande: achat.date_achat,
            nom_point: achat.nom_point,
            total: 0,
            articles: [],
            showDetails: false
          };
        }
        
        commandes[dateKey].articles.push(achat);
        commandes[dateKey].total += achat.quantite_achetee * achat.prix;
      });

      return Object.values(commandes)
        .sort((a, b) => new Date(b.date_commande) - new Date(a.date_commande));
    },

    genererIdCommande(dateKey) {
      return dateKey.replace(/-/g, '') + Math.floor(Math.random() * 1000);
    },

    toggleDetails(idCommande) {
      const commande = this.commandes.find(c => c.id_commande === idCommande);
      if (commande) {
        commande.showDetails = !commande.showDetails;
      }
    },

    formatDate(dateIso) {
      return new Date(dateIso).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    logout() {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      this.$router.push({ name: "Login" });
    }
  }
}
</script>

<style scoped>
/* ✅ MÊME NAVBAR QUE PANIER */
.navbar {
  background-color: #333;
  color: white;
  padding: 1rem;
  margin-bottom: 20px;
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

/* ✅ STYLES COMPTE (identiques) */
.mon-compte {
  max-width: 1000px;
  margin: 30px auto;
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 12px;
  min-height: 60vh;
}

.mon-compte h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.commandes-liste {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.commande-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.commande-card:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.commande-header {
  padding: 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  user-select: none;
}

.commande-header:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.commande-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.3em;
}

.date-commande {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95em;
}

.total-commande {
  margin: 5px 0 0 0;
  font-size: 1.4em;
  font-weight: bold;
}

.toggle-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

.commande-details {
  background: #f8f9ff;
  padding: 25px;
  animation: unfold 0.3s ease-out;
}

@keyframes unfold {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}

.point-retrait {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #4a90e2;
}

.point-retrait h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.articles-liste {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.articles-liste h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.article-detail {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.article-detail:last-child {
  border-bottom: none;
}

.article-total {
  font-weight: bold;
  color: #667eea;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .article-detail {
    grid-template-columns: 2fr 1fr;
    gap: 10px;
  }
  
  .article-total {
    text-align: left;
  }
}
</style>

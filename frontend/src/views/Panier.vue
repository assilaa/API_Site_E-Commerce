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

  <div class="mon-panier">
    <h2>Votre Panier</h2>

    <div v-if="chargement" class="message-info">Chargement du panier...</div>
    <div v-else-if="erreurPanier" class="message-erreur">Erreur : {{ erreurPanier }}</div>
    <div v-else-if="panier.length === 0" class="message-info">Votre panier est vide.</div>

    <div v-else class="panier-grid">
      <div class="liste-articles">
        <div
          v-for="item in panier"
          :key="item.id_panier_ligne"
          class="article-panier"
        >
          <div class="details-article">
            <h4>{{ item.nom_j }}</h4>
            <p>Prix unitaire : <strong>{{ item.prix }} €</strong></p>
            <p>Quantité : <strong>{{ item.quantite_panier }}</strong></p>
            <p>Sous-total : <strong>{{ (item.prix * item.quantite_panier).toFixed(2) }} €</strong></p>
            <p
              v-if="item.quantite_panier > item.stock_dispo"
              class="stock-alerte"
            >
              Stock insuffisant (Max: {{ item.stock_dispo }})
            </p>
          </div>
          <button
            @click="supprimerArticle(item.id_panier_ligne)"
            class="btn-supprimer"
            type="button"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div class="recap-commande">
        <h3>Récapitulatif</h3>
        <p class="total">
          Total à payer : <strong>{{ totalPanier.toFixed(2) }} €</strong>
        </p>

        <!-- ✅ POINT RELAIS UNIQUEMENT SI PAS EN PAIEMENT -->
        <div v-if="!showPaiement" class="point-retrait-choix">
          <h4>Point de retrait</h4>
          <p v-if="selectedPickup" class="point-selectionne">
            📍 <strong>{{ selectedPickup.nom }}</strong>
            ({{ selectedPickup.distance.toFixed(1) }} km)
          </p>
          <p v-else class="point-manquant">
            Veuillez choisir un point de retrait.
          </p>

          <button
            @click="ouvrirCarte"
            class="btn-choisir-map"
            :disabled="!lat || !lon || pointsRetrait.length === 0"
            type="button"
          >
            Choisir sur la carte
          </button>
        </div>

        <!-- ✅ BOUTON VALIDER (UNIQUEMENT SI PAS EN PAIEMENT) -->
        <button
          v-if="!showPaiement"
          @click="validerCommande"
          :disabled="!commandePrete"
          class="btn-valider"
          type="button"
        >
          Valider la commande
        </button>

        <!-- ✅ FORMULAIRE PAIEMENT (APPEARS APRÈS VALIDATION) -->
        <div v-if="showPaiement" class="formulaire-paiement">
          <h4>💳 Paiement sécurisé</h4>
          
          <div class="champ-paiement">
            <label>Numéro de carte</label>
            <input
              v-model="numeroCarte"
              type="text"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              @input="formatCarte"
              required
            />
          </div>

          <div class="champs-paiement-row">
            <div class="champ-paiement">
              <label>Date d'expiration</label>
              <input
                v-model="dateExpiration"
                type="text"
                placeholder="MM/AA"
                maxlength="5"
                @input="formatDate"
                required
              />
            </div>
            <div class="champ-paiement">
              <label>CVV</label>
              <input
                v-model="cvv"
                type="text"
                placeholder="123"
                maxlength="3"
                required
              />
            </div>
          </div>

          <div class="champ-paiement">
            <label>Nom sur la carte</label>
            <input
              v-model="nomTitulaire"
              type="text"
              placeholder="JEAN DUPONT"
              required
            />
          </div>

          <button @click="confirmerPaiement" class="btn-payer">
            Payer {{ totalPanier.toFixed(2) }} €
          </button>
        </div>

        <p v-if="commandeErreur" class="message-erreur">
          {{ commandeErreur }}
        </p>
        <p v-if="commandeSucces" class="message-succes">
          {{ commandeSucces }}
        </p>
      </div>
    </div>
  </div>

  <!-- ✅ CARTE UNIQUEMENT SI PAS EN PAIEMENT -->
  <div v-if="showMap && !showPaiement" class="map-modal">
    <div class="map-container">
      <div id="pickupMap" class="map"></div>
      <button @click="fermerCarte" class="close-map" type="button">
        Fermer
      </button>
    </div>
  </div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "PagePanier",

  data() {
    return {
      userId: null,
      panier: [],
      chargement: true,
      erreurPanier: "",

      // Navbar
      menuOpen: false,

      // Variables pour le point de retrait ✅ AJOUTÉES
      showMap: false,
      map: null,
      markers: [],
      selectedPickup: null,
      lat: null,
      lon: null,
      pointsRetrait: [],

      // ÉTAT PAIEMENT
      showPaiement: false,
      numeroCarte: "",
      dateExpiration: "",
      cvv: "",
      nomTitulaire: "",

      commandeErreur: "",
      commandeSucces: "",
    };
  },

  computed: {
    totalPanier() {
      return this.panier.reduce((total, item) => {
        return total + item.prix * item.quantite_panier;
      }, 0);
    },

    commandePrete() {
      return this.panier.length > 0 && this.selectedPickup !== null;
    },
  },

  watch: {
    showMap(val) {
      if (val) {
        this.$nextTick(() => {
          this.initializeMap(); // ✅ CETTE MÉTHODE MANquait !
        });
      }
    },
  },

  methods: {
    logout() {
      localStorage.removeItem("userId");
      this.$router.push("/");
    },

    ouvrirCarte() {
      this.showMap = true;
    },

    fermerCarte() {
      this.showMap = false;
    },

    validerCommande() {
      if (!this.commandePrete) {
        this.commandeErreur =
          "Veuillez choisir un point de retrait et avoir des articles dans le panier.";
        return;
      }
      this.showPaiement = true;
      this.commandeSucces = "Commande validée ! Complétez le paiement.";
    },

    formatCarte() {
      let value = this.numeroCarte.replace(/\s/g, '').replace(/[^0-9]/gi, '');
      let matches = value.match(/.{1,4}/g);
      let match = matches ? matches.join(' ') : '';
      this.numeroCarte = match;
    },

    formatDate() {
      let value = this.dateExpiration.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      this.dateExpiration = value;
    },

    async confirmerPaiement() {
      if (!this.numeroCarte || !this.dateExpiration || !this.cvv || !this.nomTitulaire) {
        this.commandeErreur = "Veuillez remplir tous les champs.";
        return;
      }

      this.commandeErreur = "";
      
      try {
        const res = await fetch("http://localhost:3000/api/commander", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_user: this.userId,
            id_point: this.selectedPickup.id,
            lat: this.selectedPickup.lat,
            lon: this.selectedPickup.lon,
            nom_point: this.selectedPickup.nom,
            paiement: {
              numero: this.numeroCarte.replace(/\s/g, ''),
              expiration: this.dateExpiration,
              cvv: this.cvv,
              titulaire: this.nomTitulaire
            }
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.commandeErreur = data.error || "Erreur lors du paiement.";
        } else {
          this.commandeSucces = `✅ Paiement confirmé ! Commande n°${data.id_commande} enregistrée.`;
          this.panier = [];
          this.selectedPickup = null;
          this.numeroCarte = "";
          this.dateExpiration = "";
          this.cvv = "";
          this.nomTitulaire = "";
          setTimeout(() => {
            this.$router.push("/mon-compte");
          }, 2000);
        }
      } catch (e) {
        this.commandeErreur = "Erreur réseau lors du paiement.";
      }
    },

    async fetchPanier() {
      this.chargement = true;
      this.userId = localStorage.getItem("userId");
      if (!this.userId) {
        this.$router.push("/");
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/api/panier/${this.userId}`
        );
        const data = await res.json();

        if (!res.ok) {
          this.erreurPanier = data.error || "Erreur de chargement du panier.";
          this.panier = [];
        } else {
          this.panier = data;
          this.erreurPanier = "";
        }
      } catch (e) {
        this.erreurPanier = "Erreur réseau lors du chargement du panier.";
        this.panier = [];
      } finally {
        this.chargement = false;
      }
    },

    async supprimerArticle(id_panier_ligne) {
      try {
        await fetch(
          `http://localhost:3000/api/panier/ligne/${id_panier_ligne}`,
          { method: "DELETE" }
        );
        await this.fetchPanier();
      } catch (e) {
        this.erreurPanier = "Erreur réseau lors de la suppression de l'article.";
      }
    },

    // ✅ MÉTHODES CARTE MANQUANTES !!!!
    distance(p1, p2) {
      const R = 6371;
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLon = (p2.lon - p1.lon) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(p1.lat * Math.PI / 180) *
          Math.cos(p2.lat * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    async fetchPoints(lat, lon) {
      const latMin = lat - 0.1;
      const latMax = lat + 0.1;
      const lonMin = lon - 0.1;
      const lonMax = lon + 0.1;

      const query = `
        [out:json];
        (
          node["amenity"="parcel_locker"](${latMin},${lonMin},${latMax},${lonMax});
          node["amenity"="post_office"](${latMin},${lonMin},${latMax},${lonMax});
          node["brand"~"Mondial|Pickup|Amazon|Locker"](${latMin},${lonMin},${latMax},${lonMax});
        );
        out;
      `;

      try {
        const url =
          "https://overpass-api.de/api/interpreter?data=" +
          encodeURIComponent(query);
        const res = await fetch(url);
        const data = await res.json();

        if (!data.elements) {
          this.pointsRetrait = [];
          return;
        }

        this.pointsRetrait = data.elements
          .filter(
            (e) =>
              e.tags && (e.tags.name || e.tags.brand || e.tags.operator)
          )
          .map((e) => ({
            id: e.id,
            nom:
              e.tags.name ||
              e.tags.brand ||
              e.tags.operator ||
              "Point relais",
            lat: e.lat,
            lon: e.lon,
            distance: this.distance(
              { lat: this.lat, lon: this.lon },
              { lat: e.lat, lon: e.lon }
            ),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 20);
      } catch (e) {
        console.error("Erreur Overpass API", e);
        this.pointsRetrait = [];
      }
    },

    initializeMap() {
      if (!this.lat || !this.lon) return;

      const container = document.getElementById("pickupMap");
      if (!container) return;

      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      this.map = L.map("pickupMap").setView([this.lat, this.lon], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(this.map);

      // Nettoyage anciens marqueurs
      this.markers.forEach((m) => this.map.removeLayer(m));
      this.markers = [];

      // Marqueur utilisateur
      L.marker([this.lat, this.lon])
        .addTo(this.map)
        .bindPopup("Votre position");

      // Points relais
      this.pointsRetrait.forEach((p) => {
        const marker = L.marker([p.lat, p.lon])
          .addTo(this.map)
          .on("click", () => {
            this.selectedPickup = p;
            this.showMap = false;
          });

        marker.bindPopup(`<b>${p.nom}</b><br>${p.distance.toFixed(1)} km`);
        this.markers.push(marker);
      });
    },
  },

  mounted() {
    // ✅ GÉOLOCALISATION + CHARGEMENT POINTS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.lat = pos.coords.latitude;
          this.lon = pos.coords.longitude;
          this.fetchPoints(this.lat, this.lon); // ✅ CETTE LIGNE MANQUAIT !
        },
        (err) => {
          console.error("Erreur géolocalisation", err);
        }
      );
    }
    this.fetchPanier();
  },
};
</script>


<style scoped>
/* ✅ TOUS LES STYLES EXISTANTS (à garder) + NOUVEAUX */
.page-panier {
  max-width: 1000px;
  margin: 30px auto;
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 12px;
}

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

.mon-panier h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.message-info,
.message-erreur,
.message-succes {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  margin: 15px 0;
}

.message-info {
  background-color: #e0f7fa;
  color: #00796b;
}

.message-erreur {
  background-color: #ffebee;
  color: #c62828;
}

.message-succes {
  background-color: #e8f5e9;
  color: #388e3c;
}

.panier-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.liste-articles {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.article-panier {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-article h4 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #333;
}

.btn-supprimer {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-supprimer:hover {
  background-color: #d32f2f;
}

.recap-commande {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.total {
  font-size: 1.3em;
  font-weight: bold;
  color: #000;
  margin: 15px 0;
}

.point-retrait-choix {
  padding: 10px;
  border: 1px dashed #ccc;
  border-radius: 5px;
  margin-bottom: 15px;
}

.point-selectionne {
  color: #00796b;
  font-weight: bold;
}

.point-manquant {
  color: #e65100;
}

.btn-choisir-map {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px;
  width: 100%;
  border-radius: 5px;
  cursor: pointer;
}

.btn-valider {
  background-color: black;
  color: white;
  border: none;
  padding: 12px;
  width: 100%;
  border-radius: 25px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.btn-valider:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.btn-valider:hover:not(:disabled) {
  background-color: #333;
}

.stock-alerte {
  color: red;
  font-weight: bold;
}

.map-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.map-container {
  width: 90%;
  max-width: 700px;
  height: 80vh;
  background: white;
  padding: 15px;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.map {
  width: 100%;
  flex-grow: 1;
  border-radius: 10px;
}

.close-map {
  margin-top: 10px;
  background: #444;
  padding: 7px 12px;
  color: white;
  border-radius: 5px;
  align-self: flex-end;
}

/* ✅ NOUVEAUX STYLES PAIEMENT */
.formulaire-paiement {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 25px;
  border-radius: 15px;
  border: 3px solid #4a90e2;
  margin-top: 20px;
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.2);
}

.formulaire-paiement h4 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.4em;
  font-weight: bold;
}

.champ-paiement {
  margin-bottom: 20px;
}

.champ-paiement label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.champ-paiement input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.champ-paiement input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.15);
  transform: translateY(-1px);
}

.champs-paiement-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.btn-payer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 18px;
  width: 100%;
  border-radius: 30px;
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-payer:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-payer:active {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .panier-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .champs-paiement-row {
    grid-template-columns: 1fr;
  }
  
  .formulaire-paiement {
    padding: 20px;
  }
}
</style>

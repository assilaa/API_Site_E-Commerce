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

        <!-- BOUTON POUR OUVRIR LA CARTE -->
        <div>
          <label>Point de retrait</label>

          <button @click="showMap = true" class="carte-button" type="button">
            Choisir sur la carte
          </button>

          <!-- AFFICHAGE DU POINT CHOISI -->
          <p v-if="selectedPickup">
            📍 <strong>{{ selectedPickup.nom }}</strong>
            ({{ selectedPickup.distance.toFixed(1) }} km)
          </p>
        </div>

        <!-- POPUP DE LA MINI CARTE -->
        <div v-if="showMap" class="map-modal">
          <div class="map-container">
            <div id="pickupMap" class="map"></div>

            <button @click="showMap = false" class="close-map" type="button">
              Fermer
            </button>
          </div>
        </div>

        <button id="submit" type="submit">Acheter</button>
        <button id="close" type="button" @click="fermerPopup">Annuler</button>

        <p v-if="achatErreur" style="color: red;">{{ achatErreur }}</p>
        <p v-if="achatSucces" style="color: green;">{{ achatSucces }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  data() {
    return {
      filtreNom: "",
      filtreCategorie: "",
      filtreJoueurs: null,

      categories: [],
      jeux: [],
      menuOpen: false,

      // Carte mini-modal
      showMap: false,
      map: null,
      markers: [],
      selectedPickup: null,

      lat: null,
      lon: null,

      // popup achat
      showPopup: false,
      jeuDetails: null,
      quantiteAchat: 1,
      achatErreur: "",
      achatSucces: "",

      pointsRetrait: [],
    };
  },

  watch: {
    showMap(val) {
      if (val) {
        this.$nextTick(() => {
          this.initializeMap();
        });
      }
    }
  },

  computed: {
    jeuxFiltres() {
      return this.jeux.filter(j => {
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
    }
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

    distance(p1, p2) {
      const R = 6371;
      const dLat = (p2.lat - p1.lat) * Math.PI/180;
      const dLon = (p2.lon - p1.lon) * Math.PI/180;

      const a =
        Math.sin(dLat/2)**2 +
        Math.cos(p1.lat*Math.PI/180) *
        Math.cos(p2.lat*Math.PI/180) *
        Math.sin(dLon/2)**2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    },

    initializeMap() {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      this.map = L.map("pickupMap").setView([this.lat, this.lon], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(this.map);

      this.pointsRetrait.forEach(p => {
        const marker = L.marker([p.lat, p.lon])
          .addTo(this.map)
          .on("click", () => {
            this.selectedPickup = p;
            this.showMap = false;
          });

        marker.bindPopup(`<b>${p.nom}</b><br>${p.distance.toFixed(1)} km`);
      });
    },

    async validerAchat() {
      if (!this.selectedPickup) {
        this.achatErreur = "Veuillez choisir un point de retrait.";
        return;
      }

      const id_user = localStorage.getItem("userId");

      try {
        const res = await fetch("http://localhost:3000/api/acheter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_jeu: this.jeuDetails.id_j,
            id_user: id_user,
            quantite_achetee: this.quantiteAchat,
            id_point_retrait: this.selectedPickup.id,
            lat: this.selectedPickup.lat,
            lon: this.selectedPickup.lon,
            nom_point: this.selectedPickup.nom
          })
        });

        const data = await res.json();

        if (!res.ok) {
          this.achatErreur = data.error;
        } else {
          this.achatSucces = "Achat enregistré.";
        }
      } catch (e) {
        this.achatErreur = "Erreur réseau.";
      }
    }
  },

  mounted() {
    // Charger catégories
    fetch("http://localhost:3000/api/categories")
      .then(res => res.json())
      .then(data => this.categories = data);

    // Charger les jeux
    fetch("http://localhost:3000/api/jeux")
      .then(res => res.json())
      .then(data => this.jeux = data);

    // Fonction Overpass
    const fetchPoints = async (lat, lon) => {
      const latMin = lat - 0.10;
      const latMax = lat + 0.10;
      const lonMin = lon - 0.10;
      const lonMax = lon + 0.10;

      const query = `
        [out:json];
        (
          node["amenity"="parcel_locker"](${latMin},${lonMin},${latMax},${lonMax});
          node["amenity"="post_office"](${latMin},${lonMin},${latMax},${lonMax});
          node["brand"~"Mondial|Pickup|Amazon|Locker"](${latMin},${lonMin},${latMax},${lonMax});
        );
        out;
      `;

      const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
      const res = await fetch(url);
      const data = await res.json();

      if (!data.elements) return;

      this.pointsRetrait = data.elements
        .filter(e => e.tags && (e.tags.name || e.tags.brand || e.tags.operator))
        .map(e => ({
          id: e.id,
          nom: e.tags.name || e.tags.brand || e.tags.operator || "Point relais",
          lat: e.lat,
          lon: e.lon,
          distance: this.distance(
            { lat: this.lat, lon: this.lon },
            { lat: e.lat, lon: e.lon }
          )
        }))
        .sort((a,b) => a.distance - b.distance)
        .slice(0, 20);
    };

    // Géolocalisation
    navigator.geolocation.getCurrentPosition(pos => {
      this.lat = pos.coords.latitude;
      this.lon = pos.coords.longitude;
      fetchPoints(this.lat, this.lon);
    });
  }
};
</script>

<style scoped>
/* TON CSS EXACT RECOLLÉ, INTACTE */

.navbar {
  background-color: #333;
  color: white;
  padding: 1rem;
}

.map-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.map-container {
  width: 80%;
  height: 70vh;
  background: white;
  padding: 10px;
  border-radius: 10px;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 10px;
}

.carte-button {
  padding: 8px 12px;
  background: #000;
  color: white;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  margin-bottom: 10px;
}

.close-map {
  margin-top: 10px;
  background: #444;
  padding: 7px 12px;
  color: white;
  border-radius: 5px;
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

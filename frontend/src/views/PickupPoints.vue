<template>
  <div class="container">
    <h2>Points de retrait proches</h2>

    <button @click="getLocation">📍 Localiser</button>

    <div v-if="loading">Chargement...</div>

    <ul v-if="pickupPoints.length">
      <li v-for="(point, index) in pickupPoints" :key="index">
        <strong>{{ point.name }}</strong><br>
        Latitude : {{ point.lat }} - Longitude : {{ point.lon }}
      </li>
    </ul>
  </div>
</template>

<script>
import geoService from "../services/geolocationService";

export default {
  data() {
    return {
      pickupPoints: [],
      loading: false
    };
  },

  methods: {
    getLocation() {
      this.loading = true;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          const response = await geoService.getPickupPoints(lat, lon);

          this.pickupPoints = response.data;
          this.loading = false;
        },
        () => {
          alert("Impossible de récupérer votre position");
          this.loading = false;
        }
      );
    }
  }
};
</script>

<style>
.container {
  padding: 20px;
}
</style>

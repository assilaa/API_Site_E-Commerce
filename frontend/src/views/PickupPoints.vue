<template>
  <div>
    <LMap :zoom="13" :center="[userLat, userLon]" style="height:400px;">
      <LTileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <LMarker :lat-lng="[userLat, userLon]">
        <LPopup>Vous êtes ici</LPopup>
      </LMarker>

      <LMarker 
        v-for="p in pointsRetrait" 
        :key="p.id_point"
        :lat-lng="[p.latitude, p.longitude]"
      >
        <LPopup>{{ p.nom }}<br>{{ p.distance.toFixed(2) }} km</LPopup>
      </LMarker>
    </LMap>
  </div>
</template>


<script>
import axios from "axios";

export default {
  data() {
    return {
      pointsRetrait: []
    };
  },
  async mounted() {
    try {
      const res = await axios.get("http://localhost:3000/api/points-retrait");
      this.pointsRetrait = res.data;
    } catch (error) {
      console.error("Erreur chargement points retrait :", error);
    }
  }
};
</script>

<style scoped>
.pickup-container {
  padding: 20px;
}
</style>

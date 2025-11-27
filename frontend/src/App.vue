<script setup>
import { ref } from "vue";

const isLogged = ref(localStorage.getItem("token") !== null);
</script>

<template>
  <nav v-if="isLogged" class="navbar">
  <div class="nav-left">
    <div class="logo">LUDOMAP</div>
    <router-link to="/home">Accueil</router-link>
    <router-link to="/pickup-points">Points de retrait</router-link>
  </div>

  <div class="nav-right">
    <router-link to="/mon-compte">Mon Compte</router-link>
    <router-link to="/logout">Déconnexion</router-link>
  </div>
</nav>


  <router-view />
</template>

<style>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #333;
  padding: 18px 30px;      /* ← NAVBAR PLUS HAUTE & PLUS LARGE */
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.logo {
  font-size: 26px;          /* ← LUDOMAP PLUS GRAND */
  font-weight: 700;
  color: white;
  margin-right: 40px;       /* Espace entre LUDOMAP et les liens */
  letter-spacing: 1px;
}

.navbar a {
  color: white;
  text-decoration: none;
  margin-right: 25px;      /* Espace entre les liens */
  font-size: 17px;         /* Liens un peu plus grands */
  font-weight: 500;
  transition: 0.2s ease;
}

.navbar a:hover {
  color: #66aaff;          /* Couleur hover plus moderne */
  text-decoration: none;
}

.nav-left, .nav-right {
  display: flex;
  align-items: center;     /* Correction d’alignement vertical */
  gap: 20px;
}

</style>

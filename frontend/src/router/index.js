import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Login.vue'
import Carte from '../views/Carte.vue'
import MonCompte from '../views/MonCompte.vue'
import Admin from '../views/Admin.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
  { path: "/", name: "Login", component: () => import("../views/Login.vue")},
  { path: "/home", name: "Home", component: () => import("../views/Carte.vue")},
  { path: '/carte', name: 'Carte', component: Carte },
  { path: '/mon-compte', name: 'MonCompte', component: MonCompte },
  { path: '/admin', name: 'Admin', component: Admin },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  { path: "/pickup-points", name: "PickupPoints", component: () => import("../views/PickupPoints.vue")}

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const isLogged = localStorage.getItem("token"); // ou cookie

  // Pages accessibles sans être connecté
  const publicPages = ["/"];

  if (!publicPages.includes(to.path) && !isLogged) {
    return next("/");
  }

  next();
});


export default router

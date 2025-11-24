import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Login.vue'
import Carte from '../views/Carte.vue'
import MonCompte from '../views/MonCompte.vue'
import Admin from '../views/Admin.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/carte', name: 'Carte', component: Carte },
  { path: '/mon-compte', name: 'MonCompte', component: MonCompte },
  { path: '/admin', name: 'Admin', component: Admin },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

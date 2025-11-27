<template>
  <section class="header">
    <div class="text-box">
      <h1>LUDOMAP</h1>
      <p>Sidy, Zaïnab, Assila</p>
      <button @click="showLoginPopup = true" class="hero-btn">Connexion</button>
      <button @click="showSignUpPopup = true" class="hero-btn">S'inscrire</button>
    </div>

    <!-- Login Popup -->
    <div v-if="showLoginPopup" class="Pupop">
      <div class="pupop-container">
        <span @click="showLoginPopup = false" class="close">&times;</span>
        <form @submit.prevent="validation">
          <label>Pseudo</label>
          <input type="text" placeholder="Nom d'utilisateur" v-model="loginUsername" required>

          <label>Mot de passe</label>
          <input type="password" placeholder="Mot de passe" v-model="loginPassword" required>

          <button type="submit">Connexion</button>
          <button type="button" @click="showLoginPopup = false">Fermer</button>
        </form>
        <p v-if="loginError" style="color: red;">Identifiants invalides.</p>
      </div>
    </div>

    <!-- Sign Up Popup -->
    <div v-if="showSignUpPopup" class="Pupop">
      <div class="pupop-container">
        <span @click="showSignUpPopup = false" class="close">&times;</span>
        <form @submit.prevent="validateSignUp">
          <label>Pseudo</label>
          <input type="text" v-model="signupUsername" placeholder="Nom d'utilisateur" required>

          <label>Mot de passe</label>
          <input type="password" v-model="signupPassword" placeholder="Mot de passe" required>

          <label>Nom</label>
          <input type="text" v-model="signupNom" placeholder="Nom" required>

          <label>Prénom</label>
          <input type="text" v-model="signupPrenom" placeholder="Prénom" required>

          <label>Email</label>
          <input type="email" v-model="signupEmail" placeholder="Email" required>

          <button type="submit">S'inscrire</button>
          <button type="button" @click="showSignUpPopup = false">Fermer</button>
        </form>
        <p v-if="signupError" style="color: red;">{{ signupErrorMessage }}</p>
        <p v-if="signupSuccess" style="color: green;">Inscription réussie !</p>

      </div>
    </div>
  </section>

  <footer>
    <p>©2024 - Tous droits réservés.</p>
  </footer>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      loginUsername: '',
      loginPassword: '',
      signupUsername: '',
      signupPassword: '',
      signupNom: '',
      signupPrenom: '',
      signupEmail: '',
      showLoginPopup: false,
      showSignUpPopup: false,
      loginError: false,
      signupError: false,
      signupSuccess: false
    };
  },
  methods: {
    async validation() {
  try {
    const res = await axios.post('http://localhost:3000/api/login', {
      pseudo: this.loginUsername,
      password: this.loginPassword
    });

    // On stocke TOUT
    localStorage.setItem("token", res.data.token);  // IMPORTANT !
    localStorage.setItem("role", res.data.role);
    localStorage.setItem("userId", res.data.userId);

    this.loginError = false;

    // On ferme le popup
    this.showLoginPopup = false;

    // On redirige selon le rôle
    if (res.data.role === 'admin') {
      this.$router.push('/admin');
    } else if (res.data.role === 'user') {
      this.$router.push('/carte'); 
    }

  } catch (err) {
    this.loginError = true;
  }
},

    async validateSignUp() {
  try {
    const res = await axios.post('http://localhost:3000/api/signup', {
      pseudo: this.signupUsername,
      password: this.signupPassword,
      nom: this.signupNom,
      prenom: this.signupPrenom,
      email: this.signupEmail
    });
    // Succès
    this.signupSuccess = true;
    this.signupError = false;
    this.signupErrorMessage = '';
  } catch (err) {
    this.signupSuccess = false;
    // Si erreur, tester le code de réponse
    if (err.response && err.response.status === 409) {
      this.signupErrorMessage = "Pseudo ou email déjà utilisé.";
    } else {
      this.signupErrorMessage = "Inscription échouée.";
    }
    this.signupError = true;
  }
}

  }
};
</script>



  
  <style scoped>
  /* Fond global */
  .header {
    min-height: 100vh;
    width: 100%;
    background-image: linear-gradient(rgba(4, 9, 30, 0.7), rgba(4, 9, 30, 0.7)), url(../img/fond.png);
    background-position: center;
    background-size: cover;
    background-attachment: fixed;
    position: relative;
  }
  
  /* Titre + bouton au centre */
  .text-box {
    width: 90%;
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  
  .text-box h1 {
    font-size: 62px;
    margin-bottom: 10px;
  }
  
  .text-box p {
    font-size: 24px;
    margin-bottom: 30px;
  }
  
  /* Boutons d'action */
  .hero-btn {
    display: inline-block;
    color: white;
    border: 2px solid white;
    padding: 10px 30px;
    font-size: 18px;
    background: transparent;
    border-radius: 50px;
    margin: 10px;
    transition: 0.3s ease;
  }
  
  .hero-btn:hover {
    background-color: #333399;
    border-color: #333399;
  }
  
  /* Popup fond */
  .Pupop {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 999;
  }
  
  /* Contenu du popup */
  .pupop-container {
    background-color: #fff;
    padding: 30px 20px;
    border-radius: 12px;
    width: 320px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    position: relative;
  }
  
  /* Bouton de fermeture */
  .close {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
  }
  
  /* Formulaires */
  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  label {
    font-size: 16px;
    text-align: left;
  }
  
  input {
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
  
  /* Footer simple */
  footer {
    text-align: center;
    padding: 20px;
    color: white;
    font-size: 14px;
  }
  </style>
  
const bcrypt = require('bcrypt');

// Nouveau mot de passe choisi
const nouveauMdp = 'blandine123';

// Nombre de tours de salage (10 est courant)
const saltRounds = 10;

bcrypt.hash(nouveauMdp, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erreur lors du hash :', err);
    return;
  }
  console.log('Hash du mot de passe :', hash);
});

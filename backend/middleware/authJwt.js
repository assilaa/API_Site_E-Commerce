// middleware/authJwt.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = "superSecret"; // même secret

function authJwt(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant." });
    }

    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET); // { id, role }
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: "Accès interdit." });
      }

      next();
    } catch (e) {
      return res.status(401).json({ error: "Token invalide ou expiré." });
    }
  };
}

module.exports = authJwt;

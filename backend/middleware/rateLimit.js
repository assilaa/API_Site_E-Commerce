// backend/middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // fenêtre de 1 minute
  max: 5,                     // 5 requêtes par IP dans cette fenêtre
  standardHeaders: true,      // ajoute les headers RateLimit-*
  legacyHeaders: false,
  message: { error: "Too Many Requests" }, // réponse JSON
  statusCode: 429,
});

module.exports = apiLimiter;

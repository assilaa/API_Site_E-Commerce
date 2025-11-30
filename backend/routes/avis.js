import express from "express";
import {
  getAvisByGame,
  createAvis,
  deleteAvis,
} from "../controllers/avisController.js";

const router = express.Router();

// Récupérer les avis d’un jeu
router.get("/:id_j", getAvisByGame);

// Ajouter un avis
router.post("/", createAvis);

// Supprimer un avis par id (admin ou auteur uniquement)
router.delete("/:id_avis", deleteAvis);

export default router;

import express from "express";
const router = express.Router();
import { register, login, me } from "../controllers/authControllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

export default router;

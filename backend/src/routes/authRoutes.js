import express from "express";
const router = express.Router();
import {
  changePassword,
  deleteUser,
  forgotPassword,
  login,
  me,
  createUser,
  resetPassword,
  updateProfile,
} from "../controllers/authControllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/users", authenticate, authorize("admin"), createUser);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, updateProfile);
router.patch("/change-password", authenticate, changePassword);
router.delete("/users/:id", authenticate, authorize("admin"), deleteUser);

export default router;

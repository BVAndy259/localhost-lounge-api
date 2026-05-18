import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AuthController } from "../controllers/auth.controller";
import { RoleMiddleware } from "../middlewares/role.middleware";
import { Roles } from "../constants/roles";

const router = Router();

router.post(
  "/register",
  AuthMiddleware.verifyToken,
  RoleMiddleware.checkRole([Roles.ADMIN]),
  AuthController.register,
);

router.post("/login", AuthController.login);

export default router;

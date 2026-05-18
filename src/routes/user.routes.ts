import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { RoleMiddleware } from "../middlewares/role.middleware";
import { Roles } from "../constants/roles";

const router = Router();

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.get("/", UserController.getAll);

router.put("/:id", UserController.update);

router.patch("/:id/status", UserController.toggleStatus);

export default router;

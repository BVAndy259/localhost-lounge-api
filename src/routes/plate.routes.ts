import { Router } from "express";
import { PlateController } from "../controllers/plate.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { RoleMiddleware } from "../middlewares/role.middleware";
import { Roles } from "../constants/roles";

const router = Router();

router.get("/public", PlateController.getPublic);

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.post("/", PlateController.create);

router.get("/", PlateController.getAll);

router.put("/:id", PlateController.update);

router.patch("/:id/status", PlateController.toggleStatus);

export default router;

import { Router } from "express";
import { TableController } from "../controllers/table.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { RoleMiddleware } from "../middlewares/role.middleware";
import { Roles } from "../constants/roles";

const router = Router();
const onlyAdmin = RoleMiddleware.checkRole([Roles.ADMIN]);

router.get("/public", TableController.getPublic);

router.get("/", AuthMiddleware.verifyToken, TableController.getAll);

router.post("/", AuthMiddleware.verifyToken, onlyAdmin, TableController.create);
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  onlyAdmin,
  TableController.update,
);
router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  onlyAdmin,
  TableController.changeStatus,
);
router.patch(
  "/:id/active",
  AuthMiddleware.verifyToken,
  onlyAdmin,
  TableController.toggleActive,
);

export default router;

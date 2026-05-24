import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";

const router = Router();

router.post("/web", ChatController.handleWebMessage);

export default router;

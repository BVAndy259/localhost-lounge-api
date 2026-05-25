import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import validateBody from '../middlewares/validate.middleware';
import { webChatSchema } from '../validators/chat.validator';

const router = Router();

router.post('/web', validateBody(webChatSchema), ChatController.handleWebMessage);

export default router;

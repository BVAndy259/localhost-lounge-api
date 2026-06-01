"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const chat_validator_1 = require("../validators/chat.validator");
const router = (0, express_1.Router)();
router.post('/web', (0, validate_middleware_1.default)(chat_validator_1.webChatSchema), chat_controller_1.ChatController.handleWebMessage);
exports.default = router;

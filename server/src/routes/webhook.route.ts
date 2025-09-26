import { Router } from "express";
import { handleStreamWebhookEvent } from "../controllers/webhook.controller";

const router = Router();

router.post("/stream",handleStreamWebhookEvent);

export default router;

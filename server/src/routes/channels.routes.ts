import { Router } from "express";

import upload from "../middleware/upload.middleware";
import { createChannel } from "../controllers/channel.controller";
const router = Router();

router.post("/new", upload.single("channelIcon"), createChannel);

export default router;

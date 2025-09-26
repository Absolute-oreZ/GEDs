import { Router } from "express";
import { getUserById } from "../controllers/users.controller";

const router = Router();

router.get("/profile",getUserById);

export default router;

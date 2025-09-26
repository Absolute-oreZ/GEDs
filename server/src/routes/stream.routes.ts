import { Router} from "express";

import { exportStreamToken,upsertStreamUser } from "../controllers/stream.controller";

const router = Router();

router.get("/token",exportStreamToken);
router.post("/users/upsert",upsertStreamUser);

export default router;
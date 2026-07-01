import { Router } from "express";
import { getPresignedUrl } from "./upload.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.post("/presigned-url", getPresignedUrl);

export default router;

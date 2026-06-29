import { Router } from "express";
import {
  create,
  getByWorkspace,
  getOne,
  update,
  remove,
} from "./document.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/workspace/:workspaceId", getByWorkspace);
router.get("/:documentId", getOne);
router.patch("/:documentId", update);
router.delete("/:documentId", remove);

export default router;

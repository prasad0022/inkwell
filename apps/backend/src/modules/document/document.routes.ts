import { Router } from "express";
import {
  create,
  getByWorkspace,
  getOne,
  update,
  remove,
} from "./document.controller";
import { search } from "./document.search.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireWorkspaceRole } from "../../middleware/permissions.middleware";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get(
  "/workspace/:workspaceId",
  requireWorkspaceRole(["OWNER", "EDITOR", "VIEWER"]),
  getByWorkspace,
);
router.get(
  "/search/:workspaceId",
  requireWorkspaceRole(["OWNER", "EDITOR", "VIEWER"]),
  search,
);
router.get(
  "/:documentId",
  requireWorkspaceRole(["OWNER", "EDITOR", "VIEWER"]),
  getOne,
);
router.patch("/:documentId", requireWorkspaceRole(["OWNER", "EDITOR"]), update);
router.delete(
  "/:documentId",
  requireWorkspaceRole(["OWNER", "EDITOR"]),
  remove,
);

export default router;

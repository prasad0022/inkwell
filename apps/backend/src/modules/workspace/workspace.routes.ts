import { Router } from "express";
import { create, getAll, getOne, update, remove } from "./workspace.controller";
import {
  invite,
  getMembers,
  updateRole,
  remove as removeMember,
} from "./workspace.members.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireWorkspaceRole } from "../../middleware/permissions.middleware";

const router = Router();

// All workspace routes are protected
router.use(authenticate);

// Workspace CRUD
router.post("/", create);
router.get("/", getAll);
router.get(
  "/:slug",
  requireWorkspaceRole(["OWNER", "EDITOR", "VIEWER"]),
  getOne,
);
router.patch("/:slug", requireWorkspaceRole(["OWNER"]), update);
router.delete("/:slug", requireWorkspaceRole(["OWNER"]), remove);

// Member management
router.post("/:slug/members", requireWorkspaceRole(["OWNER"]), invite);
router.get(
  "/:slug/members",
  requireWorkspaceRole(["OWNER", "EDITOR", "VIEWER"]),
  getMembers,
);
router.patch(
  "/:slug/members/:memberId",
  requireWorkspaceRole(["OWNER"]),
  updateRole,
);
router.delete("/:slug/members/:memberId", removeMember);

export default router;

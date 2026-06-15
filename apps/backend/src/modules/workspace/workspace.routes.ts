import { Router } from "express";
import { create, getAll, getOne, update, remove } from "./workspace.controller";
import {
  invite,
  getMembers,
  updateRole,
  remove as removeMember,
} from "./workspace.members.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// All workspace routes are protected
router.use(authenticate);

// Workspace CRUD
router.post("/", create);
router.get("/", getAll);
router.get("/:slug", getOne);
router.patch("/:slug", update);
router.delete("/:slug", remove);

// Member management
router.post("/:slug/members", invite);
router.get("/:slug/members", getMembers);
router.patch("/:slug/members/:memberId", updateRole);
router.delete("/:slug/members/:memberId", removeMember);

export default router;

import { Router } from "express";
import { create, getAll, getOne, update, remove } from "./workspace.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// All workspace routes are protected
router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/:slug", getOne);
router.patch("/:slug", update);
router.delete("/:slug", remove);

export default router;

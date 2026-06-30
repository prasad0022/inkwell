import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { WorkspaceRole } from ".prisma/client";

/**
 * Middleware factory — returns middleware that checks if the
 * logged-in user has one of the allowed roles in the workspace.
 *
 * Works for routes with either :slug (workspace routes) or
 * :workspaceId (document routes) in params.
 *
 * For document-specific routes (:documentId), it looks up the
 * document first to find its workspace.
 */
export const requireWorkspaceRole = (allowedRoles: WorkspaceRole[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = (req as any).user;
      const { slug, workspaceId, documentId } = req.params;

      let resolvedWorkspaceId = workspaceId;

      // If we have a slug instead of workspaceId, resolve it
      if (slug && !workspaceId) {
        const workspace = await prisma.workspace.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!workspace) {
          res.status(404).json({
            success: false,
            message: "Workspace not found",
          });
          return;
        }

        resolvedWorkspaceId = workspace.id;
      }

      // If we have a documentId instead, resolve workspace from document
      if (documentId && !resolvedWorkspaceId) {
        const document = await prisma.document.findUnique({
          where: { id: documentId },
          select: { workspaceId: true },
        });

        if (!document) {
          res.status(404).json({
            success: false,
            message: "Document not found",
          });
          return;
        }

        resolvedWorkspaceId = document.workspaceId;
      }

      if (!resolvedWorkspaceId) {
        res.status(400).json({
          success: false,
          message: "Could not determine workspace for permission check",
        });
        return;
      }

      // Find user's membership in this workspace
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: resolvedWorkspaceId,
          userId: user.id,
        },
      });

      if (!member) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this workspace",
        });
        return;
      }

      if (!allowedRoles.includes(member.role)) {
        res.status(403).json({
          success: false,
          message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
        });
        return;
      }

      // Attach resolved workspace + role to request for downstream use
      (req as any).workspaceId = resolvedWorkspaceId;
      (req as any).memberRole = member.role;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Simpler middleware — just checks user is ANY member of the workspace.
 * Used for read-only routes where any role (including VIEWER) is fine.
 */
export const requireWorkspaceMember = requireWorkspaceRole([
  "OWNER",
  "EDITOR",
  "VIEWER",
]);

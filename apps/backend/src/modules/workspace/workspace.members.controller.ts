import { Request, Response } from "express";
import {
  inviteMember,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
} from "./workspace.members.service";
import { WorkspaceRole } from ".prisma/client";

export const invite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { email, role } = req.body;
    const user = (req as any).user;

    if (!email || !role) {
      res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
      return;
    }

    if (!["EDITOR", "VIEWER"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Role must be EDITOR or VIEWER",
      });
      return;
    }

    const member = await inviteMember({
      workspaceSlug: slug,
      email,
      role: role as WorkspaceRole,
      inviterId: user.id,
    });

    res.status(201).json({
      success: true,
      message: "Member invited successfully",
      data: member,
    });
  } catch (error: any) {
    const status = error.message.includes("owner") ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMembers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const user = (req as any).user;

    const members = await getWorkspaceMembers(slug, user.id);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    const status = error.message.includes("access") ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug, memberId } = req.params;
    const { role } = req.body;
    const user = (req as any).user;

    if (!role) {
      res.status(400).json({
        success: false,
        message: "Role is required",
      });
      return;
    }

    if (!["EDITOR", "VIEWER"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Role must be EDITOR or VIEWER",
      });
      return;
    }

    const member = await updateMemberRole({
      workspaceSlug: slug,
      memberId,
      role: role as WorkspaceRole,
      requesterId: user.id,
    });

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: member,
    });
  } catch (error: any) {
    const status = error.message.includes("owner") ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug, memberId } = req.params;
    const user = (req as any).user;

    const result = await removeMember({
      workspaceSlug: slug,
      memberId,
      requesterId: user.id,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    const status = error.message.includes("permission") ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

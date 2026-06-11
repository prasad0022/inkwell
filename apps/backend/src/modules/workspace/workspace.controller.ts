import { Request, Response } from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceBySlug,
  updateWorkspace,
  deleteWorkspace,
} from "./workspace.service";

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const user = (req as any).user;

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
      return;
    }

    const workspace = await createWorkspace({
      name,
      description,
      userId: user.id,
    });

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const workspaces = await getUserWorkspaces(user.id);

    res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const user = (req as any).user;
    const workspace = await getWorkspaceBySlug(slug, user.id);

    res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error: any) {
    const status = error.message.includes("access") ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { name, description } = req.body;
    const user = (req as any).user;

    const workspace = await updateWorkspace(slug, user.id, {
      name,
      description,
    });

    res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      data: workspace,
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
    const { slug } = req.params;
    const user = (req as any).user;

    const result = await deleteWorkspace(slug, user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    const status = error.message.includes("owner") ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

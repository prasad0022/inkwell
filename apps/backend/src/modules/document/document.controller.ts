import { Request, Response } from "express";
import {
  createDocument,
  getWorkspaceDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "./document.service";

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, workspaceId, parentId, emoji } = req.body;
    const user = (req as any).user;

    if (!workspaceId) {
      res.status(400).json({
        success: false,
        message: "workspaceId is required",
      });
      return;
    }

    const document = await createDocument({
      title,
      workspaceId,
      createdById: user.id,
      parentId,
      emoji,
    });

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: document,
    });
  } catch (error: any) {
    const status = error.message.includes("access") ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const getByWorkspace = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const user = (req as any).user;

    const documents = await getWorkspaceDocuments(workspaceId, user.id);

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    const status = error.message.includes("access") ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;

    const document = await getDocumentById(documentId, user.id);

    res.status(200).json({
      success: true,
      data: document,
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
    const { documentId } = req.params;
    const { title, content, emoji, isPublic } = req.body;
    const user = (req as any).user;

    const document = await updateDocument(documentId, user.id, {
      title,
      content,
      emoji,
      isPublic,
    });

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error: any) {
    const status =
      error.message.includes("access") || error.message.includes("Viewer")
        ? 403
        : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;

    const result = await deleteDocument(documentId, user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    const status =
      error.message.includes("access") || error.message.includes("Viewer")
        ? 403
        : 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

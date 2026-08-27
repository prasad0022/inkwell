import { Request, Response } from "express";
import { searchDocuments } from "./document.search.service";

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { q } = req.query;
    const user = (req as any).user;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    if (q.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
      return;
    }

    const results = await searchDocuments(workspaceId, user.id, q.trim());

    res.status(200).json({
      success: true,
      data: results,
      meta: {
        query: q,
        count: results.length,
      },
    });
  } catch (error: any) {
    const status = error.message.includes("access") ? 403 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

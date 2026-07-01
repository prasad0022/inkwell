import { Request, Response } from "express";
import { generatePresignedUploadUrl } from "../../lib/s3";

export const getPresignedUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      res.status(400).json({
        success: false,
        message: "fileName and fileType are required",
      });
      return;
    }

    // Basic validation — only allow images for now
    const allowedTypes = [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(fileType)) {
      res.status(400).json({
        success: false,
        message: "Only image files are allowed (jpeg, png, gif, webp)",
      });
      return;
    }

    const result = await generatePresignedUploadUrl(
      fileName,
      fileType,
      folder === "avatars" ? "avatars" : "documents",
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

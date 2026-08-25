import { uploadApi } from "@/lib/api";

export const uploadImageToS3 = async (file: File): Promise<string> => {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only images are allowed (jpeg, png, gif, webp)");
  }

  // Validate file size — max 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Image must be smaller than 5MB");
  }

  // Get presigned URL from backend
  const { uploadUrl, fileUrl } = await uploadApi.getPresignedUrl({
    fileName: file.name,
    fileType: file.type,
    folder: "documents",
  });

  // Upload directly to S3
  await uploadApi.uploadToS3(uploadUrl, file);

  return fileUrl;
};

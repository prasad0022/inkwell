import apiClient from "../axios";
import axios from "axios";

export interface PresignedUrlInput {
  fileName: string;
  fileType: string;
  folder?: "avatars" | "documents";
}

export const uploadApi = {
  getPresignedUrl: async (input: PresignedUrlInput) => {
    const { data } = await apiClient.post("/api/upload/presigned-url", input);
    return data.data;
  },

  // Upload file directly to S3 using presigned URL
  uploadToS3: async (presignedUrl: string, file: File): Promise<void> => {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  },

  // Convenience method — get presigned URL and upload in one call
  uploadFile: async (
    file: File,
    folder: "avatars" | "documents" = "documents",
  ): Promise<string> => {
    const { uploadUrl, fileUrl } = await uploadApi.getPresignedUrl({
      fileName: file.name,
      fileType: file.type,
      folder,
    });

    await uploadApi.uploadToS3(uploadUrl, file);
    return fileUrl;
  },
};

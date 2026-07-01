import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Generates a presigned URL that allows the client to upload
 * directly to S3 without the file passing through our server.
 * URL expires in 5 minutes.
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: "avatars" | "documents" = "documents",
): Promise<PresignedUrlResult> => {
  const fileExtension = fileName.split(".").pop();
  const uniqueKey = `${folder}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300, // 5 minutes
  });

  const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${uniqueKey}`;

  return {
    uploadUrl,
    fileUrl,
    key: uniqueKey,
  };
};

export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

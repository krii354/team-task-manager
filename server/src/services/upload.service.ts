import { getCloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { ApiError } from "../utils/ApiError";

export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
}

export async function uploadFileBuffer(
  buffer: Buffer,
  options: { folder?: string; resourceType?: "image" | "raw" | "auto" } = {},
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    throw ApiError.internal("File uploads are not configured on the server.");
  }
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "team-task-manager",
        resource_type: options.resourceType ?? "auto",
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteFile(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  const cloudinary = getCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
}

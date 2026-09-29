import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sanitizeCloudinaryFolderSegment = (segment) => {
  if (!segment) {
    return "";
  }

  return String(segment)
    .trim()
    .replace(/\\/g, "/")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9/_-]+/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
};

const buildCloudinaryFolder = ({ entityType, userId, projectId, meetingId }) => {
  const segments = ["intellmeet"];

  if (entityType) {
    segments.push(sanitizeCloudinaryFolderSegment(entityType));
  }

  if (userId) {
    segments.push(sanitizeCloudinaryFolderSegment(userId));
  }

  if (projectId) {
    segments.push(sanitizeCloudinaryFolderSegment(projectId));
  }

  if (meetingId) {
    segments.push(sanitizeCloudinaryFolderSegment(meetingId));
  }

  return segments.filter(Boolean).join("/");
};

const uploadFileToCloudinary = async (localFilePath, folder = "intellmeet/general") => {
  try {
    if (!localFilePath) return null;

    const safeFolder = sanitizeCloudinaryFolderSegment(folder || "intellmeet/general");

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: safeFolder,
    });

    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.error("Error uploading file to Cloudinary:", error);
    throw error;
  }
};

const deleteFileFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;

    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

export { buildCloudinaryFolder, uploadFileToCloudinary, deleteFileFromCloudinary };

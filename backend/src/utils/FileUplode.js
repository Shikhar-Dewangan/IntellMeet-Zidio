import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({
  path: './.env'
});

const cloudinaryConfig = cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadFileToCloudinary = async (localFilePath, folder = "KaamSet") => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    fs.unlinkSync(localFilePath);

    console.log("File uploaded to Cloudinary:", response.secure_url);

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
      resource_type: resourceType
    });
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

export { uploadFileToCloudinary, deleteFileFromCloudinary };

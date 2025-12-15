import cloudinary from "../config/cloudinary";
import fs from "fs";

/**
 * Upload an image file to Cloudinary.
 * @param filePath Path to the local file (from multer)
 * @param folder Folder name in Cloudinary
 * @returns Upload result including secure_url
 */
export const uploadImage = async (
  filePath: string,
  folder: string = "eventhub"
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      use_filename: true,
      unique_filename: true,
    });

    // Hapus file lokal setelah diupload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    // Hapus file lokal jika upload gagal
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

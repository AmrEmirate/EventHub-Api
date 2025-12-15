import cloudinary from "../config/cloudinary";
import fs from "fs";

// Folder names for different upload types
export enum CloudinaryFolder {
  EVENTS = "eventhub/events",
  AVATARS = "eventhub/avatars",
  REVIEWS = "eventhub/reviews",
  PAYMENT_PROOFS = "eventhub/payment-proofs",
}

class CloudinaryService {
  /**
   * Upload an image file to Cloudinary.
   * @param filePath Path to the local file (from multer temp folder)
   * @param folder Folder name in Cloudinary
   * @returns Upload result including secure_url
   */
  public async uploadImage(
    filePath: string,
    folder: CloudinaryFolder | string = CloudinaryFolder.EVENTS
  ) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        use_filename: true,
        unique_filename: true,
        resource_type: "image",
        transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
      });

      // Hapus file lokal setelah diupload
      this.deleteLocalFile(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      // Hapus file lokal jika upload gagal
      this.deleteLocalFile(filePath);
      throw error;
    }
  }

  /**
   * Upload a PDF file to Cloudinary.
   * @param filePath Path to the local file
   * @param folder Folder name in Cloudinary
   */
  public async uploadPdf(
    filePath: string,
    folder: CloudinaryFolder | string = CloudinaryFolder.PAYMENT_PROOFS
  ) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        use_filename: true,
        unique_filename: true,
        resource_type: "raw",
      });

      this.deleteLocalFile(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      this.deleteLocalFile(filePath);
      throw error;
    }
  }

  /**
   * Upload any file (image or PDF) to Cloudinary.
   * Automatically detects file type.
   */
  public async uploadFile(
    filePath: string,
    folder: CloudinaryFolder | string,
    mimetype: string
  ) {
    if (mimetype === "application/pdf") {
      return this.uploadPdf(filePath, folder);
    }
    return this.uploadImage(filePath, folder);
  }

  /**
   * Delete an image from Cloudinary by public ID.
   * @param publicId The public ID of the image to delete
   */
  public async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
      throw error;
    }
  }

  /**
   * Helper to delete local file after upload.
   */
  private deleteLocalFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  }
}

export { CloudinaryService };

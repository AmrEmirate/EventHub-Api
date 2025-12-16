import cloudinary from "../config/cloudinary";
import fs from "fs";

export enum CloudinaryFolder {
  EVENTS = "eventhub/events",
  AVATARS = "eventhub/avatars",
  REVIEWS = "eventhub/reviews",
  PAYMENT_PROOFS = "eventhub/payment-proofs",
}

class CloudinaryService {
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

      this.deleteLocalFile(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      this.deleteLocalFile(filePath);
      throw error;
    }
  }

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

  public async deleteImage(publicId: string) {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  }

  private deleteLocalFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}

export { CloudinaryService };

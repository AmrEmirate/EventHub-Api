import multer from "multer";
import path from "path";
import os from "os";

// Gunakan folder temporary untuk menyimpan file sebelum upload ke Cloudinary
const tempDir = os.tmpdir();

// Storage configuration - menggunakan temp folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Buat nama file yang unik
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter untuk keamanan
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  // Check for images
  if (allowedImageTypes.test(extname) && mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  // Check for PDF
  if (allowedDocTypes.test(extname) && mimetype === "application/pdf") {
    return cb(null, true);
  }

  cb(
    new Error(
      "Tipe file tidak diizinkan. Hanya jpeg, jpg, png, gif, webp, dan pdf."
    )
  );
};

// Main upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Upload untuk gambar saja (event, avatar, review)
export const uploadImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = path.extname(file.originalname).toLowerCase().slice(1);

    if (allowedTypes.test(extname) && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    cb(
      new Error("Hanya file gambar yang diizinkan (jpeg, jpg, png, gif, webp)")
    );
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Upload untuk bukti pembayaran (image + pdf)
export const uploadPaymentProof = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

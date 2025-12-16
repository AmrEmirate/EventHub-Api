import multer from "multer";
import path from "path";
import os from "os";

const tempDir = os.tmpdir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  if (allowedImageTypes.test(extname) && mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  if (allowedDocTypes.test(extname) && mimetype === "application/pdf") {
    return cb(null, true);
  }

  cb(
    new Error(
      "Tipe file tidak diizinkan. Hanya jpeg, jpg, png, gif, webp, dan pdf."
    )
  );
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

export const uploadPaymentProof = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

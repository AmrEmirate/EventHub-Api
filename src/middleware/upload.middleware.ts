import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tentukan direktori upload yang akan disajikan secara publik
// process.cwd() menunjuk ke direktori root backend Anda
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Buat direktori jika belum ada saat aplikasi dimulai
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // Buat nama file yang unik untuk menghindari konflik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  // Filter file untuk keamanan
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Tipe file tidak diizinkan. Hanya jpeg, jpg, png, dan pdf.'));
  },
  // Batas ukuran file 5 MB
  limits: { fileSize: 5 * 1024 * 1024 } 
});
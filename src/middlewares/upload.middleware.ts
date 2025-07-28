import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os'; // [PENAMBAHAN] Impor modul 'os' untuk direktori temporary

// [PERBAIKAN] Gunakan direktori temporary sistem sebagai basis yang lebih aman
// Ini lebih kompatibel dengan berbagai lingkungan hosting, termasuk Vercel.
const uploadDir = path.join(os.tmpdir(), 'eventhub-uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Cek dan buat direktori jika belum ada
    fs.mkdirSync(uploadDir, { recursive: true });
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
  // [SARAN] Tambahkan filter file untuk keamanan
  fileFilter: (req, file, cb) => {
    // Izinkan hanya tipe file gambar dan PDF
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Tipe file tidak diizinkan. Hanya jpeg, jpg, png, dan pdf.'));
  },
  // [SARAN] Tambahkan batas ukuran file
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5 MB
});
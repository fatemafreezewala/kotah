import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // unique filename: <timestamp>_<random>.<ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}_${base}${ext}`);
  },
});

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Allow only images
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed (png, jpg, jpeg, webp, gif)."));
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

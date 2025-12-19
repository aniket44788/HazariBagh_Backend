import multer from "multer";
import path from "path";
import fs from "fs";

const baseUploadPath = "./uploads/vendors";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const vendorFolder = req.body.phone || "temp";
    const uploadPath = path.join(baseUploadPath, vendorFolder);

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = file.fieldname.replace(/\s+/g, "");
    cb(null, `${safeName}-${Date.now()}${ext}`);
  },
});

/**
 * FILE FILTER
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG images & PDF files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
});

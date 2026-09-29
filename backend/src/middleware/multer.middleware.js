import multer from "multer";
import os from "node:os";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
    cb(null, randomUUID());
    }
});
  
export const upload = multer({ 
    storage, 
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const acceptedTypes = file.fieldname === "avatar"
      ? /^image\/(jpeg|png|webp|gif)$/
      : /^((video|audio)\/[a-zA-Z0-9.+-]+)$/;

    if (!acceptedTypes.test(file.mimetype)) {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      return;
    }

    cb(null, true);
  },
});

export const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    const localFilePath = req.file?.path;

    if (localFilePath) {
      const cleanup = () => {
        fs.rm(localFilePath, { force: true }).catch(() => {});
      };

      res.once("finish", cleanup);
      res.once("close", cleanup);
    }

    next();
  });
};

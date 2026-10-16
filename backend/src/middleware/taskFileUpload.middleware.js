// backend/middleware/taskFileUpload.middleware.js
import multer from "multer";
import os from "node:os";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Multer instance for TASK ATTACHMENTS.
 * Separate from project/avatar uploaders to keep concerns isolated.
 *
 * Limits:
 *   - Max 5 files per request
 *   - Max 25 MB per file
 *
 * Allowed types: docs, images, archives (no executables).
 * Mirrors the project file allowlist minus heavy media.
 */
const ALLOWED_PAIRS = [
    { ext: ".pdf", mimes: ["application/pdf"] },
    { ext: ".doc", mimes: ["application/msword"] },
    {
        ext: ".docx",
        mimes: [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
    },
    { ext: ".xls", mimes: ["application/vnd.ms-excel"] },
    {
        ext: ".xlsx",
        mimes: [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
    },
    { ext: ".ppt", mimes: ["application/vnd.ms-powerpoint"] },
    {
        ext: ".pptx",
        mimes: [
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
    },
    { ext: ".txt", mimes: ["text/plain"] },
    { ext: ".jpg", mimes: ["image/jpeg"] },
    { ext: ".jpeg", mimes: ["image/jpeg"] },
    { ext: ".png", mimes: ["image/png"] },
    { ext: ".webp", mimes: ["image/webp"] },
    { ext: ".gif", mimes: ["image/gif"] },
    { ext: ".zip", mimes: ["application/zip", "application/x-zip-compressed"] },
    {
        ext: ".rar",
        mimes: ["application/vnd.rar", "application/x-rar-compressed"],
    },
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
    },
});

const taskFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();
    const pair = ALLOWED_PAIRS.find((p) => p.ext === ext);
    if (!pair || !pair.mimes.includes(mime)) {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
        return;
    }
    cb(null, true);
};

export const uploadTaskFiles = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB
        files: 5,
    },
    fileFilter: taskFileFilter,
});

/**
 * Middleware: expects "files" array field (max 5).
 * Cleans temp files on error or after response.
 */
export const uploadTaskFilesMiddleware = (req, res, next) => {
    uploadTaskFiles.array("files", 5)(req, res, (error) => {
        if (error) {
            const paths = (req.files || [])
                .map((f) => f.path)
                .filter(Boolean);
            if (paths.length) {
                Promise.all(
                    paths.map((p) =>
                        fs.rm(p, { force: true }).catch(() => {})
                    )
                ).finally(() => next(error));
            } else {
                next(error);
            }
            return;
        }

        const paths = (req.files || [])
            .map((f) => f.path)
            .filter(Boolean);

        if (paths.length) {
            const cleanup = () => {
                paths.forEach((p) => fs.rm(p, { force: true }).catch(() => {}));
            };
            res.once("finish", cleanup);
            res.once("close", cleanup);
        }

        next();
    });
};
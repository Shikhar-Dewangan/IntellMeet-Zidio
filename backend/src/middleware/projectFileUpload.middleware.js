// backend/middleware/projectFileUpload.middleware.js
import multer from "multer";
import os from "node:os";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";


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
    { ext: ".7z", mimes: ["application/x-7z-compressed"] },
    { ext: ".mp4", mimes: ["video/mp4"] },
    { ext: ".mov", mimes: ["video/quicktime"] },
    { ext: ".webm", mimes: ["video/webm"] },
    { ext: ".mp3", mimes: ["audio/mpeg"] },
    { ext: ".wav", mimes: ["audio/wav", "audio/wave", "audio/x-wav"] },
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
    },
});

const projectFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    const pair = ALLOWED_PAIRS.find((p) => p.ext === ext);
    if (!pair || !pair.mimes.includes(mime)) {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
        return;
    }
    cb(null, true);
};

export const uploadProjectFiles = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB per file
        files: 5,                    // max 5 files per request
    },
    fileFilter: projectFileFilter,
});

/**
 * Middleware: expects array field "files" (max 5).
 * Cleans up temp files on error or after response finishes.
 */
export const uploadProjectFilesMiddleware = (req, res, next) => {
    uploadProjectFiles.array("files", 5)(req, res, (error) => {
        if (error) {
            const localPaths = (req.files || [])
                .map((f) => f.path)
                .filter(Boolean);
            if (localPaths.length) {
                Promise.all(
                    localPaths.map((p) => fs.rm(p, { force: true }).catch(() => {}))
                ).finally(() => next(error));
            } else {
                next(error);
            }
            return;
        }

        const localPaths = (req.files || [])
            .map((f) => f.path)
            .filter(Boolean);

        if (localPaths.length) {
            const cleanup = () => {
                localPaths.forEach((p) => {
                    fs.rm(p, { force: true }).catch(() => {});
                });
            };
            res.once("finish", cleanup);
            res.once("close", cleanup);
        }

        next();
    });
};
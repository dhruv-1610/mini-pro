import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { env } from './env';

/** Allowed MIME types for uploaded images. */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** Allowed file extensions for uploaded images. */
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

// Ensure upload directory exists at boot
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

/**
 * Multer disk storage — saves files to UPLOAD_DIR with unique names.
 */
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter — silently rejects non-image files.
 * Checks both MIME type and file extension to prevent spoofing.
 *
 * Uses cb(null, false) instead of throwing a MulterError so the
 * multipart stream is fully consumed (prevents ECONNRESET).
 * The route handler detects the rejection via `req.fileValidationError`.
 */
/** Reject filenames that could be path traversal or unsafe. */
function isSafeFilename(originalname: string): boolean {
  const base = path.basename(originalname);
  return base === originalname && !base.includes('..') && base.length > 0 && base.length <= 255;
}

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (!isSafeFilename(file.originalname)) {
    (req as Request & { fileValidationError?: string }).fileValidationError =
      'Invalid or unsafe filename';
    cb(null, false);
    return;
  }

  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    (req as Request & { fileValidationError?: string }).fileValidationError =
      'Only image files (JPEG, PNG, GIF, WebP) are allowed';
    cb(null, false);
    return;
  }

  cb(null, true);
}

/**
 * Configured Multer instance for image uploads.
 *
 * - Disk storage under UPLOAD_DIR
 * - Image-only file filter (JPEG, PNG, GIF, WebP)
 * - Max file size from MAX_FILE_SIZE env var
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});

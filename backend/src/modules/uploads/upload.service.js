const crypto = require("crypto");
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, BUCKET } = require("../../config/s3");

const UPLOAD_EXPIRY = 5 * 60; // 5 minutes
const READ_EXPIRY = 60 * 60; // 1 hour

/**
 * Sanitize a file name — keep extension, replace unsafe chars.
 */
const sanitizeFileName = (name) => {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name
    .slice(0, name.lastIndexOf(".") || undefined)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  return `${base}${ext}`;
};

/**
 * Build a unique S3 key: {folder}/{timestamp}-{uuid}-{sanitized}
 */
const buildKey = (folder, fileName) => {
  const ts = Date.now();
  const id = crypto.randomUUID().slice(0, 8);
  const safe = sanitizeFileName(fileName);
  return `${folder}/${ts}-${id}-${safe}`;
};

// ─── Presigned Upload URL ────────────────────────────────────────────────────

const getPresignedUploadUrl = async (folder, fileName, contentType) => {
  const key = buildKey(folder, fileName);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: UPLOAD_EXPIRY });

  return { uploadUrl, key };
};

// ─── Presigned Read URL ──────────────────────────────────────────────────────

const getPresignedReadUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: READ_EXPIRY });
  return url;
};

// ─── Batch Presigned Read URLs ───────────────────────────────────────────────

const getPresignedReadUrls = async (keys) => {
  const entries = await Promise.all(
    keys.map(async (key) => {
      const url = await getPresignedReadUrl(key);
      return [key, url];
    }),
  );
  return Object.fromEntries(entries);
};

// ─── Direct Upload (server-side, for admin bulk / fallback) ──────────────────

const uploadDirect = async (fileBuffer, folder, fileName, contentType) => {
  const key = buildKey(folder, fileName);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return { key };
};

// ─── Delete File ─────────────────────────────────────────────────────────────

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

module.exports = {
  getPresignedUploadUrl,
  getPresignedReadUrl,
  getPresignedReadUrls,
  uploadDirect,
  deleteFile,
};

const uploadService = require("./upload.service");

// ─── POST /api/uploads/presign ───────────────────────────────────────────────

const getPresignedUploadUrl = async (req, res, next) => {
  try {
    const { folder, fileName, fileType } = req.body;
    const result = await uploadService.getPresignedUploadUrl(folder, fileName, fileType);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/uploads/url?key=... ────────────────────────────────────────────

const getPresignedReadUrl = async (req, res, next) => {
  try {
    const { key } = req.query;
    const url = await uploadService.getPresignedReadUrl(key);

    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/uploads/urls  (batch) ────────────────────────────────────────

const getPresignedReadUrls = async (req, res, next) => {
  try {
    const { keys } = req.body;
    const urls = await uploadService.getPresignedReadUrls(keys);

    res.json({ success: true, data: urls });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/uploads/direct  (server-side upload via multer) ───────────────

const uploadDirect = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const folder = req.body.folder || "documents";
    const result = await uploadService.uploadDirect(
      req.file.buffer,
      folder,
      req.file.originalname,
      req.file.mimetype,
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/uploads?key=... ─────────────────────────────────────────────

const deleteUpload = async (req, res, next) => {
  try {
    const { key } = req.query;
    await uploadService.deleteFile(key);

    res.json({ success: true, message: "File deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPresignedUploadUrl,
  getPresignedReadUrl,
  getPresignedReadUrls,
  uploadDirect,
  deleteUpload,
};

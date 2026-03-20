const { Router } = require("express");
const multer = require("multer");
const controller = require("./upload.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const {
  presignUploadSchema,
  presignReadSchema,
  presignBatchSchema,
} = require("./upload.validation");

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.use(protect);

// Presigned upload URL (client-side upload to S3)
router.post("/presign", validate(presignUploadSchema), controller.getPresignedUploadUrl);

// Presigned read URL (single)
router.get("/url", validateQuery(presignReadSchema), controller.getPresignedReadUrl);

// Presigned read URLs (batch)
router.post("/urls", validate(presignBatchSchema), controller.getPresignedReadUrls);

// Direct server-side upload (fallback / admin)
router.post("/direct", upload.single("file"), controller.uploadDirect);

// Delete file
router.delete("/", validateQuery(presignReadSchema), controller.deleteUpload);

module.exports = router;

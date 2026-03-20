const { z } = require("zod");

const ALLOWED_FOLDERS = ["avatars", "covers", "logos", "documents"];

const presignUploadSchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  fileType: z
    .string()
    .regex(/^(image|application)\//, "fileType must be image/* or application/*"),
  folder: z.enum(ALLOWED_FOLDERS, {
    errorMap: () => ({ message: `folder must be one of: ${ALLOWED_FOLDERS.join(", ")}` }),
  }),
});

const presignReadSchema = z.object({
  key: z.string().min(1, "key is required"),
});

const presignBatchSchema = z.object({
  keys: z
    .array(z.string().min(1))
    .min(1, "At least one key required")
    .max(50, "Maximum 50 keys per request"),
});

module.exports = {
  presignUploadSchema,
  presignReadSchema,
  presignBatchSchema,
  ALLOWED_FOLDERS,
};

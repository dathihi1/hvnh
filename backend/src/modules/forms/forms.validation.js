const { z } = require("zod");
const { QUESTION_TYPE, NAVIGATION_TYPE, FORM_STATUS, RESPONSE_STATUS } = require("../../utils/constants");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const optionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  order: z.number().int().min(0).optional().default(0),
  isOther: z.boolean().optional().default(false),
  imageUrl: z.string().url().optional().nullable(),
});

const gridRowSchema = z.object({
  label: z.string().min(1, "Row label is required"),
  order: z.number().int().min(0).optional().default(0),
});

const displayConditionSchema = z
  .object({
    questionId: z.number().int(),
    operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than"]),
    value: z.string(),
  })
  .optional();

const validationRulesSchema = z
  .object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
    pattern: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    minSelections: z.number().int().min(1).optional(),
    maxSelections: z.number().int().min(1).optional(),
  })
  .optional();

const questionSchema = z.object({
  title: z.string().min(1, "Question title is required"),
  description: z.string().optional().nullable(),
  type: z.enum(Object.values(QUESTION_TYPE)),
  order: z.number().int().min(0).optional().default(0),
  required: z.boolean().optional().default(false),

  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  scaleMinLabel: z.string().optional().nullable(),
  scaleMaxLabel: z.string().optional().nullable(),

  allowedFileTypes: z.array(z.string()).optional().default([]),
  maxFileSize: z.number().int().min(1).optional(),
  maxFiles: z.number().int().min(1).optional(),

  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),

  validationRules: validationRulesSchema,
  displayCondition: displayConditionSchema,

  options: z.array(optionSchema).optional().default([]),
  gridRows: z.array(gridRowSchema).optional().default([]),
});

const sectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional().default(0),
  navigationType: z.enum(Object.values(NAVIGATION_TYPE)).optional().default("next"),
  questions: z.array(questionSchema).optional().default([]),
});

// ─── Form CRUD schemas ────────────────────────────────────────────────────────

const createFormSchema = z.object({
  title: z.string().min(1, "Form title is required").max(255),
  description: z.string().optional().nullable(),
  headerImageUrl: z.string().url().optional().nullable(),
  confirmationMessage: z.string().optional().nullable(),
  collectEmail: z.boolean().optional().default(false),
  limitOneResponse: z.boolean().optional().default(true),
  allowEditResponse: z.boolean().optional().default(false),
  showProgressBar: z.boolean().optional().default(false),
  shuffleQuestions: z.boolean().optional().default(false),
  requireSignIn: z.boolean().optional().default(true),
  responseLimit: z.number().int().min(1).optional().nullable(),
  openAt: z.string().datetime().optional().nullable(),
  closeAt: z.string().datetime().optional().nullable(),
  activityId: z.number().int().positive().optional().nullable(),
  sections: z.array(sectionSchema).min(1, "At least 1 section is required"),
});

const updateFormSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  headerImageUrl: z.string().url().optional().nullable(),
  confirmationMessage: z.string().optional().nullable(),
  collectEmail: z.boolean().optional(),
  limitOneResponse: z.boolean().optional(),
  allowEditResponse: z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  requireSignIn: z.boolean().optional(),
  responseLimit: z.number().int().min(1).optional().nullable(),
  openAt: z.string().datetime().optional().nullable(),
  closeAt: z.string().datetime().optional().nullable(),
  activityId: z.number().int().positive().optional().nullable(),
  status: z.enum(Object.values(FORM_STATUS)).optional(),
  sections: z.array(sectionSchema).optional(),
});

const changeStatusSchema = z.object({
  status: z.enum(Object.values(FORM_STATUS)),
});

// ─── Submit schema ────────────────────────────────────────────────────────────

const submitFormSchema = z.object({
  respondentEmail: z.string().email().optional().nullable(),
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        textValue: z.string().optional().nullable(),
        fileUrl: z.string().url().optional().nullable(),
        selectedOptionIds: z.array(z.number().int().positive()).optional().default([]),
        otherText: z.string().optional().nullable(),
        gridAnswers: z
          .array(
            z.object({
              rowId: z.number().int().positive(),
              optionId: z.number().int().positive(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .min(1, "At least 1 answer is required"),
});

const approveResponseSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

// ─── Query schemas ────────────────────────────────────────────────────────────

const getFormListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(Object.values(FORM_STATUS)).optional(),
  activityId: z.coerce.number().int().positive().optional(),
});

const getResponseListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(Object.values(RESPONSE_STATUS)).optional(),
});

module.exports = {
  createFormSchema,
  updateFormSchema,
  changeStatusSchema,
  submitFormSchema,
  approveResponseSchema,
  getFormListSchema,
  getResponseListSchema,
};

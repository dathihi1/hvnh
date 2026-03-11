const { Router } = require("express");
const controller = require("./forms.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  createFormSchema,
  updateFormSchema,
  changeStatusSchema,
  submitFormSchema,
  approveResponseSchema,
  getFormListSchema,
  getResponseListSchema,
} = require("./forms.validation");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Forms
 *   description: Dynamic form builder (Google Forms-like), submission, and export
 */

router.use(protect);

// ─── Public access (all authenticated users) ──────────────────────────────────

/**
 * @swagger
 * /api/forms/{id}/public:
 *   get:
 *     summary: Get form structure for filling
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Form structure (questions, options, grid rows)
 *       400:
 *         description: Form closed or not yet open
 *       404:
 *         description: Form not found
 */
router.get("/:id/public", controller.getFormPublic);

/**
 * @swagger
 * /api/forms/{id}/submit:
 *   post:
 *     summary: Submit a form response
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               respondentEmail:
 *                 type: string
 *                 format: email
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [questionId]
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                     textValue:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     selectedOptionIds:
 *                       type: array
 *                       items: { type: integer }
 *                     otherText:
 *                       type: string
 *                     gridAnswers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rowId: { type: integer }
 *                           optionId: { type: integer }
 *     responses:
 *       201:
 *         description: Response submitted
 */
router.post("/:id/submit", validate(submitFormSchema), controller.submitForm);

// ─── Management (admin / organization_leader) ─────────────────────────────────

/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: Create a new form with sections and questions
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Form created
 */
router.post(
  "/",
  authorize("admin", "organization_leader"),
  validate(createFormSchema),
  controller.createForm
);

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: List forms (paginated)
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, open, closed] }
 *       - in: query
 *         name: activityId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated form list
 */
router.get(
  "/",
  authorize("admin", "organization_leader"),
  validateQuery(getFormListSchema),
  controller.getFormList
);

/**
 * @swagger
 * /api/forms/{id}:
 *   get:
 *     summary: Get form details (sections, questions, options)
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Form details
 */
router.get(
  "/:id",
  authorize("admin", "organization_leader"),
  controller.getFormById
);

/**
 * @swagger
 * /api/forms/{id}:
 *   put:
 *     summary: Update form settings and sections
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Form updated
 */
router.put(
  "/:id",
  authorize("admin", "organization_leader"),
  validate(updateFormSchema),
  controller.updateForm
);

/**
 * @swagger
 * /api/forms/{id}:
 *   delete:
 *     summary: Soft-delete a form
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Form deleted
 */
router.delete(
  "/:id",
  authorize("admin", "organization_leader"),
  controller.deleteForm
);

/**
 * @swagger
 * /api/forms/{id}/status:
 *   put:
 *     summary: Change form status (draft / open / closed)
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, open, closed]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.put(
  "/:id/status",
  authorize("admin", "organization_leader"),
  validate(changeStatusSchema),
  controller.changeStatus
);

// ─── Response management ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/forms/{id}/responses:
 *   get:
 *     summary: List responses for a form (paginated)
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [submitted, approved, rejected] }
 *     responses:
 *       200:
 *         description: Paginated responses with answers
 */
router.get(
  "/:id/responses",
  authorize("admin", "organization_leader"),
  validateQuery(getResponseListSchema),
  controller.getResponses
);

/**
 * @swagger
 * /api/forms/{id}/responses/{responseId}:
 *   get:
 *     summary: Get a single response with all answers
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: responseId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Response details
 */
router.get(
  "/:id/responses/:responseId",
  authorize("admin", "organization_leader"),
  controller.getResponseById
);

/**
 * @swagger
 * /api/forms/{id}/responses/{responseId}/approve:
 *   put:
 *     summary: Approve or reject a response
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: responseId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Response approved or rejected
 */
router.put(
  "/:id/responses/:responseId/approve",
  authorize("admin", "organization_leader"),
  validate(approveResponseSchema),
  controller.approveResponse
);

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/forms/{id}/export/excel:
 *   get:
 *     summary: Export form responses to Excel (.xlsx)
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 */
router.get(
  "/:id/export/excel",
  authorize("admin", "organization_leader"),
  controller.exportExcel
);

/**
 * @swagger
 * /api/forms/{id}/export/google-sheets:
 *   post:
 *     summary: Export form responses to Google Sheets
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Google Sheets URL
 */
router.post(
  "/:id/export/google-sheets",
  authorize("admin", "organization_leader"),
  controller.exportGoogleSheets
);

module.exports = router;

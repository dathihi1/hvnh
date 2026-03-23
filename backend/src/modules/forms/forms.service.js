const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { FORM_STATUS, RESPONSE_STATUS } = require("../../utils/constants");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHOICE_TYPES = new Set([
  "multiple_choice",
  "checkboxes",
  "dropdown",
  "multiple_choice_grid",
  "checkbox_grid",
]);

const formInclude = {
  sections: {
    where: { isDeleted: false },
    orderBy: { order: "asc" },
    include: {
      questions: {
        where: { isDeleted: false },
        orderBy: { order: "asc" },
        include: {
          options: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
          },
          gridRows: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  },
  _count: { select: { responses: { where: { isDeleted: false } } } },
};

// ─── Create form ──────────────────────────────────────────────────────────────

const createForm = async (payload, createdBy) => {
  const {
    title,
    description,
    headerImageUrl,
    confirmationMessage,
    collectEmail,
    limitOneResponse,
    allowEditResponse,
    showProgressBar,
    shuffleQuestions,
    requireSignIn,
    responseLimit,
    openAt,
    closeAt,
    activityId,
    sections,
  } = payload;

  return prisma.$transaction(async (tx) => {
    const form = await tx.form.create({
      data: {
        title,
        description,
        headerImageUrl,
        confirmationMessage,
        collectEmail: collectEmail ?? false,
        limitOneResponse: limitOneResponse ?? true,
        allowEditResponse: allowEditResponse ?? false,
        showProgressBar: showProgressBar ?? false,
        shuffleQuestions: shuffleQuestions ?? false,
        requireSignIn: requireSignIn ?? true,
        responseLimit,
        openAt: openAt ? new Date(openAt) : null,
        closeAt: closeAt ? new Date(closeAt) : null,
        activityId: activityId ?? null,
        organizationId: payload.organizationId ?? null,
        createdBy,
      },
    });

    for (const section of sections) {
      const createdSection = await tx.formSection.create({
        data: {
          title: section.title,
          description: section.description,
          order: section.order ?? 0,
          navigationType: section.navigationType ?? "next",
          formId: form.formId,
        },
      });

      for (const q of section.questions ?? []) {
        const createdQuestion = await tx.question.create({
          data: {
            title: q.title,
            description: q.description,
            type: q.type,
            order: q.order ?? 0,
            required: q.required ?? false,
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
            scaleMinLabel: q.scaleMinLabel,
            scaleMaxLabel: q.scaleMaxLabel,
            allowedFileTypes: q.allowedFileTypes ?? [],
            maxFileSize: q.maxFileSize,
            maxFiles: q.maxFiles,
            imageUrl: q.imageUrl,
            videoUrl: q.videoUrl,
            validationRules: q.validationRules,
            displayCondition: q.displayCondition,
            sectionId: createdSection.sectionId,
          },
        });

        for (const option of q.options ?? []) {
          await tx.questionOption.create({
            data: {
              label: option.label,
              order: option.order ?? 0,
              isOther: option.isOther ?? false,
              imageUrl: option.imageUrl,
              questionId: createdQuestion.questionId,
            },
          });
        }

        for (const row of q.gridRows ?? []) {
          await tx.gridRow.create({
            data: {
              label: row.label,
              order: row.order ?? 0,
              questionId: createdQuestion.questionId,
            },
          });
        }
      }
    }

    return getFormById(form.formId, tx);
  });
};

// ─── List forms ───────────────────────────────────────────────────────────────

const getFormList = async ({ page = 1, limit = 20, status, activityId, organizationId, search }) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;

  const where = {
    isDeleted: false,
    ...(status && { status }),
    ...(activityId && { activityId: Number(activityId) }),
    ...(organizationId && { organizationId: Number(organizationId) }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
  };

  const [data, total] = await Promise.all([
    prisma.form.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        _count: { select: { responses: { where: { isDeleted: false } } } },
        organization: { select: { organizationId: true, organizationName: true } },
      },
    }),
    prisma.form.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// ─── Get form by ID (admin view) ──────────────────────────────────────────────

const getFormById = async (formId, tx = prisma) => {
  const form = await tx.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
    include: formInclude,
  });

  if (!form) throw new AppError("FORM_NOT_FOUND");
  return form;
};

// ─── Get form public view (for filling) ───────────────────────────────────────

const getFormPublic = async (formId) => {
  const form = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
    select: {
      formId: true,
      title: true,
      description: true,
      headerImageUrl: true,
      confirmationMessage: true,
      status: true,
      activityId: true,
      collectEmail: true,
      showProgressBar: true,
      shuffleQuestions: true,
      openAt: true,
      closeAt: true,
      sections: {
        where: { isDeleted: false },
        orderBy: { order: "asc" },
        select: {
          sectionId: true,
          title: true,
          description: true,
          order: true,
          navigationType: true,
          questions: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
            select: {
              questionId: true,
              title: true,
              description: true,
              type: true,
              order: true,
              required: true,
              scaleMin: true,
              scaleMax: true,
              scaleMinLabel: true,
              scaleMaxLabel: true,
              allowedFileTypes: true,
              maxFileSize: true,
              maxFiles: true,
              imageUrl: true,
              videoUrl: true,
              validationRules: true,
              displayCondition: true,
              options: {
                where: { isDeleted: false },
                orderBy: { order: "asc" },
                select: {
                  optionId: true,
                  label: true,
                  order: true,
                  isOther: true,
                  imageUrl: true,
                  goToSectionId: true,
                },
              },
              gridRows: {
                where: { isDeleted: false },
                orderBy: { order: "asc" },
                select: { rowId: true, label: true, order: true },
              },
            },
          },
        },
      },
    },
  });

  if (!form) throw new AppError("FORM_NOT_FOUND");

  // Activity-linked forms bypass the form-level status check
  // (the activity's own registration deadline controls access)
  if (!form.activityId) {
    const now = new Date();
    if (form.status !== FORM_STATUS.OPEN) throw new AppError("FORM_CLOSED");
    if (form.openAt && now < new Date(form.openAt)) throw new AppError("FORM_CLOSED");
    if (form.closeAt && now > new Date(form.closeAt)) throw new AppError("FORM_CLOSED");
  }

  return form;
};

// ─── Update form ──────────────────────────────────────────────────────────────

const updateForm = async (formId, payload, updatedBy) => {
  const existing = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
  });
  if (!existing) throw new AppError("FORM_NOT_FOUND");

  const {
    title, description, headerImageUrl, confirmationMessage,
    collectEmail, limitOneResponse, allowEditResponse,
    showProgressBar, shuffleQuestions, requireSignIn,
    responseLimit, openAt, closeAt, activityId, sections,
    status,
  } = payload;

  return prisma.$transaction(async (tx) => {
    await tx.form.update({
      where: { formId: Number(formId) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(headerImageUrl !== undefined && { headerImageUrl }),
        ...(confirmationMessage !== undefined && { confirmationMessage }),
        ...(collectEmail !== undefined && { collectEmail }),
        ...(limitOneResponse !== undefined && { limitOneResponse }),
        ...(allowEditResponse !== undefined && { allowEditResponse }),
        ...(showProgressBar !== undefined && { showProgressBar }),
        ...(shuffleQuestions !== undefined && { shuffleQuestions }),
        ...(requireSignIn !== undefined && { requireSignIn }),
        ...(responseLimit !== undefined && { responseLimit }),
        ...(openAt !== undefined && { openAt: openAt ? new Date(openAt) : null }),
        ...(closeAt !== undefined && { closeAt: closeAt ? new Date(closeAt) : null }),
        ...(activityId !== undefined && { activityId }),
        ...(status !== undefined && { status }),
        updatedBy,
      },
    });

    if (sections) {
      const oldSections = await tx.formSection.findMany({
        where: { formId: Number(formId), isDeleted: false },
        select: { sectionId: true },
      });
      const oldSectionIds = oldSections.map((s) => s.sectionId);

      if (oldSectionIds.length > 0) {
        const oldQuestions = await tx.question.findMany({
          where: { sectionId: { in: oldSectionIds }, isDeleted: false },
          select: { questionId: true },
        });
        const oldQuestionIds = oldQuestions.map((q) => q.questionId);

        if (oldQuestionIds.length > 0) {
          await tx.questionOption.updateMany({
            where: { questionId: { in: oldQuestionIds } },
            data: { isDeleted: true },
          });
          await tx.gridRow.updateMany({
            where: { questionId: { in: oldQuestionIds } },
            data: { isDeleted: true },
          });
          await tx.question.updateMany({
            where: { questionId: { in: oldQuestionIds } },
            data: { isDeleted: true },
          });
        }

        await tx.formSection.updateMany({
          where: { sectionId: { in: oldSectionIds } },
          data: { isDeleted: true },
        });
      }

      for (const section of sections) {
        const createdSection = await tx.formSection.create({
          data: {
            title: section.title,
            description: section.description,
            order: section.order ?? 0,
            navigationType: section.navigationType ?? "next",
            formId: Number(formId),
          },
        });

        for (const q of section.questions ?? []) {
          const createdQuestion = await tx.question.create({
            data: {
              title: q.title,
              description: q.description,
              type: q.type,
              order: q.order ?? 0,
              required: q.required ?? false,
              scaleMin: q.scaleMin,
              scaleMax: q.scaleMax,
              scaleMinLabel: q.scaleMinLabel,
              scaleMaxLabel: q.scaleMaxLabel,
              allowedFileTypes: q.allowedFileTypes ?? [],
              maxFileSize: q.maxFileSize,
              maxFiles: q.maxFiles,
              imageUrl: q.imageUrl,
              videoUrl: q.videoUrl,
              validationRules: q.validationRules,
              displayCondition: q.displayCondition,
              sectionId: createdSection.sectionId,
            },
          });

          for (const option of q.options ?? []) {
            await tx.questionOption.create({
              data: {
                label: option.label,
                order: option.order ?? 0,
                isOther: option.isOther ?? false,
                imageUrl: option.imageUrl,
                questionId: createdQuestion.questionId,
              },
            });
          }

          for (const row of q.gridRows ?? []) {
            await tx.gridRow.create({
              data: {
                label: row.label,
                order: row.order ?? 0,
                questionId: createdQuestion.questionId,
              },
            });
          }
        }
      }
    }

    return getFormById(formId, tx);
  });
};

// ─── Change status ────────────────────────────────────────────────────────────

const changeStatus = async (formId, status) => {
  const form = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
  });
  if (!form) throw new AppError("FORM_NOT_FOUND");

  return prisma.form.update({
    where: { formId: Number(formId) },
    data: { status },
  });
};

// ─── Delete form (soft) ───────────────────────────────────────────────────────

const deleteForm = async (formId, deletedBy) => {
  const form = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
  });
  if (!form) throw new AppError("FORM_NOT_FOUND");

  return prisma.form.update({
    where: { formId: Number(formId) },
    data: { isDeleted: true, deletedBy },
  });
};

// ─── Submit form ──────────────────────────────────────────────────────────────

const submitForm = async (formId, payload, userId) => {
  const form = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
  });
  if (!form) throw new AppError("FORM_NOT_FOUND");

  // Activity-linked forms bypass form-level status/time checks
  if (!form.activityId) {
    if (form.status !== FORM_STATUS.OPEN) throw new AppError("FORM_CLOSED");
    const now = new Date();
    if (form.openAt && now < new Date(form.openAt)) throw new AppError("FORM_CLOSED");
    if (form.closeAt && now > new Date(form.closeAt)) throw new AppError("FORM_CLOSED");
  }

  if (form.responseLimit) {
    const count = await prisma.formResponse.count({
      where: { formId: Number(formId), isDeleted: false },
    });
    if (count >= form.responseLimit) throw new AppError("FORM_CLOSED");
  }

  if (form.limitOneResponse && userId) {
    const existing = await prisma.formResponse.findFirst({
      where: { formId: Number(formId), userId, isDeleted: false },
    });
    if (existing && !form.allowEditResponse) throw new AppError("FORM_ALREADY_SUBMITTED");
  }

  const { answers } = payload;

  return prisma.$transaction(async (tx) => {
    if (form.allowEditResponse && userId) {
      const existing = await tx.formResponse.findFirst({
        where: { formId: Number(formId), userId, isDeleted: false },
      });
      if (existing) {
        const oldAnswers = await tx.answer.findMany({
          where: { responseId: existing.responseId, isDeleted: false },
          select: { answerId: true },
        });
        const oldAnswerIds = oldAnswers.map((a) => a.answerId);
        if (oldAnswerIds.length > 0) {
          await tx.answerOption.updateMany({
            where: { answerId: { in: oldAnswerIds } },
            data: { isDeleted: true },
          });
          await tx.answer.updateMany({
            where: { answerId: { in: oldAnswerIds } },
            data: { isDeleted: true },
          });
        }
        await tx.formResponse.update({
          where: { responseId: existing.responseId },
          data: { isDeleted: true },
        });
      }
    }

    const response = await tx.formResponse.create({
      data: {
        formId: Number(formId),
        userId: userId || null,
        respondentEmail: payload.respondentEmail || null,
      },
    });

    for (const answerData of answers) {
      const answer = await tx.answer.create({
        data: {
          textValue: answerData.textValue ?? null,
          fileUrl: answerData.fileUrl ?? null,
          questionId: answerData.questionId,
          responseId: response.responseId,
        },
      });

      // Single / multiple selected options (multiple_choice, checkboxes, dropdown)
      if (answerData.selectedOptionIds?.length > 0) {
        for (const optionId of answerData.selectedOptionIds) {
          await tx.answerOption.create({
            data: {
              answerId: answer.answerId,
              optionId,
              otherText: answerData.otherText ?? null,
            },
          });
        }
      }

      // Grid answers: [{ rowId, optionId }]
      if (answerData.gridAnswers?.length > 0) {
        for (const ga of answerData.gridAnswers) {
          await tx.answerOption.create({
            data: {
              answerId: answer.answerId,
              optionId: ga.optionId,
              rowId: ga.rowId,
            },
          });
        }
      }
    }

    return response;
  });
};

// ─── Get responses ────────────────────────────────────────────────────────────

const getResponses = async (formId, { page = 1, limit = 20, status, userId, search }) => {
  const form = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
  });
  if (!form) throw new AppError("FORM_NOT_FOUND");

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;

  const where = {
    formId: Number(formId),
    ...(userId && { userId: Number(userId) }),
    ...(search && {
      user: {
        OR: [
          { userName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
    isDeleted: false,
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.formResponse.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        user: { select: { userId: true, userName: true, email: true } },
        answers: {
          where: { isDeleted: false },
          include: {
            question: { select: { questionId: true, title: true, type: true } },
            answerOptions: {
              where: { isDeleted: false },
              include: {
                option: { select: { optionId: true, label: true } },
                row: { select: { rowId: true, label: true } },
              },
            },
          },
        },
      },
    }),
    prisma.formResponse.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// ─── Get single response ──────────────────────────────────────────────────────

const getResponseById = async (formId, responseId) => {
  const response = await prisma.formResponse.findFirst({
    where: {
      responseId: Number(responseId),
      formId: Number(formId),
      isDeleted: false,
    },
    include: {
      user: { select: { userId: true, userName: true, email: true } },
      answers: {
        where: { isDeleted: false },
        include: {
          question: { select: { questionId: true, title: true, type: true } },
          answerOptions: {
            where: { isDeleted: false },
            include: {
              option: { select: { optionId: true, label: true } },
              row: { select: { rowId: true, label: true } },
            },
          },
        },
      },
    },
  });

  if (!response) throw new AppError("FORM_RESPONSE_NOT_FOUND");
  return response;
};

// ─── Approve / reject response ────────────────────────────────────────────────

const approveResponse = async (formId, responseId, status) => {
  const response = await prisma.formResponse.findFirst({
    where: {
      responseId: Number(responseId),
      formId: Number(formId),
      isDeleted: false,
    },
  });
  if (!response) throw new AppError("FORM_RESPONSE_NOT_FOUND");

  return prisma.formResponse.update({
    where: { responseId: Number(responseId) },
    data: { status },
  });
};

// ─── Get current user's own response ─────────────────────────────────────────

const getMyResponse = async (formId, userId) => {
  const response = await prisma.formResponse.findFirst({
    where: { formId: Number(formId), userId, isDeleted: false },
    orderBy: { submittedAt: "desc" },
    include: {
      answers: {
        where: { isDeleted: false },
        include: {
          question: { select: { questionId: true, title: true, type: true } },
          answerOptions: {
            where: { isDeleted: false },
            include: {
              option: { select: { optionId: true, label: true } },
              row: { select: { rowId: true, label: true } },
            },
          },
        },
      },
    },
  });
  return response ?? null;
};

module.exports = {
  createForm,
  getFormList,
  getFormById,
  getFormPublic,
  updateForm,
  changeStatus,
  deleteForm,
  submitForm,
  getResponses,
  getResponseById,
  approveResponse,
  getMyResponse,
};

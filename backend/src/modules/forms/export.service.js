const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");

let ExcelJS;
try {
  ExcelJS = require("exceljs");
} catch {
  ExcelJS = null;
}

const { createSpreadsheet, appendToSheet } = require("../../utils/google-workspace");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildFormWithQuestions = async (formId) => {
  const form = await prisma.form.findFirst({
    where: { formId: Number(formId), isDeleted: false },
    include: {
      sections: {
        where: { isDeleted: false },
        orderBy: { order: "asc" },
        include: {
          questions: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!form) throw new AppError("FORM_NOT_FOUND");

  const questions = form.sections.flatMap((s) => s.questions);
  return { form, questions };
};

const buildResponseRows = (responses, questions) => {
  return responses.map((resp, idx) => {
    const answerMap = {};

    for (const answer of resp.answers) {
      const qId = answer.questionId;
      if (answer.textValue || answer.fileUrl) {
        answerMap[qId] = answer.textValue || answer.fileUrl || "";
      } else if (answer.answerOptions?.length > 0) {
        answerMap[qId] = answer.answerOptions
          .map((ao) => {
            const base = ao.option?.label || "";
            if (ao.otherText) return `${base}: ${ao.otherText}`;
            if (ao.row) return `[${ao.row.label}] ${base}`;
            return base;
          })
          .join(", ");
      }
    }

    return {
      stt: idx + 1,
      respondent: resp.user?.userName || resp.respondentEmail || "",
      email: resp.user?.email || resp.respondentEmail || "",
      submittedAt: resp.submittedAt.toISOString().slice(0, 19).replace("T", " "),
      status: resp.status,
      ...Object.fromEntries(questions.map((q) => [q.questionId, answerMap[q.questionId] || ""])),
    };
  });
};

const fetchResponses = async (formId) => {
  return prisma.formResponse.findMany({
    where: { formId: Number(formId), isDeleted: false },
    orderBy: { submittedAt: "asc" },
    include: {
      user: { select: { userName: true, email: true } },
      answers: {
        where: { isDeleted: false },
        include: {
          answerOptions: {
            where: { isDeleted: false },
            include: {
              option: { select: { label: true } },
              row: { select: { label: true } },
            },
          },
        },
      },
    },
  });
};

// ─── Export to Excel (.xlsx) ──────────────────────────────────────────────────

const exportFormToExcel = async (formId) => {
  if (!ExcelJS) {
    throw new AppError("FORM_EXPORT_FAILED");
  }

  const { form, questions } = await buildFormWithQuestions(formId);
  const responses = await fetchResponses(formId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Responses");

  sheet.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Nguoi nop", key: "respondent", width: 22 },
    { header: "Email", key: "email", width: 25 },
    { header: "Thoi gian nop", key: "submittedAt", width: 20 },
    { header: "Trang thai", key: "status", width: 14 },
    ...questions.map((q) => ({ header: q.title, key: String(q.questionId), width: 28 })),
  ];

  sheet.getRow(1).font = { bold: true };

  const rows = buildResponseRows(responses, questions);
  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = form.title.replace(/[^a-zA-Z0-9_\-\u00C0-\u1EF9 ]/g, "").trim();
  const filename = `${safeName}_${Date.now()}.xlsx`;

  return { buffer: Buffer.from(buffer), filename };
};

// ─── Export to Google Sheets ──────────────────────────────────────────────────

const exportFormToGoogleSheets = async (formId) => {
  const { form, questions } = await buildFormWithQuestions(formId);
  const responses = await fetchResponses(formId);

  const spreadsheet = await createSpreadsheet({ title: `Form: ${form.title}` });

  const headers = [
    "STT", "Nguoi nop", "Email", "Thoi gian nop", "Trang thai",
    ...questions.map((q) => q.title),
  ];

  const rows = buildResponseRows(responses, questions).map((row) => [
    row.stt,
    row.respondent,
    row.email,
    row.submittedAt,
    row.status,
    ...questions.map((q) => row[q.questionId] || ""),
  ]);

  await appendToSheet({
    spreadsheetId: spreadsheet.spreadsheetId,
    range: "Sheet1!A1",
    values: [headers, ...rows],
  });

  return {
    spreadsheetId: spreadsheet.spreadsheetId,
    spreadsheetUrl: spreadsheet.spreadsheetUrl,
  };
};

module.exports = { exportFormToExcel, exportFormToGoogleSheets };

const { execFile } = require("child_process");
const { promisify } = require("util");
const AppError = require("./app-error");

const execFileAsync = promisify(execFile);

// ─── Base executor ──────────────────────────────────────────────────────────────

const gws = async (args) => {
  const credFile = process.env.GWS_CREDENTIALS_FILE;
  if (!credFile) {
    throw new AppError("GWS_NOT_CONFIGURED");
  }

  try {
    const { stdout } = await execFileAsync("gws", args, {
      env: {
        ...process.env,
        GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE: credFile,
      },
      timeout: 30000,
    });
    return JSON.parse(stdout);
  } catch (err) {
    throw new AppError(
      "GWS_COMMAND_FAILED",
      err.stderr || err.message
    );
  }
};

// ─── Gmail: Send email ──────────────────────────────────────────────────────────

const sendGmail = async ({ to, subject, body }) => {
  // Build RFC 2822 message and base64url encode
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const raw = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return gws([
    "gmail",
    "users",
    "messages",
    "send",
    "--params",
    JSON.stringify({ userId: "me" }),
    "--json",
    JSON.stringify({ raw }),
  ]);
};

// ─── Calendar: Create event ─────────────────────────────────────────────────────

const createCalendarEvent = async ({
  summary,
  description,
  startTime,
  endTime,
  attendees,
}) => {
  const eventData = {
    summary,
    description,
    start: { dateTime: startTime },
    end: { dateTime: endTime || startTime },
  };

  if (attendees && attendees.length > 0) {
    eventData.attendees = attendees.map((email) => ({ email }));
  }

  return gws([
    "calendar",
    "events",
    "insert",
    "--params",
    JSON.stringify({ calendarId: "primary" }),
    "--json",
    JSON.stringify(eventData),
  ]);
};

// ─── Sheets: Create spreadsheet ─────────────────────────────────────────────────

const createSpreadsheet = async ({ title }) => {
  const result = await gws([
    "sheets",
    "spreadsheets",
    "create",
    "--json",
    JSON.stringify({ properties: { title } }),
  ]);

  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl,
  };
};

// ─── Sheets: Append rows ────────────────────────────────────────────────────────

const appendToSheet = async ({ spreadsheetId, range, values }) => {
  return gws([
    "sheets",
    "spreadsheets",
    "values",
    "append",
    "--params",
    JSON.stringify({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
    }),
    "--json",
    JSON.stringify({ values }),
  ]);
};

module.exports = {
  gws,
  sendGmail,
  createCalendarEvent,
  createSpreadsheet,
  appendToSheet,
};

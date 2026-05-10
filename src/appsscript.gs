/******************************************************* IELTS SHEETS + APPS SCRIPT — CLEAN FULL REPLACEMENT - Full submit flow - Immediate Writing grading - Objective Results + Results updates - Background retry queue for failed Writing grading - Speaking upload support********************************************************/ const SPREADSHEET_ID =
  "1ZTBc4uMJ3ZAA5yG7r7i4RhTz4Eo8onnzVNNJoF1m8iU";
const SHEET_NAME = "IELTS submissions";
const ANSWER_KEY_SHEET_NAME = "AnswerKey";
const OBJECTIVE_RESULTS_SHEET_NAME = "Objective Results";
const DETAILED_RESULTS_SHEET_NAME = "Results";
const WRITING_SHEET_NAME = "Writing";
const SPEAKING_SHEET_NAME = "SpeakingUploads";
const SYSTEM_LOG_SHEET_NAME = "System Logs";
const SUBMISSION_META_SHEET_NAME = "SubmissionMeta";
const SPEAKING_FOLDER_ID = "1yWmzGpn6XXVVCV9f9YtNwv_sJVCp3LKe";
const OPENAI_BASE_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODELS_FOR_WRITING = ["gpt-4.1", "gpt-4o-mini"];
const DETAILED_BLOCK_HEIGHT = 47;
const DETAILED_BLOCK_WIDTH = 9;
const ADMIN_RESULTS_SUMMARY_CACHE_KEY = "admin_results_summary_v1";
const ADMIN_RESULTS_SUMMARY_CACHE_TTL_SECONDS = 300;
const DEFAULT_ORGANIZATION_ID = "ieltsmock";
const STUDENT_DIRECTORY_SHEET_NAME = "StudentID";
const STUDENT_ALIASES_SHEET_NAME = "StudentAliases";
const ASSIGNMENTS_SHEET_NAME = "Assignments";
const ASSIGNMENT_STUDENTS_SHEET_NAME = "AssignmentStudents";
/*********************** BASIC HELPERS************************/ function jsonOutput(
  obj,
) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
function logSystem_(scope, message, extra) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName(SYSTEM_LOG_SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SYSTEM_LOG_SHEET_NAME);
      sh.appendRow(["Timestamp", "Scope", "Message", "Extra"]);
      sh.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f4cccc");
      sh.setFrozenRows(1);
      sh.setColumnWidth(1, 180);
      sh.setColumnWidth(2, 160);
      sh.setColumnWidth(3, 320);
      sh.setColumnWidth(4, 700);
    }
    sh.appendRow([
      new Date().toISOString(),
      String(scope || ""),
      String(message || ""),
      extra ? JSON.stringify(extra) : "",
    ]);
  } catch (e) {
    Logger.log("System log failed: " + e);
  }
}
function parseJsonSafe_(jsonText) {
  if (jsonText === null || jsonText === undefined || jsonText === "")
    return null;
  try {
    return JSON.parse(String(jsonText));
  } catch (e) {
    return null;
  }
}
function getAnswers_(obj) {
  return obj && obj.answers && typeof obj.answers === "object"
    ? obj.answers
    : {};
}
function getPrompts_(obj) {
  return obj && obj.prompts && typeof obj.prompts === "object"
    ? obj.prompts
    : {};
}
function countWords_(text) {
  const s = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  return s ? s.split(" ").length : 0;
}
function toNumberOrBlank_(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? "" : n;
}
function normStrict_(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}
function makeSubmissionKey_(submittedAt, studentFullName, examId, reason) {
  return [
    String(submittedAt || "").trim(),
    String(studentFullName || "")
      .trim()
      .toLowerCase(),
    String(examId || "").trim(),
    String(reason || "").trim(),
  ].join(" || ");
}
function normalizeOrganizationId_(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase() || DEFAULT_ORGANIZATION_ID
  );
}
function normalizeEmail_(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function transliterateStudentText_(value) {
  var map = {
    ə: "e",
    Ə: "e",
    ı: "i",
    I: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ü: "u",
    Ü: "u",
    ğ: "g",
    Ğ: "g",
    ş: "s",
    Ş: "s",
    ç: "c",
    Ç: "c",
    ñ: "n",
    Ñ: "n",
  };
  return String(value || "")
    .split("")
    .map(function (ch) {
      return map.hasOwnProperty(ch) ? map[ch] : ch;
    })
    .join("");
}
function normalizeStudentName_(value) {
  var s = transliterateStudentText_(String(value || "")).toLowerCase();
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {}
  s = s
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}
function sortedStudentNameKey_(value) {
  var parts = normalizeStudentName_(value).split(" ").filter(String).sort();
  return parts.join(" ");
}
function getStudentAliasesHeaders_() {
  return [
    "studentIdCode",
    "aliasFullName",
    "aliasEmail",
    "classroom",
    "notes",
    "isActive",
  ];
}
function getOrCreateStudentAliasesSheet_(ss) {
  var sh = ss.getSheetByName(STUDENT_ALIASES_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(STUDENT_ALIASES_SHEET_NAME);
  ensureSheetHeaders_(sh, getStudentAliasesHeaders_());
  sh.getRange(1, 1, 1, sh.getLastColumn())
    .setFontWeight("bold")
    .setBackground("#fff2cc");
  sh.setFrozenRows(1);
  return sh;
}
function parseStudentDirectoryRows_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(STUDENT_DIRECTORY_SHEET_NAME);
  if (!sh || sh.getLastRow() < 1) return [];
  var values = sh
    .getRange(1, 1, sh.getLastRow(), Math.max(4, sh.getLastColumn()))
    .getDisplayValues();
  var currentClassroom = "";
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var colA = String(row[0] || "").trim();
    var colB = String(row[1] || "").trim();
    var colC = String(row[2] || "").trim();
    var colD = normalizeEmail_(row[3] || "");
    var colBLower = colB.toLowerCase();
    var colCLower = colC.toLowerCase();
    var colDLower = colD.toLowerCase();
    if (!colA && !colB && !colC && !colD) continue;
    if (
      colA &&
      ((colBLower === "variations" && colCLower === "studentid") ||
        (colBLower === "variation" && colCLower === "studentid"))
    ) {
      currentClassroom = colA;
      continue;
    }
    if (colA && !colB && !colC && !colD) {
      currentClassroom = colA;
      continue;
    }
    if (
      colALowerCase_(colA) === "name" ||
      colBLower === "variations" ||
      colCLower === "studentid" ||
      colDLower === "email"
    )
      continue;
    if (!colC) continue;
    out.push({
      classroom: currentClassroom || "",
      canonicalName: colA,
      variationName: colB,
      studentIdCode: colC,
      officialEmail: colD,
    });
  }
  return out;
}
function colALowerCase_(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function buildStudentIdentityIndex_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var aliasesSheet = getOrCreateStudentAliasesSheet_(ss);
  var records = [];
  var byStudentId = {};
  var byEmail = {};
  var byName = {};
  var bySortedName = {};
  function addRecord(record) {
    if (!record || !record.studentIdCode) return;
    var key = String(record.studentIdCode || "").trim();
    if (!key) return;
    if (!byStudentId[key]) {
      byStudentId[key] = {
        studentIdCode: key,
        canonicalName: record.canonicalName || "",
        officialEmail: normalizeEmail_(record.officialEmail || ""),
        classroom: record.classroom || "",
        aliases: [],
      };
      records.push(byStudentId[key]);
    }
    var target = byStudentId[key];
    if (!target.canonicalName && record.canonicalName)
      target.canonicalName = record.canonicalName;
    if (!target.officialEmail && record.officialEmail)
      target.officialEmail = normalizeEmail_(record.officialEmail);
    if (!target.classroom && record.classroom)
      target.classroom = record.classroom;
    (record.aliases || []).forEach(function (alias) {
      alias = String(alias || "").trim();
      if (!alias) return;
      if (target.aliases.indexOf(alias) === -1) target.aliases.push(alias);
    });
  }
  parseStudentDirectoryRows_().forEach(function (row) {
    addRecord({
      studentIdCode: row.studentIdCode,
      canonicalName: row.canonicalName,
      officialEmail: row.officialEmail,
      classroom: row.classroom,
      aliases: [row.canonicalName, row.variationName],
    });
  });
  if (aliasesSheet.getLastRow() >= 2) {
    var aliasRows = aliasesSheet
      .getRange(
        2,
        1,
        aliasesSheet.getLastRow() - 1,
        Math.max(aliasesSheet.getLastColumn(), 1),
      )
      .getDisplayValues();
    var headerMap = getHeaderMap_(aliasesSheet);
    aliasRows.forEach(function (row) {
      var studentIdCode = String(
        row[(headerMap.studentIdCode || 1) - 1] || "",
      ).trim();
      var aliasFullName = String(
        row[(headerMap.aliasFullName || 2) - 1] || "",
      ).trim();
      var aliasEmail = normalizeEmail_(
        row[(headerMap.aliasEmail || 3) - 1] || "",
      );
      var classroom = String(row[(headerMap.classroom || 4) - 1] || "").trim();
      var isActive = String(row[(headerMap.isActive || 6) - 1] || "TRUE")
        .trim()
        .toLowerCase();
      if (
        !studentIdCode ||
        isActive === "false" ||
        isActive === "0" ||
        isActive === "no"
      )
        return;
      addRecord({
        studentIdCode: studentIdCode,
        canonicalName: "",
        officialEmail: "",
        classroom: classroom,
        aliases: [aliasFullName],
        aliasEmail: aliasEmail,
      });
      if (aliasEmail) byEmail[aliasEmail] = byStudentId[studentIdCode];
    });
  }
  records.forEach(function (record) {
    if (record.officialEmail) byEmail[record.officialEmail] = record;
    (record.aliases || []).forEach(function (alias) {
      var normalized = normalizeStudentName_(alias);
      var sorted = sortedStudentNameKey_(alias);
      if (normalized) byName[normalized] = record;
      if (sorted) bySortedName[sorted] = record;
    });
    if (record.canonicalName) {
      var canonicalNormalized = normalizeStudentName_(record.canonicalName);
      var canonicalSorted = sortedStudentNameKey_(record.canonicalName);
      if (canonicalNormalized) byName[canonicalNormalized] = record;
      if (canonicalSorted) bySortedName[canonicalSorted] = record;
    }
  });
  return {
    records: records,
    byStudentId: byStudentId,
    byEmail: byEmail,
    byName: byName,
    bySortedName: bySortedName,
  };
}
/**
 * CacheService-backed wrapper around buildStudentIdentityIndex_.
 * Caches the serialised index for 5 minutes so repeated calls within the same
 * request (or across parallel requests) only read the sheet once.
 */
function buildCachedStudentIdentityIndex_() {
  const cache = CacheService.getScriptCache();
  const CACHE_KEY = "student_identity_index_v1";
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.byStudentId) return parsed;
    } catch (e) {}
  }
  const index = buildStudentIdentityIndex_();
  try { cache.put(CACHE_KEY, JSON.stringify(index), 300); } catch (e) {}
  return index;
}
function resolveStudentIdentity_(
  studentFullName,
  studentEmail,
  studentIdCode,
  organizationId,
  identityIndex,
) {
  var index = identityIndex || buildStudentIdentityIndex_();
  var resolved = null;
  var normalizedStudentId = String(studentIdCode || "").trim();
  var normalizedEmail = normalizeEmail_(studentEmail || "");
  var normalizedName = normalizeStudentName_(studentFullName || "");
  var sortedName = sortedStudentNameKey_(studentFullName || "");
  if (normalizedStudentId && index.byStudentId[normalizedStudentId]) {
    resolved = index.byStudentId[normalizedStudentId];
  }
  if (!resolved && normalizedEmail && index.byEmail[normalizedEmail]) {
    resolved = index.byEmail[normalizedEmail];
  }
  if (!resolved && normalizedName && index.byName[normalizedName]) {
    resolved = index.byName[normalizedName];
  }
  if (!resolved && sortedName && index.bySortedName[sortedName]) {
    resolved = index.bySortedName[sortedName];
  }
  if (!resolved) return null;
  return {
    organizationId: normalizeOrganizationId_(
      organizationId || DEFAULT_ORGANIZATION_ID,
    ),
    studentIdCode: resolved.studentIdCode || "",
    canonicalStudentName: resolved.canonicalName || studentFullName || "",
    officialEmail: resolved.officialEmail || normalizedEmail || "",
    classroom: resolved.classroom || "",
  };
}
var STUDENT_IDENTITY_BACKFILL_CURSOR_KEY = "STUDENT_IDENTITY_BACKFILL_CURSOR";
function applyResolvedIdentityToRowObject_(rowObject, resolvedIdentity) {
  var next = Object.assign({}, rowObject || {});
  if (!resolvedIdentity) return next;
  if (resolvedIdentity.studentIdCode)
    next.studentIdCode = resolvedIdentity.studentIdCode;
  if (resolvedIdentity.classroom) next.classroom = resolvedIdentity.classroom;
  if (resolvedIdentity.canonicalStudentName)
    next.canonicalStudentName = resolvedIdentity.canonicalStudentName;
  if (resolvedIdentity.officialEmail)
    next.officialEmail = resolvedIdentity.officialEmail;
  if (resolvedIdentity.organizationId)
    next.organizationId = normalizeOrganizationId_(
      resolvedIdentity.organizationId,
    );
  return next;
}
function getHeaderMap_(sheet) {
  const headers =
    sheet && sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
      : [];
  const map = {};
  headers.forEach(function (header, index) {
    const key = String(header || "").trim();
    if (key) map[key] = index + 1;
  });
  return map;
}
function ensureSheetHeaders_(sheet, headers) {
  if (!sheet) throw new Error("Sheet is required.");
  const required = Array.isArray(headers) ? headers.slice() : [];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
    return required;
  }
  const lastColumn = Math.max(sheet.getLastColumn(), required.length, 1);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const existing = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(function (value) {
      return String(value || "").trim();
    });
  const seen = {};
  const normalized = [];
  required.forEach(function (header) {
    const key = String(header || "").trim();
    if (!key || seen[key]) return;
    seen[key] = true;
    normalized.push(key);
  });
  existing.forEach(function (header) {
    const key = String(header || "").trim();
    if (!key || seen[key]) return;
    seen[key] = true;
    normalized.push(key);
  });
  const needsRewrite =
    normalized.length !== existing.length ||
    existing.some(function (header, index) {
      return (
        String(header || "").trim() !== String(normalized[index] || "").trim()
      );
    });
  if (!needsRewrite) return normalized;
  const width = Math.max(sheet.getLastColumn(), 1);
  const allValues = sheet.getRange(1, 1, lastRow, width).getValues();
  const dataRows = allValues.slice(1);
  const oldHeaderIndex = {};
  existing.forEach(function (header, index) {
    const key = String(header || "").trim();
    if (key && oldHeaderIndex[key] === undefined) oldHeaderIndex[key] = index;
  });
  const rewrittenRows = dataRows.map(function (row) {
    return normalized.map(function (header) {
      const idx = oldHeaderIndex[header];
      return idx === undefined ? "" : row[idx];
    });
  });
  sheet.clearContents();
  sheet.getRange(1, 1, 1, normalized.length).setValues([normalized]);
  if (rewrittenRows.length) {
    sheet
      .getRange(2, 1, rewrittenRows.length, normalized.length)
      .setValues(rewrittenRows);
  }
  return normalized;
}
function getRowObject_(sheet, rowNumber) {
  const headerMap = getHeaderMap_(sheet);
  const values = sheet
    .getRange(rowNumber, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getDisplayValues()[0];
  const out = { rowNumber: rowNumber };
  Object.keys(headerMap).forEach(function (header) {
    out[header] = values[headerMap[header] - 1] || "";
  });
  return out;
}
function setRowObjectByHeaders_(sheet, rowNumber, data, preferredHeaders) {
  const currentHeaders =
    sheet.getLastRow() > 0
      ? sheet
          .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
          .getDisplayValues()[0]
          .map(function (value) {
            return String(value || "").trim();
          })
          .filter(String)
      : [];
  const baseHeaders = (
    Array.isArray(preferredHeaders) && preferredHeaders.length
      ? preferredHeaders
      : currentHeaders.length
        ? currentHeaders
        : Object.keys(data || {})
  ).slice();
  const headers = ensureSheetHeaders_(sheet, baseHeaders);
  const values = headers.map(function (header) {
    return data[header] !== undefined ? data[header] : "";
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
  return rowNumber;
}
function appendRowObject_(sheet, data, preferredHeaders) {
  const currentHeaders =
    sheet.getLastRow() > 0
      ? sheet
          .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
          .getDisplayValues()[0]
          .map(function (value) {
            return String(value || "").trim();
          })
          .filter(String)
      : [];
  const baseHeaders = (
    Array.isArray(preferredHeaders) && preferredHeaders.length
      ? preferredHeaders
      : currentHeaders.length
        ? currentHeaders
        : Object.keys(data || {})
  ).slice();
  const headers = ensureSheetHeaders_(sheet, baseHeaders);
  const values = headers.map(function (header) {
    return data[header] !== undefined ? data[header] : "";
  });
  sheet.appendRow(values);
  return sheet.getLastRow();
}
function getSubmissionSheet_(ss) {
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  ensureSubmissionHeader_(sh);
  return sh;
}
function getAllSubmissionRowObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber++) {
    const row = getSubmissionRowObject_(sheet, rowNumber);
    if (
      !String(row.submittedAt || "").trim() &&
      !String(row.studentFullName || "").trim() &&
      !String(row.examId || "").trim() &&
      !String(row.listening_json || "").trim() &&
      !String(row.reading_json || "").trim() &&
      !String(row.writing_json || "").trim()
    )
      continue;
    rows.push(row);
  }
  return rows;
}
function getSubmissionRowObject_(sheet, rowNumber) {
  const row = getRowObject_(sheet, rowNumber);
  return {
    rowNumber: rowNumber,
    submittedAt: row.submittedAt || "",
    studentFullName: row.studentFullName || "",
    examId: row.examId || "ielts-full-001",
    reason: row.reason || "",
    organizationId: normalizeOrganizationId_(row.organizationId || ""),
    listening_json: row.listening_json || "",
    reading_json: row.reading_json || "",
    writing_json: row.writing_json || "",
    studentIdCode: row.studentIdCode || "",
    classroom: row.classroom || "",
    canonicalStudentName: row.canonicalStudentName || "",
    officialEmail: normalizeEmail_(row.officialEmail || ""),
  };
}
function appendSubmissionRow_(sheet, rowObject) {
  return appendRowObject_(
    sheet,
    {
      submittedAt: rowObject.submittedAt || "",
      studentFullName: rowObject.studentFullName || "",
      examId: rowObject.examId || "",
      reason: rowObject.reason || "",
      listening_json: rowObject.listening_json || "",
      reading_json: rowObject.reading_json || "",
      writing_json: rowObject.writing_json || "",
      organizationId: normalizeOrganizationId_(rowObject.organizationId || ""),
      studentIdCode: rowObject.studentIdCode || "",
      classroom: rowObject.classroom || "",
      canonicalStudentName: rowObject.canonicalStudentName || "",
      officialEmail: normalizeEmail_(rowObject.officialEmail || ""),
    },
    getSubmissionHeaders_(),
  );
}
function getObjectiveResultRowObject_(sheet, rowNumber) {
  const row = getRowObject_(sheet, rowNumber);
  return {
    rowNumber: rowNumber,
    submittedAt: row.submittedAt || "",
    studentFullName: row.studentFullName || "",
    examId: row.examId || "",
    reason: row.reason || "",
    organizationId: normalizeOrganizationId_(row.organizationId || ""),
    listeningTotal: row.listeningTotal || "",
    listeningBand: row.listeningBand || "",
    readingTotal: row.readingTotal || "",
    readingBand: row.readingBand || "",
    finalWritingBand: row.finalWritingBand || "",
    studentIdCode: row.studentIdCode || "",
    classroom: row.classroom || "",
    canonicalStudentName: row.canonicalStudentName || "",
    officialEmail: normalizeEmail_(row.officialEmail || ""),
  };
}
function appendObjectiveResultRow_(sheet, rowObject) {
  return appendRowObject_(
    sheet,
    {
      submittedAt: rowObject.submittedAt || "",
      studentFullName: rowObject.studentFullName || "",
      examId: rowObject.examId || "",
      reason: rowObject.reason || "",
      listeningTotal: rowObject.listeningTotal || "",
      listeningBand: rowObject.listeningBand || "",
      readingTotal: rowObject.readingTotal || "",
      readingBand: rowObject.readingBand || "",
      finalWritingBand: rowObject.finalWritingBand || "",
      organizationId: normalizeOrganizationId_(rowObject.organizationId || ""),
      studentIdCode: rowObject.studentIdCode || "",
      classroom: rowObject.classroom || "",
      canonicalStudentName: rowObject.canonicalStudentName || "",
      officialEmail: normalizeEmail_(rowObject.officialEmail || ""),
    },
    getObjectiveResultsHeaders_(),
  );
}
function findRowByFields_(sheet, fields) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const headerMap = getHeaderMap_(sheet);
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 1))
    .getDisplayValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var matches = true;
    Object.keys(fields || {}).forEach(function (key) {
      if (!matches) return;
      var columnIndex = headerMap[key];
      if (!columnIndex) {
        matches = false;
        return;
      }
      if (String(rows[i][columnIndex - 1] || "") !== String(fields[key] || ""))
        matches = false;
    });
    if (matches) return i + 2;
  }
  return 0;
}
function getSubmissionHeaders_() {
  return [
    "submittedAt",
    "studentFullName",
    "examId",
    "reason",
    "listening_json",
    "reading_json",
    "writing_json",
    "organizationId",
    "studentIdCode",
    "classroom",
    "canonicalStudentName",
    "officialEmail",
  ];
}
function getObjectiveResultsHeaders_() {
  return [
    "submittedAt",
    "studentFullName",
    "examId",
    "reason",
    "listeningTotal",
    "listeningBand",
    "readingTotal",
    "readingBand",
    "finalWritingBand",
    "organizationId",
    "studentIdCode",
    "classroom",
    "canonicalStudentName",
    "officialEmail",
  ];
}
function getSubmissionMetaHeaders_() {
  return [
    "submittedAt",
    "studentFullName",
    "examId",
    "reason",
    "studentEmail",
    "signInMethod",
    "emailSentAt",
    "emailSendStatus",
    "emailSendError",
    "organizationId",
    "studentIdCode",
    "classroom",
    "canonicalStudentName",
    "officialEmail",
  ];
}
function makeSubmissionKeyFromObject_(row) {
  return makeSubmissionKey_(
    row.submittedAt || "",
    row.studentFullName || "",
    row.examId || "",
    row.reason || "",
  );
}
function getOrCreateSubmissionMetaSheet_(ss) {
  let sh = ss.getSheetByName(SUBMISSION_META_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SUBMISSION_META_SHEET_NAME);
  ensureSheetHeaders_(sh, getSubmissionMetaHeaders_());
  sh.getRange(1, 1, 1, sh.getLastColumn())
    .setFontWeight("bold")
    .setBackground("#d9ead3");
  sh.setFrozenRows(1);
  return sh;
}
function upsertSubmissionMeta_(
  submittedAt,
  studentFullName,
  examId,
  reason,
  organizationId,
  studentEmail,
  signInMethod,
) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSubmissionMetaSheet_(ss);
  const foundRow = findSubmissionMetaRow_(
    submittedAt,
    studentFullName,
    examId,
    reason,
  );
  const current = foundRow ? getRowObject_(sh, foundRow) : {};
  const rowObject = {
    submittedAt: submittedAt || "",
    studentFullName: studentFullName || "",
    examId: examId || "",
    reason: reason || "",
    studentEmail: String(studentEmail || current.studentEmail || "")
      .trim()
      .toLowerCase(),
    signInMethod: String(signInMethod || current.signInMethod || "").trim(),
    emailSentAt: current.emailSentAt || "",
    emailSendStatus: current.emailSendStatus || "",
    emailSendError: current.emailSendError || "",
    organizationId: normalizeOrganizationId_(
      organizationId || current.organizationId || "",
    ),
    studentIdCode: current.studentIdCode || "",
    classroom: current.classroom || "",
    canonicalStudentName: current.canonicalStudentName || "",
    officialEmail: normalizeEmail_(current.officialEmail || ""),
  };
  return foundRow
    ? setRowObjectByHeaders_(
        sh,
        foundRow,
        rowObject,
        getSubmissionMetaHeaders_(),
      )
    : appendRowObject_(sh, rowObject, getSubmissionMetaHeaders_());
}
function findSubmissionMetaRow_(submittedAt, studentFullName, examId, reason) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SUBMISSION_META_SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return 0;
  return findRowByFields_(sh, {
    submittedAt: submittedAt || "",
    studentFullName: studentFullName || "",
    examId: examId || "",
    reason: reason || "",
  });
}
function buildSubmissionKeyRowMap_(sheet) {
  var map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  var rows = sheet
    .getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      Math.min(4, Math.max(sheet.getLastColumn(), 1)),
    )
    .getDisplayValues();
  for (var i = 0; i < rows.length; i++) {
    var key = makeSubmissionKey_(
      rows[i][0] || "",
      rows[i][1] || "",
      rows[i][2] || "",
      rows[i][3] || "",
    );
    if (key) map[key] = i + 2;
  }
  return map;
}
function getSubmissionMetaByKey_(submittedAt, studentFullName, examId, reason) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SUBMISSION_META_SHEET_NAME);
  if (!sh) return null;
  const row = findSubmissionMetaRow_(
    submittedAt,
    studentFullName,
    examId,
    reason,
  );
  if (!row) return null;
  return getRowObject_(sh, row);
}
function markSubmissionEmailStatus_(rowNumber, status, errorMessage) {
  if (!rowNumber) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSubmissionMetaSheet_(ss);
  const current = getRowObject_(sh, rowNumber);
  setRowObjectByHeaders_(
    sh,
    rowNumber,
    {
      submittedAt: current.submittedAt || "",
      studentFullName: current.studentFullName || "",
      examId: current.examId || "",
      reason: current.reason || "",
      studentEmail: current.studentEmail || "",
      signInMethod: current.signInMethod || "",
      emailSentAt: new Date().toISOString(),
      emailSendStatus: String(status || ""),
      emailSendError: String(errorMessage || ""),
      organizationId: normalizeOrganizationId_(current.organizationId || ""),
      studentIdCode: current.studentIdCode || "",
      classroom: current.classroom || "",
      canonicalStudentName: current.canonicalStudentName || "",
      officialEmail: normalizeEmail_(current.officialEmail || ""),
    },
    getSubmissionMetaHeaders_(),
  );
}
function escapeHtmlEmail_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function nl2br_(value) {
  return escapeHtmlEmail_(value || "").replace(/\n/g, "<br>");
}
function buildObjectiveReviewHtmlTable_(title, items) {
  const rows = Array.isArray(items) ? items : [];
  const body = rows
    .map((item) => {
      const markColor = item.mark ? "#1f845a" : "#c44536";
      const markText = item.mark ? "Correct" : "Wrong";
      return `      <tr>        <td style="padding:6px 8px;border:1px solid #ddd;">${item.q}</td>        <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtmlEmail_(item.student || "—")}</td>        <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtmlEmail_(item.correct || "—")}</td>        <td style="padding:6px 8px;border:1px solid #ddd;color:${markColor};font-weight:700;">${markText}</td>      </tr>    `;
    })
    .join("");
  return `    <h3 style="margin:24px 0 10px;">${title}</h3>    <table style="border-collapse:collapse;width:100%;font-size:14px;">      <thead>        <tr>          <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Q#</th>          <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Student</th>          <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Correct</th>          <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Mark</th>        </tr>      </thead>      <tbody>${body}</tbody>    </table>  `;
}
function sendStudentReportEmailForSubmissionRow_(submissionRow) {
  const result = buildStudentResultForSubmissionRow_(submissionRow);
  const meta = getSubmissionMetaByKey_(
    result.submittedAt,
    result.studentFullName,
    result.examId,
    result.reason,
  );
  var targetEmail = normalizeEmail_(
    (meta && meta.officialEmail) || (meta && meta.studentEmail) || "",
  );
  if (!meta || !targetEmail) {
    logSystem_("StudentEmail", "No student email found for submission", {
      submissionRow: submissionRow,
    });
    return { ok: false, sent: false, reason: "Missing student email" };
  }
  if (meta.emailSentAt)
    return { ok: true, sent: false, reason: "Already sent" };
  const objective = buildObjectiveAnswerDetailsForSubmissionRow_(submissionRow);
  const subject = `IELTS Mock Report - ${result.examId} - ${result.studentFullName}`;
  const htmlBody = `    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1b1f23;max-width:980px;margin:0 auto;">      <h1 style="margin-bottom:8px;">${escapeHtmlEmail_(result.studentFullName)}</h1>      <h2 style="margin-top:0;">Submission</h2>      <p>        <b>Email:</b> ${escapeHtmlEmail_(targetEmail)}<br>        <b>Student ID:</b> ${escapeHtmlEmail_(meta.studentIdCode || result.studentIdCode || "—")}<br>        <b>Classroom:</b> ${escapeHtmlEmail_(meta.classroom || result.classroom || "—")}<br>        <b>Test:</b> ${escapeHtmlEmail_(result.examId)}<br>        <b>Submitted:</b> ${escapeHtmlEmail_(result.submittedAt)}<br>        <b>Reason:</b> ${escapeHtmlEmail_(result.reason)}<br>        <b>Organization:</b> ${escapeHtmlEmail_(result.organizationId || DEFAULT_ORGANIZATION_ID)}      </p>      <h2>Scores</h2>      <p>        <b>Listening:</b> ${escapeHtmlEmail_(String(result.listeningTotal))} / 40 (Band ${escapeHtmlEmail_(String(result.listeningBand))})<br>        <b>Reading:</b> ${escapeHtmlEmail_(String(result.readingTotal))} / 40 (Band ${escapeHtmlEmail_(String(result.readingBand))})<br>        <b>Overall Writing:</b> Band ${escapeHtmlEmail_(String(result.finalWritingBand || ""))}<br>        <b>Writing words:</b> ${escapeHtmlEmail_(String(result.task1Words || 0))} / ${escapeHtmlEmail_(String(result.task2Words || 0))}      </p>      ${buildObjectiveReviewHtmlTable_("Listening answer review", objective.listening)}      ${buildObjectiveReviewHtmlTable_("Reading answer review", objective.reading)}      <h2 style="margin-top:28px;">Writing Task 1</h2>      <p><b>Band:</b> ${escapeHtmlEmail_(String(result.task1Band || ""))}</p>      <p><b>Breakdown:</b><br>${nl2br_(result.task1Breakdown || "")}</p>      <p><b>Essay</b><br>${nl2br_(result.writingTask1 || "")}</p>      <p><b>Feedback</b><br>${nl2br_(result.task1Feedback || "")}</p>      <h2 style="margin-top:28px;">Writing Task 2</h2>      <p><b>Band:</b> ${escapeHtmlEmail_(String(result.task2Band || ""))}</p>      <p><b>Breakdown:</b><br>${nl2br_(result.task2Breakdown || "")}</p>      <p><b>Essay</b><br>${nl2br_(result.writingTask2 || "")}</p>      <p><b>Feedback</b><br>${nl2br_(result.task2Feedback || "")}</p>      <h2 style="margin-top:28px;">Overall Writing Feedback</h2>      <p>${nl2br_(result.overallFeedback || "")}</p>    </div>  `;
  try {
    MailApp.sendEmail({
      to: meta.studentEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "IELTS Mock",
    });
    markSubmissionEmailStatus_(meta.rowNumber, "sent", "");
    return { ok: true, sent: true };
  } catch (err) {
    markSubmissionEmailStatus_(meta.rowNumber, "failed", String(err));
    logSystem_("StudentEmail", "Sending report failed", {
      submissionRow: submissionRow,
      email: meta.studentEmail,
      error: String(err),
    });
    return { ok: false, sent: false, error: String(err) };
  }
}
function sendAssignmentNotificationEmail_(payload) {
  payload = payload || {};
  const assignmentId = String(payload.assignmentId || "").trim();
  const assignmentTitle = String(payload.assignmentTitle || "New task").trim();
  const dueDate = String(payload.dueDate || "").trim();
  const assignmentLink = String(payload.assignmentLink || "https://ieltsmock.org").trim();
  const studentId = String(payload.studentId || "").trim();
  const studentName = String(payload.studentName || "Student").trim() || "Student";
  const toEmail = String(payload.toEmail || "")
    .trim()
    .toLowerCase();
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail);
  if (!toEmail || !emailOk) {
    return { ok: false, error: "Invalid recipient email", recipient: toEmail };
  }
  const subject = "New task assigned on ieltsmock.org";
  const body = [
    "Dear " + studentName + ",",
    "",
    "You have been assigned a task on ieltsmock.org.",
    "",
    "Task: " + assignmentTitle,
    dueDate ? "Due date: " + dueDate : "Due date: Not specified",
    "Use your Student ID: " + (studentId || "Not set"),
    "",
    "Log in to start it now.",
    "",
    assignmentLink,
  ].join("\n");
  try {
    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: body.replace(/\n/g, "<br>"),
      name: "IELTS Mock",
    });
    return {
      ok: true,
      provider: "apps_script_mailapp",
      recipient: toEmail,
      assignmentId: assignmentId,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "apps_script_mailapp",
      recipient: toEmail,
      assignmentId: assignmentId,
      error: String(err),
    };
  }
}
function hasRealWritingContent_(writingJson) {
  const obj = parseJsonSafe_(writingJson);
  if (!obj) return false;
  const answers = getAnswers_(obj);
  const task1 = String(answers.task1 || "").trim();
  const task2 = String(answers.task2 || "").trim();
  return Boolean(task1 || task2);
}
function getWritingAnswerText_(jsonText, taskKey) {
  const obj = parseJsonSafe_(jsonText);
  if (!obj) return "";
  const answers = getAnswers_(obj);
  if (String(taskKey) === "task1") return String(answers.task1 || "");
  if (String(taskKey) === "task2") return String(answers.task2 || "");
  return "";
}
function WRITING_WORDCOUNT(jsonText, taskKey) {
  const obj = parseJsonSafe_(jsonText);
  if (!obj) return "";
  const key = String(taskKey || "")
    .toLowerCase()
    .trim();
  const wcObj =
    obj.wordCount && typeof obj.wordCount === "object" ? obj.wordCount : {};
  const answers = getAnswers_(obj);
  if (key === "task1")
    return wcObj.task1 != null && wcObj.task1 !== ""
      ? wcObj.task1
      : countWords_(answers.task1);
  if (key === "task2")
    return wcObj.task2 != null && wcObj.task2 !== ""
      ? wcObj.task2
      : countWords_(answers.task2);
  return "";
}
function getWritingPromptLabel_(jsonText, taskKey) {
  const obj = parseJsonSafe_(jsonText);
  if (!obj) return String(taskKey) === "task1" ? "Task 1" : "Task 2";
  const prompts = getPrompts_(obj);
  if (String(taskKey) === "task1") {
    const promptText = String(prompts.task1Text || "").trim();
    const imageSrc = String(prompts.task1ImageSrc || "").trim();
    let label = "Task 1";
    if (promptText) label += "\n" + promptText;
    if (imageSrc) label += "\nGraph URL: " + imageSrc;
    return label;
  }
  if (String(taskKey) === "task2") {
    const promptText = String(prompts.task2Text || "").trim();
    let label = "Task 2";
    if (promptText) label += "\n" + promptText;
    return label;
  }
  return "";
}
/*********************** ANSWER MATCHING / SCORING************************/ function cleanBasic_(
  s,
) {
  return String(s || "")
    .replace(/[’‘]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
}
function cleanForCompare_(s) {
  const basic = cleanBasic_(s);
  if (!basic) return "";
  return basic.replace(/([A-Za-z])\.(?=\s|$)/g, "$1").replace(/\s*\/\s*/g, "/");
}
function isAllCapsAnswer_(s) {
  const t = cleanBasic_(s);
  return !!t && /[A-Za-z]/.test(t) && t === t.toUpperCase();
}
function splitTopLevelSlashAlternatives_(s) {
  s = cleanBasic_(s);
  if (!s) return [""];
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }
    if (ch === "/" && depth === 0) {
      parts.push(cleanBasic_(current));
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(cleanBasic_(current));
  return parts.filter(Boolean);
}
function expandParenthesesVariants_(text) {
  let variants = [cleanBasic_(text)];
  const parenRegex = /\(([^()]+)\)/;
  while (true) {
    let changed = false;
    const next = [];
    for (const v of variants) {
      const m = v.match(parenRegex);
      if (!m) {
        next.push(cleanBasic_(v));
        continue;
      }
      changed = true;
      const inside = cleanBasic_(m[1]);
      const before = v.slice(0, m.index);
      const after = v.slice(m.index + m[0].length);
      next.push(cleanBasic_(before + " " + after));
      inside
        .split("/")
        .map((x) => cleanBasic_(x))
        .filter(Boolean)
        .forEach((alt) => {
          next.push(cleanBasic_(before + " " + alt + " " + after));
        });
    }
    variants = Array.from(
      new Set(next.map((x) => cleanBasic_(x)).filter(Boolean)),
    );
    if (!changed) break;
  }
  return variants.length ? variants : [""];
}
function expandCorrectVariants_(correctRaw) {
  const s0 = cleanBasic_(correctRaw);
  if (!s0) return [""];
  const final = new Set();
  splitTopLevelSlashAlternatives_(s0).forEach((alt) => {
    expandParenthesesVariants_(alt).forEach((item) => {
      const cleaned = cleanBasic_(item);
      if (cleaned) final.add(cleaned);
    });
  });
  const extra = new Set();
  final.forEach((phrase) => {
    const tokens = cleanBasic_(phrase).split(" ").filter(Boolean);
    const optionsPerToken = tokens.map((tok) =>
      tok.includes("/") && !tok.includes("(") && !tok.includes(")")
        ? tok
            .split("/")
            .map((x) => cleanBasic_(x))
            .filter(Boolean)
        : [tok],
    );
    let acc = [""];
    optionsPerToken.forEach((opts) => {
      const tmp = [];
      acc.forEach((prefix) => {
        opts.forEach((opt) => tmp.push(cleanBasic_(prefix + " " + opt)));
      });
      acc = tmp;
    });
    acc.forEach((x) => {
      if (cleanBasic_(x)) extra.add(cleanBasic_(x));
    });
  });
  extra.forEach((x) => final.add(x));
  return Array.from(final);
}
function isAnswerCorrect_(studentRaw, correctRaw) {
  const student0 = cleanForCompare_(studentRaw);
  if (!student0) return false;
  const correctVariants =
    expandCorrectVariants_(correctRaw).map(cleanForCompare_);
  const studentIsOneLetter = /^[A-Za-z]$/.test(student0);
  if (studentIsOneLetter || isAllCapsAnswer_(studentRaw)) {
    const sLower = student0.toLowerCase();
    return correctVariants.some((c) => String(c).toLowerCase() === sLower);
  }
  return correctVariants.some((c) => c === student0);
}
function columnNumberToLetter_(num) {
  let s = "";
  while (num > 0) {
    const mod = (num - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    num = Math.floor((num - mod) / 26);
  }
  return s;
}
function getAnswerKeyColumnsFromExamId_(examId) {
  const m = String(examId || "").match(/(\d+)$/);
  const testNum = m ? Number(m[1]) : 1;
  const listeningColNum = (testNum - 1) * 2 + 1;
  return {
    listeningCol: columnNumberToLetter_(listeningColNum),
    readingCol: columnNumberToLetter_(listeningColNum + 1),
  };
}
function getAnswerKeyValuesFromExamId_(ss, examId) {
  const sh = ss.getSheetByName(ANSWER_KEY_SHEET_NAME);
  if (!sh) throw new Error("Sheet not found: " + ANSWER_KEY_SHEET_NAME);
  const cols = getAnswerKeyColumnsFromExamId_(examId || "ielts-full-001");
  return {
    listening: sh
      .getRange(cols.listeningCol + "1:" + cols.listeningCol + "40")
      .getDisplayValues(),
    reading: sh
      .getRange(cols.readingCol + "1:" + cols.readingCol + "40")
      .getDisplayValues(),
  };
}
function getKeyRangeForExam_(examId, section) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(ANSWER_KEY_SHEET_NAME);
  if (!sh) throw new Error("Sheet not found: " + ANSWER_KEY_SHEET_NAME);
  const cols = getAnswerKeyColumnsFromExamId_(examId || "ielts-full-001");
  const col =
    String(section).toLowerCase() === "reading"
      ? cols.readingCol
      : cols.listeningCol;
  return sh.getRange(col + "1:" + col + "40").getDisplayValues();
}
function TOTAL_CORRECT(jsonText, keyRange, maxQ) {
  maxQ = Number(maxQ || 40);
  const obj = parseJsonSafe_(jsonText);
  if (!obj) return 0;
  const answers = getAnswers_(obj);
  const keyArr = Array.isArray(keyRange) ? keyRange : [[keyRange]];
  let count = 0;
  for (let q = 1; q <= maxQ; q++) {
    const student = answers[q] !== undefined ? String(answers[q]) : "";
    const correct =
      keyArr[q - 1] && keyArr[q - 1][0] !== undefined
        ? String(keyArr[q - 1][0])
        : "";
    if (isAnswerCorrect_(student, correct)) count++;
  }
  return count;
}
function LISTENING_TOTAL(jsonText, keyRange, maxQ) {
  return TOTAL_CORRECT(jsonText, keyRange, maxQ || 40);
}
function listeningBandFromCorrect_(correct) {
  correct = Number(correct || 0);
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 32) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 26) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 18) return 5.5;
  if (correct >= 16) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 11) return 4.0;
  if (correct >= 8) return 3.5;
  if (correct >= 6) return 3.0;
  if (correct >= 4) return 2.5;
  return 0.0;
}
function readingBandFromCorrect_(correct) {
  correct = Number(correct || 0);
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 19) return 5.5;
  if (correct >= 15) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 8) return 3.5;
  if (correct >= 6) return 3.0;
  if (correct >= 4) return 2.5;
  return 0.0;
}
function LR_REPORT(
  studentNameCell,
  listeningJson,
  readingJson,
  listeningKeyRange,
  readingKeyRange,
  maxQ,
) {
  maxQ = Number(maxQ || 40);
  const studentName = normStrict_(studentNameCell) || "(NO NAME)";
  const out = [];
  out.push(["Student: " + studentName, "", "", "", "", "", "", "", ""]);
  out.push(["LISTENING", "", "", "", "", "READING", "", "", ""]);
  out.push([
    "Q#",
    "Student",
    "Correct",
    "Mark",
    "",
    "Q#",
    "Student",
    "Correct",
    "Mark",
  ]);
  const listenAns = parseJsonSafe_(listeningJson)
    ? getAnswers_(parseJsonSafe_(listeningJson))
    : {};
  const readAns = parseJsonSafe_(readingJson)
    ? getAnswers_(parseJsonSafe_(readingJson))
    : {};
  const listenKeys = Array.isArray(listeningKeyRange)
    ? listeningKeyRange
    : [[listeningKeyRange]];
  const readKeys = Array.isArray(readingKeyRange)
    ? readingKeyRange
    : [[readingKeyRange]];
  let listenCorrect = 0;
  let readCorrect = 0;
  for (let q = 1; q <= maxQ; q++) {
    const lStudent = listenAns[q] !== undefined ? String(listenAns[q]) : "";
    const lCorrect =
      listenKeys[q - 1] && listenKeys[q - 1][0] !== undefined
        ? String(listenKeys[q - 1][0])
        : "";
    const lOk = isAnswerCorrect_(lStudent, lCorrect);
    if (lOk) listenCorrect++;
    const rStudent = readAns[q] !== undefined ? String(readAns[q]) : "";
    const rCorrect =
      readKeys[q - 1] && readKeys[q - 1][0] !== undefined
        ? String(readKeys[q - 1][0])
        : "";
    const rOk = isAnswerCorrect_(rStudent, rCorrect);
    if (rOk) readCorrect++;
    out.push([
      q,
      lStudent,
      lCorrect,
      lOk ? "✅" : "❌",
      "",
      q,
      rStudent,
      rCorrect,
      rOk ? "✅" : "❌",
    ]);
  }
  out.push([
    "TOTAL",
    listenCorrect,
    "out of " + maxQ,
    "",
    "",
    "TOTAL",
    readCorrect,
    "out of " + maxQ,
    "",
  ]);
  out.push([
    "BAND",
    listeningBandFromCorrect_(listenCorrect),
    "",
    "",
    "",
    "BAND",
    readingBandFromCorrect_(readCorrect),
    "",
    "",
  ]);
  return out;
}
/*********************** SHEET HELPERS************************/ function ensureSubmissionHeader_(
  sheet,
) {
  ensureSheetHeaders_(sheet, getSubmissionHeaders_());
}
function getOrCreateObjectiveResultsSheet_(ss) {
  let sh = ss.getSheetByName(OBJECTIVE_RESULTS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(OBJECTIVE_RESULTS_SHEET_NAME);
  return sh;
}
function writeObjectiveResultsHeader_(sh) {
  const headers = ensureSheetHeaders_(sh, getObjectiveResultsHeaders_());
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#d9ead3")
    .setHorizontalAlignment("center");
}
function formatObjectiveResultsSheet_(sh) {
  sh.setFrozenRows(1);
  [170, 220, 130, 180, 130, 110, 110, 110, 110, 130].forEach((w, i) =>
    sh.setColumnWidth(i + 1, w),
  );
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow > 1 && lastCol > 0)
    sh.getRange(2, 1, lastRow - 1, lastCol)
      .setVerticalAlignment("middle")
      .setWrap(true);
}
function getOrCreateDetailedResultsSheet_(ss) {
  let sh = ss.getSheetByName(DETAILED_RESULTS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(DETAILED_RESULTS_SHEET_NAME);
  return sh;
}
function formatDetailedBlock_(sheet, startRow) {
  sheet
    .getRange(startRow, 1, DETAILED_BLOCK_HEIGHT, DETAILED_BLOCK_WIDTH)
    .setWrap(true)
    .setVerticalAlignment("top");
  sheet
    .getRange(startRow, 1, 1, DETAILED_BLOCK_WIDTH)
    .setFontWeight("bold")
    .setBackground("#fff2cc");
  sheet
    .getRange(startRow + 1, 1, 2, DETAILED_BLOCK_WIDTH)
    .setFontWeight("bold")
    .setBackground("#d9ead3");
  [70, 180, 180, 90, 30, 70, 180, 180, 90].forEach((w, i) =>
    sheet.setColumnWidth(i + 1, w),
  );
}
/*********************** WRITING GRADING************************/ function getOpenAIApiKey_() {
  const key =
    PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is missing in Script Properties.");
  return key;
}
function buildWritingRubricPrompt_(
  task1Prompt,
  task1ImageSrc,
  task1Essay,
  task2Prompt,
  task2Essay,
) {
  const hasTask1 = Boolean(String(task1Essay || "").trim());
  const hasTask2 = Boolean(String(task2Essay || "").trim());
  const taskScope = hasTask1 && hasTask2
    ? "BOTH IELTS Writing Task 1 and Task 2 responses"
    : hasTask1
    ? "the IELTS Writing Task 1 response only (Task 2 was not submitted)"
    : "the IELTS Writing Task 2 response only (Task 1 was not submitted)";
  return [
    "You are a highly experienced IELTS Writing examiner trained to apply the official IELTS band descriptors accurately and realistically.",
    "",
    `Your task is to evaluate ${taskScope}.`,
    "",
    "You must behave like a real IELTS examiner: balanced, practical, evidence-based, and focused on communication rather than perfection.",
    "",
    "GENERAL EXAMINER APPROACH",
    "- Follow official IELTS band descriptors, but apply them with real examiner judgment.",
    "- Judge what the candidate CAN do, not only what they cannot do.",
    "- Focus on overall effectiveness of communication.",
    "- Do NOT expect perfection, even at higher bands.",
    "- Minor or occasional errors should NOT significantly reduce scores if meaning remains clear.",
    "- Evaluate patterns, not isolated mistakes.",
    "",
    "LENIENCY CALIBRATION",
    "- IELTS examiners are not harsh graders.",
    "- If the writing is generally clear and understandable, it should usually not fall below Band 6.",
    "- If ideas are developed and mostly clear, it can reach Band 6.5–7 even with noticeable language errors.",
    "- Band 7 does NOT require near-perfect grammar; it requires effective communication, sufficient development, and reasonable control.",
    "- Always ask: 'Would a real examiner penalize this heavily?' If not, do not reduce the score.",
    "",
    "REAL STUDENT STANDARD",
    "- Most IELTS candidates are non-native speakers.",
    "- Do NOT compare responses to native-level writing.",
    "- Evaluate based on IELTS expectations, not ideal academic prose.",
    "",
    "SCORING PROCESS",
    "- Evaluate each criterion independently from the script itself.",
    "- Do NOT decide the overall band first.",
    "- First assign criterion scores, then calculate the task overall band.",
    "- Use 0.5 band increments where appropriate.",
    "",
    "SCORE SEPARATION CALIBRATION (CRITICAL)",
    "- Do NOT begin with an estimated overall band and then fit all criteria around it.",
    "- Score each criterion from fresh evidence in the script.",
    "- Do NOT cluster all four criteria around the same band unless the evidence genuinely supports that.",
    "- In real IELTS marking, one criterion is often 0.5 to 1 band higher or lower than another.",
    "- Task Response / Task Achievement is often higher than Grammar or Lexical Resource when ideas are clear but language control is weaker.",
    "- Lexical Resource and Grammatical Range and Accuracy should NOT automatically receive the same score.",
    "- Coherence and Cohesion may be stronger than Grammar when organisation is clear but sentence control is inconsistent.",
    "- Similar scores are allowed only when there is clear evidence that performance is genuinely balanced.",
    "- Before finalising scores, identify the strongest criterion and the weakest criterion for each task.",
    "- If all four criteria are the same, or three are nearly identical, re-check whether this happened because of real evidence or because of score anchoring.",
    "- A script may appear to be an overall Band 6.5 performance while still containing criterion scores such as 7 / 6.5 / 6 / 6 or 7 / 6 / 6.5 / 6.",
    "",
    "BAND DECISION GUIDANCE",
    "- If a response sits between two bands, choose the higher band if most features of that band are present.",
    "- Only choose the lower band if clear weaknesses prevent meeting the higher band.",
    "",
    "WORD COUNT RULES",
    "- Task 1 minimum: 150 words.",
    "- Task 2 minimum: 250 words.",
    "- If slightly under length but still well-developed, do NOT heavily penalize.",
    "- Only reduce Task Achievement / Task Response when lack of length clearly limits content development.",
    "",
    "TASK 1 GUIDANCE",
    "- Check for a clear overview. It does not need to be perfect to support a good score.",
    "- Check whether key features are selected and compared.",
    "- Minor omissions should not prevent a good score if the main trends are covered.",
    "",
    "TASK 2 GUIDANCE",
    "- Identify the question type correctly.",
    "- Focus on clarity of position, development of ideas, and relevance to the exact question.",
    "- Strong ideas and clear progression can support a higher Task Response score even if language control is weaker.",
    "",
    "LANGUAGE SCORING",
    "Lexical Resource:",
    "- Reward range, flexibility, and appropriate topic vocabulary.",
    "- Occasional inaccurate word choice or awkward collocation is acceptable.",
    "- Reduce the score only when vocabulary problems are frequent, repetitive, or reduce precision.",
    "",
    "Grammatical Range and Accuracy:",
    "- Focus on range and overall control, not perfection.",
    "- Occasional sentence-level mistakes are acceptable, even at Band 7.",
    "- Reduce the score only when grammatical problems are frequent, persistent, or reduce clarity.",
    "",
    "ADVICE RULES",
    "- band7_advice: give practical advice to reach Band 7 if the current level is below Band 7.",
    "- band8_advice: give practical advice to move toward Band 8, even if the current level is already around Band 7.",
    "- Advice must be specific and based only on real weaknesses in the script.",
    "",
    "ERROR ANALYSIS RULES",
    "- Include only real errors from the text.",
    "- Do NOT invent errors.",
    "- Keep corrections concise and accurate.",
    "",
    "OUTPUT RULES",
    "- Return ONLY valid JSON.",
    "- Do NOT include explanations outside JSON.",
    ...(!(hasTask1 && hasTask2) ? [
      "",
      "SINGLE-TASK SUBMISSION",
      hasTask1
        ? "- Only Task 1 was submitted. Set final_writing_band = task1.overall. Fill task2 with all-zero scores and empty strings."
        : "- Only Task 2 was submitted. Set final_writing_band = task2.overall. Fill task1 with all-zero scores and empty strings.",
    ] : []),
    "",
    "Return EXACTLY in this format:",
    "{",
    '  "task1": {',
    '    "analysis": "",',
    '    "TA_justification": "",',
    '    "CC_justification": "",',
    '    "LR_justification": "",',
    '    "GRA_justification": "",',
    '    "strongest_criterion": "",',
    '    "weakest_criterion": "",',
    '    "TA": 0,',
    '    "CC": 0,',
    '    "LR": 0,',
    '    "GRA": 0,',
    '    "overall": 0,',
    '    "strengths": [],',
    '    "weaknesses": []',
    "  },",
    '  "task2": {',
    '    "analysis": "",',
    '    "question_type": "",',
    '    "TR_justification": "",',
    '    "CC_justification": "",',
    '    "LR_justification": "",',
    '    "GRA_justification": "",',
    '    "strongest_criterion": "",',
    '    "weakest_criterion": "",',
    '    "TR": 0,',
    '    "CC": 0,',
    '    "LR": 0,',
    '    "GRA": 0,',
    '    "overall": 0,',
    '    "strengths": [],',
    '    "weaknesses": []',
    "  },",
    '  "final_writing_band": 0,',
    '  "cefr_estimate": "",',
    '  "template_detected": false,',
    '  "main_issues": [],',
    '  "error_analysis": [{"original": "", "corrected": "", "issue_type": ""}],',
    '  "band7_advice": [],',
    '  "band8_advice": []',
    "}",
    "",
    "TASK 1 PROMPT:",
    task1Prompt || "",
    "",
    "TASK 1 GRAPH URL:",
    task1ImageSrc || "",
    "",
    "TASK 1 RESPONSE:",
    task1Essay || "",
    "",
    "TASK 2 PROMPT:",
    task2Prompt || "",
    "",
    "TASK 2 RESPONSE:",
    task2Essay || "",
  ].join("\n");
}
function extractResponseText_(responseJson) {
  if (!responseJson) return "";
  if (
    typeof responseJson.output_text === "string" &&
    responseJson.output_text.trim()
  ) {
    return responseJson.output_text.trim();
  }
  if (typeof responseJson.text === "string" && responseJson.text.trim()) {
    return responseJson.text.trim();
  }
  const out = responseJson.output;
  if (Array.isArray(out)) {
    const chunks = [];
    out.forEach((item) => {
      if (!item) return;
      if (typeof item.text === "string" && item.text.trim()) {
        chunks.push(item.text.trim());
      }
      const content = item.content;
      if (!Array.isArray(content)) return;
      content.forEach((part) => {
        if (!part) return;
        if (typeof part.text === "string" && part.text.trim())
          chunks.push(part.text.trim());
        if (typeof part.output_text === "string" && part.output_text.trim())
          chunks.push(part.output_text.trim());
      });
    });
    if (chunks.length) return chunks.join("\n").trim();
  }
  return "";
}
function extractFirstJsonObject_(text) {
  const s = String(text || "").trim();
  if (!s) throw new Error("Model returned empty text.");
  try {
    return JSON.parse(s);
  } catch (e) {}
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(s.slice(start, end + 1));
  }
  throw new Error(
    "Could not find valid JSON in model response: " + s.slice(0, 1500),
  );
}
function normalizeWritingResult_(raw) {
  raw = raw || {};
  const task1 = raw.task1 || {};
  const task2 = raw.task2 || {};

  function num(v) {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    return isNaN(n) ? "" : n;
  }
  // IELTS band scores must be on 0.5 increments (0, 0.5, 1 … 9).
  // Round any raw AI value (e.g. 6.25 → 6.5) before writing to the sheet.
  function band(v) {
    const n = num(v);
    if (n === "") return "";
    return Math.round(n * 2) / 2;
  }
  function arr(v) {
    if (Array.isArray(v)) return v.map(x => String(x || "").trim()).filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
  }
  function str(v) {
    return String(v || "").trim();
  }

  return {
    task1: {
      overall: band(task1.overall),
      TA: band(task1.TA != null ? task1.TA : task1.taskAchievement),
      CC: band(task1.CC),
      LR: band(task1.LR),
      GRA: band(task1.GRA),
      analysis: str(task1.analysis),
      strengths: arr(task1.strengths),
      weaknesses: arr(task1.weaknesses),
    },
    task2: {
      overall: band(task2.overall),
      TR: band(task2.TR != null ? task2.TR : task2.taskResponse),
      CC: band(task2.CC),
      LR: band(task2.LR),
      GRA: band(task2.GRA),
      analysis: str(task2.analysis),
      strengths: arr(task2.strengths),
      weaknesses: arr(task2.weaknesses),
    },
    final_writing_band: band(raw.final_writing_band),
    cefr_estimate: str(raw.cefr_estimate),
    template_detected: raw.template_detected === true,
    main_issues: arr(raw.main_issues),
    band7_advice: arr(raw.band7_advice),
    band8_advice: arr(raw.band8_advice),
  };
}
function callOpenAIIELTS_(writingJson) {
  const apiKey = getOpenAIApiKey_();
  const obj = parseJsonSafe_(writingJson);
  if (!obj) throw new Error("Invalid writing JSON");
  const prompts = getPrompts_(obj);
  const answers = getAnswers_(obj);
  const task1Prompt = String(prompts.task1Text || "").trim();
  const task1ImageSrc = String(prompts.task1ImageSrc || "").trim();
  const task2Prompt = String(prompts.task2Text || "").trim();
  const task1Essay = String(answers.task1 || "").trim();
  const task2Essay = String(answers.task2 || "").trim();
  const prompt = buildWritingRubricPrompt_(
    task1Prompt,
    task1ImageSrc,
    task1Essay,
    task2Prompt,
    task2Essay,
  );
  const payloads = [];
  const models =
    Array.isArray(OPENAI_MODELS_FOR_WRITING) && OPENAI_MODELS_FOR_WRITING.length
      ? OPENAI_MODELS_FOR_WRITING
      : ["gpt-5.4"];
  models.forEach((model) => {
    payloads.push({
      label: model + " / simple-input",
      payload: { model: model, input: prompt },
    });
    payloads.push({
      label: model + " / messages-input",
      payload: {
        model: model,
        input: [
          { role: "user", content: [{ type: "input_text", text: prompt }] },
        ],
      },
    });
  });
  let lastErr = "";
  for (let i = 0; i < payloads.length; i++) {
    const item = payloads[i];
    try {
      const response = UrlFetchApp.fetch(OPENAI_BASE_URL, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + apiKey },
        payload: JSON.stringify(item.payload),
        muteHttpExceptions: true,
      });
      const code = response.getResponseCode();
      const body = response.getContentText();
      if (code < 200 || code >= 300) {
        throw new Error(
          "OpenAI API error " + code + " [" + item.label + "]: " + body,
        );
      }
      let parsedResponse = null;
      try {
        parsedResponse = JSON.parse(body);
      } catch (e) {
        throw new Error(
          "OpenAI returned non-JSON body [" + item.label + "]: " + body,
        );
      }
      const rawText = extractResponseText_(parsedResponse);
      if (!rawText) {
        throw new Error(
          "OpenAI returned no usable text [" + item.label + "]: " + body,
        );
      }
      const parsedJson = extractFirstJsonObject_(rawText);
      return normalizeWritingResult_(parsedJson);
    } catch (err) {
      lastErr = String(err);
      logSystem_("OpenAI", "Model attempt failed", {
        label: item.label,
        error: String(err),
      });
    }
  }
  throw new Error(lastErr || "All OpenAI model attempts failed.");
}
function getOrCreateWritingSheet_(ss) {
  let sh = ss.getSheetByName(WRITING_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(WRITING_SHEET_NAME);
  ensureSheetHeaders_(sh, [
    "Essay Text / Name",
    "Prompt",
    "Type",
    "Band",
    "Score Breakdown",
    "Feedback",
    "organizationId",
  ]);
  sh.getRange(1, 1, 1, sh.getLastColumn())
    .setFontWeight("bold")
    .setBackground("#d9ead3");
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 900);
  sh.setColumnWidth(2, 320);
  sh.setColumnWidth(3, 140);
  sh.setColumnWidth(4, 100);
  sh.setColumnWidth(5, 600);
  sh.setColumnWidth(6, 700);
  sh.setColumnWidth(7, 140);
  return sh;
}
function findWritingBlockGlobal_(ss, studentName, task1Text, task2Text) {
  const empty = {
    task1Band: "", task1Breakdown: "", task1Feedback: "",
    task2Band: "", task2Breakdown: "", task2Feedback: "",
    finalWritingBand: "", overallFeedback: "",
  };

  // ── Try to serve the Writing-sheet rows from CacheService ──
  const cache = CacheService.getScriptCache();
  const CACHE_KEY = "writing_sheet_rows_v1";
  let writingValues = null;
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    try { writingValues = JSON.parse(cached); } catch (e) { writingValues = null; }
  }
  if (!writingValues) {
    const writingSheet = ss.getSheetByName(WRITING_SHEET_NAME);
    if (!writingSheet || writingSheet.getLastRow() <= 1) return empty;
    writingValues = writingSheet
      .getRange(1, 1, writingSheet.getLastRow(), 7)
      .getDisplayValues();
    try { cache.put(CACHE_KEY, JSON.stringify(writingValues), 300); } catch (e) {}
  }

  const targetName = String(studentName || "").trim();
  const targetTask1 = String(task1Text || "").trim();
  const targetTask2 = String(task2Text || "").trim();
  for (let i = 0; i < writingValues.length; i++) {
    const row = writingValues[i];
    if (String(row[0] || "").trim() === targetName && String(row[1] || "").trim() === "Name") {
      const r1 = writingValues[i + 1] || [];
      const r2 = writingValues[i + 2] || [];
      const r3 = writingValues[i + 3] || [];
      if (String(r1[0] || "").trim() === targetTask1 && String(r2[0] || "").trim() === targetTask2) {
        return {
          task1Band: r1[3] || "", task1Breakdown: r1[4] || "", task1Feedback: r1[5] || "",
          task2Band: r2[3] || "", task2Breakdown: r2[4] || "", task2Feedback: r2[5] || "",
          finalWritingBand: r3[3] || "", overallFeedback: r3[5] || "",
        };
      }
    }
  }
  return empty;
}
function isSubmissionAlreadyGraded_(ss, submissionRow) {
  const src = ss.getSheetByName(SHEET_NAME);
  const writingSheet = ss.getSheetByName(WRITING_SHEET_NAME);
  if (!src || !writingSheet || writingSheet.getLastRow() <= 1) return false;
  const row = getSubmissionRowObject_(src, submissionRow);
  const studentFullName = row.studentFullName || "";
  const writingJson = row.writing_json || "";
  if (!writingJson) return false;
  const task1Text = String(
    getWritingAnswerText_(writingJson, "task1") || "",
  ).trim();
  const task2Text = String(
    getWritingAnswerText_(writingJson, "task2") || "",
  ).trim();
  const found = findWritingBlockGlobal_(
    ss,
    studentFullName,
    task1Text,
    task2Text,
  );
  return String(found.finalWritingBand || "").trim() !== "";
}
function processNewWritingSubmission_(submissionRow) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const src = ss.getSheetByName(SHEET_NAME);
  if (!src) throw new Error("Sheet not found: " + SHEET_NAME);
  const writingSheet = getOrCreateWritingSheet_(ss);
  const row = getSubmissionRowObject_(src, submissionRow);
  const studentFullName = row.studentFullName || "";
  const writingJson = row.writing_json || "";
  if (!writingJson || !hasRealWritingContent_(writingJson)) return null;
  const task1Text = getWritingAnswerText_(writingJson, "task1");
  const task2Text = getWritingAnswerText_(writingJson, "task2");
  if (isSubmissionAlreadyGraded_(ss, submissionRow)) {
    return findWritingBlockGlobal_(ss, studentFullName, task1Text, task2Text);
  }
  const result = callOpenAIIELTS_(writingJson);
  const t1 = result.task1 || {};
  const t2 = result.task2 || {};
  const hasTask1Text = Boolean(String(task1Text || "").trim());
  const hasTask2Text = Boolean(String(task2Text || "").trim());
  /* Single-task override: ignore AI's final_writing_band when only one task was submitted
     and use that task's own overall band instead. */
  if (hasTask1Text && !hasTask2Text && t1.overall !== "" && t1.overall != null) {
    result.final_writing_band = t1.overall;
  } else if (!hasTask1Text && hasTask2Text && t2.overall !== "" && t2.overall != null) {
    result.final_writing_band = t2.overall;
  }
  const t1Breakdown =
    "TA: " +
    (t1.TA ?? "") +
    "\nCC: " +
    (t1.CC ?? "") +
    "\nLR: " +
    (t1.LR ?? "") +
    "\nGRA: " +
    (t1.GRA ?? "");
  const t2Breakdown =
    "TR: " +
    (t2.TR ?? "") +
    "\nCC: " +
    (t2.CC ?? "") +
    "\nLR: " +
    (t2.LR ?? "") +
    "\nGRA: " +
    (t2.GRA ?? "");
  const t1Feedback =
    "Analysis:\n" +
    (t1.analysis || "") +
    "\n\nStrengths:\n• " +
    ((t1.strengths || []).join("\n• ") || "") +
    "\n\nWeaknesses:\n• " +
    ((t1.weaknesses || []).join("\n• ") || "");
  const t2Feedback =
    "Analysis:\n" +
    (t2.analysis || "") +
    "\n\nStrengths:\n• " +
    ((t2.strengths || []).join("\n• ") || "") +
    "\n\nWeaknesses:\n• " +
    ((t2.weaknesses || []).join("\n• ") || "");
  const overallFeedback =
    "CEFR Level: " +
    (result.cefr_estimate || "") +
    "\n\nTemplate detected: " +
    (result.template_detected ? "Yes" : "No") +
    "\n\nMain Issues:\n• " +
    ((result.main_issues || []).join("\n• ") || "") +
    "\n\nBand 7 Advice:\n• " +
    ((result.band7_advice || []).join("\n• ") || "") +
    "\n\nBand 8 Advice:\n• " +
    ((result.band8_advice || []).join("\n• ") || "");
  writingSheet.appendRow([
    studentFullName,
    "Name",
    "",
    "",
    "",
    "",
    normalizeOrganizationId_(row.organizationId || ""),
  ]);
  writingSheet.appendRow([
    task1Text,
    row.examId || "",
    "Task 1",
    t1.overall || "",
    t1Breakdown,
    t1Feedback,
    normalizeOrganizationId_(row.organizationId || ""),
  ]);
  writingSheet.appendRow([
    task2Text,
    row.examId || "",
    "Task 2",
    t2.overall || "",
    t2Breakdown,
    t2Feedback,
    normalizeOrganizationId_(row.organizationId || ""),
  ]);
  writingSheet.appendRow([
    "Overall Writing",
    row.examId || "",
    "Overall",
    result.final_writing_band || "",
    "",
    overallFeedback,
    normalizeOrganizationId_(row.organizationId || ""),
  ]);
  writingSheet
    .getRange(Math.max(1, writingSheet.getLastRow() - 3), 1, 4, 7)
    .setWrap(true)
    .setVerticalAlignment("top");
  SpreadsheetApp.flush();
  return {
    task1Band: t1.overall || "",
    task1Breakdown: t1Breakdown,
    task1Feedback: t1Feedback,
    task2Band: t2.overall || "",
    task2Breakdown: t2Breakdown,
    task2Feedback: t2Feedback,
    finalWritingBand: result.final_writing_band || "",
    overallFeedback: overallFeedback,
  };
}
function tryGradeSubmissionNow_(rowNumber) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || !rowNumber)
    return { ok: false, graded: false, error: "Submission row not found" };
  const row = getSubmissionRowObject_(sh, rowNumber);
  const writingJson = row.writing_json || "";
  if (!hasRealWritingContent_(writingJson)) {
    upsertObjectiveResultRow_(rowNumber);
    ensureDetailedResultBlock_(rowNumber);
    SpreadsheetApp.flush();
    try { syncSubmissionToSupabase_(rowNumber); } catch (err) {
      logSystem_("supabaseSync", "live sync failed (no writing)", { row: rowNumber, error: String(err) });
    }
    return { ok: true, graded: false, reason: "No writing content" };
  }
  if (isSubmissionAlreadyGraded_(ss, rowNumber)) {
    upsertObjectiveResultRow_(rowNumber);
    ensureDetailedResultBlock_(rowNumber);
    SpreadsheetApp.flush();
    try { syncSubmissionToSupabase_(rowNumber); } catch (err) {
      logSystem_("supabaseSync", "live sync failed (already graded)", { row: rowNumber, error: String(err) });
    }
    const existing = buildStudentResultForSubmissionRow_(rowNumber);
    return {
      ok: true,
      graded: true,
      reason: "Already graded",
      finalWritingBand: existing.finalWritingBand || "",
    };
  }
  const writingMeta = processNewWritingSubmission_(rowNumber);
  upsertObjectiveResultRow_(rowNumber);
  ensureDetailedResultBlock_(rowNumber);
  SpreadsheetApp.flush();
  try {
    syncSubmissionToSupabase_(rowNumber);
  } catch (err) {
    logSystem_("supabaseSync", "live sync failed", {
      row: rowNumber,
      error: String(err),
    });
  }
  return {
    ok: true,
    graded: true,
    finalWritingBand: writingMeta ? writingMeta.finalWritingBand : "",
  };
}
/*********************** RESULT BUILDERS************************/ function buildWritingOverallBandMap_(
  ss,
) {
  const writingSheet = ss.getSheetByName(WRITING_SHEET_NAME);
  const map = {};
  if (!writingSheet || writingSheet.getLastRow() <= 1) return map;
  const values = writingSheet
    .getRange(1, 1, writingSheet.getLastRow(), 7)
    .getDisplayValues();
  /* Off-by-one fix: last row accessed is values[i+2], so bound is length-3 not length-4.
     The old bound caused the most-recently-graded student to always be missed. */
  for (let i = 1; i <= values.length - 3; i++) {
    const nameRow = values[i - 1];
    const task1Row = values[i];
    const task2Row = values[i + 1];
    const overallRow = values[i + 2];
    const studentName = String(nameRow[0] || "").trim();
    const marker = String(nameRow[1] || "").trim();
    if (!studentName || marker !== "Name") continue;
    const key = [
      studentName,
      String(task1Row[0] || "").trim(),
      String(task2Row[0] || "").trim(),
    ].join(" || ");
    map[key] = String(overallRow[3] || "").trim();
  }
  return map;
}
function buildObjectiveResultRow_(rowValues, ss, writingBandMap) {
  writingBandMap = writingBandMap || {};
  const submittedAt = rowValues[0] || "";
  const studentFullName = rowValues[1] || "";
  const examId = rowValues[2] || "ielts-full-001";
  const reason = rowValues[3] || "";
  const listeningJson = rowValues[4] || "";
  const readingJson = rowValues[5] || "";
  const writingJson = rowValues[6] || "";
  const organizationId = normalizeOrganizationId_(rowValues[7] || "");
  const studentIdCode = String(rowValues[8] || "").trim();
  const classroom = String(rowValues[9] || "").trim();
  const canonicalStudentName = String(rowValues[10] || "").trim();
  const officialEmail = normalizeEmail_(rowValues[11] || "");
  const keys = getAnswerKeyValuesFromExamId_(ss, examId);
  const listeningTotal = LISTENING_TOTAL(listeningJson, keys.listening, 40);
  const readingTotal = TOTAL_CORRECT(readingJson, keys.reading, 40);
  const listeningBand = listeningBandFromCorrect_(listeningTotal);
  const readingBand = readingBandFromCorrect_(readingTotal);
  const writingKey = [
    String(studentFullName || "").trim(),
    String(getWritingAnswerText_(writingJson, "task1") || "").trim(),
    String(getWritingAnswerText_(writingJson, "task2") || "").trim(),
  ].join(" || ");
  var resolvedIdentity = resolveStudentIdentity_(
    studentFullName,
    officialEmail,
    studentIdCode,
    organizationId,
  );
  return [
    submittedAt,
    studentFullName,
    examId,
    reason,
    listeningTotal,
    listeningBand,
    readingTotal,
    readingBand,
    writingBandMap[writingKey] || "",
    organizationId,
    (resolvedIdentity && resolvedIdentity.studentIdCode) || studentIdCode || "",
    (resolvedIdentity && resolvedIdentity.classroom) || classroom || "",
    (resolvedIdentity && resolvedIdentity.canonicalStudentName) ||
      canonicalStudentName ||
      "",
    (resolvedIdentity && resolvedIdentity.officialEmail) || officialEmail || "",
  ];
}
function upsertObjectiveResultRow_(submissionRow) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const src = getSubmissionSheet_(ss);
  const out = getOrCreateObjectiveResultsSheet_(ss);
  if (out.getLastRow() === 0) writeObjectiveResultsHeader_(out);
  const submission = getSubmissionRowObject_(src, submissionRow);
  const rowValues = [
    submission.submittedAt,
    submission.studentFullName,
    submission.examId,
    submission.reason,
    submission.listening_json,
    submission.reading_json,
    submission.writing_json,
    submission.organizationId,
    submission.studentIdCode,
    submission.classroom,
    submission.canonicalStudentName,
    submission.officialEmail,
  ];
  const resultRow = buildObjectiveResultRow_(
    rowValues,
    ss,
    buildWritingOverallBandMap_(ss),
  );
  const targetKey = makeSubmissionKey_(
    submission.submittedAt,
    submission.studentFullName,
    submission.examId,
    submission.reason,
  );
  let foundRow = 0;
  if (out.getLastRow() >= 2) {
    const existing = out
      .getRange(2, 1, out.getLastRow() - 1, 4)
      .getDisplayValues();
    for (let i = existing.length - 1; i >= 0; i--) {
      if (
        makeSubmissionKey_(
          existing[i][0] || "",
          existing[i][1] || "",
          existing[i][2] || "",
          existing[i][3] || "",
        ) === targetKey
      ) {
        foundRow = i + 2;
        break;
      }
    }
  }
  const rowObject = {
    submittedAt: resultRow[0],
    studentFullName: resultRow[1],
    examId: resultRow[2],
    reason: resultRow[3],
    listeningTotal: resultRow[4],
    listeningBand: resultRow[5],
    readingTotal: resultRow[6],
    readingBand: resultRow[7],
    finalWritingBand: resultRow[8],
    organizationId: resultRow[9],
    studentIdCode: resultRow[10],
    classroom: resultRow[11],
    canonicalStudentName: resultRow[12],
    officialEmail: resultRow[13],
  };
  if (foundRow)
    setRowObjectByHeaders_(
      out,
      foundRow,
      rowObject,
      getObjectiveResultsHeaders_(),
    );
  else appendObjectiveResultRow_(out, rowObject);
  formatObjectiveResultsSheet_(out);
  SpreadsheetApp.flush();
}
function writeDetailedResultBlock_(sheet, submissionRow, startRow) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const src = ss.getSheetByName(SHEET_NAME);
  if (!src) throw new Error("Sheet not found: " + SHEET_NAME);
  const row = getSubmissionRowObject_(src, submissionRow);
  const submittedAt = row.submittedAt || "";
  const studentFullName = row.studentFullName || "";
  const examId = row.examId || "ielts-full-001";
  const reason = row.reason || "";
  const organizationId = normalizeOrganizationId_(row.organizationId || "");
  const resolvedIdentity =
    resolveStudentIdentity_(
      row.studentFullName || "",
      row.officialEmail || "",
      row.studentIdCode || "",
      organizationId,
    ) || null;
  const report = LR_REPORT(
    studentFullName,
    row.listening_json || "",
    row.reading_json || "",
    getKeyRangeForExam_(examId, "listening"),
    getKeyRangeForExam_(examId, "reading"),
    40,
  );
  const header = [
    [
      "Submission row: " + submissionRow,
      "Student: " + studentFullName,
      "Exam ID: " + examId,
      "Reason: " + reason,
      "Organization: " + organizationId,
      "Submitted at: " + submittedAt,
      "",
      "",
      "",
    ],
  ];
  sheet.getRange(startRow, 1, 1, DETAILED_BLOCK_WIDTH).setValues(header);
  sheet
    .getRange(startRow + 1, 1, report.length, report[0].length)
    .setValues(report);
  formatDetailedBlock_(sheet, startRow);
}
function hasDetailedResultBlock_(submissionRow) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const out = ss.getSheetByName(DETAILED_RESULTS_SHEET_NAME);
  if (!out || out.getLastRow() < 1) return false;
  const colA = out.getRange(1, 1, out.getLastRow(), 1).getDisplayValues();
  const needle = "Submission row: " + String(submissionRow);
  return colA.some((r) => String(r[0] || "").trim() === needle);
}
function ensureDetailedResultBlock_(submissionRow) {
  if (hasDetailedResultBlock_(submissionRow)) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const out = getOrCreateDetailedResultsSheet_(ss);
  const startRow = out.getLastRow() === 0 ? 1 : out.getLastRow() + 1;
  writeDetailedResultBlock_(out, submissionRow, startRow);
  SpreadsheetApp.flush();
}
function buildStudentResultForSubmissionRow_(submissionRow) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getSubmissionSheet_(ss);
  const row = getSubmissionRowObject_(sh, submissionRow);
  const submittedAt = row.submittedAt || "";
  const studentFullName = row.studentFullName || "";
  const examId = row.examId || "ielts-full-001";
  const reason = row.reason || "";
  const organizationId = normalizeOrganizationId_(row.organizationId || "");
  // ── Build identity index once and pass it in to avoid repeated sheet reads ──
  const identityIndex = buildCachedStudentIdentityIndex_();
  const resolvedIdentity =
    resolveStudentIdentity_(
      row.studentFullName || "",
      row.officialEmail || "",
      row.studentIdCode || "",
      organizationId,
      identityIndex,
    ) || null;
  const listeningJson = row.listening_json || "";
  const readingJson = row.reading_json || "";
  const writingJson = row.writing_json || "";
  let objectiveMeta = {};
  const objectiveSheet = ss.getSheetByName(OBJECTIVE_RESULTS_SHEET_NAME);
  if (objectiveSheet && objectiveSheet.getLastRow() >= 2) {
    const targetKey = makeSubmissionKey_(
      submittedAt,
      studentFullName,
      examId,
      reason,
    );
    // ── Read the entire Objective Results sheet in one batch call ──
    const objHeaders = objectiveSheet
      .getRange(1, 1, 1, Math.max(objectiveSheet.getLastColumn(), 1))
      .getDisplayValues()[0];
    const objHeaderMap = {};
    objHeaders.forEach(function(h, i) { objHeaderMap[String(h || "").trim()] = i; });
    const objAllValues = objectiveSheet
      .getRange(2, 1, objectiveSheet.getLastRow() - 1, Math.max(objectiveSheet.getLastColumn(), 1))
      .getDisplayValues();
    for (let i = objAllValues.length - 1; i >= 0; i--) {
      const r = objAllValues[i];
      const rSubmittedAt = String(r[objHeaderMap.submittedAt] || "").trim();
      const rStudentFullName = String(r[objHeaderMap.studentFullName] || "").trim();
      const rExamId = String(r[objHeaderMap.examId] || "").trim();
      const rReason = String(r[objHeaderMap.reason] || "").trim();
      if (
        makeSubmissionKey_(rSubmittedAt, rStudentFullName, rExamId, rReason) === targetKey
      ) {
        objectiveMeta = {
          organizationId: normalizeOrganizationId_(String(r[objHeaderMap.organizationId] || "")),
          listeningTotal: toNumberOrBlank_(r[objHeaderMap.listeningTotal]),
          listeningBand: toNumberOrBlank_(r[objHeaderMap.listeningBand]),
          readingTotal: toNumberOrBlank_(r[objHeaderMap.readingTotal]),
          readingBand: toNumberOrBlank_(r[objHeaderMap.readingBand]),
          finalWritingBand: toNumberOrBlank_(r[objHeaderMap.finalWritingBand]),
        };
        break;
      }
    }
  }
  if (
    objectiveMeta.listeningTotal === undefined ||
    objectiveMeta.listeningTotal === ""
  ) {
    const keys = getAnswerKeyValuesFromExamId_(ss, examId);
    objectiveMeta.listeningTotal = LISTENING_TOTAL(
      listeningJson,
      keys.listening,
      40,
    );
    objectiveMeta.listeningBand = listeningBandFromCorrect_(
      objectiveMeta.listeningTotal,
    );
    objectiveMeta.readingTotal = TOTAL_CORRECT(readingJson, keys.reading, 40);
    objectiveMeta.readingBand = readingBandFromCorrect_(
      objectiveMeta.readingTotal,
    );
  }
  const writingTask1 = getWritingAnswerText_(writingJson, "task1");
  const writingTask2 = getWritingAnswerText_(writingJson, "task2");
  const writingMeta = findWritingBlockGlobal_(
    ss,
    studentFullName,
    writingTask1,
    writingTask2,
  );
  return {
    organizationId: organizationId,
    studentIdCode:
      (resolvedIdentity && resolvedIdentity.studentIdCode) ||
      row.studentIdCode ||
      "",
    classroom:
      (resolvedIdentity && resolvedIdentity.classroom) || row.classroom || "",
    canonicalStudentName:
      (resolvedIdentity && resolvedIdentity.canonicalStudentName) ||
      row.canonicalStudentName ||
      studentFullName,
    officialEmail:
      (resolvedIdentity && resolvedIdentity.officialEmail) ||
      row.officialEmail ||
      "",
    submittedAt: submittedAt,
    studentFullName: studentFullName,
    examId: examId,
    reason: reason,
    listeningTotal: objectiveMeta.listeningTotal,
    listeningBand: objectiveMeta.listeningBand,
    readingTotal: objectiveMeta.readingTotal,
    readingBand: objectiveMeta.readingBand,
    task1Words: Number(WRITING_WORDCOUNT(writingJson, "task1") || 0),
    task2Words: Number(WRITING_WORDCOUNT(writingJson, "task2") || 0),
    writingTask1: writingTask1,
    writingTask2: writingTask2,
    task1Band: writingMeta.task1Band,
    task1Breakdown: writingMeta.task1Breakdown,
    task1Feedback: writingMeta.task1Feedback,
    task2Band: writingMeta.task2Band,
    task2Breakdown: writingMeta.task2Breakdown,
    task2Feedback: writingMeta.task2Feedback,
    finalWritingBand:
      objectiveMeta.finalWritingBand !== "" &&
      objectiveMeta.finalWritingBand !== undefined
        ? objectiveMeta.finalWritingBand
        : writingMeta.finalWritingBand,
    overallFeedback: writingMeta.overallFeedback,
  };
}
const ADMIN_RESULTS_SUMMARY_CACHE_CHUNK_SIZE = 90 * 1024;
/* safe under the 100KB per-key limit */ const ADMIN_RESULTS_SUMMARY_CACHE_MAX_CHUNKS = 50;
function getCachedAdminResultsSummary_() {
  try {
    const cache = CacheService.getScriptCache();
    const meta = cache.get(ADMIN_RESULTS_SUMMARY_CACHE_KEY + ":meta");
    if (!meta) return null;
    const parsedMeta = JSON.parse(meta);
    const chunkCount = Number(parsedMeta && parsedMeta.chunks) || 0;
    if (!chunkCount) return null;
    const keys = [];
    for (let i = 0; i < chunkCount; i++) {
      keys.push(ADMIN_RESULTS_SUMMARY_CACHE_KEY + ":" + i);
    }
    const got = cache.getAll(keys);
    let raw = "";
    for (let i = 0; i < chunkCount; i++) {
      const part = got[ADMIN_RESULTS_SUMMARY_CACHE_KEY + ":" + i];
      if (part === undefined || part === null) return null;
      /* partial cache => invalidate */ raw += part;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
}
function setCachedAdminResultsSummary_(rows) {
  try {
    const cache = CacheService.getScriptCache();
    const json = JSON.stringify(Array.isArray(rows) ? rows : []);
    const chunks = [];
    for (
      let i = 0;
      i < json.length;
      i += ADMIN_RESULTS_SUMMARY_CACHE_CHUNK_SIZE
    ) {
      chunks.push(json.slice(i, i + ADMIN_RESULTS_SUMMARY_CACHE_CHUNK_SIZE));
    }
    if (chunks.length > ADMIN_RESULTS_SUMMARY_CACHE_MAX_CHUNKS) {
      logSystem_("adminResultsSummary", "skip cache: too many chunks", {
        chunks: chunks.length,
        bytes: json.length,
      });
      return;
    }
    const payload = {};
    for (let i = 0; i < chunks.length; i++) {
      payload[ADMIN_RESULTS_SUMMARY_CACHE_KEY + ":" + i] = chunks[i];
    }
    payload[ADMIN_RESULTS_SUMMARY_CACHE_KEY + ":meta"] = JSON.stringify({
      chunks: chunks.length,
      bytes: json.length,
      writtenAt: new Date().toISOString(),
    });
    cache.putAll(payload, ADMIN_RESULTS_SUMMARY_CACHE_TTL_SECONDS);
  } catch (err) {
    try {
      logSystem_("adminResultsSummary", "cache write failed", {
        error: String(err),
      });
    } catch (e) {}
  }
}
function clearAdminResultsCaches_() {
  try {
    CacheService.getScriptCache().remove(ADMIN_RESULTS_SUMMARY_CACHE_KEY);
  } catch (err) {
    logSystem_("AdminResultsSummary", "Cache clear failed", {
      error: String(err),
    });
  }
}
function buildObjectiveSummaryMap_(ss) {
  const map = {};
  const objectiveSheet = ss.getSheetByName(OBJECTIVE_RESULTS_SHEET_NAME);
  if (!objectiveSheet || objectiveSheet.getLastRow() < 2) return map;
  for (
    let rowNumber = 2;
    rowNumber <= objectiveSheet.getLastRow();
    rowNumber++
  ) {
    const row = getObjectiveResultRowObject_(objectiveSheet, rowNumber);
    const key = makeSubmissionKey_(
      row.submittedAt || "",
      row.studentFullName || "",
      row.examId || "",
      row.reason || "",
    );
    if (!key) continue;
    map[key] = {
      organizationId: normalizeOrganizationId_(row.organizationId || ""),
      listeningTotal: toNumberOrBlank_(row.listeningTotal),
      listeningBand: toNumberOrBlank_(row.listeningBand),
      readingTotal: toNumberOrBlank_(row.readingTotal),
      readingBand: toNumberOrBlank_(row.readingBand),
      finalWritingBand: toNumberOrBlank_(row.finalWritingBand),
    };
  }
  return map;
}
function buildWritingSummaryMap_(ss) {
  const writingSheet = ss.getSheetByName(WRITING_SHEET_NAME);
  const map = {};
  if (!writingSheet || writingSheet.getLastRow() <= 1) return map;
  const values = writingSheet
    .getRange(1, 1, writingSheet.getLastRow(), 7)
    .getDisplayValues();
  for (let i = 1; i <= values.length - 4; i++) {
    const nameRow = values[i - 1];
    const task1Row = values[i];
    const task2Row = values[i + 1];
    const overallRow = values[i + 2];
    const studentName = String(nameRow[0] || "").trim();
    const marker = String(nameRow[1] || "").trim();
    if (!studentName || marker !== "Name") continue;
    const key = [
      studentName,
      String(task1Row[0] || "").trim(),
      String(task2Row[0] || "").trim(),
    ].join(" || ");
    map[key] = {
      task1Band: String(task1Row[3] || "").trim(),
      task2Band: String(task2Row[3] || "").trim(),
      finalWritingBand: String(overallRow[3] || "").trim(),
    };
  }
  return map;
}
function buildAdminResultSummaryRowFromSubmission_(
  submissionRow,
  objectiveMap,
  writingMap,
) {
  const submittedAt = submissionRow.submittedAt || "";
  const studentFullName = submissionRow.studentFullName || "";
  const examId = submissionRow.examId || "ielts-full-001";
  const reason = submissionRow.reason || "";
  const organizationId = normalizeOrganizationId_(
    submissionRow.organizationId || "",
  );
  const resolvedIdentity =
    resolveStudentIdentity_(
      submissionRow.studentFullName || "",
      submissionRow.officialEmail || "",
      submissionRow.studentIdCode || "",
      organizationId,
    ) || null;
  const writingJson = submissionRow.writing_json || "";
  const key = makeSubmissionKey_(submittedAt, studentFullName, examId, reason);
  const objectiveMeta = objectiveMap[key] || {};
  const writingKey = [
    String(studentFullName || "").trim(),
    String(getWritingAnswerText_(writingJson, "task1") || "").trim(),
    String(getWritingAnswerText_(writingJson, "task2") || "").trim(),
  ].join(" || ");
  const writingMeta = writingMap[writingKey] || {};
  return {
    organizationId: organizationId,
    studentIdCode:
      (resolvedIdentity && resolvedIdentity.studentIdCode) ||
      submissionRow.studentIdCode ||
      "",
    classroom:
      (resolvedIdentity && resolvedIdentity.classroom) ||
      submissionRow.classroom ||
      "",
    canonicalStudentName:
      (resolvedIdentity && resolvedIdentity.canonicalStudentName) ||
      submissionRow.canonicalStudentName ||
      studentFullName,
    officialEmail:
      (resolvedIdentity && resolvedIdentity.officialEmail) ||
      submissionRow.officialEmail ||
      "",
    submittedAt: submittedAt,
    studentFullName: studentFullName,
    examId: examId,
    reason: reason,
    listeningTotal:
      objectiveMeta.listeningTotal !== undefined
        ? objectiveMeta.listeningTotal
        : "",
    listeningBand:
      objectiveMeta.listeningBand !== undefined
        ? objectiveMeta.listeningBand
        : "",
    readingTotal:
      objectiveMeta.readingTotal !== undefined
        ? objectiveMeta.readingTotal
        : "",
    readingBand:
      objectiveMeta.readingBand !== undefined ? objectiveMeta.readingBand : "",
    finalWritingBand:
      objectiveMeta.finalWritingBand !== undefined &&
      objectiveMeta.finalWritingBand !== ""
        ? objectiveMeta.finalWritingBand
        : writingMeta.finalWritingBand || "",
    task1Words: Number(WRITING_WORDCOUNT(writingJson, "task1") || 0),
    task2Words: Number(WRITING_WORDCOUNT(writingJson, "task2") || 0),
    task1Band: writingMeta.task1Band || "",
    task2Band: writingMeta.task2Band || "",
  };
}
function buildAdminResultsSummary_() {
  const cached = getCachedAdminResultsSummary_();
  if (cached) return cached;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return [];
  const submissions = getAllSubmissionRowObjects_(sh);
  const objectiveMap = buildObjectiveSummaryMap_(ss);
  const writingMap = buildWritingSummaryMap_(ss);
  const out = submissions
    .filter(
      (r) =>
        String(r.studentFullName || "").trim() ||
        r.organizationId ||
        r.listening_json ||
        r.reading_json ||
        r.writing_json,
    )
    .map((r) =>
      buildAdminResultSummaryRowFromSubmission_(r, objectiveMap, writingMap),
    );
  out.sort(
    (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0),
  );
  setCachedAdminResultsSummary_(out);
  return out;
}
function compareAdminSummaryRows_(a, b, field, direction) {
  const dir = String(direction || "desc").toLowerCase() === "asc" ? 1 : -1;
  let av = a && a[field] !== undefined ? a[field] : "";
  let bv = b && b[field] !== undefined ? b[field] : "";
  if (field === "submittedAt") {
    av = new Date(av || 0).getTime();
    bv = new Date(bv || 0).getTime();
  } else if (
    [
      "listeningTotal",
      "listeningBand",
      "readingTotal",
      "readingBand",
      "finalWritingBand",
      "task1Words",
      "task2Words",
    ].indexOf(field) >= 0
  ) {
    av = Number(av || 0);
    bv = Number(bv || 0);
  } else {
    av = String(av || "").toLowerCase();
    bv = String(bv || "").toLowerCase();
  }
  if (av < bv) return -1 * dir;
  if (av > bv) return 1 * dir;
  return 0;
}
function queryAdminResultsSummary_(params) {
  params = params || {};
  let rows = buildAdminResultsSummary_().slice();
  const q = String(params.q || "")
    .trim()
    .toLowerCase();
  const examId = String(params.examId || "").trim();
  const month = String(params.month || "").trim();
  const year = String(params.year || "").trim();
  const sortValue = String(params.sort || "submittedAt_desc").trim();
  const limit = Number(params.limit || 0);
  if (q) {
    rows = rows.filter((row) => {
      const hay = [row.studentFullName, row.reason, row.examId]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return hay.indexOf(q) >= 0;
    });
  }
  if (examId) {
    rows = rows.filter((row) => String(row.examId || "") === examId);
  }
  if (month || year) {
    rows = rows.filter((row) => {
      const d = new Date(row.submittedAt || "");
      if (isNaN(d.getTime())) return false;
      const rowMonth = String(d.getMonth() + 1).padStart(2, "0");
      const rowYear = String(d.getFullYear());
      if (month && rowMonth !== month) return false;
      if (year && rowYear !== year) return false;
      return true;
    });
  }
  const sortParts = sortValue.split("_");
  const sortField = sortParts[0] || "submittedAt";
  const sortDirection = sortParts[1] || "desc";
  rows.sort((a, b) => compareAdminSummaryRows_(a, b, sortField, sortDirection));
  if (limit > 0) rows = rows.slice(0, limit);
  return rows;
}
function buildAdminResults_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return [];
  const out = [];
  for (let row = 2; row <= sh.getLastRow(); row++)
    out.push(buildStudentResultForSubmissionRow_(row));
  out.sort(
    (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0),
  );
  return out;
}
/*********************** FINDING SUBMISSIONS************************/ function findExistingSubmissionRow_(
  sheet,
  submittedAt,
  studentFullName,
  examId,
  reason,
) {
  return findRowByFields_(sheet, {
    submittedAt: submittedAt || "",
    studentFullName: studentFullName || "",
    examId: examId || "",
    reason: reason || "",
  });
}
function normalizeIsoMinuteKey_(value) {
  const d = new Date(value || "");
  return isNaN(d.getTime())
    ? ""
    : Utilities.formatDate(d, "UTC", "yyyy-MM-dd'T'HH:mm");
}
function findSubmissionRowRelaxed_(
  submittedAt,
  studentFullName,
  examId,
  reason,
) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return 0;
  const headerMap = getHeaderMap_(sh);
  const subIdx = (headerMap.submittedAt || 0) - 1;
  const nameIdx = (headerMap.studentFullName || 0) - 1;
  const examIdx = (headerMap.examId || 0) - 1;
  const reasonIdx = (headerMap.reason || 0) - 1;
  if (subIdx < 0 || nameIdx < 0 || examIdx < 0) return 0;
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
  const targetName = normStrict_(studentFullName).toLowerCase();
  const targetExamId = String(examId || "").trim();
  const targetReason = normStrict_(reason).toLowerCase();
  const targetMinute = normalizeIsoMinuteKey_(submittedAt);
  for (var i = values.length - 1; i >= 0; i--) {
    const r = values[i];
    const rowName = normStrict_(r[nameIdx] || "").toLowerCase();
    const rowExamId = String(r[examIdx] || "").trim();
    const rowReason = reasonIdx >= 0 ? normStrict_(r[reasonIdx] || "").toLowerCase() : "";
    if (targetName && rowName !== targetName) continue;
    if (targetExamId && rowExamId !== targetExamId) continue;
    if (targetReason && rowReason && rowReason !== targetReason) continue;
    if (
      targetMinute &&
      normalizeIsoMinuteKey_(r[subIdx] || "") !== targetMinute
    )
      continue;
    return i + 2;
  }
  return 0;
}
function findSubmissionRowByKey_(submittedAt, studentFullName, examId, reason) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return 0;
  return findExistingSubmissionRow_(
    sh,
    submittedAt,
    studentFullName,
    examId,
    reason,
  );
}
/*********************** BACKGROUND WRITING QUEUE************************/ function deleteAllGradeTriggers_() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (
      t.getHandlerFunction &&
      t.getHandlerFunction() === "processQueuedWritingSubmissions_"
    )
      ScriptApp.deleteTrigger(t);
  });
}
function scheduleQueuedWritingProcessing_() {
  deleteAllGradeTriggers_();
  ScriptApp.newTrigger("processQueuedWritingSubmissions_")
    .timeBased()
    .after(5 * 1000)
    .create();
}
/**
 * Manually runnable from the Apps Script editor Run dropdown.
 * Re-grades up to 10 submissions that have real writing content but whose
 * writing bands are missing from the Writing sheet (e.g., due to earlier
 * OpenAI failures). Also updates Objective Results and syncs to Supabase.
 * Run it multiple times if you have more than 10 ungraded submissions.
 */
function reGradeUngradedSubmissions() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) {
    Logger.log("No submissions found.");
    return;
  }
  const rows = getAllSubmissionRowObjects_(sh);
  let processed = 0;
  let skipped = 0;
  const BATCH_LIMIT = 10;
  for (let i = rows.length - 1; i >= 0 && processed < BATCH_LIMIT; i--) {
    const row = rows[i];
    const writingJson = row.writing_json || "";
    if (!writingJson || !hasRealWritingContent_(writingJson)) continue;
    if (isSubmissionAlreadyGraded_(ss, row.rowNumber)) {
      skipped++;
      continue;
    }
    try {
      Logger.log("Re-grading row " + row.rowNumber + ": " + (row.studentFullName || "unknown"));
      tryGradeSubmissionNow_(row.rowNumber);
      processed++;
      Utilities.sleep(1500);
    } catch (err) {
      logSystem_("reGradeUngraded", "Grading failed", { row: row.rowNumber, error: String(err) });
      Logger.log("Failed row " + row.rowNumber + ": " + err);
    }
  }
  clearAdminResultsCaches_();
  Logger.log("reGradeUngradedSubmissions: processed=" + processed + ", skipped(already graded)=" + skipped);
}
function hasUngradedWriting_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return false;
  const rows = getAllSubmissionRowObjects_(sh);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const writingJson = row.writing_json || "";
    if (
      writingJson &&
      hasRealWritingContent_(writingJson) &&
      !isSubmissionAlreadyGraded_(ss, row.rowNumber)
    )
      return true;
  }
  return false;
}
function processQueuedWritingSubmissions_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    if (!sh || sh.getLastRow() < 2) return;
    const rows = getAllSubmissionRowObjects_(sh);
    let processed = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const writingJson = row.writing_json || "";
      if (
        !writingJson ||
        !hasRealWritingContent_(writingJson) ||
        isSubmissionAlreadyGraded_(ss, row.rowNumber)
      )
        continue;
      try {
        tryGradeSubmissionNow_(row.rowNumber);
        // Report emails are sent centrally by the Worker (Resend).
        processed++;
        Utilities.sleep(1200);
      } catch (err) {
        logSystem_("QueuedWriting", "Queued grading failed", {
          row: row.rowNumber,
          error: String(err),
        });
      }
      if (processed >= 3) break;
    }
    if (hasUngradedWriting_()) scheduleQueuedWritingProcessing_();
    else deleteAllGradeTriggers_();
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/*********************** ASSIGNMENTS BACKEND ************************/
function nowIso_() {
  return new Date().toISOString();
}
function toBool_(v) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  return false;
}
function toDisplayDate_(v) {
  if (!v) return "";
  try {
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  } catch (e) {
    return String(v);
  }
}
function generateId_(prefix) {
  return String(prefix || "id") + "_" + Utilities.getUuid().replace(/-/g, "").slice(0, 16);
}
function getAssignmentsHeaders_() {
  return [
    "id","title","testId","assignmentType","taskId","dueDate","note",
    "classroomId","classroomName","createdBy","createdAt","updatedAt","isActive"
  ];
}
function getAssignmentStudentsHeaders_() {
  return [
    "assignmentId","studentProfileId","studentIdCode","studentName","officialEmail",
    "classroomId","classroomName","attempted","attemptedAt","completed","completedAt","createdAt"
  ];
}
function getOrCreateAssignmentsSheet_(ss) {
  var sh = ss.getSheetByName(ASSIGNMENTS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(ASSIGNMENTS_SHEET_NAME);
  ensureSheetHeaders_(sh, getAssignmentsHeaders_());
  return sh;
}
function getOrCreateAssignmentStudentsSheet_(ss) {
  var sh = ss.getSheetByName(ASSIGNMENT_STUDENTS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(ASSIGNMENT_STUDENTS_SHEET_NAME);
  ensureSheetHeaders_(sh, getAssignmentStudentsHeaders_());
  return sh;
}
function getHeaderMapFromSheet_(sh) {
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var map = {};
  headers.forEach(function (h, i) { map[String(h || "").trim()] = i; });
  return { headers: headers, map: map };
}
function readSheetObjects_(sh) {
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var hc = getHeaderMapFromSheet_(sh);
  var vals = sh.getRange(2, 1, lastRow - 1, hc.headers.length).getValues();
  return vals.map(function (row, idx) {
    var obj = { __rowNumber: idx + 2 };
    hc.headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}
function writeObjectRow_(sh, rowNumber, obj) {
  var hc = getHeaderMapFromSheet_(sh);
  var out = hc.headers.map(function (h) {
    var v = obj[h];
    if (v === undefined || v === null) return "";
    return v;
  });
  sh.getRange(rowNumber, 1, 1, out.length).setValues([out]);
}
function appendObjectRow_(sh, obj) {
  var hc = getHeaderMapFromSheet_(sh);
  var out = hc.headers.map(function (h) {
    var v = obj[h];
    if (v === undefined || v === null) return "";
    return v;
  });
  sh.appendRow(out);
  return sh.getLastRow();
}
function normalizeAssignmentForFrontend_(a) {
  return {
    id: String(a.id || ""),
    title: String(a.title || ""),
    test_id: String(a.testId || ""),
    testId: String(a.testId || ""),
    assignmentType: String(a.assignmentType || "test"),
    taskId: String(a.taskId || ""),
    due_date: String(a.dueDate || ""),
    dueDate: String(a.dueDate || ""),
    note: String(a.note || ""),
    classroom_id: String(a.classroomId || ""),
    classroomId: String(a.classroomId || ""),
    classroomName: String(a.classroomName || ""),
    status: String(a.isActive === false || String(a.isActive).toLowerCase() === "false" ? "archived" : "published"),
    createdAt: String(a.createdAt || ""),
    updatedAt: String(a.updatedAt || "")
  };
}
function resolveAssignableStudentsByClassroom_(classroomId) {
  var index = buildStudentIdentityIndex_();
  var target = String(classroomId || "").trim();
  var records = (index && index.records) ? index.records : [];
  return records
    .filter(function (r) { return !target || String(r.classroom || "") === target; })
    .map(function (r) {
      return {
        studentProfileId: String(r.studentIdCode || ""),
        studentIdCode: String(r.studentIdCode || ""),
        studentName: String(r.canonicalName || ""),
        officialEmail: normalizeEmail_(r.officialEmail || ""),
        classroomId: String(r.classroom || ""),
        classroomName: String(r.classroom || "")
      };
    });
}
function listAssignmentsAction_(params) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = getOrCreateAssignmentsSheet_(ss);
  var rows = readSheetObjects_(sh);
  var classroomId = String((params && params.classroomId) || "").trim();
  var list = rows
    .filter(function (r) { return String(r.isActive || "true") !== "false"; })
    .filter(function (r) { return !classroomId || String(r.classroomId || "") === classroomId; })
    .map(normalizeAssignmentForFrontend_);
  return { ok: true, assignments: list };
}
function createAssignmentAction_(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var aSh = getOrCreateAssignmentsSheet_(ss);
  var sSh = getOrCreateAssignmentStudentsSheet_(ss);

  var id = generateId_("asg");
  var assignment = {
    id: id,
    title: String(data.title || "").trim(),
    testId: String(data.testId || "").trim(),
    assignmentType: String(data.assignmentType || "test").trim(),
    taskId: String(data.taskId || "").trim(),
    dueDate: String(data.dueDate || "").trim(),
    note: String(data.note || "").trim(),
    classroomId: String(data.classroomId || "").trim(),
    classroomName: String(data.classroomName || data.classroomId || "").trim(),
    createdBy: String(data.createdBy || "").trim(),
    createdAt: nowIso_(),
    updatedAt: nowIso_(),
    isActive: "true"
  };
  if (!assignment.title) return { ok: false, error: "Title is required." };
  if (!assignment.testId) return { ok: false, error: "testId is required." };

  appendObjectRow_(aSh, assignment);

  var explicitStudents = Array.isArray(data.students) ? data.students : [];
  var targets = explicitStudents.length ? explicitStudents : resolveAssignableStudentsByClassroom_(assignment.classroomId);

  var existing = readSheetObjects_(sSh);
  var existingKey = {};
  existing.forEach(function (r) {
    var k = String(r.assignmentId || "") + "::" + String(r.studentProfileId || "");
    existingKey[k] = true;
  });

  var added = 0;
  targets.forEach(function (st) {
    var pid = String(st.studentProfileId || st.studentIdCode || "").trim();
    if (!pid) return;
    var key = assignment.id + "::" + pid;
    if (existingKey[key]) return;
    appendObjectRow_(sSh, {
      assignmentId: assignment.id,
      studentProfileId: pid,
      studentIdCode: String(st.studentIdCode || ""),
      studentName: String(st.studentName || ""),
      officialEmail: normalizeEmail_(st.officialEmail || ""),
      classroomId: String(st.classroomId || assignment.classroomId || ""),
      classroomName: String(st.classroomName || assignment.classroomName || ""),
      attempted: "false",
      attemptedAt: "",
      completed: "false",
      completedAt: "",
      createdAt: nowIso_()
    });
    added++;
  });

  return {
    ok: true,
    assignment: normalizeAssignmentForFrontend_(assignment),
    attachedStudents: added,
    notificationTargets: targets.map(function (s) {
      return {
        studentProfileId: String(s.studentProfileId || s.studentIdCode || ""),
        studentIdCode: String(s.studentIdCode || ""),
        studentName: String(s.studentName || ""),
        officialEmail: normalizeEmail_(s.officialEmail || "")
      };
    }),
    emailsSent: 0,
    failed: 0,
    missingEmails: 0,
    duplicateSkipped: 0,
    failures: [],
    emailSummary: {
      attempted: 0,
      sent: 0,
      failed: 0,
      skippedNoEmail: 0,
      skippedDuplicate: 0,
      failures: [],
      provider: "worker_resend"
    }
  };
}
function updateAssignmentAction_(data) {
  var id = String(data.id || "").trim();
  if (!id) return { ok: false, error: "Assignment id is required." };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = getOrCreateAssignmentsSheet_(ss);
  var rows = readSheetObjects_(sh);
  var row = null;
  rows.forEach(function (r) { if (!row && String(r.id || "") === id) row = r; });
  if (!row) return { ok: false, error: "Assignment not found." };

  var updated = {
    id: id,
    title: data.title != null ? String(data.title).trim() : String(row.title || ""),
    testId: data.testId != null ? String(data.testId).trim() : String(row.testId || ""),
    assignmentType: data.assignmentType != null ? String(data.assignmentType).trim() : String(row.assignmentType || "test"),
    taskId: data.taskId != null ? String(data.taskId).trim() : String(row.taskId || ""),
    dueDate: data.dueDate != null ? String(data.dueDate).trim() : String(row.dueDate || ""),
    note: data.note != null ? String(data.note).trim() : String(row.note || ""),
    classroomId: data.classroomId != null ? String(data.classroomId).trim() : String(row.classroomId || ""),
    classroomName: data.classroomName != null ? String(data.classroomName).trim() : String(row.classroomName || ""),
    createdBy: String(row.createdBy || ""),
    createdAt: String(row.createdAt || ""),
    updatedAt: nowIso_(),
    isActive: (String(data.status || "").trim() === "archived") ? "false" : String(row.isActive || "true")
  };
  writeObjectRow_(sh, row.__rowNumber, updated);

  var out = { ok: true, assignment: normalizeAssignmentForFrontend_(updated) };

  if (String(data.status || "").trim() === "published") {
    var sSh = getOrCreateAssignmentStudentsSheet_(ss);
    var aRows = readSheetObjects_(sSh).filter(function (r) { return String(r.assignmentId || "") === id; });
    var targets = aRows.map(function (r) {
      return {
        studentProfileId: String(r.studentProfileId || ""),
        studentIdCode: String(r.studentIdCode || ""),
        studentName: String(r.studentName || ""),
        officialEmail: normalizeEmail_(r.officialEmail || ""),
        classroomId: String(r.classroomId || ""),
        classroomName: String(r.classroomName || "")
      };
    });
    out.notificationTargets = targets;
    out.emailsSent = 0;
    out.failed = 0;
    out.missingEmails = 0;
    out.duplicateSkipped = 0;
    out.failures = [];
    out.emailSummary = {
      attempted: 0,
      sent: 0,
      failed: 0,
      skippedNoEmail: 0,
      skippedDuplicate: 0,
      failures: [],
      provider: "worker_resend"
    };
  }

  return out;
}
function deleteAssignmentAction_(data) {
  var id = String(data.id || "").trim();
  if (!id) return { ok: false, error: "Assignment id is required." };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = getOrCreateAssignmentsSheet_(ss);
  var rows = readSheetObjects_(sh);
  var found = false;
  rows.forEach(function (r) {
    if (String(r.id || "") === id) {
      r.isActive = "false";
      r.updatedAt = nowIso_();
      writeObjectRow_(sh, r.__rowNumber, r);
      found = true;
    }
  });
  if (!found) return { ok: false, error: "Assignment not found." };
  return { ok: true };
}
function assignmentStudentsAction_(params) {
  var assignmentId = String((params && params.assignmentId) || "").trim();
  if (!assignmentId) return { ok: false, error: "assignmentId is required." };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = getOrCreateAssignmentStudentsSheet_(ss);
  var rows = readSheetObjects_(sh).filter(function (r) { return String(r.assignmentId || "") === assignmentId; });
  return {
    ok: true,
    students: rows.map(function (r) {
      return {
        student_profile_id: String(r.studentProfileId || ""),
        student: {
          id: String(r.studentProfileId || ""),
          studentIdCode: String(r.studentIdCode || ""),
          name: String(r.studentName || ""),
          officialEmail: normalizeEmail_(r.officialEmail || "")
        },
        attempted: toBool_(r.attempted),
        attemptedAt: String(r.attemptedAt || ""),
        completed: toBool_(r.completed),
        completedAt: String(r.completedAt || "")
      };
    })
  };
}
function assignmentStudentsBulkAction_(data) {
  var assignmentId = String(data.assignmentId || "").trim();
  if (!assignmentId) return { ok: false, error: "assignmentId is required." };

  var add = Array.isArray(data.add) ? data.add : [];
  var remove = Array.isArray(data.remove) ? data.remove : [];

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var aSh = getOrCreateAssignmentsSheet_(ss);
  var sSh = getOrCreateAssignmentStudentsSheet_(ss);

  var assignmentRow = null;
  readSheetObjects_(aSh).forEach(function (r) {
    if (!assignmentRow && String(r.id || "") === assignmentId) assignmentRow = r;
  });
  if (!assignmentRow) return { ok: false, error: "Assignment not found." };

  var sRows = readSheetObjects_(sSh);
  var removeSet = {};
  remove.forEach(function (id) { removeSet[String(id || "")] = true; });
  for (var i = sRows.length - 1; i >= 0; i--) {
    var r = sRows[i];
    if (String(r.assignmentId || "") !== assignmentId) continue;
    if (removeSet[String(r.studentProfileId || "")]) {
      sSh.deleteRow(r.__rowNumber);
    }
  }

  sRows = readSheetObjects_(sSh);
  var byKey = {};
  sRows.forEach(function (r) {
    byKey[String(r.assignmentId || "") + "::" + String(r.studentProfileId || "")] = true;
  });

  var available = resolveAssignableStudentsByClassroom_(assignmentRow.classroomId);
  var byPid = {};
  available.forEach(function (s) { byPid[String(s.studentProfileId || "")] = s; });

  var targetsForEmail = [];
  add.forEach(function (pidRaw) {
    var pid = String(pidRaw || "").trim();
    if (!pid) return;
    var k = assignmentId + "::" + pid;
    if (byKey[k]) return;
    var s = byPid[pid] || { studentProfileId: pid, studentIdCode: pid, studentName: "", officialEmail: "", classroomId: assignmentRow.classroomId || "", classroomName: assignmentRow.classroomName || "" };
    appendObjectRow_(sSh, {
      assignmentId: assignmentId,
      studentProfileId: pid,
      studentIdCode: String(s.studentIdCode || ""),
      studentName: String(s.studentName || ""),
      officialEmail: normalizeEmail_(s.officialEmail || ""),
      classroomId: String(s.classroomId || assignmentRow.classroomId || ""),
      classroomName: String(s.classroomName || assignmentRow.classroomName || ""),
      attempted: "false",
      attemptedAt: "",
      completed: "false",
      completedAt: "",
      createdAt: nowIso_()
    });
    targetsForEmail.push(s);
  });

  return {
    ok: true,
    notificationTargets: targetsForEmail.map(function (s) {
      return {
        studentProfileId: String(s.studentProfileId || s.studentIdCode || ""),
        studentIdCode: String(s.studentIdCode || ""),
        studentName: String(s.studentName || ""),
        officialEmail: normalizeEmail_(s.officialEmail || "")
      };
    }),
    emailSummary: {
      attempted: 0,
      sent: 0,
      failed: 0,
      skippedNoEmail: 0,
      skippedDuplicate: 0,
      failures: [],
      provider: "worker_resend"
    },
    emailsSent: 0,
    failed: 0,
    missingEmails: 0,
    duplicateSkipped: 0,
    failures: []
  };
}
function resolveStudentIdentityFromRequest_(data, params) {
  var candidates = [];
  [data, params].forEach(function (src) {
    if (!src) return;
    candidates.push({
      studentProfileId: String(src.studentProfileId || src.student_profile_id || src.studentIdCode || "").trim(),
      studentIdCode: String(src.studentIdCode || src.student_id_code || "").trim(),
      officialEmail: normalizeEmail_(src.officialEmail || src.studentEmail || src.loginEmail || src.email || ""),
      studentName: String(src.studentName || src.studentFullName || src.name || "").trim()
    });
  });
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (c.studentProfileId || c.studentIdCode || c.officialEmail) return c;
  }
  return { studentProfileId: "", studentIdCode: "", officialEmail: "", studentName: "" };
}
function studentAssignmentsAction_(data, params) {
  var student = resolveStudentIdentityFromRequest_(data, params);
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var aSh = getOrCreateAssignmentsSheet_(ss);
  var sSh = getOrCreateAssignmentStudentsSheet_(ss);

  var assignmentsById = {};
  readSheetObjects_(aSh).forEach(function (r) {
    if (String(r.isActive || "true") === "false") return;
    assignmentsById[String(r.id || "")] = r;
  });

  var rows = readSheetObjects_(sSh).filter(function (r) {
    if (!assignmentsById[String(r.assignmentId || "")]) return false;
    var pid = String(r.studentProfileId || "");
    var sid = String(r.studentIdCode || "");
    var em = normalizeEmail_(r.officialEmail || "");
    if (student.studentProfileId && pid === student.studentProfileId) return true;
    if (student.studentIdCode && sid === student.studentIdCode) return true;
    if (student.officialEmail && em && em === student.officialEmail) return true;
    return false;
  });

  var out = rows.map(function (r) {
    var a = assignmentsById[String(r.assignmentId || "")] || {};
    return {
      id: String(r.assignmentId || ""),
      title: String(a.title || ""),
      testId: String(a.testId || ""),
      assignmentType: String(a.assignmentType || "test"),
      taskId: String(a.taskId || ""),
      dueDate: String(a.dueDate || ""),
      note: String(a.note || ""),
      completed: toBool_(r.completed),
      attempted: toBool_(r.attempted),
      attemptedAt: String(r.attemptedAt || ""),
      completedAt: String(r.completedAt || ""),
      classroom_id: String(a.classroomId || "")
    };
  });
  return { ok: true, assignments: out };
}
function assignmentAccessAction_(data, params) {
  var testId = String((params && params.testId) || (data && data.testId) || "").trim();
  if (!testId) return { ok: false, error: "testId is required." };

  var student = resolveStudentIdentityFromRequest_(data, params);
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var aSh = getOrCreateAssignmentsSheet_(ss);
  var sSh = getOrCreateAssignmentStudentsSheet_(ss);

  var assignments = readSheetObjects_(aSh).filter(function (a) {
    return String(a.isActive || "true") !== "false" && String(a.testId || "") === testId;
  });
  if (!assignments.length) return { ok: true, access: false };

  var byAssignment = {};
  assignments.forEach(function (a) { byAssignment[String(a.id || "")] = a; });

  var rows = readSheetObjects_(sSh).filter(function (r) {
    if (!byAssignment[String(r.assignmentId || "")]) return false;
    var pid = String(r.studentProfileId || "");
    var sid = String(r.studentIdCode || "");
    var em = normalizeEmail_(r.officialEmail || "");
    if (student.studentProfileId && pid === student.studentProfileId) return true;
    if (student.studentIdCode && sid === student.studentIdCode) return true;
    if (student.officialEmail && em && em === student.officialEmail) return true;
    return false;
  });
  if (!rows.length) return { ok: true, access: false };

  var row = rows[0];
  var a = byAssignment[String(row.assignmentId || "")] || {};
  var attempted = toBool_(row.attempted);
  var completed = toBool_(row.completed);
  return {
    ok: true,
    access: !(attempted || completed),
    assignmentId: String(row.assignmentId || ""),
    completed: completed,
    attempted: attempted,
    attemptedAt: String(row.attemptedAt || ""),
    completedAt: String(row.completedAt || ""),
    dueDate: String(a.dueDate || "")
  };
}
function markAssignmentStartedAction_(data) {
  var assignmentId = String(data.assignmentId || "").trim();
  if (!assignmentId) return { ok: false, error: "assignmentId is required." };

  var student = resolveStudentIdentityFromRequest_(data, null);
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = getOrCreateAssignmentStudentsSheet_(ss);
  var rows = readSheetObjects_(sh);
  var found = false;
  rows.forEach(function (r) {
    if (String(r.assignmentId || "") !== assignmentId) return;
    var pid = String(r.studentProfileId || "");
    var sid = String(r.studentIdCode || "");
    var em = normalizeEmail_(r.officialEmail || "");
    var match =
      (student.studentProfileId && pid === student.studentProfileId) ||
      (student.studentIdCode && sid === student.studentIdCode) ||
      (student.officialEmail && em && em === student.officialEmail);
    if (!match) return;
    if (!toBool_(r.attempted)) {
      r.attempted = "true";
      r.attemptedAt = nowIso_();
      writeObjectRow_(sh, r.__rowNumber, r);
    }
    found = true;
  });
  if (!found) return { ok: false, error: "Assigned student row not found." };
  return { ok: true };
}
function markAssignmentCompleteAction_(data) {
  var assignmentId = String(data.assignmentId || "").trim();
  if (!assignmentId) return { ok: false, error: "assignmentId is required." };

  var student = resolveStudentIdentityFromRequest_(data, null);
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = getOrCreateAssignmentStudentsSheet_(ss);
  var rows = readSheetObjects_(sh);
  var found = false;
  rows.forEach(function (r) {
    if (String(r.assignmentId || "") !== assignmentId) return;
    var pid = String(r.studentProfileId || "");
    var sid = String(r.studentIdCode || "");
    var em = normalizeEmail_(r.officialEmail || "");
    var match =
      (student.studentProfileId && pid === student.studentProfileId) ||
      (student.studentIdCode && sid === student.studentIdCode) ||
      (student.officialEmail && em && em === student.officialEmail);
    if (!match) return;
    r.completed = "true";
    r.completedAt = nowIso_();
    if (!toBool_(r.attempted)) {
      r.attempted = "true";
      r.attemptedAt = nowIso_();
    }
    writeObjectRow_(sh, r.__rowNumber, r);
    found = true;
  });
  if (!found) return { ok: false, error: "Assigned student row not found." };
  return { ok: true };
}
function sendAssignmentNotificationsForTargets_(assignment, targets) {
  var sent = 0;
  var failed = 0;
  var skippedNoEmail = 0;
  var skippedDuplicate = 0;
  var failures = [];
  var dedup = {};
  (targets || []).forEach(function (s) {
    var toEmail = normalizeEmail_(s.officialEmail || "");
    if (!toEmail) {
      skippedNoEmail++;
      return;
    }
    if (dedup[toEmail]) {
      skippedDuplicate++;
      return;
    }
    dedup[toEmail] = true;
    var payload = {
      action: "assignmentNotify",
      assignmentId: String(assignment.id || ""),
      assignmentTitle: String(assignment.title || ""),
      dueDate: toDisplayDate_(assignment.dueDate || ""),
      assignmentLink: "https://ieltsmock.org",
      studentId: String(s.studentIdCode || ""),
      studentName: String(s.studentName || "Student"),
      toEmail: toEmail
    };
    var res = sendAssignmentNotificationEmail_(payload);
    if (res && res.ok) sent++;
    else {
      failed++;
      failures.push({
        recipient: toEmail,
        studentIdCode: String(s.studentIdCode || ""),
        fullName: String(s.studentName || ""),
        error: String((res && res.error) || "Unknown send error")
      });
    }
  });
  return {
    attempted: sent + failed,
    sent: sent,
    failed: failed,
    skippedNoEmail: skippedNoEmail,
    skippedDuplicate: skippedDuplicate,
    failures: failures,
    provider: "apps_script_mailapp"
  };
}

/*********************** GET / POST************************/ function parseInboundPostData_(
  e,
) {
  const out = { raw: "", data: {} };
  if (
    e &&
    e.parameter &&
    typeof e.parameter.payload === "string" &&
    e.parameter.payload
  )
    out.raw = e.parameter.payload;
  else if (e && e.postData && typeof e.postData.contents === "string")
    out.raw = e.postData.contents;
  if (!out.raw) return out;
  try {
    out.data = JSON.parse(out.raw);
    return out;
  } catch (err) {}
  try {
    const params = out.raw.split("&").reduce((acc, part) => {
      if (!part) return acc;
      const idx = part.indexOf("=");
      const k = idx >= 0 ? part.slice(0, idx) : part;
      const v = idx >= 0 ? part.slice(idx + 1) : "";
      acc[decodeURIComponent(k.replace(/\+/g, " "))] = decodeURIComponent(
        v.replace(/\+/g, " "),
      );
      return acc;
    }, {});
    if (params.payload) {
      out.raw = params.payload;
      out.data = JSON.parse(params.payload);
    }
  } catch (err) {}
  return out;
}
function doGet(e) {
  try {
    const action =
      e && e.parameter && e.parameter.action ? String(e.parameter.action) : "";
    if (action) {
      var worker = verifyWorkerRequest_(e);
      if (!worker.ok) {
        return ContentService.createTextOutput(
          JSON.stringify({ ok: false, error: worker.error }),
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    if (action === "resultsSummary") {
      const rows = queryAdminResultsSummary_({
        q: e && e.parameter && e.parameter.q ? String(e.parameter.q) : "",
        examId:
          e && e.parameter && e.parameter.examId
            ? String(e.parameter.examId)
            : "",
        month:
          e && e.parameter && e.parameter.month
            ? String(e.parameter.month)
            : "",
        year:
          e && e.parameter && e.parameter.year ? String(e.parameter.year) : "",
        sort:
          e && e.parameter && e.parameter.sort
            ? String(e.parameter.sort)
            : "submittedAt_desc",
        limit:
          e && e.parameter && e.parameter.limit
            ? String(e.parameter.limit)
            : "",
      });
      return jsonOutput({
        ok: true,
        results: rows,
        filteredTotal: rows.length,
      });
    }
    if (action === "results") {
      return jsonOutput({ ok: true, results: buildAdminResults_() });
    }
    if (action === "studentResult") {
  const submittedAt = e && e.parameter && e.parameter.submittedAt ? String(e.parameter.submittedAt) : "";
  const studentFullName = e && e.parameter && e.parameter.studentFullName ? String(e.parameter.studentFullName) : "";
  const examId = e && e.parameter && e.parameter.examId ? String(e.parameter.examId) : "";
  const reason = e && e.parameter && e.parameter.reason ? String(e.parameter.reason) : "";
  let row = findSubmissionRowByKey_(submittedAt, studentFullName, examId, reason);
  if (!row) row = findSubmissionRowRelaxed_(submittedAt, studentFullName, examId, reason);
  if (!row) return jsonOutput({ ok: false, error: "Submission not found" });

  // Build result once — this is the only expensive call
  const result = buildStudentResultForSubmissionRow_(row);
  const alreadyGraded = String(result.finalWritingBand || "").trim() !== "";

  // If not yet graded, queue it in the background instead of blocking this request
  if (!alreadyGraded) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sh = getSubmissionSheet_(ss);
      const writingJson = sh ? getSubmissionRowObject_(sh, row).writing_json || "" : "";
      if (hasRealWritingContent_(writingJson)) scheduleQueuedWritingProcessing_();
    } catch (schedErr) {
      logSystem_("studentResult", "Failed to schedule grading", { row: row, error: String(schedErr) });
    }
  }

  return jsonOutput({ ok: true, graded: alreadyGraded, result: result });
}
    if (action === "studentObjectiveDetail") {
      const submittedAt =
        e && e.parameter && e.parameter.submittedAt
          ? String(e.parameter.submittedAt)
          : "";
      const studentFullName =
        e && e.parameter && e.parameter.studentFullName
          ? String(e.parameter.studentFullName)
          : "";
      const examId =
        e && e.parameter && e.parameter.examId
          ? String(e.parameter.examId)
          : "";
      const reason =
        e && e.parameter && e.parameter.reason
          ? String(e.parameter.reason)
          : "";
      let row = findSubmissionRowByKey_(
        submittedAt,
        studentFullName,
        examId,
        reason,
      );
      if (!row)
        row = findSubmissionRowRelaxed_(
          submittedAt,
          studentFullName,
          examId,
          reason,
        );
      if (!row) return jsonOutput({ ok: false, error: "Submission not found" });
      const result = buildObjectiveAnswerDetailsForSubmissionRow_(row);
      return jsonOutput({ ok: true, result: result });
    }
    if (action === "listAssignments") {
      return jsonOutput(listAssignmentsAction_(e && e.parameter ? e.parameter : {}));
    }
    if (action === "assignmentStudents") {
      return jsonOutput(assignmentStudentsAction_(e && e.parameter ? e.parameter : {}));
    }
    if (action === "studentAssignments") {
      return jsonOutput(studentAssignmentsAction_({}, e && e.parameter ? e.parameter : {}));
    }
    if (action === "assignmentAccess") {
      return jsonOutput(assignmentAccessAction_({}, e && e.parameter ? e.parameter : {}));
    }
    return ContentService.createTextOutput(
      "OK - Web App is working. Use POST to submit data.",
    ).setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    logSystem_("doGet", "GET failed", { error: String(err) });
    return jsonOutput({ ok: false, error: String(err) });
  }
}
function doPost(e) {
  var worker = verifyWorkerRequest_(e);
  if (!worker.ok) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: worker.error }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const inbound = parseInboundPostData_(e);
    let data = inbound.data || {};
    if ((!data || Object.keys(data).length === 0) && inbound.raw) {
      try {
        data = JSON.parse(inbound.raw);
      } catch (err) {
        data = {};
      }
    }
    const action = String((data && data.action) || (e && e.parameter && e.parameter.action) || "").trim();
    if (action === "assignmentNotify") {
      return jsonOutput(sendAssignmentNotificationEmail_(data));
    }
    if (action === "createAssignment") {
      return jsonOutput(createAssignmentAction_(data || {}));
    }
    if (action === "updateAssignment") {
      return jsonOutput(updateAssignmentAction_(data || {}));
    }
    if (action === "deleteAssignment") {
      return jsonOutput(deleteAssignmentAction_(data || {}));
    }
    if (action === "assignmentStudentsBulk") {
      return jsonOutput(assignmentStudentsBulkAction_(data || {}));
    }
    if (action === "markAssignmentStarted") {
      return jsonOutput(markAssignmentStartedAction_(data || {}));
    }
    if (action === "markAssignmentComplete") {
      return jsonOutput(markAssignmentCompleteAction_(data || {}));
    }
    if (action === "uploadSpeaking")
      return jsonOutput(saveSpeakingUpload_(data));
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = getSubmissionSheet_(ss);
    const submittedAt = String(
      data.submittedAt || new Date().toISOString(),
    ).trim();
    const studentFullName = String(data.studentFullName || "").trim();
    const examId = String(data.examId || "ielts-full-001").trim();
    const reason =
      String(
        data.writing && data.writing.reason
          ? data.writing.reason
          : data.reason || "Student submitted exam.",
      ).trim() || "Student submitted exam.";
    const studentEmail = String(data.studentEmail || "")
      .trim()
      .toLowerCase();
    const signInMethod = String(data.signInMethod || "").trim();
    const organizationId = normalizeOrganizationId_(data.organizationId || "");
    const resolvedIdentity =
      resolveStudentIdentity_(
        studentFullName,
        studentEmail,
        String(data.studentIdCode || ""),
        organizationId,
      ) || null;
    const listeningJson = JSON.stringify(data.listening || null);
    const readingJson = JSON.stringify(data.reading || null);
    const writingJson = JSON.stringify(data.writing || null);
    const hasWriting = hasRealWritingContent_(writingJson);
    let rowNumber = findExistingSubmissionRow_(
      sheet,
      submittedAt,
      studentFullName,
      examId,
      reason,
    );
    let duplicate = false;
    if (!rowNumber) {
      rowNumber = appendSubmissionRow_(sheet, {
        submittedAt: submittedAt,
        studentFullName: studentFullName,
        examId: examId,
        reason: reason,
        organizationId: organizationId,
        listening_json: listeningJson,
        reading_json: readingJson,
        writing_json: writingJson,
        studentIdCode: resolvedIdentity
          ? resolvedIdentity.studentIdCode
          : String(data.studentIdCode || ""),
        classroom: resolvedIdentity ? resolvedIdentity.classroom : "",
        canonicalStudentName: resolvedIdentity
          ? resolvedIdentity.canonicalStudentName
          : studentFullName,
        officialEmail: resolvedIdentity
          ? resolvedIdentity.officialEmail
          : studentEmail,
      });
      SpreadsheetApp.flush();
    } else {
      duplicate = true;
    }
    var submissionMetaRow = upsertSubmissionMeta_(
      submittedAt,
      studentFullName,
      examId,
      reason,
      normalizeOrganizationId_(data.organizationId || ""),
      studentEmail,
      signInMethod,
    );
    if (resolvedIdentity && submissionMetaRow) {
      var ssMeta = SpreadsheetApp.openById(SPREADSHEET_ID);
      var shMeta = getOrCreateSubmissionMetaSheet_(ssMeta);
      var currentMeta = getRowObject_(shMeta, submissionMetaRow);
      setRowObjectByHeaders_(
        shMeta,
        submissionMetaRow,
        applyResolvedIdentityToRowObject_(currentMeta, resolvedIdentity),
        getSubmissionMetaHeaders_(),
      );
    }
    upsertObjectiveResultRow_(rowNumber);
    clearAdminResultsCaches_();
    let immediateGrade = null;
    let immediateGradeError = "";
    try {
      immediateGrade = tryGradeSubmissionNow_(rowNumber);
    } catch (gradeErr) {
      immediateGradeError = String(gradeErr);
      logSystem_("doPost", "Immediate grading failed", {
        row: rowNumber,
        error: immediateGradeError,
      });
      if (hasWriting) scheduleQueuedWritingProcessing_();
      try {
        ensureDetailedResultBlock_(rowNumber);
      } catch (detailErr) {
        logSystem_("doPost", "Results block failed", {
          row: rowNumber,
          error: String(detailErr),
        });
      }
    }
    // Report emails are sent centrally by the Worker (Resend).
    return jsonOutput({
      ok: true,
      duplicate: duplicate,
      rowNumber: rowNumber,
      organizationId: organizationId,
      submittedAt: submittedAt,
      studentFullName: studentFullName,
      examId: examId,
      immediateWritingGraded: Boolean(
        immediateGrade && immediateGrade.graded === true,
      ),
      queuedForWriting: Boolean(
        hasWriting && !(immediateGrade && immediateGrade.graded === true),
      ),
      finalWritingBand:
        immediateGrade && immediateGrade.finalWritingBand
          ? immediateGrade.finalWritingBand
          : "",
      note: hasWriting
        ? immediateGrade && immediateGrade.graded === true
          ? "Submission saved. Writing, Objective Results, and Results were updated immediately."
          : "Submission saved. Immediate writing grading failed, so writing was queued for retry."
        : "Submission saved. Objective Results and Results were updated.",
      immediateGradeError: immediateGradeError || "",
    });
  } catch (err) {
    logSystem_("doPost", "POST failed", { error: String(err) });
    return jsonOutput({ ok: false, error: String(err) });
  }
}
/*********************** SPEAKING************************/ function saveSpeakingUpload_(
  data,
) {
  const studentFullName = String(data.studentFullName || "").trim();
  const submittedAt = String(
    data.submittedAt || new Date().toISOString(),
  ).trim();
  const part1DurationSec = Number(data.part1DurationSec || 0);
  const part2PrepSec = Number(data.part2PrepSec || 0);
  const part2SpeakSec = Number(data.part2SpeakSec || 0);
  const part3DurationSec = Number(data.part3DurationSec || 0);
  const totalDurationSec =
    part1DurationSec + part2PrepSec + part2SpeakSec + part3DurationSec;
  const organizationId = normalizeOrganizationId_(data.organizationId || "");
  const base64Audio = String(data.base64Audio || "").trim();
  const mimeType = String(data.mimeType || "audio/webm").trim();
  if (!studentFullName)
    return { ok: false, error: "studentFullName is required" };
  if (!base64Audio) return { ok: false, error: "No audio data received" };
  const bytes = Utilities.base64Decode(base64Audio);
  const blob = Utilities.newBlob(bytes, mimeType, "upload.webm");
  const folder = DriveApp.getFolderById(SPEAKING_FOLDER_ID);
  const safeName =
    studentFullName.replace(/[^\w\s\-]/g, "").trim() || "student";
  const fileName =
    "IELTS Speaking - " +
    safeName +
    " - " +
    new Date().toISOString().replace(/[:.]/g, "-") +
    ".webm";
  const createdFile = folder.createFile(blob).setName(fileName);
  createdFile.setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW,
  );
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SPEAKING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SPEAKING_SHEET_NAME);
    sheet.appendRow([
      "Submitted At",
      "Student Full Name",
      "Exam ID",
      "Status",
      "File Name",
      "File URL",
      "Total Duration (sec)",
      "Part 1 Duration (sec)",
      "Part 2 Prep (sec)",
      "Part 2 Speak (sec)",
      "Part 3 Duration (sec)",
      "organizationId",
    ]);
  }
  sheet.appendRow([
    submittedAt,
    studentFullName,
    "ielts-speaking-001",
    "uploaded",
    fileName,
    createdFile.getUrl(),
    totalDurationSec,
    part1DurationSec,
    part2PrepSec,
    part2SpeakSec,
    part3DurationSec,
    organizationId,
  ]);
  return {
    ok: true,
    fileName: fileName,
    fileUrl: createdFile.getUrl(),
    rowNumber: sheet.getLastRow(),
    totalDurationSec: totalDurationSec,
  };
}
function testLastEssayGrading() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) throw new Error("No submissions found.");
  return tryGradeSubmissionNow_(sh.getLastRow());
}
/*********************** MAINTENANCE************************/ function ensureStudentIdentityColumns_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateStudentAliasesSheet_(ss);
  ensureSheetHeaders_(
    getOrCreateSubmissionMetaSheet_(ss),
    getSubmissionMetaHeaders_(),
  );
  var submissions = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  ensureSubmissionHeader_(submissions);
  var objective = getOrCreateObjectiveResultsSheet_(ss);
  writeObjectiveResultsHeader_(objective);
  SpreadsheetApp.flush();
}
function looksLikeJsonType_(value, expectedType) {
  const obj = parseJsonSafe_(value);
  return !!(
    obj &&
    String(obj.type || "")
      .trim()
      .toLowerCase() ===
      String(expectedType || "")
        .trim()
        .toLowerCase()
  );
}
function looksLikeWritingPayload_(value) {
  const obj = parseJsonSafe_(value);
  return !!(
    obj &&
    String(obj.type || "")
      .trim()
      .toLowerCase() === "writing" &&
    obj.answers &&
    typeof obj.answers === "object"
  );
}
function maybeOrganizationIdValue_(value) {
  const s = String(value || "").trim();
  return !!s && !/^[\{\[]/.test(s) && s.length <= 120;
}
function buildDetailedResultsBlockMap_(sheet) {
  var out = {};
  if (!sheet || sheet.getLastRow() < 1) return out;
  var values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getDisplayValues();
  for (var i = 0; i < values.length; i++) {
    var cell = String(values[i][0] || "").trim();
    var match = cell.match(/^Submission row:\s*(\d+)$/);
    if (!match) continue;
    out[String(match[1])] = i + 1;
  }
  return out;
}
var REFRESH_LATEST_LIMIT = 50;
function refreshObjectiveScoresOnly() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var submissions = getSubmissionSheet_(ss);
  var objective = getOrCreateObjectiveResultsSheet_(ss);
  ensureSheetHeaders_(objective, getObjectiveResultsHeaders_());
  if (submissions.getLastRow() < 2 || objective.getLastRow() < 2)
    return { ok: true, updated: 0 };
  var writingBandMap = buildWritingOverallBandMap_(ss);
  var objectiveMap = {};
  for (var rowNumber = 2; rowNumber <= objective.getLastRow(); rowNumber++) {
    var current = getObjectiveResultRowObject_(objective, rowNumber);
    var key = makeSubmissionKey_(
      current.submittedAt || "",
      current.studentFullName || "",
      current.examId || "",
      current.reason || "",
    );
    if (!key) continue;
    objectiveMap[key] = rowNumber;
  }
  var lastSubmissionRow = submissions.getLastRow();
  var firstSubmissionRow = Math.max(2, lastSubmissionRow - REFRESH_LATEST_LIMIT + 1);
  var updated = 0;
  for (
    var submissionRow = lastSubmissionRow;
    submissionRow >= firstSubmissionRow;
    submissionRow--
  ) {
    var submission = getSubmissionRowObject_(submissions, submissionRow);
    var resultKey = makeSubmissionKey_(
      submission.submittedAt || "",
      submission.studentFullName || "",
      submission.examId || "",
      submission.reason || "",
    );
    var targetRow = objectiveMap[resultKey];
    if (!targetRow) continue;
    var computed = buildObjectiveResultRow_(
      [
        submission.submittedAt,
        submission.studentFullName,
        submission.examId,
        submission.reason,
        submission.listening_json,
        submission.reading_json,
        submission.writing_json,
        submission.organizationId,
      ],
      ss,
      writingBandMap,
    );
    objective
      .getRange(targetRow, 5, 1, 5)
      .setValues([
        [computed[4], computed[5], computed[6], computed[7], computed[8]],
      ]);
    updated++;
  }
  clearAdminResultsCaches_();
  SpreadsheetApp.flush();
  return { ok: true, updated: updated, scanned: lastSubmissionRow - firstSubmissionRow + 1 };
}
function refreshDetailedResultsOnly() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var detailed = getOrCreateDetailedResultsSheet_(ss);
  var blockMap = buildDetailedResultsBlockMap_(detailed);
  var pairs = Object.keys(blockMap)
    .map(function (key) {
      return { submissionRow: Number(key), startRow: blockMap[key] };
    })
    .filter(function (p) { return p.submissionRow && p.startRow; })
    .sort(function (a, b) { return b.submissionRow - a.submissionRow; })
    .slice(0, REFRESH_LATEST_LIMIT);
  if (!pairs.length) return { ok: true, updated: 0 };
  var updated = 0;
  pairs.forEach(function (p) {
    writeDetailedResultBlock_(detailed, p.submissionRow, p.startRow);
    updated++;
  });
  clearAdminResultsCaches_();
  SpreadsheetApp.flush();
  return { ok: true, updated: updated, scanned: pairs.length };
}
function buildObjectiveAnswerDetailsForSubmissionRow_(submissionRow) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error("Sheet not found: " + SHEET_NAME);
  const row = getSubmissionRowObject_(sh, submissionRow);
  const submittedAt = row.submittedAt || "";
  const studentFullName = row.studentFullName || "";
  const examId = row.examId || "ielts-full-001";
  const reason = row.reason || "";
  const organizationId = normalizeOrganizationId_(row.organizationId || "");
  const resolvedIdentity =
    resolveStudentIdentity_(
      row.studentFullName || "",
      row.officialEmail || "",
      row.studentIdCode || "",
      organizationId,
    ) || null;
  const listeningJson = row.listening_json || "";
  const readingJson = row.reading_json || "";
  const keys = getAnswerKeyValuesFromExamId_(ss, examId);
  const listeningObj = parseJsonSafe_(listeningJson) || {};
  const readingObj = parseJsonSafe_(readingJson) || {};
  const listeningAnswers = getAnswers_(listeningObj);
  const readingAnswers = getAnswers_(readingObj);
  const listening = [];
  const reading = [];
  for (let q = 1; q <= 40; q++) {
    const lStudent =
      listeningAnswers[q] !== undefined ? String(listeningAnswers[q]) : "";
    const lCorrect =
      keys.listening[q - 1] && keys.listening[q - 1][0] !== undefined
        ? String(keys.listening[q - 1][0])
        : "";
    listening.push({
      q: q,
      student: lStudent,
      correct: lCorrect,
      mark: isAnswerCorrect_(lStudent, lCorrect),
    });
    const rStudent =
      readingAnswers[q] !== undefined ? String(readingAnswers[q]) : "";
    const rCorrect =
      keys.reading[q - 1] && keys.reading[q - 1][0] !== undefined
        ? String(keys.reading[q - 1][0])
        : "";
    reading.push({
      q: q,
      student: rStudent,
      correct: rCorrect,
      mark: isAnswerCorrect_(rStudent, rCorrect),
    });
  }
  return {
    organizationId: organizationId,
    submittedAt: submittedAt,
    studentFullName: studentFullName,
    examId: examId,
    reason: reason,
    listening: listening,
    reading: reading,
  };
}
function testSendLastStudentReportEmail() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) throw new Error("No submissions found.");
  return sendStudentReportEmailForSubmissionRow_(sh.getLastRow());
}
function verifyWorkerRequest_(e) {
  var secret = PropertiesService.getScriptProperties().getProperty(
    "WORKER_SIGNING_SECRET",
  );
  if (!secret) {
    return { ok: false, error: "Missing WORKER_SIGNING_SECRET." };
  }
  var method = String(e && e.postData ? "POST" : "GET");
  var timestamp = String(
    (e && e.parameter && e.parameter._workerTs) || "",
  ).trim();
  var providedBodyHash = String(
    (e && e.parameter && e.parameter._workerBodySha256) || "",
  ).trim();
  var providedSignature = String(
    (e && e.parameter && e.parameter._workerSig) || "",
  ).trim();
  if (!timestamp || !providedBodyHash || !providedSignature) {
    return { ok: false, error: "Missing worker signing parameters." };
  }
  var ts = Number(timestamp);
  if (!isFinite(ts)) {
    return { ok: false, error: "Invalid worker timestamp." };
  }
  var maxSkewMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - ts) > maxSkewMs) {
    return { ok: false, error: "Expired worker timestamp." };
  }
  var bodyText =
    e && e.postData && typeof e.postData.contents === "string"
      ? e.postData.contents
      : "";
  var actualBodyHash = sha256Base64Url_(bodyText);
  if (!constantTimeEquals_(providedBodyHash, actualBodyHash)) {
    return { ok: false, error: "Worker body hash mismatch." };
  }
  var canonicalQuery = canonicalizeWorkerQueryString_(
    e && typeof e.queryString === "string" ? e.queryString : "",
  );
  var payload = [method, timestamp, canonicalQuery, providedBodyHash].join(
    "\n",
  );
  var expectedSignature = hmacSha256Base64Url_(payload, secret);
  if (!constantTimeEquals_(providedSignature, expectedSignature)) {
    return { ok: false, error: "Invalid worker signature." };
  }
  return { ok: true };
}
function canonicalizeWorkerParams_(parameters) {
  var pairs = [];
  Object.keys(parameters || {}).forEach(function (key) {
    if (key === "_workerSig") return;
    var values = parameters[key];
    if (!Array.isArray(values)) values = [values];
    values.forEach(function (value) {
      pairs.push([String(key || ""), String(value || "")]);
    });
  });
  pairs.sort(function (a, b) {
    if (a[0] === b[0]) return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
    return a[0] < b[0] ? -1 : 1;
  });
  return pairs
    .map(function (pair) {
      return encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1]);
    })
    .join("&");
}
function canonicalizeWorkerQueryString_(queryString) {
  if (!queryString) return "";
  var parameters = {};
  String(queryString || "")
    .split("&")
    .forEach(function (part) {
      if (!part) return;
      var idx = part.indexOf("=");
      var rawKey = idx >= 0 ? part.slice(0, idx) : part;
      var rawValue = idx >= 0 ? part.slice(idx + 1) : "";
      var key = decodeURIComponent(String(rawKey || "").replace(/\+/g, " "));
      var value = decodeURIComponent(
        String(rawValue || "").replace(/\+/g, " "),
      );
      if (!parameters[key]) parameters[key] = [];
      parameters[key].push(value);
    });
  return canonicalizeWorkerParams_(parameters);
}
function hmacSha256Base64Url_(payload, secret) {
  var signature = Utilities.computeHmacSha256Signature(payload, secret);
  return base64UrlFromBytes_(signature);
}
function sha256Base64Url_(value) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8,
  );
  return base64UrlFromBytes_(digest);
}
function base64UrlFromBytes_(bytes) {
  var base64 = Utilities.base64EncodeWebSafe(bytes);
  return String(base64 || "").replace(/=+$/g, "");
}
function constantTimeEquals_(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a.length !== b.length) return false;
  var mismatch = 0;
  for (var i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
/*********************
 * SUPABASE SYNC
 * Replace your existing "SUPABASE SYNC" block (everything from
 * `const SUPABASE_EXAM_ATTEMPTS_TABLE = ...` down to the bottom
 * of the file) with this entire block.
 *********************/

const SUPABASE_EXAM_ATTEMPTS_TABLE = "exam_attempts";

function getSupabaseConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    url: String(props.getProperty("SUPABASE_URL") || "").replace(/\/+$/, ""),
    key: String(props.getProperty("SUPABASE_SERVICE_ROLE_KEY") || ""),
  };
}

function toNumberOrNull_(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIsoOrNull_(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function postSupabaseUpsertBatch_(cfg, rows) {
  const url =
    cfg.url +
    "/rest/v1/" +
    SUPABASE_EXAM_ATTEMPTS_TABLE +
    "?on_conflict=submitted_at,student_full_name,exam_id";
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      apikey: cfg.key,
      Authorization: "Bearer " + cfg.key,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    payload: JSON.stringify(rows),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code >= 200 && code < 300) return { ok: true };
  return { ok: false, status: code, body: res.getContentText().slice(0, 500) };
}

function buildSupabasePayloadFromObjectiveRow_(row, idx) {
  const submittedAt = toIsoOrNull_(row[idx.submittedAt]);
  const examId = String(row[idx.examId] || "").trim();
  const studentFullName = String(row[idx.studentFullName] || "").trim();
  if (!submittedAt || !examId || !studentFullName) return null;
  return {
    submitted_at: submittedAt,
    student_full_name: studentFullName,
    exam_id: examId,
    reason: String(row[idx.reason] || ""),
    organization_id: String(row[idx.organizationId] || DEFAULT_ORGANIZATION_ID),
    official_email: String(row[idx.officialEmail] || "") || null,
    student_id_code: String(row[idx.studentIdCode] || "") || null,
    listening_total: toNumberOrNull_(row[idx.listeningTotal]),
    listening_band: toNumberOrNull_(row[idx.listeningBand]),
    reading_total: toNumberOrNull_(row[idx.readingTotal]),
    reading_band: toNumberOrNull_(row[idx.readingBand]),
    final_writing_band: toNumberOrNull_(row[idx.finalWritingBand]),
  };
}

function readObjectiveResultsTable_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(OBJECTIVE_RESULTS_SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return null;
  const values = sh
    .getRange(1, 1, sh.getLastRow(), sh.getLastColumn())
    .getValues();
  const headers = values.shift().map((h) => String(h || "").trim());
  const idx = {};
  headers.forEach((h, i) => {
    idx[h] = i;
  });
  const required = [
    "submittedAt",
    "studentFullName",
    "examId",
    "reason",
    "listeningTotal",
    "listeningBand",
    "readingTotal",
    "readingBand",
    "finalWritingBand",
    "organizationId",
    "studentIdCode",
    "officialEmail",
  ];
  for (const k of required) {
    if (idx[k] === undefined)
      throw new Error("Missing column in Objective Results: " + k);
  }
  return { values: values, idx: idx };
}

/**
 * Live-sync called from tryGradeSubmissionNow_ after each grading.
 * Reads the Objective Results sheet + Writing sheet, finds the matching
 * objective row by submission key, enriches with task bands + word counts,
 * and pushes a single upsert to Supabase.
 */
function syncSubmissionToSupabase_(rowNumber) {
  const cfg = getSupabaseConfig_();
  if (!cfg.url || !cfg.key)
    return { ok: false, error: "Supabase not configured" };
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const subSheet = ss.getSheetByName(SHEET_NAME);
  if (!subSheet) return { ok: false, error: "Submission sheet missing" };
  const sub = getSubmissionRowObject_(subSheet, rowNumber);
  if (!sub.studentFullName || !sub.submittedAt || !sub.examId) {
    return { ok: false, error: "Missing identity" };
  }
  const table = readObjectiveResultsTable_();
  if (!table) return { ok: false, error: "Objective Results empty" };
  const targetKey = makeSubmissionKey_(
    sub.submittedAt,
    sub.studentFullName,
    sub.examId,
    sub.reason || "",
  );
  let match = null;
  for (let i = table.values.length - 1; i >= 0; i--) {
    const r = table.values[i];
    const key = makeSubmissionKey_(
      r[table.idx.submittedAt],
      r[table.idx.studentFullName],
      r[table.idx.examId],
      r[table.idx.reason] || "",
    );
    if (key === targetKey) {
      match = r;
      break;
    }
  }
  if (!match) return { ok: false, error: "No matching Objective Results row" };
  const payload = buildSupabasePayloadFromObjectiveRow_(match, table.idx);
  if (!payload) return { ok: false, error: "Payload build failed" };

  // Enrich with writing task bands + word counts from Writing sheet and submission JSON.
  const writingJson = sub.writing_json || "";
  const task1Text = String(getWritingAnswerText_(writingJson, "task1") || "").trim();
  const task2Text = String(getWritingAnswerText_(writingJson, "task2") || "").trim();
  const writingBlock = findWritingBlockGlobal_(ss, sub.studentFullName, task1Text, task2Text);
  payload.task1_band = toNumberOrNull_(writingBlock.task1Band) !== "" ? toNumberOrNull_(writingBlock.task1Band) : null;
  payload.task2_band = toNumberOrNull_(writingBlock.task2Band) !== "" ? toNumberOrNull_(writingBlock.task2Band) : null;
  // Override final_writing_band with Writing sheet value if Objective Results was empty.
  if ((payload.final_writing_band === null || payload.final_writing_band === undefined) && writingBlock.finalWritingBand) {
    payload.final_writing_band = toNumberOrNull_(writingBlock.finalWritingBand) !== "" ? toNumberOrNull_(writingBlock.finalWritingBand) : null;
  }
  // Word counts from submission JSON.
  const t1Words = Number(WRITING_WORDCOUNT(writingJson, "task1") || 0);
  const t2Words = Number(WRITING_WORDCOUNT(writingJson, "task2") || 0);
  payload.task1_words = t1Words > 0 ? t1Words : null;
  payload.task2_words = t2Words > 0 ? t2Words : null;

  return postSupabaseUpsertBatch_(cfg, [payload]);
}

/**
 * Full re-sync: iterates every row in IELTS submissions and pushes complete
 * data (objective + writing task bands + word counts) to Supabase.
 * Safe to run multiple times — upsert is idempotent.
 * Runs in batches of 20 with a resumable cursor stored in script properties.
 */
function resyncAllSubmissionsToSupabase() {
  const cfg = getSupabaseConfig_();
  if (!cfg.url || !cfg.key) throw new Error("Supabase not configured");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const subSheet = ss.getSheetByName(SHEET_NAME);
  if (!subSheet || subSheet.getLastRow() < 2) {
    Logger.log("No submissions found.");
    return { done: true, pushed: 0, failed: 0 };
  }
  const props = PropertiesService.getScriptProperties();
  const cursorKey = "supabase_resync_cursor_v1";
  const TIME_BUDGET_MS = 5 * 60 * 1000;
  const startedAt = Date.now();
  const BATCH_SIZE = 20;

  // Build a pre-loaded Writing sheet values map to avoid re-reading sheet on every iteration.
  const table = readObjectiveResultsTable_();
  const writingSheet = ss.getSheetByName(WRITING_SHEET_NAME);
  const writingValues = writingSheet && writingSheet.getLastRow() > 1
    ? writingSheet.getRange(1, 1, writingSheet.getLastRow(), 7).getDisplayValues()
    : [];

  const lastRow = subSheet.getLastRow();
  let i = Number(props.getProperty(cursorKey) || 2); // row 1 is header
  let pushed = 0, failed = 0;
  const failures = [];

  while (i <= lastRow && Date.now() - startedAt < TIME_BUDGET_MS) {
    const batch = [];
    const end = Math.min(i + BATCH_SIZE - 1, lastRow);
    for (let r = i; r <= end; r++) {
      try {
        const sub = getSubmissionRowObject_(subSheet, r);
        if (!sub.studentFullName || !sub.submittedAt || !sub.examId) continue;

        // Find matching Objective Results row.
        const targetKey = makeSubmissionKey_(sub.submittedAt, sub.studentFullName, sub.examId, sub.reason || "");
        let match = null;
        if (table) {
          for (let k = table.values.length - 1; k >= 0; k--) {
            const tr = table.values[k];
            const key = makeSubmissionKey_(
              tr[table.idx.submittedAt], tr[table.idx.studentFullName],
              tr[table.idx.examId], tr[table.idx.reason] || ""
            );
            if (key === targetKey) { match = tr; break; }
          }
        }
        if (!match) continue; // Skip submissions not yet scored.

        const payload = buildSupabasePayloadFromObjectiveRow_(match, table.idx);
        if (!payload) continue;

        // Enrich with task bands from Writing sheet.
        const writingJson = sub.writing_json || "";
        const task1Text = String(getWritingAnswerText_(writingJson, "task1") || "").trim();
        const task2Text = String(getWritingAnswerText_(writingJson, "task2") || "").trim();
        const targetName = String(sub.studentFullName || "").trim();
        let task1Band = null, task2Band = null, writingFinalBand = null;
        for (let w = 0; w < writingValues.length; w++) {
          const wRow = writingValues[w];
          if (String(wRow[0] || "").trim() === targetName && String(wRow[1] || "").trim() === "Name") {
            const r1 = writingValues[w + 1] || [];
            const r2 = writingValues[w + 2] || [];
            const r3 = writingValues[w + 3] || [];
            if (String(r1[0] || "").trim() === task1Text && String(r2[0] || "").trim() === task2Text) {
              const t1b = toNumberOrNull_(r1[3]);
              const t2b = toNumberOrNull_(r2[3]);
              task1Band = t1b !== "" ? t1b : null;
              task2Band = t2b !== "" ? t2b : null;
              const fb = toNumberOrNull_(r3[3]);
              writingFinalBand = fb !== "" ? fb : null;
              break;
            }
          }
        }
        payload.task1_band = task1Band;
        payload.task2_band = task2Band;
        if (payload.final_writing_band === null && writingFinalBand !== null) {
          payload.final_writing_band = writingFinalBand;
        }
        const t1Words = Number(WRITING_WORDCOUNT(writingJson, "task1") || 0);
        const t2Words = Number(WRITING_WORDCOUNT(writingJson, "task2") || 0);
        payload.task1_words = t1Words > 0 ? t1Words : null;
        payload.task2_words = t2Words > 0 ? t2Words : null;

        batch.push(payload);
      } catch (rowErr) {
        logSystem_("resyncAll", "Row error", { row: r, error: String(rowErr) });
      }
    }
    if (batch.length) {
      const res = postSupabaseUpsertBatch_(cfg, batch);
      if (res.ok) {
        pushed += batch.length;
      } else {
        failed += batch.length;
        if (failures.length < 5) failures.push({ atRow: i, info: res });
      }
    }
    i = end + 1;
    props.setProperty(cursorKey, String(i));
  }

  const done = i > lastRow;
  if (done) props.deleteProperty(cursorKey);
  const summary = { done: done, nextRow: done ? null : i, totalRows: lastRow - 1, pushed: pushed, failed: failed, failures: failures };
  logSystem_("resyncAll", done ? "complete" : "partial (re-run to continue)", summary);
  Logger.log("resyncAllSubmissionsToSupabase: " + JSON.stringify(summary));
  return summary;
}

function resetResyncCursor() {
  PropertiesService.getScriptProperties().deleteProperty("supabase_resync_cursor_v1");
  Logger.log("Resync cursor reset. Run resyncAllSubmissionsToSupabase() to start fresh.");
}

/**
 * Patches ONLY the final_writing_band (and task1/task2 bands + word counts) on existing
 * Supabase rows. Uses HTTP PATCH with exact row filters — never inserts new rows.
 * Run this after manually filling column I in Objective Results.
 *
 * Safe to run multiple times. Only updates rows where Objective Results has a
 * non-empty finalWritingBand.
 */
function patchWritingBandsToSupabase() {
  const cfg = getSupabaseConfig_();
  if (!cfg.url || !cfg.key) throw new Error("Supabase not configured");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const table = readObjectiveResultsTable_();
  if (!table) throw new Error("Objective Results sheet empty or missing required columns");

  const subSheet = ss.getSheetByName(SHEET_NAME);
  const subMap = {}; // key → writing_json, for word counts
  if (subSheet && subSheet.getLastRow() >= 2) {
    const rows = getAllSubmissionRowObjects_(subSheet);
    rows.forEach(function(r) {
      const key = makeSubmissionKey_(r.submittedAt || "", r.studentFullName || "", r.examId || "", r.reason || "");
      if (key) subMap[key] = r.writing_json || "";
    });
  }

  // Also pre-load Writing sheet for task1/task2 bands.
  const writingSheet = ss.getSheetByName(WRITING_SHEET_NAME);
  const writingValues = writingSheet && writingSheet.getLastRow() > 1
    ? writingSheet.getRange(1, 1, writingSheet.getLastRow(), 7).getDisplayValues()
    : [];

  let patched = 0, skipped = 0, failed = 0;
  const failures = [];

  table.values.forEach(function(row) {
    const finalWritingBand = toNumberOrNull_(row[table.idx.finalWritingBand]);
    if (finalWritingBand === null || finalWritingBand === "") return; // nothing to patch
    skipped++;

    const submittedAt = toIsoOrNull_(row[table.idx.submittedAt]);
    const studentFullName = String(row[table.idx.studentFullName] || "").trim();
    const examId = String(row[table.idx.examId] || "").trim();
    const reason = String(row[table.idx.reason] || "");
    if (!submittedAt || !studentFullName || !examId) return;

    // Build patch body with task bands + word counts too.
    const patchBody = { final_writing_band: finalWritingBand };

    const writingJson = subMap[makeSubmissionKey_(submittedAt, studentFullName, examId, reason)] || "";
    if (writingJson) {
      const task1Text = String(getWritingAnswerText_(writingJson, "task1") || "").trim();
      const task2Text = String(getWritingAnswerText_(writingJson, "task2") || "").trim();
      // Look up Writing sheet for task bands.
      for (let w = 0; w < writingValues.length; w++) {
        if (String(writingValues[w][0] || "").trim() === studentFullName && String(writingValues[w][1] || "").trim() === "Name") {
          const r1 = writingValues[w + 1] || [];
          const r2 = writingValues[w + 2] || [];
          if (String(r1[0] || "").trim() === task1Text && String(r2[0] || "").trim() === task2Text) {
            const t1b = toNumberOrNull_(r1[3]);
            const t2b = toNumberOrNull_(r2[3]);
            if (t1b !== null && t1b !== "") patchBody.task1_band = t1b;
            if (t2b !== null && t2b !== "") patchBody.task2_band = t2b;
            break;
          }
        }
      }
      const t1Words = Number(WRITING_WORDCOUNT(writingJson, "task1") || 0);
      const t2Words = Number(WRITING_WORDCOUNT(writingJson, "task2") || 0);
      if (t1Words > 0) patchBody.task1_words = t1Words;
      if (t2Words > 0) patchBody.task2_words = t2Words;
    }

    // PATCH the existing row — never inserts.
    const url = cfg.url + "/rest/v1/" + SUPABASE_EXAM_ATTEMPTS_TABLE
      + "?student_full_name=eq." + encodeURIComponent(studentFullName)
      + "&exam_id=eq." + encodeURIComponent(examId)
      + "&submitted_at=eq." + encodeURIComponent(submittedAt);
    const res = UrlFetchApp.fetch(url, {
      method: "patch",
      contentType: "application/json",
      headers: {
        apikey: cfg.key,
        Authorization: "Bearer " + cfg.key,
        Prefer: "return=minimal",
      },
      payload: JSON.stringify(patchBody),
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code >= 200 && code < 300) {
      patched++;
      skipped--;
    } else {
      failed++;
      skipped--;
      if (failures.length < 10) failures.push({
        name: studentFullName, examId: examId, submittedAt: submittedAt,
        status: code, body: res.getContentText().slice(0, 200)
      });
    }
    Utilities.sleep(50); // avoid rate limits
  });

  logSystem_("patchWritingBands", "done", { patched: patched, failed: failed, failures: failures });
  Logger.log("patchWritingBandsToSupabase: patched=" + patched + ", failed=" + failed);
  if (failures.length) Logger.log("Failures: " + JSON.stringify(failures));
  return { patched: patched, failed: failed, failures: failures };
}

/**
 * Step 1 of full repair: updates finalWritingBand in Objective Results for ALL submissions
 * by re-reading from the Writing sheet. Fixes rows where column I was empty because
 * the initial doPost call wrote the row before writing grading completed.
 * Run this first, then run resyncAllSubmissionsToSupabase().
 */
function refreshAllObjectiveWritingBands() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const submissions = getSubmissionSheet_(ss);
  const objective = getOrCreateObjectiveResultsSheet_(ss);
  ensureSheetHeaders_(objective, getObjectiveResultsHeaders_());
  if (submissions.getLastRow() < 2 || objective.getLastRow() < 2) {
    Logger.log("Nothing to refresh.");
    return { ok: true, updated: 0 };
  }
  const writingBandMap = buildWritingOverallBandMap_(ss);
  // Build secondary fallback map: [studentName || examId] → writingData (uses last match)
  const writingBandMapByNameExam = {};
  Object.keys(writingBandMap).forEach(function(key) {
    const parts = key.split(" || ");
    const altKey = (parts[0] || "") + " || " + ""; // name only, no essay text
    if (!writingBandMapByNameExam[altKey] || writingBandMap[key].finalWritingBand) {
      writingBandMapByNameExam[altKey] = writingBandMap[key];
    }
  });

  // Build index of Objective Results rows by key
  const objectiveMap = {};
  for (let rowNumber = 2; rowNumber <= objective.getLastRow(); rowNumber++) {
    const current = getObjectiveResultRowObject_(objective, rowNumber);
    const key = makeSubmissionKey_(
      current.submittedAt || "", current.studentFullName || "",
      current.examId || "", current.reason || ""
    );
    if (key) objectiveMap[key] = rowNumber;
  }

  let updated = 0;
  for (let submissionRow = 2; submissionRow <= submissions.getLastRow(); submissionRow++) {
    const submission = getSubmissionRowObject_(submissions, submissionRow);
    const resultKey = makeSubmissionKey_(
      submission.submittedAt || "", submission.studentFullName || "",
      submission.examId || "", submission.reason || ""
    );
    const targetRow = objectiveMap[resultKey];
    if (!targetRow) continue;

    const writingJson = submission.writing_json || "";
    const writingKey = [
      String(submission.studentFullName || "").trim(),
      String(getWritingAnswerText_(writingJson, "task1") || "").trim(),
      String(getWritingAnswerText_(writingJson, "task2") || "").trim(),
    ].join(" || ");

    let writingData = writingBandMap[writingKey];
    // Fallback: try name-only match when essay text doesn't match
    if (!writingData || !writingData.finalWritingBand) {
      const altKey = String(submission.studentFullName || "").trim() + " || ";
      writingData = writingBandMapByNameExam[altKey];
    }

    const newBand = (writingData && writingData.finalWritingBand) ? String(writingData.finalWritingBand).trim() : "";
    if (!newBand) continue; // No writing data found — leave existing value

    // Only update if the current finalWritingBand is empty
    const current = getObjectiveResultRowObject_(objective, targetRow);
    if (String(current.finalWritingBand || "").trim() === "") {
      objective.getRange(targetRow, getObjectiveResultsHeaders_().indexOf("finalWritingBand") + 1, 1, 1)
        .setValue(newBand);
      updated++;
    }
  }
  SpreadsheetApp.flush();
  clearAdminResultsCaches_();
  Logger.log("refreshAllObjectiveWritingBands: updated=" + updated + " rows.");
  return { ok: true, updated: updated };
}

/**
 * Full repair in two steps: refresh Objective Results writing bands, then sync to Supabase.
 * Run this once to fix all students showing "Band null" in admin results.
 * If it times out, re-run — both steps are resumable.
 */
function fullRepairAndResync() {
  Logger.log("Step 1: Refreshing Objective Results writing bands...");
  const step1 = refreshAllObjectiveWritingBands();
  Logger.log("Step 1 done: " + JSON.stringify(step1));
  Utilities.sleep(1000);
  Logger.log("Step 2: Syncing all submissions to Supabase...");
  const step2 = resyncAllSubmissionsToSupabase();
  Logger.log("Step 2 done: " + JSON.stringify(step2));
  return { step1: step1, step2: step2 };
}

/**
 * One-time backfill: pushes ALL Objective Results rows to Supabase in batches.
 * Resumable via a script-properties cursor — re-run if it ever times out.
 */
function backfillFromObjectiveResultsSheet() {
  const cfg = getSupabaseConfig_();
  if (!cfg.url || !cfg.key) throw new Error("Supabase not configured");
  const table = readObjectiveResultsTable_();
  if (!table) throw new Error("Objective Results sheet empty");

  const props = PropertiesService.getScriptProperties();
  const cursorKey = "supabase_backfill_cursor_v2";
  let i = Number(props.getProperty(cursorKey) || 0);
  const total = table.values.length;
  const BATCH_SIZE = 100;
  const TIME_BUDGET_MS = 5 * 60 * 1000;
  const startedAt = Date.now();
  let pushed = 0,
    failed = 0;
  const failures = [];

  while (i < total && Date.now() - startedAt < TIME_BUDGET_MS) {
    const slice = table.values.slice(i, i + BATCH_SIZE);
    const payload = [];
    for (const row of slice) {
      const item = buildSupabasePayloadFromObjectiveRow_(row, table.idx);
      if (item) payload.push(item);
    }
    if (payload.length) {
      const res = postSupabaseUpsertBatch_(cfg, payload);
      if (res.ok) pushed += payload.length;
      else {
        failed += payload.length;
        if (failures.length < 5) failures.push({ atIndex: i, info: res });
      }
    }
    i += BATCH_SIZE;
    props.setProperty(cursorKey, String(i));
  }

  const done = i >= total;
  if (done) props.deleteProperty(cursorKey);
  logSystem_("supabaseBackfill", done ? "complete" : "partial", {
    nextIndex: done ? null : i,
    total: total,
    pushed: pushed,
    failed: failed,
    failures: failures,
  });
  return {
    done: done,
    nextIndex: done ? null : i,
    total: total,
    pushed: pushed,
    failed: failed,
    failures: failures,
  };
}

function resetSupabaseBackfillCursorV2() {
  PropertiesService.getScriptProperties().deleteProperty(
    "supabase_backfill_cursor_v2",
  );
}

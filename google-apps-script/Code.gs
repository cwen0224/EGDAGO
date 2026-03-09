const LOG_SHEET_NAME = "EGDA Uploads";
const EMAIL_CODE_CACHE_PREFIX = "egda-email-code:";
const EMAIL_SESSION_CACHE_PREFIX = "egda-email-session:";
const EMAIL_CODE_TTL_SECONDS = 600;
const EMAIL_SESSION_TTL_SECONDS = 21600;

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const action = payload.action || "";
    if (action === "requestEmailLoginCode") {
      const email = normalizeEmail_(payload.email || "");
      requestEmailLoginCode_(email);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, email: email }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "verifyEmailLoginCode") {
      const email = normalizeEmail_(payload.email || "");
      const sessionToken = verifyEmailLoginCode_(email, String(payload.code || ""));
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, email: email, sessionToken: sessionToken }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const fields = payload.fields || {};
    const storedFields = sanitizeStoredFields_(fields);
    const files = payload.files || [];
    const folder = DriveApp.getFolderById(getRequiredSetting_("TARGET_DRIVE_FOLDER_ID"));
    const sheet = getOrCreateSheet_();
    const submissionId = Utilities.getUuid();
    const storedFiles = [];

    files.forEach((file) => {
      const bytes = Utilities.base64Decode(file.contentBase64);
      const blob = Utilities.newBlob(bytes, file.type, file.name);
      const created = folder.createFile(blob);
      storedFiles.push({
        fieldName: file.fieldName,
        fileName: file.name,
        fileId: created.getId(),
        url: created.getUrl(),
        size: file.size
      });
    });

    sheet.appendRow([
      new Date(),
      submissionId,
      fields.submissionStage || "",
      fields.category || "",
      fields.teamName || "",
      fields.contactName || "",
      fields.contactEmail || "",
      JSON.stringify(storedFields),
      JSON.stringify(storedFiles)
    ]);

    const asanaResult = maybeCreateAsanaTask_(fields, storedFiles, submissionId);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, submissionId, files: storedFiles, asana: asanaResult }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  if (action === "asanaTest") {
    const testEmail = e && e.parameter ? e.parameter.email || "" : "";
    const assigneeGid = e && e.parameter ? e.parameter.assigneeGid || "" : "";
    const result = runAsanaTestTask_(testEmail, assigneeGid);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "listSubmissions") {
    try {
      const idToken = e && e.parameter ? e.parameter.idToken || "" : "";
      const sessionToken = e && e.parameter ? e.parameter.sessionToken || "" : "";
      const email = idToken ? getVerifiedGoogleEmail_(idToken) : getVerifiedSessionEmail_(sessionToken);
      const submissions = listSubmissionsForEmail_(email);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, email: email, submissions: submissions }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === "processAsanaEmailQueue") {
    try {
      const result = processAsanaEmailQueue();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, result: result }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "EGDA upload backend is running." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupScriptPropertiesTemplate() {
  const properties = PropertiesService.getScriptProperties();
  const defaults = {
    TARGET_DRIVE_FOLDER_ID: "",
    TARGET_SPREADSHEET_ID: "",
    ASANA_ENABLED: "true",
    ASANA_PERSONAL_ACCESS_TOKEN: "",
    ASANA_PROJECT_GID: "1212853000554713",
    ASANA_SECTION_GID: "1212853000554714",
    ASANA_MAIL_SECTION_GID: "",
    ASANA_MAIL_DONE_SECTION_GID: "",
    ASANA_MAIL_SENDER_NAME: "EGDA2026"
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (properties.getProperty(key) === null) {
      properties.setProperty(key, value);
    }
  });

  return properties.getProperties();
}

function authorizeMailApp() {
  MailApp.sendEmail(Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail(), "EGDA MailApp Authorization", "MailApp authorization test.");
  return true;
}

function installAsanaEmailTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "processAsanaEmailQueue")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("processAsanaEmailQueue")
    .timeBased()
    .everyMinutes(5)
    .create();

  return true;
}

function processAsanaEmailQueue() {
  const mailConfig = getAsanaMailConfig_();
  const tasks = listAsanaSectionTasks_(mailConfig.sectionGid);
  const result = {
    scanned: tasks.length,
    sent: 0,
    skipped: 0,
    errors: []
  };

  tasks.forEach((task) => {
    try {
      if (task.completed) {
        result.skipped += 1;
        return;
      }

      const emailJob = parseAsanaEmailTask_(task);
      if (!emailJob) {
        result.skipped += 1;
        return;
      }

      MailApp.sendEmail({
        to: emailJob.to,
        cc: emailJob.cc || "",
        subject: emailJob.subject,
        body: emailJob.body,
        name: mailConfig.senderName
      });

      commentOnAsanaTask_(
        task.gid,
        `[EGDA_MAIL_SENT] ${new Date().toISOString()} -> ${emailJob.to}${emailJob.cc ? ` / cc: ${emailJob.cc}` : ""}`
      );

      if (mailConfig.doneSectionGid) {
        moveTaskToAsanaSection_(task.gid, mailConfig.doneSectionGid);
      }

      completeAsanaTask_(task.gid);
      result.sent += 1;
    } catch (error) {
      result.errors.push({
        taskGid: task.gid,
        taskName: task.name,
        error: error.message
      });
      try {
        commentOnAsanaTask_(task.gid, `[EGDA_MAIL_ERROR] ${error.message}`);
      } catch (commentError) {
        result.errors.push({
          taskGid: task.gid,
          taskName: task.name,
          error: `Failed to write error comment: ${commentError.message}`
        });
      }
    }
  });

  return result;
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.openById(getRequiredSetting_("TARGET_SPREADSHEET_ID"));
  const existing = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (existing) {
    return existing;
  }

  const sheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
  sheet.appendRow([
    "createdAt",
    "submissionId",
    "submissionStage",
    "category",
    "teamName",
    "contactName",
    "contactEmail",
    "fieldsJson",
    "filesJson"
  ]);
  return sheet;
}

function listSubmissionsForEmail_(email) {
  const spreadsheet = SpreadsheetApp.openById(getRequiredSetting_("TARGET_SPREADSHEET_ID"));
  const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    return [];
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return [];
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  return rows
    .slice(1)
    .map((row) => {
      const fields = parseJsonSafely_(row[7], {});
      const files = parseJsonSafely_(row[8], []);
      return {
        createdAt: row[0],
        submissionId: row[1],
        submissionStage: row[2],
        category: row[3],
        teamName: row[4],
        contactName: row[5],
        contactEmail: row[6],
        fields: sanitizeStoredFields_(fields),
        files: files
      };
    })
    .filter((entry) => {
      const googleEmail = String(entry.fields.googleAccountEmail || "").trim().toLowerCase();
      const contactEmail = String(entry.contactEmail || "").trim().toLowerCase();
      return googleEmail === normalizedEmail || contactEmail === normalizedEmail;
    })
    .reverse();
}

function requestEmailLoginCode_(email) {
  if (!email) {
    throw new Error("Missing email address.");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  CacheService.getScriptCache().put(
    `${EMAIL_CODE_CACHE_PREFIX}${email}`,
    JSON.stringify({ code: code, email: email }),
    EMAIL_CODE_TTL_SECONDS
  );

  MailApp.sendEmail({
    to: email,
    subject: "EGDA2026 驗證碼",
    body: [
      "你的 EGDA2026 驗證碼如下：",
      "",
      code,
      "",
      "此驗證碼 10 分鐘內有效。",
      "若你並未發出此請求，請忽略這封信。"
    ].join("\n")
  });
}

function verifyEmailLoginCode_(email, code) {
  if (!email || !code) {
    throw new Error("Missing email or verification code.");
  }

  const cache = CacheService.getScriptCache();
  const raw = cache.get(`${EMAIL_CODE_CACHE_PREFIX}${email}`);
  const data = parseJsonSafely_(raw, null);
  if (!data || String(data.code) !== String(code).trim()) {
    throw new Error("Invalid or expired verification code.");
  }

  cache.remove(`${EMAIL_CODE_CACHE_PREFIX}${email}`);
  const sessionToken = Utilities.getUuid();
  cache.put(`${EMAIL_SESSION_CACHE_PREFIX}${sessionToken}`, email, EMAIL_SESSION_TTL_SECONDS);
  return sessionToken;
}

function maybeCreateAsanaTask_(fields, storedFiles, submissionId) {
  const asanaConfig = getAsanaConfig_();
  if (!asanaConfig.enabled) {
    return { enabled: false };
  }

  const notes = buildAsanaNotes_(fields, storedFiles, submissionId);
  const payload = {
    data: {
      name: `[EGDA] ${fields.teamName || "未命名隊伍"} / ${fields.projectTitle || "未命名作品"}`,
      notes: notes,
      projects: [asanaConfig.projectGid]
    }
  };

  const assigneeGid = fields.assigneeGid || "";
  if (assigneeGid) {
    payload.data.assignee = assigneeGid;
  }

  if (asanaConfig.sectionGid) {
    payload.data.memberships = [
      {
        project: asanaConfig.projectGid,
        section: asanaConfig.sectionGid
      }
    ];
  }

  const response = UrlFetchApp.fetch("https://app.asana.com/api/1.0/tasks", {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${asanaConfig.personalAccessToken}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseText = response.getContentText();
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(`Asana API error: ${response.getResponseCode()} ${responseText}`);
  }

  return JSON.parse(responseText);
}

function runAsanaTestTask_(testEmail, assigneeGid) {
  const email = testEmail || "cwen0224@gmail.com";
  const testFields = {
    submissionStage: "test",
    category: "asana-test",
    teamName: "EGDA 測試隊伍",
    projectTitle: "Asana 測試任務",
    contactName: "System Test",
    contactEmail: email,
    googleAccountEmail: email,
    assigneeGid: assigneeGid || ""
  };

  return maybeCreateAsanaTask_(testFields, [], `test-${new Date().toISOString()}`);
}

function buildAsanaNotes_(fields, storedFiles, submissionId) {
  const fileLines = storedFiles.length
    ? storedFiles.map((file) => `- ${file.fieldName}: ${file.fileName} (${file.url})`).join("\n")
    : "- 無附件";

  return [
    `submissionId: ${submissionId}`,
    `submissionStage: ${fields.submissionStage || ""}`,
    `category: ${fields.category || ""}`,
    `teamName: ${fields.teamName || ""}`,
    `projectTitle: ${fields.projectTitle || ""}`,
    `contactName: ${fields.contactName || ""}`,
    `contactEmail: ${fields.contactEmail || ""}`,
    `googleAccountEmail: ${fields.googleAccountEmail || ""}`,
    "",
    "files:",
    fileLines
  ].join("\n");
}

function parseAsanaEmailTask_(task) {
  const notes = String(task.notes || "").replace(/\r\n/g, "\n").trim();
  if (!notes) {
    return null;
  }

  const lines = notes.split("\n");
  const marker = String(lines.shift() || "").trim().toUpperCase();
  if (!["EGDA_MAIL", "[EGDA_MAIL]", "EGDA-MAIL"].includes(marker)) {
    return null;
  }

  const headers = {};
  let bodyIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^BODY\s*:/i.test(line)) {
      bodyIndex = index;
      break;
    }

    const matched = line.match(/^([A-Z_]+)\s*:\s*(.*)$/i);
    if (matched) {
      headers[matched[1].toUpperCase()] = matched[2].trim();
    }
  }

  if (bodyIndex === -1) {
    throw new Error("Missing BODY: section.");
  }

  const bodyFirstLine = lines[bodyIndex].replace(/^BODY\s*:\s*/i, "");
  const bodyLines = [bodyFirstLine].concat(lines.slice(bodyIndex + 1));
  const body = bodyLines.join("\n").trim();
  const to = normalizeEmail_(headers.TO || "");
  const cc = String(headers.CC || "")
    .split(",")
    .map((email) => normalizeEmail_(email))
    .filter(Boolean)
    .join(",");
  const subject = String(headers.SUBJECT || task.name || "").trim();

  if (!to) {
    throw new Error("Missing TO: recipient email.");
  }

  if (!subject) {
    throw new Error("Missing SUBJECT: line.");
  }

  if (!body) {
    throw new Error("Missing BODY content.");
  }

  return {
    to: to,
    cc: cc,
    subject: subject,
    body: body
  };
}

function listAsanaSectionTasks_(sectionGid) {
  const response = asanaRequest_("get", `/sections/${sectionGid}/tasks?opt_fields=gid,name,notes,completed,permalink_url`);
  return response.data || [];
}

function commentOnAsanaTask_(taskGid, text) {
  return asanaRequest_("post", `/tasks/${taskGid}/stories`, {
    data: {
      text: text
    }
  });
}

function moveTaskToAsanaSection_(taskGid, sectionGid) {
  return asanaRequest_("post", `/sections/${sectionGid}/addTask`, {
    data: {
      task: taskGid
    }
  });
}

function completeAsanaTask_(taskGid) {
  return asanaRequest_("put", `/tasks/${taskGid}`, {
    data: {
      completed: true
    }
  });
}

function asanaRequest_(method, path, payload) {
  const asanaConfig = getAsanaConfig_();
  if (!asanaConfig.personalAccessToken) {
    throw new Error("Missing Asana personal access token.");
  }

  const options = {
    method: method,
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${asanaConfig.personalAccessToken}`
    },
    muteHttpExceptions: true
  };

  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(`https://app.asana.com/api/1.0${path}`, options);
  const responseText = response.getContentText();
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(`Asana API error: ${response.getResponseCode()} ${responseText}`);
  }

  return parseJsonSafely_(responseText, {});
}

function getVerifiedGoogleEmail_(idToken) {
  if (!idToken) {
    throw new Error("Missing Google ID token.");
  }

  const response = UrlFetchApp.fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    method: "get",
    muteHttpExceptions: true
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("Google sign-in verification failed.");
  }

  const payload = parseJsonSafely_(response.getContentText(), {});
  if (payload.email_verified !== "true" || !payload.email) {
    throw new Error("Google sign-in verification failed.");
  }

  return payload.email;
}

function getVerifiedSessionEmail_(sessionToken) {
  if (!sessionToken) {
    throw new Error("Missing session token.");
  }
  const email = CacheService.getScriptCache().get(`${EMAIL_SESSION_CACHE_PREFIX}${sessionToken}`);
  if (!email) {
    throw new Error("Email login session expired. Please verify again.");
  }
  return email;
}

function sanitizeStoredFields_(fields) {
  const clone = JSON.parse(JSON.stringify(fields || {}));
  delete clone.googleIdToken;
  return clone;
}

function parseJsonSafely_(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function normalizeEmail_(email) {
  return String(email || "").trim().toLowerCase();
}

function getRequiredSetting_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(`Missing script property: ${key}`);
  }
  return value;
}

function getOptionalSetting_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value === null ? fallback : value;
}

function getAsanaConfig_() {
  return {
    enabled: getOptionalSetting_("ASANA_ENABLED", "false") === "true",
    personalAccessToken: getOptionalSetting_("ASANA_PERSONAL_ACCESS_TOKEN", ""),
    projectGid: getOptionalSetting_("ASANA_PROJECT_GID", ""),
    sectionGid: getOptionalSetting_("ASANA_SECTION_GID", "")
  };
}

function getAsanaMailConfig_() {
  const asanaConfig = getAsanaConfig_();
  return {
    personalAccessToken: asanaConfig.personalAccessToken,
    projectGid: asanaConfig.projectGid,
    sectionGid: getRequiredSetting_("ASANA_MAIL_SECTION_GID"),
    doneSectionGid: getOptionalSetting_("ASANA_MAIL_DONE_SECTION_GID", ""),
    senderName: getOptionalSetting_("ASANA_MAIL_SENDER_NAME", "EGDA2026")
  };
}

const LOG_SHEET_NAME = "EGDA Uploads";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const fields = payload.fields || {};
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
      JSON.stringify(fields),
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
    ASANA_SECTION_GID: "1212853000554714"
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (properties.getProperty(key) === null) {
      properties.setProperty(key, value);
    }
  });

  return properties.getProperties();
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

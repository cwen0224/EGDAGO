# EGDA2026 Project Handoff

## Project Goal

This project is a public-facing registration portal for `EGDA2026`.

The intent is to replace EGDA's fragmented Google Form and file-upload workflow with a single GitHub Pages site that:

- lets participants fill in registration data
- uploads files through Google Apps Script to Google Drive
- logs submissions into Google Sheets
- creates Asana tasks for internal follow-up
- supports Google sign-in and email verification login
- lets users review their own past submissions after login

This file is written so another AI or engineer can take over without reconstructing prior context.

## Current Production Targets

GitHub repository:

- `https://github.com/cwen0224/EGDAGO`

GitHub Pages:

- `https://cwen0224.github.io/EGDAGO/`

Current frontend API endpoint in [config.js](/c:/Users/Sang/Desktop/EGDA報名系統/config.js#L1):

- `https://script.google.com/macros/s/AKfycbyouJT5ykXY0cdqL-qginLMqFh_moy4Tu7ButIeVzMOsyUtelSoRaG6e-FZjQr4sYRk/exec`

Apps Script editor project:

- `https://script.google.com/d/1IphaAIiYNs3JGandgaJGCP2HHV1gzZGCLKHSSDc7Kqy-g4qj17wwbi7p/edit`

Current app version:

- `v2026.03.09-1426`

## Architecture

Frontend:

- Static GitHub Pages site
- Main files:
  - [index.html](/c:/Users/Sang/Desktop/EGDA報名系統/index.html)
  - [styles.css](/c:/Users/Sang/Desktop/EGDA報名系統/styles.css)
  - [app.js](/c:/Users/Sang/Desktop/EGDA報名系統/app.js)
  - [config.js](/c:/Users/Sang/Desktop/EGDA報名系統/config.js)

Backend:

- Google Apps Script Web App
- Main file:
  - [Code.gs](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/Code.gs)

Storage:

- Google Drive for uploaded files
- Google Sheet for submission log

Notification:

- Asana task creation from Apps Script
- Asana email queue processing from Apps Script

## What The Frontend Currently Does

Public registration flow:

- category-based form sections
- stage-based upload fields
- dark mode
- zh/en switch
- browser draft save
- Google sign-in
- email verification login
- Asana assignee selector
- visible waiting overlay for slow actions

User account/history flow:

- `Google sign-in` can be used to view prior submissions
- `Email verification login` can also be used to view prior submissions
- users can load a prior submission back into the form

Important UI state:

- Google sign-in button is rendered in two places:
  - top bar
  - hero section
- Email verification login is now a modal entry button placed beside Google sign-in

## What The GAS Backend Currently Does

Submission API:

- accepts JSON payload from frontend
- stores uploaded files into Drive
- appends submission records into Google Sheet
- creates an Asana task if enabled

History API:

- `GET ?action=listSubmissions&idToken=...`
- `GET ?action=listSubmissions&sessionToken=...`

Email login API:

- `POST { action: "requestEmailLoginCode", email }`
- `POST { action: "verifyEmailLoginCode", email, code }`

Utilities:

- `setupScriptPropertiesTemplate()`
- `authorizeMailApp()`
- `installAsanaEmailTrigger()`
- `processAsanaEmailQueue()`
- `doGet()`
- `doPost()`

## Required GAS Script Properties

Configured through Apps Script `Project Settings > Script properties`.

Required:

- `TARGET_DRIVE_FOLDER_ID`
- `TARGET_SPREADSHEET_ID`

Asana:

- `ASANA_ENABLED`
- `ASANA_PERSONAL_ACCESS_TOKEN`
- `ASANA_PROJECT_GID`
- `ASANA_SECTION_GID`
- `ASANA_MAIL_SECTION_GID`
- `ASANA_MAIL_DONE_SECTION_GID`
- `ASANA_MAIL_SENDER_NAME`

Reference example:

- [script-properties.example.json](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/script-properties.example.json)

## Known Important IDs And Settings

Google OAuth frontend client ID:

- `114769317222-agrcn2apovvh3ubbu6fpelcq6imbv1hv.apps.googleusercontent.com`

Asana project in use:

- project name: `AI自動安排任務`
- `ASANA_PROJECT_GID = 1212853000554713`
- `ASANA_SECTION_GID = 1212853000554714`

Known valid Asana user:

- `cwen0224@gmail.com`
- user name: `Sivan`
- `assigneeGid = 1203170629963294`

Frontend assignee config:

- [config.js](/c:/Users/Sang/Desktop/EGDA報名系統/config.js#L1)

## Important Implementation Notes

### 1. Email verification login depends on MailApp permission

If email code sending fails with a permission error, Apps Script needs mail authorization.

Use:

- `authorizeMailApp()`

Open GAS editor, select `authorizeMailApp`, run it once, and approve permissions.

### 2. Frontend and GAS deployments can drift

This happened multiple times during development.

If a feature seems present locally but not online, verify:

- latest `clasp push` happened
- GAS Web App was redeployed
- frontend `submissionEndpoint` matches the newest deployed GAS `exec` URL

### 3. Google sign-in button can disappear if GIS script loads late

The current frontend retries Google Identity initialization several times.
If the button disappears again, check [app.js](/c:/Users/Sang/Desktop/EGDA報名系統/app.js) around `initializeGoogleLogin()`.

### 4. Email verification login currently uses CacheService sessions

This means:

- verification codes expire
- email login sessions expire
- sessions are not persisted in a database

Current TTLs in [Code.gs](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/Code.gs#L1):

- code TTL: `600` seconds
- session TTL: `21600` seconds

### 5. Submission history lookup source

History is reconstructed from the `EGDA Uploads` sheet using:

- stored `fieldsJson`
- stored `filesJson`
- email match against:
  - `googleAccountEmail`
  - `contactEmail`

### 6. Asana assignment model

Asana assignment is no longer fixed in Script Properties.

Current rule:

- frontend sends `assigneeGid`
- GAS uses that value when creating the Asana task

### 7. Asana outbound email queue

There is now a second Asana automation path:

- one specific Asana section acts as a mail queue
- Apps Script scans that section
- if a task description matches the fixed mail syntax, GAS sends the email
- success moves the task to the done section and marks it completed

Current fixed syntax inside Asana task notes:

```txt
EGDA_MAIL
TO: participant@example.com
CC: optional@example.com
SUBJECT: EGDA2026 通知
BODY:
這裡開始是信件內文
```

Related GAS functions:

- `processAsanaEmailQueue()`
- `installAsanaEmailTrigger()`

Manual test endpoint:

- `GET ?action=processAsanaEmailQueue`

Required properties for this flow:

- `ASANA_MAIL_SECTION_GID`
- `ASANA_MAIL_DONE_SECTION_GID`
- `ASANA_MAIL_SENDER_NAME`

## Current UX Decisions

Homepage:

- headline is intentionally shortened to `EGDA2026 報名入口`
- copy is participant-facing, not admin-facing

Waiting UX:

- full-screen loading overlay for:
  - submission
  - email code send
  - email code verify
  - load history

Post-send notice:

- email code send shows a confirmation notice modal

## Current Problem Checklist

If something is broken, check in this order:

1. `config.js` endpoint is the newest GAS `exec` URL
2. GAS has been redeployed after latest `clasp push`
3. MailApp permission is granted
4. Script properties are still present
5. Google OAuth origin settings still include:
   - `https://cwen0224.github.io`
   - local dev origin if needed

## Local Utility Folder

There is a local shortcut folder:

- [快捷連結](/c:/Users/Sang/Desktop/EGDA報名系統/快捷連結)

It contains:

- EGDA official site
- GitHub repo
- GitHub Pages
- GAS editor
- GAS API
- Drive folder
- related Google Forms / Docs

## Files Another AI Should Read First

In order:

1. [HANDOFF.md](/c:/Users/Sang/Desktop/EGDA報名系統/HANDOFF.md)
2. [config.js](/c:/Users/Sang/Desktop/EGDA報名系統/config.js)
3. [app.js](/c:/Users/Sang/Desktop/EGDA報名系統/app.js)
4. [index.html](/c:/Users/Sang/Desktop/EGDA報名系統/index.html)
5. [google-apps-script/Code.gs](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/Code.gs)
6. [google-apps-script/README.md](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/README.md)

## Recommended Next Steps

Highest value next improvements:

1. Add admin-facing management view instead of only participant history lookup.
2. Replace CacheService-based email login with a more durable session model if needed.
3. Add per-field file size / file type validation from EGDA rules instead of one global size.
4. Improve visual polish of login and history flows.
5. Add explicit success page after full submission, not just status text.
6. Add template variables for Asana mail tasks so email bodies can reuse submission data.

## Git Workflow Expectation

User explicitly requested that every code change be pushed.

Required operating rule for future agents:

- if you modify project code, commit it and push to `main`
- do not leave functional changes only in local working tree

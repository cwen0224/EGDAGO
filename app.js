const config = window.EGDA_CONFIG || {};
const form = document.querySelector("#egda-form");
const statusMessage = document.querySelector("#status-message");
const previewPanel = document.querySelector("#preview-panel");
const previewOutput = document.querySelector("#preview-output");
const saveDraftButton = document.querySelector("#save-draft");
const submitButton = form.querySelector('button[type="submit"]');
const themeToggleButton = document.querySelector("#theme-toggle");
const themeToggleLabel = themeToggleButton.querySelector(".theme-toggle-label");
const languageToggleButton = document.querySelector("#language-toggle");
const googleLoginButton = document.querySelector("#google-login-button");
const heroGoogleLoginButton = document.querySelector("#hero-google-login-button");
const googleLogoutButton = document.querySelector("#google-logout");
const loadingOverlay = document.querySelector("#loading-overlay");
const loadingTitle = document.querySelector("#loading-title");
const loadingText = document.querySelector("#loading-text");
const noticeOverlay = document.querySelector("#notice-overlay");
const noticeTitle = document.querySelector("#notice-title");
const noticeText = document.querySelector("#notice-text");
const noticeCloseButton = document.querySelector("#notice-close");
const googleAccountEmailInput = document.querySelector("#google-account-email");
const googleIdTokenInput = document.querySelector("#google-id-token");
const versionBadge = document.querySelector("#version-badge");
const historyLabel = document.querySelector("#history-label");
const historyTitle = document.querySelector("#history-title");
const historyHint = document.querySelector("#history-hint");
const historyList = document.querySelector("#history-list");
const loadHistoryButton = document.querySelector("#load-history");
const emailLoginLabel = document.querySelector("#email-login-label");
const emailCodeLabel = document.querySelector("#email-code-label");
const emailLoginEmailInput = document.querySelector("#email-login-email");
const emailLoginCodeInput = document.querySelector("#email-login-code");
const emailLoginStatus = document.querySelector("#email-login-status");
const sendEmailCodeButton = document.querySelector("#send-email-code");
const verifyEmailCodeButton = document.querySelector("#verify-email-code");
const clearEmailLoginButton = document.querySelector("#clear-email-login");
const categorySelect = document.querySelector("#category-select");
const submissionStageSelect = document.querySelector("#submission-stage");
const stageReminderInput = document.querySelector("#stage-reminder");
const asanaAssigneeField = document.querySelector("#asana-assignee-field");
const asanaAssigneeSelect = document.querySelector("#asana-assignee-select");
const draftKey = config.draftStorageKey || "egda-registration-draft";
const themeKey = "egda-theme";
const languageKey = "egda-language";
const emailSessionKey = "egda-email-login-session";
let submissionHistory = [];
let emailLoginSession = null;
let currentLanguage = "zh";
let busyCounter = 0;
let googleLoginInitAttempts = 0;

const labels = {
  teamName: pickLabel("input[name='teamName']"),
  contactName: pickLabel("input[name='contactName']"),
  contactEmail: pickLabel("input[name='contactEmail']"),
  googleAccountEmail: pickLabel("input[name='googleAccountEmail']"),
  contactPhone: pickLabel("input[name='contactPhone']"),
  organization: pickLabel("input[name='organization']"),
  memberCount: pickLabel("input[name='memberCount']"),
  category: categorySelect.closest("label").querySelector("span"),
  projectTitle: pickLabel("input[name='projectTitle']"),
  learningGoal: pickLabel("textarea[name='learningGoal']"),
  gameBackground: pickLabel("textarea[name='gameBackground']"),
  gameDuration: pickLabel("input[name='gameDuration']"),
  playerCount: pickLabel("input[name='playerCount']"),
  gameplay: pickLabel("textarea[name='gameplay']"),
  components: pickLabel("textarea[name='components']"),
  setup: pickLabel("textarea[name='setup']"),
  props: pickLabel("textarea[name='props']"),
  endCondition: pickLabel("textarea[name='endCondition']"),
  cognitiveDesign: pickLabel("textarea[name='cognitiveDesign']"),
  projectUrl: pickLabel("input[name='projectUrl']"),
  videoUrl: pickLabel("input[name='videoUrl']"),
  projectSummary: pickLabel("textarea[name='projectSummary']"),
  cardOverview: pickLabel("textarea[name='cardOverview']"),
  puzzleContent: pickLabel("textarea[name='puzzleContent']"),
  playMode: pickLabel("input[name='playMode']"),
  hintPolicy: pickLabel("input[name='hintPolicy']"),
  solutionExplanation: pickLabel("textarea[name='solutionExplanation']"),
  submissionStage: submissionStageSelect.closest("label").querySelector("span"),
  stageReminder: stageReminderInput.closest("label").querySelector("span"),
  assigneeGid: asanaAssigneeSelect.closest("label").querySelector("span"),
  consentFile: pickLabel("input[name='consentFile']"),
  paymentProofFile: pickLabel("input[name='paymentProofFile']"),
  rulebookFile: pickLabel("input[name='rulebookFile']"),
  gameManualFile: pickLabel("input[name='gameManualFile']"),
  imageFiles: pickLabel("input[name='imageFiles']"),
  cardAssets: pickLabel("input[name='cardAssets']"),
  referencePhotos: pickLabel("input[name='referencePhotos']"),
  gameBuildFiles: pickLabel("input[name='gameBuildFiles']"),
  bonusFiles: pickLabel("input[name='bonusFiles']"),
  demoFiles: pickLabel("input[name='demoFiles']"),
  attachmentFiles: pickLabel("input[name='attachmentFiles']"),
  notes: pickLabel("textarea[name='notes']"),
  agreeRules: form.querySelector(".checkbox-field span")
};

const ui = {
  description: document.querySelector('meta[name="description"]'),
  heroEyebrow: document.querySelector(".hero .eyebrow"),
  heroTitle: document.querySelector(".hero-copy h1"),
  heroText: document.querySelector(".hero-text"),
  heroPrimary: document.querySelector(".hero-actions .button-primary"),
  heroSecondary: document.querySelector(".hero-actions .button-secondary"),
  infoLabels: Array.from(document.querySelectorAll(".info-strip .info-label")),
  infoBodies: Array.from(document.querySelectorAll(".info-strip article p:last-child")),
  categoriesEyebrow: document.querySelector(".categories .eyebrow"),
  categoriesTitle: document.querySelector(".categories .section-heading h2"),
  categoryTitles: Array.from(document.querySelectorAll(".category-card h3")),
  categoryBodies: Array.from(document.querySelectorAll(".category-card p")),
  formEyebrow: document.querySelector(".form-section .section-heading .eyebrow"),
  formTitle: document.querySelector(".form-section .section-heading h2"),
  formHint: document.querySelector(".form-section > .hint"),
  legends: Array.from(document.querySelectorAll("fieldset legend")),
  uploadHint: document.querySelector("fieldset:nth-of-type(3) .hint"),
  architectureEyebrow: document.querySelector(".architecture .eyebrow"),
  architectureTitle: document.querySelector(".architecture .section-heading h2"),
  architectureCardTitles: Array.from(document.querySelectorAll(".architecture-card h3")),
  architectureCardBodies: Array.from(document.querySelectorAll(".architecture-card p")),
  previewEyebrow: document.querySelector(".preview-panel .eyebrow"),
  previewTitle: document.querySelector(".preview-panel h2"),
  historyLabel,
  historyTitle,
  historyHint,
  loadHistoryButton,
  emailLoginLabel,
  emailCodeLabel,
  emailLoginStatus,
  sendEmailCodeButton,
  verifyEmailCodeButton,
  clearEmailLoginButton
};

const translations = {
  zh: {
    languageToggle: "EN",
    themeDark: "深色模式",
    themeLight: "淺色模式",
    title: "EGDA2026報名系統",
    description: "將 EGDA 報名、作品資訊填寫與附件上傳整合成單一頁面，方便參賽者一次完成送件。",
    heroEyebrow: "EGDA 2026",
    heroTitle: "EGDA2026 報名入口",
    heroText: "歡迎參與 2026 全球華人教育遊戲設計大賞。請依參賽組別與送件階段填寫資料，並於期限內完成附件上傳與報名提交。",
    heroPrimary: "開始報名",
    heroSecondary: "",
    infoLabels: ["報名方式", "第一階段", "第二階段", "送件提醒"],
    infoBodies: [
      "全程線上報名，請依階段上傳指定資料。",
      "2026 年 4 月 24 日 23:59 前完成報名、同意書與繳費證明。",
      "2026 年 4 月 24 日至 2026 年 8 月 14 日上傳作品資料與附件。",
      "請先確認組別、檔案格式與規則書內容是否符合簡章要求。"
    ],
    categoriesEyebrow: "組別資訊",
    categoriesTitle: "目前已對齊數位組、教育實境組與桌遊組規則書欄位",
    categoryTitles: ["教育桌遊設計", "教育實境遊戲設計", "數位教育遊戲設計", "遊戲化教學設計"],
    categoryBodies: [
      "適合以實體配件為主的桌遊作品，可分一般組與學生組。",
      "適合結合實體場域、機關或任務設計的實境作品。",
      "適合全數位作品，通常需提供執行檔、介紹影片與補充文件。",
      "適合教案、課程活動、遊戲化課堂流程等教育應用方案。"
    ],
    formEyebrow: "報名表單",
    formTitle: "依組別切換對應規則書欄位的一頁式送件",
    formHint: "目前欄位已依「2026全球華人教育遊戲設計大賞」第一階段報名與第二階段繳件規則調整。",
    historyLabel: "我的送件紀錄",
    historyTitle: "登入後查看自己先前填寫的表單",
    historyHintSignedOut: "請先使用 Google / Gmail 登入，再載入你先前送出的資料。",
    historyHintSignedIn: "你可以查看自己先前提交過的表單，並將內容載回目前頁面。",
    historyHintEmailSignedIn: "你已使用 Email 驗證登入，可以查看這個 Email 先前提交過的表單。",
    historyLoad: "載入我的紀錄",
    historyLoadIntoForm: "載入到表單",
    historyEmpty: "目前沒有找到你先前提交的表單。",
    historyFiles: "附件",
    loadingTitle: "系統處理中",
    loadingText: "請稍候，這可能需要幾秒鐘。",
    noticeTitle: "已送出",
    noticeClose: "我知道了",
    emailLoginLabel: "Email 驗證登入",
    emailCodeLabel: "6 位數驗證碼",
    emailLoginStatusSignedOut: "也可以用 Email 驗證碼登入後查看自己先前填寫的表單。",
    emailLoginStatusSignedIn: "目前已使用 {email} 完成 Email 驗證登入。",
    emailSendCode: "寄送驗證碼",
    emailVerifyCode: "驗證並登入",
    emailClearLogin: "清除 Email 登入",
    legends: ["1. 隊伍與聯絡資訊", "2. 參賽作品資訊", "3. 檔案上傳", "4. 備註與授權"],
    labels: {
      teamName: "隊伍名稱", contactName: "主要聯絡人", contactEmail: "聯絡 Email", contactPhone: "聯絡電話",
      googleAccountEmail: "Google 登入 Email", organization: "所屬單位 / 學校", memberCount: "隊伍人數", category: "報名組別", projectTitle: "作品名稱",
      learningGoal: "學習目標", gameBackground: "遊戲背景", gameDuration: "遊戲時間", playerCount: "遊戲人數",
      gameplay: "遊戲進行", components: "配件介紹", setup: "遊戲設置", props: "道具",
      endCondition: "遊戲結束條件", cognitiveDesign: "情境、鷹架等等（與認知設計相關之項目）",
      projectUrl: "作品網址 / 試玩連結", videoUrl: "介紹影片連結", projectSummary: "補充",
      cardOverview: "卡片一覽", puzzleContent: "關卡謎題內容", playMode: "單人 / 多人模式",
      hintPolicy: "提示", solutionExplanation: "解析", submissionStage: "送件階段", stageReminder: "目前提醒",
      assigneeGid: "內部通知對象",
      consentFile: "參賽同意書", paymentProofFile: "報名費繳費證明", rulebookFile: "規則書（15MB 以內）",
      gameManualFile: "遊戲說明書", imageFiles: "作品圖片 / 補充圖檔（可多選）",
      cardAssets: "卡片圖檔 / 配件照片（可多選）", referencePhotos: "相關照片（可多選）",
      gameBuildFiles: "遊戲執行檔案", bonusFiles: "企劃設定集 / 美術設定集 / 其他加分文件",
      demoFiles: "執行檔或簡報", attachmentFiles: "補充附件（可多選）", notes: "其他補充說明",
      agreeRules: "我已閱讀比賽規則，並同意主辦單位依活動需求使用本次提交資料。"
    },
    options: {
      digital: "數位教育遊戲設計組", boardgameGeneral: "教育桌遊設計｜一般組",
      boardgameStudent: "教育桌遊設計｜學生組", larp: "教育實境遊戲設計組",
      gamifiedLearning: "遊戲化教學設計組", stage1: "第一階段：報名與繳費", stage2: "第二階段：作品繳件"
    },
    placeholders: {
      learningGoal: "透過本遊戲，學會／練習什麼內容？並說明如何透過遊戲目標達成學習目標。",
      gameBackground: "根據學習目標或遊戲主題，設定遊戲的故事背景。", gameDuration: "例如：20-30 分鐘",
      playerCount: "例如：2-4 人", gameplay: "按步驟描述遊戲流程及遇到任何狀況的處理方式。",
      components: "每種類配件，清楚說明。", setup: "遊戲開始前，如何擺設及發給玩家的配件。",
      props: "卡牌、小工具等等。", endCondition: "計分方法、判斷勝負。",
      cognitiveDesign: "說明遊戲中的教學鷹架、情境設計、提示設計等。", projectUrl: "https://",
      videoUrl: "https://", projectSummary: "其他評審需要知道的補充資訊。",
      cardOverview: "每種類卡片，至少提供五張卡片的正反面及內容介紹；不到五張者全數提供。沒卡片者可註明無。",
      puzzleContent: "含括謎題本身、劇情、裝置、道具、地點等等。", playMode: "例如：多人合作 / 單人挑戰",
      hintPolicy: "可由玩家自由選擇是否使用，以避免卡關。",
      solutionExplanation: "解謎之方式、原因、對照相關所有內容，越詳盡越好。"
    },
    uploadHint: "請先選擇目前要處理的是第一階段報名或第二階段繳件。",
    reminders: { stage1: "第一階段截止：2026-04-24 23:59", stage2: "第二階段收件：2026-04-24 至 2026-08-14" },
    saveDraft: "儲存草稿",
    submit: "送出報名",
    googleLogout: "登出 Google",
    googleEmailPlaceholder: "請先使用 Google / Gmail 登入",
    architectureEyebrow: "部署方式",
    architectureTitle: "GitHub Pages 可以負責前端，Google Apps Script 會把檔案存進 Google Drive",
    architectureCardTitles: ["前端", "提交 API", "檔案儲存"],
    architectureCardBodies: [
      "本專案是純靜態 HTML / CSS / JS，可直接部署到 GitHub Pages。",
      "建議使用 Google Apps Script Web App，接收表單與 Base64 檔案資料。",
      "Apps Script 可把檔案寫進指定 Google Drive 資料夾，並把紀錄寫入 Google Sheet。"
    ],
    previewEyebrow: "送出預覽",
    previewTitle: "尚未設定 API，以下是目前會送出的欄位內容",
    messages: {
      draftSaved: "草稿已儲存在這台裝置。", draftRestored: "已載入先前草稿。", formUpdated: "表單已更新，尚未送出。",
      previewOnly: "目前尚未開放送出，請稍後再試或聯絡主辦單位。", success: "報名資料已成功送出。",
      fileTooLarge: "檔案 {name} 超過 {size}MB 上限。", uploadConverting: "正在轉換檔案並上傳至 Google Drive...",
      uploadConvertingHint: "檔案上傳中，請不要關閉頁面或重複送出。",
      uploadFailed: "送出時發生錯誤。",
      historyLoading: "正在載入你先前提交的資料...",
      historyLoadingHint: "系統正在整理你的送件紀錄。",
      historyLoaded: "已載入你的送件紀錄。",
      historyRestored: "已將先前送件內容載回表單。",
      historyLoginRequired: "請先完成 Google 或 Email 驗證登入後再查看送件紀錄。",
      historyLoadFailed: "無法載入先前送件資料。",
      emailCodeSending: "正在寄送驗證碼...",
      emailCodeSendingHint: "系統正在寄送驗證碼，請稍候，不要重複點擊。",
      emailCodeSent: "驗證碼已寄出，請到信箱查看。",
      emailCodeSentNotice: "驗證碼已寄出到你的 Email，請查看信箱並輸入 6 位數驗證碼。",
      emailCodeSendFailed: "無法寄送驗證碼。",
      emailCodeVerifying: "正在驗證 Email 驗證碼...",
      emailCodeVerifyingHint: "系統正在驗證你輸入的驗證碼。",
      emailLoginSuccess: "Email 驗證成功，現在可以查看自己的送件紀錄。",
      emailLoginFailed: "Email 驗證失敗。",
      emailLoginCleared: "已清除 Email 驗證登入。",
      emailRequired: "請先輸入 Email。",
      emailCodeRequired: "請輸入 6 位數驗證碼。",
      googleSignedIn: "已完成 Google 登入。",
      googleSignedOut: "已登出 Google。",
      googleUnavailable: "Google 登入尚未開放。"
    }
  },
  en: {
    languageToggle: "中文",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    title: "EGDA2026 Registration",
    description: "A single-page EGDA registration flow that combines team info, project details, and file uploads.",
    heroEyebrow: "EGDA 2026",
    heroTitle: "EGDA2026 Registration",
    heroText: "Welcome to the 2026 Global Chinese Educational Game Design Awards. Please complete your category details, required files, and submission steps before the deadline.",
    heroPrimary: "Start Registration",
    heroSecondary: "",
    infoLabels: ["Registration", "Phase 1", "Phase 2", "Reminder"],
    infoBodies: [
      "Complete the registration online and upload the required materials by phase.",
      "Finish registration, signed consent, and payment proof by April 24, 2026 at 23:59.",
      "Upload project materials and attachments from April 24, 2026 to August 14, 2026.",
      "Please confirm your category, file formats, and rulebook contents before submitting."
    ],
    categoriesEyebrow: "Categories",
    categoriesTitle: "Rulebook fields are currently aligned for digital, location-based, and board game groups",
    categoryTitles: ["Educational Board Game Design", "Educational Location-Based Game Design", "Digital Educational Game Design", "Gamified Teaching Design"],
    categoryBodies: [
      "For physical board game works, including general and student divisions.",
      "For works built around physical spaces, mechanisms, and missions.",
      "For fully digital works that usually need a playable build, video, and supporting material.",
      "For lesson plans, classroom activities, and gamified teaching workflows."
    ],
    formEyebrow: "Registration Form",
    formTitle: "Single-page submission with category-based rulebook fields",
    formHint: "The current fields reflect the Phase 1 registration and Phase 2 submission requirements of EGDA 2026.",
    historyLabel: "My Submissions",
    historyTitle: "Sign in to review your previous forms",
    historyHintSignedOut: "Please sign in with Google / Gmail first, then load your previous submissions.",
    historyHintSignedIn: "You can review your previous submissions and load one back into the form.",
    historyHintEmailSignedIn: "You are signed in with email verification and can review submissions for this email address.",
    historyLoad: "Load My History",
    historyLoadIntoForm: "Load Into Form",
    historyEmpty: "No previous submissions were found for this account.",
    historyFiles: "Files",
    loadingTitle: "Processing",
    loadingText: "Please wait. This may take a few seconds.",
    noticeTitle: "Sent",
    noticeClose: "OK",
    emailLoginLabel: "Email Verification Login",
    emailCodeLabel: "6-digit Verification Code",
    emailLoginStatusSignedOut: "You can also sign in with an email verification code to review your previous forms.",
    emailLoginStatusSignedIn: "Email verification is active for {email}.",
    emailSendCode: "Send Code",
    emailVerifyCode: "Verify and Sign In",
    emailClearLogin: "Clear Email Login",
    legends: ["1. Team and Contact", "2. Project Information", "3. File Uploads", "4. Notes and Consent"],
    labels: {
      teamName: "Team Name", contactName: "Primary Contact", contactEmail: "Contact Email", contactPhone: "Contact Phone",
      googleAccountEmail: "Google Sign-in Email", organization: "School / Organization", memberCount: "Team Size", category: "Category", projectTitle: "Project Title",
      themeDark: "Dark Mode", themeLight: "Light Mode",
      learningGoal: "Learning Goal", gameBackground: "Game Background", gameDuration: "Game Duration", playerCount: "Player Count",
      gameplay: "Gameplay", components: "Components", setup: "Setup", props: "Props", endCondition: "End Condition",
      cognitiveDesign: "Scaffolding / Cognitive Design", projectUrl: "Project URL / Demo Link", videoUrl: "Intro Video Link",
      projectSummary: "Additional Notes", cardOverview: "Card Overview", puzzleContent: "Puzzle / Level Content",
      playMode: "Single / Multiplayer Mode", hintPolicy: "Hints", solutionExplanation: "Solution Explanation",
      submissionStage: "Submission Phase", stageReminder: "Reminder", assigneeGid: "Internal Notification Assignee", consentFile: "Signed Consent Form",
      paymentProofFile: "Payment Proof", rulebookFile: "Rulebook (within 15MB)", gameManualFile: "Game Manual",
      imageFiles: "Images / Supporting Screenshots", cardAssets: "Card Assets / Component Photos",
      referencePhotos: "Reference Photos", gameBuildFiles: "Playable Build Files",
      bonusFiles: "Design Docs / Art Book / Bonus Files", demoFiles: "Executable or Slides",
      attachmentFiles: "Extra Attachments", notes: "Other Notes",
      agreeRules: "I have read the competition rules and agree that the organizer may use the submitted materials for event administration."
    },
    options: {
      digital: "Digital Educational Game Design", boardgameGeneral: "Educational Board Game | General",
      boardgameStudent: "Educational Board Game | Student", larp: "Educational Location-Based Game Design",
      gamifiedLearning: "Gamified Teaching Design", stage1: "Phase 1: Registration and Payment", stage2: "Phase 2: Final Submission"
    },
    placeholders: {
      learningGoal: "Explain what learners will learn or practice and how the game goal supports that learning goal.",
      gameBackground: "Describe the story background based on the learning goal or game theme.", gameDuration: "Example: 20-30 minutes",
      playerCount: "Example: 2-4 players", gameplay: "Describe the game flow step by step, including how edge cases are handled.",
      components: "Clearly describe each type of component.", setup: "Explain how to set up the game and distribute components before play starts.",
      props: "Cards, tools, props, and other physical devices.", endCondition: "Scoring method and win / lose condition.",
      cognitiveDesign: "Describe scaffolding, situational design, hints, and other cognitive design choices.", projectUrl: "https://",
      videoUrl: "https://", projectSummary: "Any extra information the judges should know.",
      cardOverview: "For each card type, provide fronts / backs and content notes for at least five cards; if there are fewer than five, include all of them.",
      puzzleContent: "Include puzzle content, story, devices, props, and locations.", playMode: "Example: co-op multiplayer / solo challenge",
      hintPolicy: "Hints can be optionally used by players to avoid getting stuck.",
      solutionExplanation: "Explain the solving method, reasons, and mappings in as much detail as possible."
    },
    uploadHint: "Choose whether you are handling Phase 1 registration or Phase 2 final submission.",
    reminders: { stage1: "Phase 1 deadline: 2026-04-24 23:59", stage2: "Phase 2 window: 2026-04-24 to 2026-08-14" },
    saveDraft: "Save Draft",
    submit: "Submit",
    googleLogout: "Sign Out",
    googleEmailPlaceholder: "Please sign in with Google / Gmail first",
    architectureEyebrow: "Deployment",
    architectureTitle: "GitHub Pages serves the frontend, and Google Apps Script stores uploads in Google Drive",
    architectureCardTitles: ["Frontend", "Submission API", "File Storage"],
    architectureCardBodies: [
      "This project is plain HTML / CSS / JS and can be deployed directly to GitHub Pages.",
      "Use a Google Apps Script web app to receive the form data and Base64 file payloads.",
      "Apps Script can write files into a target Google Drive folder and log records into Google Sheets."
    ],
    previewEyebrow: "Submission Preview",
    previewTitle: "No API endpoint is configured yet. This is the payload that would be sent.",
    messages: {
      draftSaved: "Draft saved on this device.", draftRestored: "Previous draft restored.", formUpdated: "Form updated and not submitted yet.",
      previewOnly: "Submission is not available right now. Please try again later or contact the organizer.", success: "Registration submitted successfully.",
      fileTooLarge: "File {name} exceeds the {size}MB limit.", uploadConverting: "Converting files and uploading to Google Drive...",
      uploadConvertingHint: "Files are uploading. Please do not close the page or submit again.",
      uploadFailed: "An error occurred while submitting.",
      historyLoading: "Loading your previous submissions...",
      historyLoadingHint: "Your submission history is being prepared.",
      historyLoaded: "Your submission history has been loaded.",
      historyRestored: "The selected submission has been restored into the form.",
      historyLoginRequired: "Please sign in with Google or email verification before viewing your submission history.",
      historyLoadFailed: "Failed to load previous submissions.",
      emailCodeSending: "Sending verification code...",
      emailCodeSendingHint: "Your verification code is being sent. Please wait and avoid clicking again.",
      emailCodeSent: "Verification code sent. Please check your inbox.",
      emailCodeSentNotice: "A verification code has been sent to your email. Please check your inbox and enter the 6-digit code.",
      emailCodeSendFailed: "Failed to send verification code.",
      emailCodeVerifying: "Verifying your email code...",
      emailCodeVerifyingHint: "Your verification code is being checked.",
      emailLoginSuccess: "Email verification succeeded. You can now view your submission history.",
      emailLoginFailed: "Email verification failed.",
      emailLoginCleared: "Email verification login cleared.",
      emailRequired: "Please enter your email address first.",
      emailCodeRequired: "Please enter the 6-digit verification code.",
      googleSignedIn: "Google sign-in completed.",
      googleSignedOut: "Signed out from Google.",
      googleUnavailable: "Google sign-in is not available yet."
    }
  }
};

function pickLabel(selector) {
  return form.querySelector(selector).closest("label").querySelector("span");
}

function currentPack() {
  return translations[currentLanguage];
}

function tMessage(key, params = {}) {
  const template = currentPack().messages[key] || key;
  return Object.entries(params).reduce((message, [paramKey, value]) => message.replace(`{${paramKey}}`, value), template);
}

function setStatus(message, state = "") {
  statusMessage.textContent = message;
  if (state) {
    statusMessage.dataset.state = state;
  } else {
    delete statusMessage.dataset.state;
  }
}

function setBusy(isBusy, message = "", detail = "") {
  if (!loadingOverlay || !loadingTitle || !loadingText) {
    return;
  }

  busyCounter = isBusy ? busyCounter + 1 : Math.max(0, busyCounter - 1);
  const shouldShow = busyCounter > 0;
  loadingOverlay.classList.toggle("hidden", !shouldShow);
  document.body.classList.toggle("is-busy", shouldShow);

  if (shouldShow) {
    loadingTitle.textContent = message || currentPack().loadingTitle;
    loadingText.textContent = detail || currentPack().loadingText;
  }
}

function showNotice(title, message) {
  if (!noticeOverlay || !noticeTitle || !noticeText) {
    return;
  }
  noticeTitle.textContent = title || currentPack().noticeTitle;
  noticeText.textContent = message || "";
  noticeOverlay.classList.remove("hidden");
  document.body.classList.add("is-busy");
}

function hideNotice() {
  if (!noticeOverlay) {
    return;
  }
  noticeOverlay.classList.add("hidden");
  if (busyCounter === 0) {
    document.body.classList.remove("is-busy");
  }
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggleLabel.textContent = theme === "dark" ? currentPack().themeLight : currentPack().themeDark;
}

function restoreTheme() {
  const savedTheme = localStorage.getItem(themeKey);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeKey, nextTheme);
  applyTheme(nextTheme);
}

function detectLanguage() {
  if (config.locale && config.locale !== "auto") {
    return config.locale;
  }
  return (localStorage.getItem(languageKey) || navigator.language || "zh-TW").toLowerCase().startsWith("zh") ? "zh" : "en";
}

function applyArrayText(elements, values) {
  elements.forEach((element, index) => {
    if (element && values[index]) {
      element.textContent = values[index];
    }
  });
}

function renderAssigneeOptions() {
  if (!asanaAssigneeField || !asanaAssigneeSelect) {
    return;
  }

  const options = Array.isArray(config.asanaAssigneeOptions) ? config.asanaAssigneeOptions : [];
  asanaAssigneeField.classList.toggle("hidden", options.length === 0);

  const previousValue = asanaAssigneeSelect.value;
  asanaAssigneeSelect.innerHTML = "";

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.gid || "";
    optionElement.textContent = option.label || option.gid || "";
    asanaAssigneeSelect.appendChild(optionElement);
  });

  const hasPreviousValue = options.some((option) => (option.gid || "") === previousValue);
  asanaAssigneeSelect.value = hasPreviousValue ? previousValue : options[0]?.gid || "";
}

function hasHistoryAuth() {
  return Boolean(googleIdTokenInput.value || emailLoginSession?.sessionToken);
}

function getHistoryAuthMode() {
  if (googleIdTokenInput.value) {
    return "google";
  }
  if (emailLoginSession?.sessionToken) {
    return "email";
  }
  return "";
}

function saveEmailLoginSession(session) {
  emailLoginSession = session;
  if (session?.sessionToken) {
    localStorage.setItem(emailSessionKey, JSON.stringify(session));
    emailLoginEmailInput.value = session.email || "";
  } else {
    localStorage.removeItem(emailSessionKey);
  }
  updateHistoryAuthState();
}

function restoreEmailLoginSession() {
  const raw = localStorage.getItem(emailSessionKey);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.sessionToken && parsed?.email) {
      emailLoginSession = parsed;
      emailLoginEmailInput.value = parsed.email;
    }
  } catch (error) {
    localStorage.removeItem(emailSessionKey);
  }
}

function updateHistoryAuthState() {
  if (!historyHint || !loadHistoryButton || !emailLoginStatus) {
    return;
  }
  const mode = getHistoryAuthMode();
  if (mode === "google") {
    historyHint.textContent = currentPack().historyHintSignedIn;
  } else if (mode === "email") {
    historyHint.textContent = currentPack().historyHintEmailSignedIn;
  } else {
    historyHint.textContent = currentPack().historyHintSignedOut;
  }
  emailLoginStatus.textContent = mode === "email"
    ? tMessage("emailLoginStatusSignedIn", { email: emailLoginSession.email })
    : currentPack().emailLoginStatusSignedOut;
  clearEmailLoginButton.classList.toggle("hidden", mode !== "email");
  loadHistoryButton.disabled = !hasHistoryAuth();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function getSelectText(select, value) {
  const option = Array.from(select.options).find((item) => item.value === value);
  return option ? option.textContent : value || "-";
}

function formatSubmissionDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(currentLanguage === "zh" ? "zh-TW" : "en-US");
}

function renderSubmissionHistory(submissions) {
  submissionHistory = submissions;
  historyList.innerHTML = "";

  if (!submissions.length) {
    historyList.innerHTML = `<p class="hint">${escapeHtml(currentPack().historyEmpty)}</p>`;
    return;
  }

  submissions.forEach((submission) => {
    const fields = submission.fields || {};
    const files = Array.isArray(submission.files) ? submission.files : [];
    const fileMarkup = files.length
      ? `<ul class="history-files">${files.map((file) => `<li><a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.fileName)}</a></li>`).join("")}</ul>`
      : "";

    const article = document.createElement("article");
    article.className = "history-card";
    article.innerHTML = `
      <div class="history-card-header">
        <div>
          <h4>${escapeHtml(fields.projectTitle || fields.teamName || submission.submissionId)}</h4>
          <p class="history-meta">
            ${escapeHtml(fields.teamName || "-")}<br>
            ${escapeHtml(getSelectText(categorySelect, fields.category))} / ${escapeHtml(getSelectText(submissionStageSelect, fields.submissionStage))}<br>
            ${escapeHtml(formatSubmissionDate(submission.createdAt))}
          </p>
        </div>
      </div>
      ${fileMarkup}
      <div class="history-actions">
        <button class="button button-secondary" type="button" data-submission-id="${escapeHtml(submission.submissionId)}">${escapeHtml(currentPack().historyLoadIntoForm)}</button>
      </div>
    `;
    historyList.appendChild(article);
  });
}

function restoreSubmissionToForm(fields) {
  Object.entries(fields || {}).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field || value === undefined || Array.isArray(value)) {
      return;
    }
    if (field.type === "checkbox") {
      field.checked = value === true || value === "true" || value === "on";
    } else if (field.type !== "file") {
      field.value = value;
    }
  });

  updateStageFields();
  updateCategoryFields();

  if (googleIdTokenInput.value) {
    setGoogleSignedInState(googleAccountEmailInput.value, googleIdTokenInput.value);
  }

  setStatus(tMessage("historyRestored"), "success");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function fetchJsonResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return text ? JSON.parse(text) : { ok: true };
}

async function loadSubmissionHistory() {
  if (!hasHistoryAuth()) {
    throw new Error(tMessage("historyLoginRequired"));
  }
  if (!config.submissionEndpoint) {
    throw new Error(tMessage("historyLoadFailed"));
  }

  setStatus(tMessage("historyLoading"));
  setBusy(true, tMessage("historyLoading"), tMessage("historyLoadingHint"));
  try {
    const endpoint = new URL(config.submissionEndpoint);
    endpoint.searchParams.set("action", "listSubmissions");
    if (googleIdTokenInput.value) {
      endpoint.searchParams.set("idToken", googleIdTokenInput.value);
    } else if (emailLoginSession?.sessionToken) {
      endpoint.searchParams.set("sessionToken", emailLoginSession.sessionToken);
    }
    const result = await fetchJsonResponse(await fetch(endpoint.toString()));
    if (result.ok === false) {
      throw new Error(result.error || tMessage("historyLoadFailed"));
    }

    renderSubmissionHistory(result.submissions || []);
    setStatus(tMessage("historyLoaded"), "success");
  } finally {
    setBusy(false);
  }
}

async function postAction(payload) {
  if (!config.submissionEndpoint) {
    throw new Error(tMessage("uploadFailed"));
  }
  return fetchJsonResponse(await fetch(config.submissionEndpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }));
}

async function requestEmailVerificationCode() {
  const email = emailLoginEmailInput.value.trim();
  if (!email) {
    throw new Error(tMessage("emailRequired"));
  }
  setStatus(tMessage("emailCodeSending"));
  setBusy(true, tMessage("emailCodeSending"), tMessage("emailCodeSendingHint"));
  try {
    const result = await postAction({ action: "requestEmailLoginCode", email });
    if (result.ok === false) {
      throw new Error(result.error || tMessage("emailCodeSendFailed"));
    }
    setStatus(tMessage("emailCodeSent"), "success");
    showNotice(currentPack().noticeTitle, tMessage("emailCodeSentNotice"));
  } finally {
    setBusy(false);
  }
}

async function verifyEmailVerificationCode() {
  const email = emailLoginEmailInput.value.trim();
  const code = emailLoginCodeInput.value.trim();
  if (!email) {
    throw new Error(tMessage("emailRequired"));
  }
  if (!code) {
    throw new Error(tMessage("emailCodeRequired"));
  }
  setStatus(tMessage("emailCodeVerifying"));
  setBusy(true, tMessage("emailCodeVerifying"), tMessage("emailCodeVerifyingHint"));
  try {
    const result = await postAction({ action: "verifyEmailLoginCode", email, code });
    if (result.ok === false) {
      throw new Error(result.error || tMessage("emailLoginFailed"));
    }
    saveEmailLoginSession({ email: result.email, sessionToken: result.sessionToken });
    emailLoginCodeInput.value = "";
    setStatus(tMessage("emailLoginSuccess"), "success");
  } finally {
    setBusy(false);
  }
}

function applyTranslations() {
  const pack = currentPack();
  document.documentElement.lang = currentLanguage === "zh" ? "zh-Hant" : "en";
  document.title = pack.title;
  if (versionBadge) {
    versionBadge.textContent = config.appVersion || "v2026.03.06";
  }
  if (loadingTitle && loadingText) {
    loadingTitle.textContent = pack.loadingTitle;
    loadingText.textContent = pack.loadingText;
  }
  if (noticeTitle && noticeCloseButton) {
    noticeTitle.textContent = pack.noticeTitle;
    noticeCloseButton.textContent = pack.noticeClose;
  }
  ui.description.setAttribute("content", pack.description);
  languageToggleButton.textContent = pack.languageToggle;
  ui.heroEyebrow.textContent = pack.heroEyebrow;
  ui.heroTitle.textContent = pack.heroTitle;
  ui.heroText.textContent = pack.heroText;
  ui.heroPrimary.textContent = pack.heroPrimary;
  if (ui.heroSecondary) {
    ui.heroSecondary.textContent = pack.heroSecondary;
  }
  applyArrayText(ui.infoLabels, pack.infoLabels);
  applyArrayText(ui.infoBodies, pack.infoBodies);
  ui.historyLabel.textContent = pack.historyLabel;
  ui.historyTitle.textContent = pack.historyTitle;
  ui.loadHistoryButton.textContent = pack.historyLoad;
  ui.emailLoginLabel.textContent = pack.emailLoginLabel;
  ui.emailCodeLabel.textContent = pack.emailCodeLabel;
  ui.sendEmailCodeButton.textContent = pack.emailSendCode;
  ui.verifyEmailCodeButton.textContent = pack.emailVerifyCode;
  ui.clearEmailLoginButton.textContent = pack.emailClearLogin;
  ui.categoriesEyebrow.textContent = pack.categoriesEyebrow;
  ui.categoriesTitle.textContent = pack.categoriesTitle;
  applyArrayText(ui.categoryTitles, pack.categoryTitles);
  applyArrayText(ui.categoryBodies, pack.categoryBodies);
  ui.formEyebrow.textContent = pack.formEyebrow;
  ui.formTitle.textContent = pack.formTitle;
  ui.formHint.textContent = pack.formHint;
  applyArrayText(ui.legends, pack.legends);
  Object.entries(pack.labels).forEach(([key, text]) => {
    if (labels[key]) {
      labels[key].textContent = text;
    }
  });
  categorySelect.querySelector('option[value="digital"]').textContent = pack.options.digital;
  categorySelect.querySelector('option[value="boardgame-general"]').textContent = pack.options.boardgameGeneral;
  categorySelect.querySelector('option[value="boardgame-student"]').textContent = pack.options.boardgameStudent;
  categorySelect.querySelector('option[value="larp"]').textContent = pack.options.larp;
  categorySelect.querySelector('option[value="gamified-learning"]').textContent = pack.options.gamifiedLearning;
  submissionStageSelect.querySelector('option[value="stage1"]').textContent = pack.options.stage1;
  submissionStageSelect.querySelector('option[value="stage2"]').textContent = pack.options.stage2;
  renderAssigneeOptions();
  form.querySelector('textarea[name="learningGoal"]').placeholder = pack.placeholders.learningGoal;
  form.querySelector('textarea[name="gameBackground"]').placeholder = pack.placeholders.gameBackground;
  form.querySelector('input[name="gameDuration"]').placeholder = pack.placeholders.gameDuration;
  form.querySelector('input[name="playerCount"]').placeholder = pack.placeholders.playerCount;
  form.querySelector('textarea[name="gameplay"]').placeholder = pack.placeholders.gameplay;
  form.querySelector('textarea[name="components"]').placeholder = pack.placeholders.components;
  form.querySelector('textarea[name="setup"]').placeholder = pack.placeholders.setup;
  form.querySelector('textarea[name="props"]').placeholder = pack.placeholders.props;
  form.querySelector('textarea[name="endCondition"]').placeholder = pack.placeholders.endCondition;
  form.querySelector('textarea[name="cognitiveDesign"]').placeholder = pack.placeholders.cognitiveDesign;
  form.querySelector('input[name="projectUrl"]').placeholder = pack.placeholders.projectUrl;
  form.querySelector('input[name="videoUrl"]').placeholder = pack.placeholders.videoUrl;
  form.querySelector('textarea[name="projectSummary"]').placeholder = pack.placeholders.projectSummary;
  form.querySelector('textarea[name="cardOverview"]').placeholder = pack.placeholders.cardOverview;
  form.querySelector('textarea[name="puzzleContent"]').placeholder = pack.placeholders.puzzleContent;
  form.querySelector('input[name="playMode"]').placeholder = pack.placeholders.playMode;
  form.querySelector('input[name="hintPolicy"]').placeholder = pack.placeholders.hintPolicy;
  form.querySelector('textarea[name="solutionExplanation"]').placeholder = pack.placeholders.solutionExplanation;
  ui.uploadHint.textContent = pack.uploadHint;
  saveDraftButton.textContent = pack.saveDraft;
  submitButton.textContent = pack.submit;
  googleLogoutButton.textContent = pack.googleLogout;
  googleAccountEmailInput.placeholder = pack.googleEmailPlaceholder;
  emailLoginEmailInput.placeholder = "name@example.com";
  emailLoginCodeInput.placeholder = currentLanguage === "zh" ? "123456" : "123456";
  if (ui.architectureEyebrow) {
    ui.architectureEyebrow.textContent = pack.architectureEyebrow;
    ui.architectureTitle.textContent = pack.architectureTitle;
    applyArrayText(ui.architectureCardTitles, pack.architectureCardTitles);
    applyArrayText(ui.architectureCardBodies, pack.architectureCardBodies);
  }
  if (ui.previewEyebrow) {
    ui.previewEyebrow.textContent = pack.previewEyebrow;
    ui.previewTitle.textContent = pack.previewTitle;
  }
  updateStageReminder();
  updateHistoryAuthState();
  applyTheme(document.body.dataset.theme || "light");
}

function decodeJwtPayload(token) {
  const payload = token.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(normalized);
  return JSON.parse(decoded);
}

function setGoogleSignedInState(email, credential) {
  googleAccountEmailInput.value = email || "";
  googleIdTokenInput.value = credential || "";
  googleLogoutButton.classList.toggle("hidden", !email);
  if (!email && !emailLoginSession?.sessionToken) {
    submissionHistory = [];
    historyList.innerHTML = "";
  }
  updateHistoryAuthState();
}

function handleGoogleCredentialResponse(response) {
  const payload = decodeJwtPayload(response.credential);
  setGoogleSignedInState(payload.email || "", response.credential);
  setStatus(tMessage("googleSignedIn"), "success");
}

function initializeGoogleLogin() {
  if (!config.googleClientId) {
    googleLoginButton.classList.add("hidden");
    heroGoogleLoginButton?.classList.add("hidden");
    googleLogoutButton.classList.add("hidden");
    return;
  }

  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    googleLoginInitAttempts += 1;
    if (googleLoginInitAttempts <= 20) {
      window.setTimeout(initializeGoogleLogin, 300);
    }
    return;
  }

  googleLoginInitAttempts = 0;

  window.google.accounts.id.initialize({
    client_id: config.googleClientId,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  googleLoginButton.innerHTML = "";
  googleLoginButton.classList.remove("hidden");
  window.google.accounts.id.renderButton(googleLoginButton, {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "signin_with",
    locale: currentLanguage === "zh" ? "zh-TW" : "en"
  });

  if (heroGoogleLoginButton) {
    heroGoogleLoginButton.classList.remove("hidden");
    heroGoogleLoginButton.innerHTML = "";
    window.google.accounts.id.renderButton(heroGoogleLoginButton, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      locale: currentLanguage === "zh" ? "zh-TW" : "en"
    });
  }
}

function setLanguage(language) {
  currentLanguage = language;
  localStorage.setItem(languageKey, language);
  applyTranslations();
  initializeGoogleLogin();
}

function toggleLanguage() {
  setLanguage(currentLanguage === "zh" ? "en" : "zh");
}

function updateStageReminder() {
  stageReminderInput.value = currentPack().reminders[submissionStageSelect.value];
}

function updateCategoryFields() {
  const category = categorySelect.value;
  document.querySelectorAll(".category-only").forEach((field) => {
    const groups = (field.dataset.categoryGroup || "").split(",").map((group) => group.trim()).filter(Boolean);
    const isVisible = groups.includes(category) && !field.closest(".stage-only.hidden");
    field.classList.toggle("hidden", !isVisible);
    field.querySelectorAll("input, textarea, select").forEach((input) => {
      if (input.dataset.requiredWhenVisible === "true") {
        input.required = isVisible;
      }
    });
  });
}

function updateStageFields() {
  const stage = submissionStageSelect.value;
  document.querySelectorAll(".stage-only").forEach((field) => {
    const stages = (field.dataset.stageGroup || "").split(",").map((group) => group.trim()).filter(Boolean);
    const isVisible = stages.includes(stage);
    field.classList.toggle("hidden", !isVisible);
    field.querySelectorAll("input, textarea, select").forEach((input) => {
      if (input.dataset.requiredWhenVisible === "true") {
        input.required = isVisible;
      }
    });
  });
  updateStageReminder();
  updateCategoryFields();
}

function getSerializableData(currentForm) {
  const payload = {};
  for (const [key, value] of new FormData(currentForm).entries()) {
    if (value instanceof File) {
      if (!value.name) {
        continue;
      }
      if (!payload[key]) {
        payload[key] = [];
      }
      payload[key].push({ name: value.name, size: value.size, type: value.type || "application/octet-stream" });
      continue;
    }
    if (payload[key]) {
      if (!Array.isArray(payload[key])) {
        payload[key] = [payload[key]];
      }
      payload[key].push(value);
    } else {
      payload[key] = value;
    }
  }
  payload.language = currentLanguage;
  payload.submittedAt = new Date().toISOString();
  return payload;
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify(getSerializableData(form)));
  setStatus(tMessage("draftSaved"), "success");
}

function restoreDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) {
    return;
  }
  try {
    const draft = JSON.parse(raw);
    Object.entries(draft).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field || value === undefined || Array.isArray(value)) {
        return;
      }
      if (field.type === "checkbox") {
        field.checked = value === "on" || value === true;
      } else if (field.type !== "file") {
        field.value = value;
      }
    });
    setStatus(tMessage("draftRestored"), "success");
  } catch (error) {
    console.error("Failed to restore draft", error);
  }
}

function validateFiles() {
  const maxBytes = (config.maxFileSizeMb || 100) * 1024 * 1024;
  form.querySelectorAll('input[type="file"]').forEach((input) => {
    Array.from(input.files).forEach((file) => {
      if (file.size > maxBytes) {
        throw new Error(tMessage("fileTooLarge", { name: file.name, size: config.maxFileSizeMb || 100 }));
      }
    });
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        contentBase64: result.includes(",") ? result.split(",")[1] : result
      });
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function buildSubmissionPayload(currentForm) {
  const fields = {};
  const files = [];
  for (const [key, value] of new FormData(currentForm).entries()) {
    if (value instanceof File) {
      if (!value.name) {
        continue;
      }
      files.push({ fieldName: key, ...(await readFileAsBase64(value)) });
      continue;
    }
    if (fields[key]) {
      if (!Array.isArray(fields[key])) {
        fields[key] = [fields[key]];
      }
      fields[key].push(value);
    } else {
      fields[key] = value;
    }
  }
  return {
    fields,
    files,
    metadata: {
      language: currentLanguage,
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
  };
}

async function submitToEndpoint(currentForm) {
  const response = await fetch(config.submissionEndpoint, {
    method: config.requestMethod || "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(await buildSubmissionPayload(currentForm))
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  if (!text) {
    return { ok: true };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, raw: text };
  }
}

saveDraftButton.addEventListener("click", saveDraft);
loadHistoryButton.addEventListener("click", async () => {
  try {
    await loadSubmissionHistory();
  } catch (error) {
    console.error(error);
    setStatus(error.message || tMessage("historyLoadFailed"), "error");
  }
});
sendEmailCodeButton.addEventListener("click", async () => {
  try {
    await requestEmailVerificationCode();
  } catch (error) {
    console.error(error);
    setStatus(error.message || tMessage("emailCodeSendFailed"), "error");
  }
});
verifyEmailCodeButton.addEventListener("click", async () => {
  try {
    await verifyEmailVerificationCode();
  } catch (error) {
    console.error(error);
    setStatus(error.message || tMessage("emailLoginFailed"), "error");
  }
});
clearEmailLoginButton.addEventListener("click", () => {
  saveEmailLoginSession(null);
  emailLoginCodeInput.value = "";
  historyList.innerHTML = "";
  setStatus(tMessage("emailLoginCleared"), "success");
});
noticeCloseButton.addEventListener("click", hideNotice);
themeToggleButton.addEventListener("click", toggleTheme);
languageToggleButton.addEventListener("click", toggleLanguage);
googleLogoutButton.addEventListener("click", () => {
  setGoogleSignedInState("", "");
  setStatus(tMessage("googleSignedOut"), "success");
});
categorySelect.addEventListener("change", updateCategoryFields);
submissionStageSelect.addEventListener("change", updateStageFields);

form.addEventListener("input", () => {
  setStatus(tMessage("formUpdated"));
});

historyList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-submission-id]");
  if (!button) {
    return;
  }
  const submission = submissionHistory.find((item) => item.submissionId === button.dataset.submissionId);
  if (!submission) {
    return;
  }
  restoreSubmissionToForm(submission.fields || {});
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    validateFiles();
    if (!config.submissionEndpoint) {
      saveDraft();
      setStatus(tMessage("previewOnly"), "error");
      return;
    }
    setStatus(tMessage("uploadConverting"));
    setBusy(true, tMessage("uploadConverting"), tMessage("uploadConvertingHint"));
    const result = await submitToEndpoint(form);
    if (result && result.ok === false) {
      throw new Error(result.error || tMessage("uploadFailed"));
    }
    localStorage.removeItem(draftKey);
    form.reset();
    updateStageFields();
    setStatus(tMessage("success"), "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || tMessage("uploadFailed"), "error");
  } finally {
    setBusy(false);
  }
});

restoreEmailLoginSession();
restoreDraft();
setLanguage(detectLanguage());
restoreTheme();
updateStageFields();
initializeGoogleLogin();

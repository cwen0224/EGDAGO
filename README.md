# EGDA 報名整合頁

這是一個可直接部署到 GitHub Pages 的靜態前端，用來把 EGDA 的報名填寫、作品資訊與附件上傳整合到同一頁。

## 為什麼不能只用 GitHub Pages

GitHub Pages 只能提供靜態檔案，不能直接：

- 接收表單並寫入資料庫
- 保存使用者上傳的檔案
- 做權限驗證或檔案掃毒

所以這個專案的定位是：

- `index.html` / `styles.css` / `app.js`：使用者填表與上傳入口
- 外部 API：真正接收表單與檔案

## 建議架構

前端：

- GitHub Pages

後端擇一：

- Cloudflare Workers + R2 + D1
- Supabase Edge Functions + Supabase Storage
- Firebase Hosting 以外的 Cloud Functions + Firebase Storage
- 自架 Node.js / PHP / Python API

## 快速部署

1. 建立 GitHub repo。
2. 將本目錄檔案推上 repo。
3. 在 repo 設定中開啟 GitHub Pages，來源選擇 `main` branch root。
4. 確認網站可以顯示靜態頁面。

## 串接 Google Drive

目前前端已改成可把表單與檔案送到 Google Apps Script，再由 Apps Script 寫入 Google Drive。

編輯 `config.js`：

```js
window.EGDA_CONFIG = {
  submissionEndpoint: "https://script.google.com/macros/s/your-script-id/exec",
  requestMethod: "POST",
  draftStorageKey: "egda-registration-draft",
  maxFileSizeMb: 100,
  locale: "auto"
};
```

Apps Script 範例在 [Code.gs](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/Code.gs#L1)。

## 語系切換

- 預設依瀏覽器語系自動切換中英文
- 使用者也可以在頁面右上角手動切換
- 目前判斷依據是瀏覽器語系，不是精準地理位置

## 串接 API

編輯 `config.js`：

```js
window.EGDA_CONFIG = {
  submissionEndpoint: "https://your-api.example.com/submit",
  requestMethod: "POST",
  draftStorageKey: "egda-registration-draft",
  maxFileSizeMb: 100
};
```

前端會以 `FormData` 送出所有欄位與檔案，後端需要支援 `multipart/form-data`。

## 目前提供的功能

- 單頁式報名表單
- 作品組別選擇
- 多檔案上傳欄位
- 草稿暫存到瀏覽器 `localStorage`
- 若未設定 API，顯示實際會送出的 JSON 預覽

## 建議下一步

如果你要正式上線，最值得先補的是：

1. 決定後端儲存方案
2. 把正式報名欄位和主辦單位現有 Google 表單逐項對齊
3. 加上管理端或至少通知信機制

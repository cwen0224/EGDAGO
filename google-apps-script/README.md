# Google Apps Script Upload Endpoint

這個資料夾提供 GitHub Pages 前端對接 Google Drive 的最小可用後端。

## 佈署方式

1. 建立一個新的 Google Sheet。
2. 在該 Sheet 中開啟 `擴充功能 > Apps Script`。
3. 把 [Code.gs](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/Code.gs#L1) 內容貼進去。
4. 在 Apps Script 的 `專案設定 > Script properties` 填入設定值。
5. 設定鍵值可直接參考 [script-properties.example.json](/c:/Users/Sang/Desktop/EGDA報名系統/google-apps-script/script-properties.example.json#L1)。
6. 部署成 `Web app`。
7. 執行身分選你自己的 Google 帳號。
8. 存取權限視需求選 `Anyone` 或 `Anyone with Google account`。
9. 複製部署網址，填到 [config.js](/c:/Users/Sang/Desktop/EGDA報名系統/config.js#L1) 的 `submissionEndpoint`。

## 注意

- Apps Script 很適合文件、圖片、PDF、證明檔。
- 若數位教育遊戲組的執行檔很大，Apps Script 會遇到請求大小與執行時間限制。
- 大型執行檔建議改成雲端硬碟分享連結，或改用更適合大檔案的上傳方案。

## Asana 通知

如果你要在有人送出表單後，自動建立 Asana 任務提醒同事：

在 Script Properties 設這幾個值：

- `ASANA_ENABLED`
- `ASANA_PERSONAL_ACCESS_TOKEN`
- `ASANA_PROJECT_GID`
- `ASANA_SECTION_GID`

這樣每次表單送出成功後，Apps Script 也會同步建立一張 Asana 任務。實際要指派給誰，改由前端送出的 `assigneeGid` 決定，不再依賴固定的 Script Property。

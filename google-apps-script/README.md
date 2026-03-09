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

## Asana 自動寄信佇列

如果你要把 Asana 某個區段當成寄信佇列，讓 GAS 自動寄送 Email 給參賽者，請再補這幾個 Script Properties：

- `ASANA_MAIL_SECTION_GID`
- `ASANA_MAIL_DONE_SECTION_GID`
- `ASANA_MAIL_SENDER_NAME`

用途：

- `ASANA_MAIL_SECTION_GID`
  要掃描的寄信佇列區段
- `ASANA_MAIL_DONE_SECTION_GID`
  寄送成功後移入的完成區段，可留空
- `ASANA_MAIL_SENDER_NAME`
  收件者看到的寄件者名稱

Task 描述必須用固定格式：

```txt
EGDA_MAIL
TO: participant@example.com
CC: backup@example.com
SUBJECT: EGDA2026 報名提醒
BODY:
您好，

這裡是要寄出的內文。
可以直接換行。
```

規則：

- 第一行必須是 `EGDA_MAIL`
- `TO:` 必填
- `CC:` 選填，可用逗號分隔多個 Email
- `SUBJECT:` 若省略，會改用 task 標題
- `BODY:` 之後的全部內容都會當成信件正文

執行方式：

1. 在 GAS 執行一次 `installAsanaEmailTrigger()`
2. 它會建立每 5 分鐘執行一次的排程
3. 也可以手動呼叫：
   `GET ?action=processAsanaEmailQueue`

處理結果：

- 成功寄出後，task 會被加上 `[EGDA_MAIL_SENT]` 註記
- 若有設定 `ASANA_MAIL_DONE_SECTION_GID`，task 會移到該區段
- task 也會被標記為 completed
- 若格式錯誤或寄信失敗，task 會被加上 `[EGDA_MAIL_ERROR]` 註記

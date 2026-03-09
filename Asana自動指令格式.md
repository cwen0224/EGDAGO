# Asana 自動指令格式

把任務放進 `AI自動安排任務 > 自動指令` 區段後，請在任務描述填這個格式：

```txt
EGDA_MAIL
TO: participant@example.com
CC: backup@example.com
SEND_AT: 2026-03-15 10:30
SUBJECT: EGDA2026 報名通知
BODY:
您好，

這裡是要寄給參賽者的內容。
可以直接換行。

EGDA2026 工作小組
```

## 規則

- 第一行必須是 `EGDA_MAIL`
- `TO:` 必填，只能放主要收件者 Email
- `CC:` 選填，多個 Email 用逗號分隔
- `SEND_AT:` 選填，格式用 `YYYY-MM-DD HH:mm`
- `SUBJECT:` 選填；若不填，會改用任務名稱
- `BODY:` 之後的全部內容都會當成信件正文

## 寄送時間判斷順序

系統會依這個順序決定什麼時候寄出：

1. 先看 Asana 任務本身的截止日期 / 截止時間
2. 如果任務沒設截止日期，再看描述裡的 `SEND_AT:`
3. 兩者都沒有，就會在掃描到時立即寄送

補充：

- 如果 Asana 只設「截止日期」沒設時間，系統會用該日 `00:00`
- `SEND_AT:` 也可寫成只有日期，例如 `2026-03-15`

## 最小可用範例

```txt
EGDA_MAIL
TO: cwen0224@gmail.com
SUBJECT: EGDA2026 測試通知
BODY:
這是一封測試信。
```

## 指定時間範例

```txt
EGDA_MAIL
TO: cwen0224@gmail.com
SEND_AT: 2026-03-15 10:30
SUBJECT: EGDA2026 預約寄送測試
BODY:
這封信會在指定時間後才寄出。
```

## 建議命名

任務名稱可用：

```txt
[寄信] 初審通知 - 王小明
```

## 目前對應區段

- 自動指令：`1213565045298315`
- 寄件備份：`1213567713364367`

# Asana 自動指令格式

把任務放進 `AI自動安排任務 > 自動指令` 區段後，請在任務描述填這個格式：

```txt
EGDA_MAIL
TO: participant@example.com
CC: backup@example.com
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
- `SUBJECT:` 選填；若不填，會改用任務名稱
- `BODY:` 之後的全部內容都會當成信件正文

## 最小可用範例

```txt
EGDA_MAIL
TO: cwen0224@gmail.com
SUBJECT: EGDA2026 測試通知
BODY:
這是一封測試信。
```

## 建議命名

任務名稱可用：

```txt
[寄信] 初審通知 - 王小明
```

## 目前對應區段

- 自動指令：`1213565045298315`
- 寄件備份：`1213567713364367`

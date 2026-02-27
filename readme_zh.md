# Neon Hell 2088 - AI 驅動的互動劇本遊戲 (繁體中文)

---

## 專案概述

**Neon Hell 2088** 是一款 **AI 驅動的互動劇本遊戲**。玩家自行提供 **Ollama**（BYOLLM）作為 LLM 後端。遊戲透過 `meta.json` 與 `milestones.json` 兩個檔案的腳本引擎載入與執行劇本，呈現動態對話與情節。使用 **Vite + React 19 + TypeScript + Tailwind CSS 4** 打造，採賽博朋克美學設計。

---

## 特色功能

- **AI 互動劇本**：利用玩家自行部署的 Ollama 模型產生即時對話與情節走向。
- **腳本引擎架構**：`meta.json` 定義腳本元資訊，`milestones.json` 描述各階段事件與里程碑。
- **AGPL‑3.0 開源授權**：自由使用、修改與分享，衍生作品亦須採相同授權。
- **現代前端技術棧**：React 19 + TypeScript，搭配 Vite 提供快速熱更新與建構。
- **Tailwind CSS 4**：原子化樣式，快速打造賽博朋克 UI。
- **Buy Me a Coffee**：若喜歡本專案，歡迎支持開發者 https://buymeacoffee.com/prome02

---

## 技術棧

- **Vite** – 超快開發伺服器與建構工具
- **React 19** – 現代 UI 库
- **TypeScript 5** – 靜態型別檢查
- **Tailwind CSS 4** – 原子化樣式框架
- **Ollama** – 玩家自行提供的 LLM 後端（BYOLLM）

---

## 快速開始

### 前置條件

- Node.js (v18 以上) 與 npm
- 已安裝且執行中的 **Ollama** 服務（自行提供模型）

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```
於瀏覽器開啟 http://localhost:5173 觀看遊戲。

### 建構專案

```bash
npm run build
```
產出位於 `dist/`，可使用 `npm run preview` 預覽。

---

## 專案結構

```text
src/
├── App.tsx                # 主要應用程式組件
├── main.tsx               # 應用程式入口點
├── index.css              # 全域樣式
├── App.css                # UI 專屬樣式
└── assets/                # 靜態資源

public/
├── assets/                # 公開資源
│   └── generated/         # AI 產生的圖像
├── vite.svg
└── index.html

data/
├── scripts/
│   ├── neon-hell-2088/
│   │   ├── meta.json      # 劇本元資訊
│   │   └── milestones.json# 劇情里程碑
│   └── ...
└── savegame.json          # 玩家存檔
```

---

## 授權條款

本專案採用 **AGPL‑3.0** 開源授權，詳情請參考 [LICENSE](LICENSE) 檔案。

---

## 參與貢獻

歡迎提交 Issue 或 Pull Request 改進本專案。請遵守以下指引：

1. 使用既有的程式碼風格與格式化規則。
2. 為新功能或變更加入適當的註解與文件說明。
3. 確保所有測試皆通過。
4. 更新相關的 README 或文件說明。

---

**開發者**：prome02

**版本**：v1.0.0

**最後更新**：2026‑02‑27

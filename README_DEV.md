# Neon Hell 2088 - 開發紀錄 (README_DEV.md)

## 專案狀態：P1 環境建立 (Phase 1: Environment Setup)

### P1 完成清單 (Completion List)
- [x] 建立專案目錄 `neon-hell-2088`
- [x] 初始化 Vite (React + TypeScript)
- [x] 安裝 Tailwind CSS 並配置 Cyberpunk 主題顏色
- [x] 建立後端/金融核心資料夾結構:
    - `core/ledger/`
    - `core/rules/`
    - `data/vault/`
- [x] 初始化數據文件 `ledger.jsonl`, `members.json`

### 目前開發進度
環境已就緒，React 前端與核心邏輯目錄已建立。
Tailwind 已配置自定義顏色：`cyber-pink`, `cyber-blue`, `cyber-yellow`, `cyber-red`。

### 下一步建議
1. 實作 `core/ledger` 的基礎帳本寫入邏輯。
2. 設計 `data/vault/members.json` 的初始成員資料架構。

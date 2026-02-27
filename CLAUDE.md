# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neon Hell 2088 is a sci-fi tactical RPG game with a Cyberpunk 2077-inspired aesthetic. Built with Vite + React 19 + TypeScript + Tailwind CSS.

## Development Commands

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 (with custom `tactical` color theme)
- **Code Quality**: ESLint with TypeScript support

## Architecture

The project uses a simple client-side architecture:

- `src/` - React frontend (App.tsx, main.tsx, components)
- `data/` - Game data storage
  - `vault/members.json` - Member/character data
  - `vault/ledger.jsonl` - Transaction/action ledger (JSONL format)
  - `savegame.json` - Save game state
- Tailwind config defines a custom `tactical` theme with colors like `tactical-teal`, `tactical-amber`, `tactical-warn`, `tactical-error`, `tactical-bg`, `tactical-panel`, `tactical-border`

## Model Selection Policy

依任務複雜度選用不同模型以節省 token：

| 模型 | 適用任務 | 範例 |
|------|----------|------|
| **Haiku** | 簡單、機械式操作 | git 操作、檔案搜尋、快速查詢、格式調整 |
| **Sonnet** | 中等複雜度開發 | 功能實作、重構、除錯、程式碼審查 |
| **Opus** | 高複雜度決策 | 架構設計、技術選型、複雜系統規劃 |

使用 Task tool 派發 subagent 時，依上表指定 `model` 參數。

## Notes

- Output language: Traditional Chinese (Taiwan)
- Console logs should be in English
- No emoji in code

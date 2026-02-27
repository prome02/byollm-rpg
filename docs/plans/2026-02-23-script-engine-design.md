# 劇本引擎設計文件

**日期**：2026-02-23
**狀態**：已確認，待實作

---

## 目標

將故事劇本從程式碼中拆解出來，變成可替換的 JSON 格式。引擎負責驅動節點流程，AI 負責生成節點之間的過渡劇情。

---

## 架構概覽

```
瀏覽器（純前端）
├── UI Shell（現有 React 介面）
├── 劇本引擎（節點邏輯、狀態管理）
├── AI 服務（Ollama OpenAI-compatible API）
└── 存檔（localStorage）
```

無後端，無帳號系統。使用者自備 Ollama 環境。

---

## 互動模式

玩家**只能點選選項**，不能自由輸入文字。

傳給 AI 的內容永遠來自劇本 JSON，結構固定：
- `system`：`meta.system_prompt`（劇本作者撰寫）
- `user`：`情境：{milestone.context}，玩家選擇：{milestone.choices[i]}`（兩個值皆來自 JSON）

因此不存在 prompt injection 風險。

---

## 資料結構

### 資料夾佈局

```
data/scripts/
├── neon-hell-2088/
│   ├── meta.json
│   └── milestones.json
└── voyage-to-oort/
    ├── meta.json
    └── milestones.json
```

### meta.json

```json
{
  "id": "neon-hell-2088",
  "title": "霓虹地獄 2088",
  "start": "shipyard-awakening",
  "system_prompt": "你是一個賽博龐克文字冒險遊戲的敘事者。世界觀：2088年台灣，義體改造普及，Josh是一個左臂熔毀的傭兵，正在淡水河廢棄造船廠求生。風格：黑色電影、簡短有力、繁體中文。每次回應限100-150字。"
}
```

### milestones.json

節點之間形成網狀結構，收斂為 2-3 個結局。`choices` 為空陣列代表結局節點。

```json
[
  {
    "id": "shipyard-awakening",
    "title": "造船廠·甦醒",
    "context": "Josh 在淡水河廢棄造船廠坑道醒來，左臂熔毀離線，體溫極低，還有2支菸和5%電量的終端",
    "image": "mud_beach_rescue.png",
    "choices": ["點最後一支菸撐著", "嘗試啟動終端發信號"],
    "next": {
      "點最後一支菸撐著": "signal-received",
      "嘗試啟動終端發信號": "signal-received"
    }
  },
  {
    "id": "signal-received",
    "title": "信號·應答",
    "context": "有人接收到了信號，但 Josh 的意識開始模糊",
    "image": "josh_remix_final.png",
    "choices": ["保持清醒等待", "放棄抵抗，閉上眼睛"],
    "next": {
      "保持清醒等待": "ending-survival",
      "放棄抵抗，閉上眼睛": "ending-drift"
    }
  },
  {
    "id": "ending-survival",
    "title": "結局·生還",
    "context": "Josh 被找到了",
    "image": "josh_remix_final.png",
    "choices": [],
    "next": {}
  },
  {
    "id": "ending-drift",
    "title": "結局·漂流",
    "context": "Josh 的意識融入了網絡",
    "image": "josh_remix_final.png",
    "choices": [],
    "next": {}
  }
]
```

**選填欄位**：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `telemetry` | `Record<string, string>` | 遙測數據標籤與初始值 |

---

## TypeScript 型別定義

```typescript
interface ScriptMeta {
  id: string;
  title: string;
  start: string;
  system_prompt: string;
}

interface Milestone {
  id: string;
  title: string;
  context: string;
  image: string;
  choices: string[];
  next: Record<string, string>;
  telemetry?: Record<string, string>;
}

interface SaveGame {
  script_id: string;
  current_milestone: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface OllamaConfig {
  endpoint: string;   // 預設 http://localhost:11434
  model: string;      // 預設 minimax-m2.5:cloud
}
```

---

## 引擎運作流程

```
啟動
 ↓
從 localStorage 讀取 OllamaConfig
若不存在 → Entry Page 要求輸入 endpoint + model
 ↓
從 localStorage 讀取 SaveGame
若不存在 → 從 meta.start 節點開始，history 為空
 ↓
載入當前節點，顯示 choices
 ↓
玩家點選其中一個選項
 ↓
呼叫 Ollama API（streaming）：
  system: meta.system_prompt
  messages: history + {
    role: 'user',
    content: '情境：{milestone.context}，玩家選擇：{choice}'
  }
 ↓
即時顯示 AI 回傳的劇情文字（streaming）
 ↓
AI 回應結束後，更新 history，存入 localStorage
 ↓
根據 milestone.next[choice] 跳到下一節點
 ↓
重複，直到 choices 為空（結局節點）
```

---

## Entry Page 改動

「終端訪問密鑰」輸入改為兩個欄位：

| 欄位 | 預設值 |
|------|--------|
| Ollama Endpoint | `http://localhost:11434` |
| 模型名稱 | `minimax-m2.5:cloud` |

存入 localStorage key `ollama_config`。

---

## 不在此版本範圍內

- 遙測數據與劇情的連動
- player / inventory 狀態注入 AI prompt
- 多劇本選擇介面
- 音效系統

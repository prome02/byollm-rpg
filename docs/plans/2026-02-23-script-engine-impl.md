# Script Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將劇本從 App.tsx 的 hardcode 拆解為 JSON 驅動的引擎，並串接 Ollama API 生成過渡劇情。

**Architecture:** 新增 `src/types/script.ts` 定義型別，`src/services/` 放 Ollama 呼叫與 localStorage 存取，`data/scripts/` 放劇本 JSON。Entry Page 改為收集 Ollama 設定。MainPage 改為從引擎狀態讀取資料。

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Ollama OpenAI-compatible API (fetch + ReadableStream for streaming)

---

### Task 1: 建立型別定義

**Files:**
- Create: `src/types/script.ts`

**Step 1: 建立型別檔案**

```typescript
// src/types/script.ts

export interface ScriptMeta {
  id: string;
  title: string;
  start: string;
  system_prompt: string;
}

export interface Milestone {
  id: string;
  title: string;
  context: string;
  image: string;
  choices: string[];
  next: Record<string, string>;
  telemetry?: Record<string, string>;
}

export interface SaveGame {
  script_id: string;
  current_milestone: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface OllamaConfig {
  endpoint: string;
  model: string;
}
```

**Step 2: Commit**

```bash
git add src/types/script.ts
git commit -m "feat: 新增劇本引擎型別定義"
```

---

### Task 2: 建立劇本 JSON 資料

**Files:**
- Create: `data/scripts/neon-hell-2088/meta.json`
- Create: `data/scripts/neon-hell-2088/milestones.json`
- Create: `data/scripts/voyage-to-oort/meta.json`
- Create: `data/scripts/voyage-to-oort/milestones.json`

**Step 1: 建立 neon-hell-2088/meta.json**

```json
{
  "id": "neon-hell-2088",
  "title": "霓虹地獄 2088",
  "start": "shipyard-awakening",
  "system_prompt": "你是一個賽博龐克文字冒險遊戲的敘事者。世界觀：2088年台灣，義體改造普及，Josh是一個左臂熔毀的傭兵，正在淡水河廢棄造船廠求生。風格：黑色電影、簡短有力、繁體中文。每次回應限100-150字。不要重複玩家的選擇，直接寫後續發展。"
}
```

**Step 2: 建立 neon-hell-2088/milestones.json**

```json
[
  {
    "id": "shipyard-awakening",
    "title": "造船廠·甦醒",
    "context": "Josh 在淡水河廢棄造船廠坑道醒來，左臂熔毀離線，體溫極低，口袋裡還有2支菸和電量只剩5%的審判者戰術終端",
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
    "context": "遠方有人接收到了隱藏信號，但Josh的體溫持續下降，意識開始模糊",
    "image": "josh_remix_final.png",
    "choices": ["集中意識，保持清醒", "放鬆，閉上眼睛等待"],
    "next": {
      "集中意識，保持清醒": "ending-survival",
      "放鬆，閉上眼睛等待": "ending-drift"
    }
  },
  {
    "id": "ending-survival",
    "title": "結局·生還",
    "context": "救援小隊找到了Josh，廢棄造船廠的坑道裡出現了手電筒的光",
    "image": "josh_remix_final.png",
    "choices": [],
    "next": {}
  },
  {
    "id": "ending-drift",
    "title": "結局·漂流",
    "context": "Josh的意識在失溫中漂離身體，最後的畫面是淡水河上的霓虹倒影",
    "image": "mud_beach_rescue.png",
    "choices": [],
    "next": {}
  }
]
```

**Step 3: 建立 voyage-to-oort/meta.json**

```json
{
  "id": "voyage-to-oort",
  "title": "航向奧爾特雲",
  "start": "l2-relay",
  "system_prompt": "你是一個深空任務文字冒險遊戲的敘事者。世界觀：2088年，人類首次嘗試抵達奧爾特雲，操作員在L2中繼站維持信號連線。風格：硬科幻、精準、繁體中文。每次回應限100-150字。不要重複玩家的選擇，直接寫後續發展。"
}
```

**Step 4: 建立 voyage-to-oort/milestones.json**

```json
[
  {
    "id": "l2-relay",
    "title": "L2中繼站",
    "context": "操作員在L2拉格朗日點的阿爾法中繼站，來自奧爾特雲方向的遙測數據出現異常波動",
    "image": "style_nasa.png",
    "choices": ["校準天線陣列", "分析異常信號"],
    "next": {
      "校準天線陣列": "signal-anomaly",
      "分析異常信號": "signal-anomaly"
    }
  },
  {
    "id": "signal-anomaly",
    "title": "信號異常",
    "context": "信號源確認：不是設備故障，是來自奧爾特雲深處的未知回波",
    "image": "style_cyberpunk.png",
    "choices": ["回傳確認信號", "靜默監聽"],
    "next": {
      "回傳確認信號": "ending-contact",
      "靜默監聽": "ending-silence"
    }
  },
  {
    "id": "ending-contact",
    "title": "結局·接觸",
    "context": "回傳信號後，對方開始回應，這是人類史上第一次星際通訊",
    "image": "style_nasa.png",
    "choices": [],
    "next": {}
  },
  {
    "id": "ending-silence",
    "title": "結局·靜默",
    "context": "靜默監聽持續了72小時，信號自行消失，記錄封存，不對外公開",
    "image": "style_nasa.png",
    "choices": [],
    "next": {}
  }
]
```

**Step 5: Commit**

```bash
git add data/scripts/
git commit -m "feat: 新增兩套劇本 JSON（霓虹地獄 2088 與航向奧爾特雲）"
```

---

### Task 3: localStorage 存取服務

**Files:**
- Create: `src/services/storage.ts`

**Step 1: 建立 storage.ts**

```typescript
// src/services/storage.ts
import type { SaveGame, OllamaConfig } from '../types/script';

const KEYS = {
  OLLAMA_CONFIG: 'ollama_config',
  SAVE_GAME: 'save_game',
} as const;

const DEFAULT_CONFIG: OllamaConfig = {
  endpoint: 'http://localhost:11434',
  model: 'minimax-m2.5:cloud',
};

export function loadOllamaConfig(): OllamaConfig {
  try {
    const raw = localStorage.getItem(KEYS.OLLAMA_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveOllamaConfig(config: OllamaConfig): void {
  localStorage.setItem(KEYS.OLLAMA_CONFIG, JSON.stringify(config));
}

export function loadSaveGame(): SaveGame | null {
  try {
    const raw = localStorage.getItem(KEYS.SAVE_GAME);
    if (!raw) return null;
    return JSON.parse(raw) as SaveGame;
  } catch {
    return null;
  }
}

export function saveSaveGame(game: SaveGame): void {
  localStorage.setItem(KEYS.SAVE_GAME, JSON.stringify(game));
}

export function clearSaveGame(): void {
  localStorage.removeItem(KEYS.SAVE_GAME);
}
```

**Step 2: Commit**

```bash
git add src/services/storage.ts
git commit -m "feat: 新增 localStorage 存取服務"
```

---

### Task 4: Ollama API 服務

**Files:**
- Create: `src/services/ollama.ts`

**Step 1: 建立 ollama.ts**

```typescript
// src/services/ollama.ts
import type { OllamaConfig } from '../types/script';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function streamCompletion(
  config: OllamaConfig,
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${config.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      onError(`連線失敗：${response.status} ${response.statusText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('無法讀取回應串流');
      return;
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content ?? '';
          if (text) {
            fullText += text;
            onChunk(text);
          }
        } catch {
          // 忽略解析失敗的 chunk
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    onError(`網路錯誤：${err instanceof Error ? err.message : String(err)}`);
  }
}
```

**Step 2: Commit**

```bash
git add src/services/ollama.ts
git commit -m "feat: 新增 Ollama streaming API 服務"
```

---

### Task 5: 劇本載入服務

**Files:**
- Create: `src/services/scriptLoader.ts`

**Step 1: 建立 scriptLoader.ts**

```typescript
// src/services/scriptLoader.ts
import type { ScriptMeta, Milestone } from '../types/script';

export async function loadScriptMeta(scriptId: string): Promise<ScriptMeta> {
  const response = await fetch(`/data/scripts/${scriptId}/meta.json`);
  if (!response.ok) throw new Error(`找不到劇本：${scriptId}`);
  return response.json() as Promise<ScriptMeta>;
}

export async function loadMilestones(scriptId: string): Promise<Milestone[]> {
  const response = await fetch(`/data/scripts/${scriptId}/milestones.json`);
  if (!response.ok) throw new Error(`找不到節點資料：${scriptId}`);
  return response.json() as Promise<Milestone[]>;
}

export function getMilestoneById(milestones: Milestone[], id: string): Milestone | undefined {
  return milestones.find(m => m.id === id);
}
```

**Step 2: 確認 data/ 資料夾在 public/ 下可被 fetch 存取**

Vite 預設只提供 `public/` 下的靜態檔案。需要將 `data/scripts/` 移到 `public/data/scripts/`，或在 `vite.config.ts` 加入靜態資源設定。

選擇移動資料夾，最簡單：
```bash
# 在 PowerShell 執行
Move-Item data/scripts public/data/scripts -Force
```
（注意：`data/savegame.json` 和 `data/vault/` 不需要移動，那些不是前端讀取的）

**Step 3: Commit**

```bash
git add src/services/scriptLoader.ts public/data/
git commit -m "feat: 新增劇本載入服務，移動 scripts 到 public/"
```

---

### Task 6: 改寫 Entry Page（收集 Ollama 設定）

**Files:**
- Modify: `src/App.tsx`（EntryPage 元件，約第 47-131 行）

**Step 1: 替換 EntryPage 元件**

將現有的 `EntryPage` 替換為以下版本：

```tsx
// --- Entry Page ---
const EntryPage = ({ onJoin }: { onJoin: (config: OllamaConfig) => void }) => {
  const saved = loadOllamaConfig();
  const [endpoint, setEndpoint] = useState<string>(saved.endpoint);
  const [model, setModel] = useState<string>(saved.model);
  const [isError, setIsError] = useState(false);

  const handleSubmit = () => {
    const trimmedEndpoint = endpoint.trim();
    const trimmedModel = model.trim();
    if (!trimmedEndpoint || !trimmedModel) {
      setIsError(true);
      setTimeout(() => setIsError(false), 800);
      return;
    }
    const config: OllamaConfig = { endpoint: trimmedEndpoint, model: trimmedModel };
    saveOllamaConfig(config);
    onJoin(config);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="app-container flex items-center justify-center min-h-screen relative overflow-hidden">
      <div className="noise"></div>
      <div className="space-dust"></div>
      <div className="tactical-grid"></div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-tactical-teal/40"></div>
          <span className="text-[9px] text-tactical-teal font-tech uppercase tracking-[0.4em]">系統連線設定</span>
          <div className="flex-1 h-px bg-tactical-teal/40"></div>
        </div>

        <div className="relative bg-tactical-panel border-2 border-tactical-teal/60 p-8 backdrop-blur-sm entry-card">
          <HUDCorner />
          <div className="scanline"></div>

          <div className="mb-6 text-center">
            <h1
              className="text-2xl font-display uppercase tracking-widest tactical-text-teal glitch font-pulse-elegant"
              data-text="NEON HELL 2088"
            >
              NEON HELL 2088
            </h1>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-tactical-amber"></div>
              <span className="text-[8px] text-tactical-amber font-tech uppercase tracking-widest">需要 Ollama 設定</span>
              <div className="h-px w-8 bg-tactical-amber"></div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[8px] text-white/40 uppercase tracking-widest font-tech mb-1">Ollama Endpoint</div>
              <input
                type="text"
                className={`w-full tactical-input py-2 text-sm ${isError ? 'border-tactical-error flicker' : ''}`}
                placeholder="http://localhost:11434"
                value={endpoint}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndpoint(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div>
              <div className="text-[8px] text-white/40 uppercase tracking-widest font-tech mb-1">模型名稱</div>
              <input
                type="text"
                className={`w-full tactical-input py-2 text-sm ${isError ? 'border-tactical-error flicker' : ''}`}
                placeholder="minimax-m2.5:cloud"
                value={model}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              onClick={handleSubmit}
              type="button"
              className="w-full tactical-button py-3 text-sm tracking-[0.25em] font-tech mt-2"
            >
              初始化系統
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-tactical-teal/30 flex justify-between text-[8px] text-white/40 uppercase tracking-widest font-tech">
            <span className="tactical-blink">LOCAL-FIRST</span>
            <span>OLLAMA POWERED</span>
            <span>&copy; 2088</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: 更新 import**

在 `src/App.tsx` 頂部加入：
```tsx
import type { OllamaConfig } from './types/script';
import { loadOllamaConfig, saveOllamaConfig } from './services/storage';
```

**Step 3: 更新 App Root**

```tsx
export default function App() {
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig | null>(() => {
    const config = loadOllamaConfig();
    // 若已有設定直接跳過 Entry Page
    const hasConfig = localStorage.getItem('ollama_config');
    return hasConfig ? config : null;
  });

  useEffect(() => {
    const pm = PerformanceManager.getInstance();
    pm.initialize();
    return () => pm.destroy();
  }, []);

  if (!ollamaConfig) return <EntryPage onJoin={setOllamaConfig} />;
  return <MainPage config={ollamaConfig} />;
}
```

**Step 4: Commit**

```bash
git add src/App.tsx src/types/ src/services/
git commit -m "feat: Entry Page 改為收集 Ollama 設定"
```

---

### Task 7: 改寫 MainPage（接入劇本引擎）

**Files:**
- Modify: `src/App.tsx`（MainPage 元件，約第 133-319 行）

**Step 1: 替換 MainPage 元件**

```tsx
// --- Main Page ---
const MainPage = ({ config }: { config: OllamaConfig }) => {
  const [meta, setMeta] = useState<ScriptMeta | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [saveGame, setSaveGame] = useState<SaveGame | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMilestone = useMemo(() => {
    if (!saveGame || milestones.length === 0) return null;
    return getMilestoneById(milestones, saveGame.current_milestone) ?? null;
  }, [saveGame, milestones]);

  // 載入劇本
  useEffect(() => {
    const scriptId = 'neon-hell-2088';
    Promise.all([
      loadScriptMeta(scriptId),
      loadMilestones(scriptId),
    ]).then(([loadedMeta, loadedMilestones]) => {
      setMeta(loadedMeta);
      setMilestones(loadedMilestones);
      const existing = loadSaveGame();
      if (existing && existing.script_id === scriptId) {
        setSaveGame(existing);
      } else {
        const newGame: SaveGame = {
          script_id: scriptId,
          current_milestone: loadedMeta.start,
          history: [],
        };
        setSaveGame(newGame);
        saveSaveGame(newGame);
      }
    }).catch(err => setError(String(err)));
  }, []);

  // 自動捲動
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayText]);

  const handleChoice = (choice: string) => {
    if (!meta || !currentMilestone || !saveGame || isStreaming) return;

    setIsStreaming(true);
    setError(null);

    const userMessage = `情境：${currentMilestone.context}，玩家選擇：${choice}`;
    const messages = [
      { role: 'system' as const, content: meta.system_prompt },
      ...saveGame.history,
      { role: 'user' as const, content: userMessage },
    ];

    let accumulated = '';
    setDisplayText(prev => prev + `\n\n> ${choice}\n`);

    streamCompletion(
      config,
      messages,
      (chunk) => {
        accumulated += chunk;
        setDisplayText(prev => prev + chunk);
        if (Math.random() > 0.97) {
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 80);
        }
      },
      (fullText) => {
        const nextMilestoneId = currentMilestone.next[choice];
        const updatedHistory = [
          ...saveGame.history,
          { role: 'user' as const, content: userMessage },
          { role: 'assistant' as const, content: fullText },
        ];
        const updatedGame: SaveGame = {
          ...saveGame,
          current_milestone: nextMilestoneId,
          history: updatedHistory,
        };
        setSaveGame(updatedGame);
        saveSaveGame(updatedGame);
        setIsStreaming(false);
      },
      (errMsg) => {
        setError(errMsg);
        setIsStreaming(false);
      }
    );
  };

  // 初始文字
  useEffect(() => {
    if (currentMilestone && !displayText) {
      setDisplayText(`>> ${currentMilestone.title}\n\n${currentMilestone.context}`);
    }
  }, [currentMilestone]);

  if (error) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <div className="text-tactical-error font-mono text-sm p-8 border border-tactical-error/40 max-w-md">
          <div className="text-[8px] uppercase tracking-widest mb-2">系統錯誤</div>
          {error}
          <button
            type="button"
            onClick={() => { setError(null); }}
            className="tactical-button mt-4 text-xs"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!meta || !currentMilestone) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <div className="text-tactical-teal font-mono text-sm animate-pulse">載入劇本中...</div>
      </div>
    );
  }

  const isEnding = currentMilestone.choices.length === 0;

  return (
    <div className={`app-container flex flex-col h-screen overflow-hidden transition-all duration-100 ${glitchActive ? 'opacity-80 flicker' : ''}`}>
      <div className="noise"></div>
      <div className="space-dust"></div>
      <div className="tactical-grid"></div>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center gap-4 px-4 py-2 bg-tactical-panel border-b-2 border-tactical-teal/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 border border-tactical-teal/60 overflow-hidden shrink-0">
            <img
              src={`/assets/generated/${currentMilestone.image}`}
              alt="Scene"
              className="w-full h-full object-cover grayscale opacity-80"
            />
          </div>
          <div>
            <div className="text-[8px] text-tactical-amber uppercase tracking-widest font-tech">{meta.id}</div>
            <div className="text-xs text-tactical-teal font-display uppercase tracking-wide">{currentMilestone.title}</div>
          </div>
        </div>

        <div className="w-px h-8 bg-tactical-teal/30 mx-1"></div>

        <div>
          <div className="text-[8px] text-white/50 uppercase tracking-widest font-tech">當前劇本</div>
          <div className="text-sm font-display uppercase tracking-widest tactical-text-teal">
            {meta.title}
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 ${isStreaming ? 'bg-tactical-amber animate-pulse' : 'bg-tactical-teal animate-pulse'}`}></div>
            <span className="text-[8px] text-tactical-teal uppercase tracking-widest font-tech">
              {isStreaming ? 'AI 生成中' : '等待指令'}
            </span>
          </div>
          <span className="text-[8px] text-white/40 font-mono uppercase">{config.model.substring(0, 12)}</span>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col md:flex-row flex-1 overflow-hidden w-full">

        {/* 圖片區塊 */}
        <div className="relative bg-black group
          h-[38%] shrink-0
          md:h-auto md:w-[45%] md:shrink-0
          border-b border-tactical-teal/20
          md:border-b-0 md:border-r md:border-tactical-teal/20">
          <HUDCorner />

          <div className="absolute top-2 left-3 z-20 flex items-center gap-2">
            <div className="px-2 py-0.5 text-[8px] border border-tactical-teal/50 text-tactical-teal uppercase tracking-widest font-tech bg-black/70">
              {currentMilestone.id.toUpperCase()}
            </div>
            {isStreaming && (
              <div className="px-2 py-0.5 text-[8px] border border-tactical-amber/60 text-tactical-amber uppercase tracking-widest font-tech bg-black/70 animate-pulse">
                AI_GEN
              </div>
            )}
          </div>

          <img
            src={`/assets/generated/${currentMilestone.image}`}
            alt={currentMilestone.title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity duration-1000"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-tactical-bg via-transparent to-transparent opacity-60 pointer-events-none"></div>

          <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2 bg-black/70 border-t border-tactical-teal/20">
            <div className="text-[8px] text-tactical-teal/60 uppercase tracking-widest font-tech">{currentMilestone.title}</div>
          </div>

          <div className="scanline pointer-events-none"></div>
        </div>

        {/* 故事文字 + 按鈕 */}
        <div className="flex flex-col flex-1 overflow-hidden">

          <div className="flex flex-col flex-1 overflow-hidden border-b border-tactical-teal/20">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-tactical-panel border-b border-tactical-teal/20 shrink-0">
              <div className="w-1.5 h-1.5 bg-tactical-teal animate-pulse"></div>
              <span className="text-[8px] text-tactical-teal uppercase tracking-[0.3em] font-tech">任務日誌</span>
              <div className="ml-auto text-[8px] text-white/30 font-mono uppercase">
                {saveGame?.history.length ?? 0} ENTRIES
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 text-white/85 text-sm leading-relaxed whitespace-pre-wrap font-mono"
            >
              {displayText}
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-tactical-amber ml-1 animate-pulse align-text-bottom" />
              )}
              {!isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-tactical-teal ml-1 animate-pulse align-text-bottom" />
              )}
            </div>
          </div>

          {/* 選項按鈕 */}
          <div className="shrink-0 px-4 py-3 bg-tactical-panel border-t-2 border-tactical-amber/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-tactical-amber animate-pulse"></div>
              <span className="text-[8px] text-tactical-amber uppercase tracking-[0.3em] font-tech">
                {isEnding ? '結局' : '指令緩衝區'}
              </span>
            </div>

            {isEnding ? (
              <button
                type="button"
                onClick={() => {
                  clearSaveGame();
                  window.location.reload();
                }}
                className="tactical-button py-2 text-[10px] tracking-widest font-tech"
              >
                重新開始
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {currentMilestone.choices.map((choice: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChoice(choice)}
                    disabled={isStreaming}
                    className={`${idx % 2 === 0 ? 'tactical-button-amber' : 'tactical-button'} py-2 md:py-3 text-[10px] tracking-widest font-tech disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex items-center justify-between px-4 py-1 bg-black/50 border-t border-white/10 shrink-0">
        <div className="flex gap-4 text-[7px] text-white/30 uppercase tracking-widest font-tech">
          <span className="tactical-blink">{meta.id}</span>
          <span>{config.model}</span>
        </div>
        <div className="flex items-center gap-3 text-[7px] text-white/30 uppercase tracking-widest font-tech">
          <span className="text-tactical-teal/50 animate-pulse">LOCAL-FIRST</span>
          <span>&copy; 2088</span>
        </div>
      </footer>
    </div>
  );
};
```

**Step 2: 更新 App.tsx 頂部 import**

完整 import 區塊：
```tsx
import { useState, useEffect, useRef, useMemo, ChangeEvent, KeyboardEvent } from 'react';
import { PerformanceManager } from './utils/PerformanceManager';
import type { OllamaConfig, ScriptMeta, Milestone, SaveGame } from './types/script';
import { loadOllamaConfig, saveOllamaConfig, loadSaveGame, saveSaveGame, clearSaveGame } from './services/storage';
import { streamCompletion } from './services/ollama';
import { loadScriptMeta, loadMilestones, getMilestoneById } from './services/scriptLoader';
import './App.css';
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: MainPage 接入劇本引擎與 Ollama streaming"
```

---

### Task 8: 移除已不需要的型別與 hardcode

**Files:**
- Modify: `src/App.tsx`

**Step 1: 移除舊的 interface**

刪除 `src/App.tsx` 頂部的：
```tsx
interface GameState { ... }
interface TelemetryData { ... }
```
這些已被 `src/types/script.ts` 取代。

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: 移除 App.tsx 內的舊型別定義"
```

---

### Task 9: 驗證整體流程

**Step 1: 啟動 dev server**

```bash
npm run dev
```

**Step 2: 驗證 Entry Page**

- 打開 `http://localhost:5173`
- 確認顯示 Ollama Endpoint 和模型名稱兩個輸入框
- 預設值正確（`http://localhost:11434` / `minimax-m2.5:cloud`）
- 點「初始化系統」進入 Main Page

**Step 3: 驗證 Main Page（無 Ollama 情況）**

- 確認顯示「造船廠·甦醒」節點標題
- 確認顯示兩個選項按鈕
- 點選任一選項，確認出現錯誤訊息（因為沒有 Ollama 在跑）
- 錯誤訊息清楚顯示，不崩潰

**Step 4: 驗證 localStorage**

在瀏覽器 DevTools > Application > Local Storage：
- 確認 `ollama_config` 存在
- 確認 `save_game` 存在且包含正確的 `script_id` 和 `current_milestone`

**Step 5: 驗證重新整理後恢復存檔**

- 重新整理頁面
- 確認直接進入 Main Page（跳過 Entry Page）
- 確認節點狀態正確恢復

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: 完成劇本引擎 MVP，串接 Ollama streaming"
```

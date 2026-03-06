import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { sanitizePlayerInput } from './utils/sanitizePlayerInput';
import { PerformanceManager } from './utils/PerformanceManager';
import type { OllamaConfig, ScriptMeta, Milestone, SaveGame } from './types/script';
import { loadOllamaConfig, saveOllamaConfig, loadSaveGame, saveSaveGame, clearSaveGame } from './services/storage';
import { streamCompletion, generateText } from './services/ollama';
import { loadScriptMeta, loadMilestones, getMilestoneById } from './services/scriptLoader';
import './App.css';

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.floor(hours / 24)} 天前`;
}

const HUDCorner = () => (
  <>
    <div className="hud-corner hud-tl"></div>
    <div className="hud-corner hud-tr"></div>
    <div className="hud-corner hud-bl"></div>
    <div className="hud-corner hud-br"></div>
  </>
);

type ScriptEntry = { id: string; title: string; subtitle: string; file: string };
type ScriptId = string;

// --- Entry Page ---
const OPENROUTER_FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-3-12b-it:free',
  'mistralai/mistral-7b-instruct:free',
];

const EntryPage = ({ onJoin }: { onJoin: (config: OllamaConfig, scriptId: ScriptId) => void }) => {
  const saved = loadOllamaConfig();
  const [provider, setProvider] = useState<'ollama' | 'openrouter'>(saved.provider ?? 'ollama');
  const [endpoint, setEndpoint] = useState<string>(saved.endpoint);
  const [model, setModel] = useState<string>(saved.model);
  const [apiKey, setApiKey] = useState<string>(saved.apiKey ?? '');
  const [scripts, setScripts] = useState<ScriptEntry[]>([]);
  const [selectedScript, setSelectedScript] = useState<ScriptId>('');
  const [scriptSaves, setScriptSaves] = useState<Record<string, SaveGame | null>>({});
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const isOllamaEndpoint = (url: string) => {
    try {
      return new URL(url.trim()).port === '11434';
    } catch {
      return false;
    }
  };

  const fetchOllamaModels = (url: string) => {
    const base = url.trim().replace(/\/$/, '');
    setIsFetchingModels(true);
    fetch(`${base}/api/tags`)
      .then((r) => r.json())
      .then((data: { models?: { name: string }[] }) => {
        const names = (data.models ?? []).map((m) => m.name).sort();
        setOllamaModels(names);
        if (names.length > 0 && !names.includes(model)) {
          setModel(names[0]);
        }
      })
      .catch(() => setOllamaModels([]))
      .finally(() => setIsFetchingModels(false));
  };

  useEffect(() => {
    if (isOllamaEndpoint(endpoint)) {
      fetchOllamaModels(endpoint);
    } else {
      setOllamaModels([]);
    }
  }, [endpoint]);

  useEffect(() => {
    fetch('/scenarios/manifest.json')
      .then((r) => r.json())
      .then((data: ScriptEntry[]) => {
        setScripts(data);
        if (data.length > 0) setSelectedScript(data[0].id);
        const saves: Record<string, SaveGame | null> = {};
        for (const script of data) {
          saves[script.id] = loadSaveGame(script.id);
        }
        setScriptSaves(saves);
      })
      .catch((err) => console.error('Failed to load scenario manifest:', err));
  }, []);
  const [isError, setIsError] = useState(false);

  const handleSubmit = () => {
    const trimmedModel = model.trim();
    const trimmedKey = apiKey.trim();
    const trimmedEndpoint = endpoint.trim();
    const invalid = provider === 'openrouter' ? (!trimmedKey || !trimmedModel) : (!trimmedEndpoint || !trimmedModel);
    if (invalid) {
      setIsError(true);
      setTimeout(() => setIsError(false), 800);
      return;
    }
    const config: OllamaConfig = {
      provider,
      endpoint: trimmedEndpoint,
      model: trimmedModel,
      ...(provider === 'openrouter' ? { apiKey: trimmedKey } : {}),
    };
    saveOllamaConfig(config);
    onJoin(config, selectedScript);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="app-container h-screen overflow-hidden flex flex-col md:flex-row">
      <div className="noise" />
      <div className="space-dust" />

      {/* Hero panel — top banner on mobile, left panel on desktop */}
      <div className="relative shrink-0 overflow-hidden h-[220px] md:h-auto md:w-[340px]">
        <img
          src="/assets/generated/tamsui_river_view_window.png"
          alt="scene"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-tactical-bg/30 via-transparent to-tactical-bg md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-tactical-bg" />
        <HUDCorner />
        <div className="scanline pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="text-[8px] text-tactical-teal/70 uppercase tracking-[0.3em] font-tech mb-2">
            SCI-FI · TACTICAL · RPG
          </div>
          <h1
            className="text-3xl md:text-4xl font-display text-white font-black leading-tight glitch"
            data-text="NEON HELL 2088"
          >
            NEON HELL<br />2088
          </h1>
          <div className="mt-2 text-[8px] text-white/30 uppercase tracking-[0.25em] font-tech">
            CYBERPUNK · TAIWAN · 2088
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative z-10 flex-1 flex flex-col justify-center overflow-y-auto bg-tactical-bg px-6 py-8 md:px-10 md:py-10">

        {/* Scenario selection */}
        <div className="mb-6">
          <div className="text-[8px] text-white/25 uppercase tracking-[0.3em] font-tech mb-3">選 擇 劇 本</div>
          <div className="flex flex-col gap-2">
            {scripts.map((script) => (
              <button
                key={script.id}
                type="button"
                onClick={() => setSelectedScript(script.id)}
                className={`flex items-center gap-3 px-4 py-3.5 border rounded-lg transition-colors text-left ${
                  selectedScript === script.id
                    ? 'border-tactical-teal/70 bg-tactical-teal/10'
                    : 'border-white/10 bg-transparent hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className={`w-[3px] self-stretch rounded-full shrink-0 transition-colors ${
                  selectedScript === script.id ? 'bg-tactical-teal' : 'bg-white/10'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-tech font-semibold transition-colors ${
                    selectedScript === script.id ? 'text-tactical-teal' : 'text-white/30'
                  }`}>
                    {script.title}
                  </div>
                  <div className="text-[10px] text-white/25 mt-0.5">{script.subtitle}</div>
                  {scriptSaves[script.id] ? (
                    <div className="text-[9px] text-tactical-teal/60 mt-1 font-mono">
                      {scriptSaves[script.id]!.current_milestone}
                      {scriptSaves[script.id]!.savedAt && (
                        <span className="text-white/20 ml-1">· {formatRelativeTime(scriptSaves[script.id]!.savedAt!)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[9px] text-white/15 mt-1 font-mono">尚未開始</div>
                  )}
                </div>
                {selectedScript === script.id && (
                  <span className="text-[7px] font-bold tracking-widest text-tactical-bg bg-tactical-teal px-1.5 py-0.5 rounded shrink-0">
                    SELECTED
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Provider toggle */}
        <div className="mb-4">
          <div className="text-[8px] text-white/25 uppercase tracking-[0.3em] font-tech mb-3">LLM 接 入 方 式</div>
          <div className="flex gap-2">
            {(['ollama', 'openrouter'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`flex-1 py-2.5 text-[9px] font-tech tracking-widest uppercase rounded-lg border transition-colors ${
                  provider === p
                    ? 'border-tactical-teal/70 bg-tactical-teal/10 text-tactical-teal'
                    : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
                }`}
              >
                {p === 'ollama' ? 'Ollama · 本地' : 'OpenRouter · 雲端'}
              </button>
            ))}
          </div>
        </div>

        {/* LLM config */}
        <div className="mb-6">
          {provider === 'ollama' ? (
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="text-[8px] text-white/20 uppercase tracking-widest font-tech mb-1.5">ENDPOINT</div>
                <input
                  type="text"
                  className={`w-full bg-tactical-panel border rounded-lg px-4 py-3 text-sm text-tactical-teal font-mono placeholder:text-white/20 outline-none transition-colors focus:border-tactical-teal/60 ${isError ? 'border-tactical-error flicker' : 'border-white/10'}`}
                  placeholder="http://localhost:11434"
                  value={endpoint}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEndpoint(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[8px] text-white/20 uppercase tracking-widest font-tech">MODEL</span>
                  {isFetchingModels && (
                    <span className="text-[7px] text-tactical-teal/50 font-tech animate-pulse">SCANNING...</span>
                  )}
                  {!isFetchingModels && ollamaModels.length > 0 && (
                    <span className="text-[7px] text-tactical-teal/50 font-tech">{ollamaModels.length} AVAILABLE</span>
                  )}
                </div>
                {ollamaModels.length > 0 ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={`w-full bg-tactical-panel border rounded-lg px-4 py-3 text-sm text-tactical-teal font-mono outline-none transition-colors focus:border-tactical-teal/60 appearance-none cursor-pointer ${isError ? 'border-tactical-error flicker' : 'border-white/10'}`}
                  >
                    {ollamaModels.map((m) => (
                      <option key={m} value={m} className="bg-tactical-panel text-tactical-teal">
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className={`w-full bg-tactical-panel border rounded-lg px-4 py-3 text-sm text-tactical-teal font-mono placeholder:text-white/20 outline-none transition-colors focus:border-tactical-teal/60 ${isError ? 'border-tactical-error flicker' : 'border-white/10'}`}
                    placeholder="minimax-m2.5:cloud"
                    value={model}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[8px] text-white/20 uppercase tracking-widest font-tech mb-1.5">OPENROUTER API KEY</div>
                <input
                  type="password"
                  className={`w-full bg-tactical-panel border rounded-lg px-4 py-3 text-sm text-tactical-teal font-mono placeholder:text-white/20 outline-none transition-colors focus:border-tactical-teal/60 ${isError ? 'border-tactical-error flicker' : 'border-white/10'}`}
                  placeholder="sk-or-..."
                  value={apiKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <div className="mt-1.5 text-[8px] text-white/20 font-tech">
                  Key 僅存於你的瀏覽器，不經過我們的伺服器。
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="ml-1 text-tactical-teal/40 hover:text-tactical-teal/70 transition-colors">取得 Key →</a>
                </div>
              </div>
              <div>
                <div className="text-[8px] text-white/20 uppercase tracking-widest font-tech mb-1.5">MODEL</div>
                <input
                  type="text"
                  className={`w-full bg-tactical-panel border rounded-lg px-4 py-3 text-sm text-tactical-teal font-mono placeholder:text-white/20 outline-none transition-colors focus:border-tactical-teal/60 ${isError ? 'border-tactical-error flicker' : 'border-white/10'}`}
                  placeholder="meta-llama/llama-3.1-8b-instruct:free"
                  value={model}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="mt-1.5 flex gap-2 flex-wrap">
                  {OPENROUTER_FREE_MODELS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={`text-[7px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        model === m
                          ? 'border-tactical-teal/50 text-tactical-teal/70 bg-tactical-teal/10'
                          : 'border-white/10 text-white/20 hover:border-white/25 hover:text-white/40'
                      }`}
                    >
                      {m.split('/')[1]}
                    </button>
                  ))}
                  <span className="text-[7px] text-white/15 font-tech self-center">免費模型</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          type="button"
          className="w-full bg-tactical-teal hover:bg-tactical-teal/90 text-tactical-bg font-bold py-4 text-sm tracking-[0.3em] font-tech rounded-lg transition-colors shadow-[0_4px_24px_rgba(0,180,166,0.25)]"
        >
          初始化系統
        </button>

        <div className="mt-6 flex justify-between text-[8px] text-white/20 uppercase tracking-widest font-tech">
          <span className="tactical-blink">LOCAL-FIRST</span>
          <span>{provider === 'openrouter' ? 'OPENROUTER POWERED' : 'OLLAMA POWERED'}</span>
          <span>&copy; 2088</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
const MainPage = ({ config, scriptId, onRestart, onUpdateConfig }: { config: OllamaConfig; scriptId: string; onRestart: () => void; onUpdateConfig: (config: OllamaConfig) => void }) => {
  const [meta, setMeta] = useState<ScriptMeta | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [saveGame, setSaveGame] = useState<SaveGame | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveConflict, setSaveConflict] = useState<{ milestoneId: string; startMilestone: string } | null>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const [freeInputText, setFreeInputText] = useState('');
  const [freeInputError, setFreeInputError] = useState(false);
  const [dynamicChoices, setDynamicChoices] = useState<string[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsModel, setSettingsModel] = useState(config.model);
  const [settingsKey, setSettingsKey] = useState(config.apiKey ?? '');
  const lastNarrativeRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMilestone = useMemo(() => {
    if (!saveGame || milestones.length === 0) {
      console.log('[MainPage] currentMilestone: null (saveGame=%o, milestones=%d)', saveGame, milestones.length);
      return null;
    }
    const m = getMilestoneById(milestones, saveGame.current_milestone) ?? null;
    console.log('[MainPage] currentMilestone resolved:', m?.id ?? 'NOT FOUND', '(looking for', saveGame.current_milestone, ')');
    return m;
  }, [saveGame, milestones]);

  useEffect(() => {
    console.log('[MainPage] loading script:', scriptId);
    Promise.all([
      loadScriptMeta(scriptId),
      loadMilestones(scriptId),
    ]).then(([loadedMeta, loadedMilestones]) => {
      console.log('[MainPage] meta loaded:', loadedMeta);
      console.log('[MainPage] milestones loaded:', loadedMilestones.length, 'entries');
      setMeta(loadedMeta);
      setMilestones(loadedMilestones);
      const existing = loadSaveGame(scriptId);
      console.log('[MainPage] existing save:', existing);
      const milestoneExists = (id: string) => loadedMilestones.some((m) => m.id === id);
      if (existing && existing.script_id === scriptId && milestoneExists(existing.current_milestone)) {
        console.log('[MainPage] restoring save, milestone:', existing.current_milestone);
        setSaveGame(existing);
      } else if (existing && existing.script_id === scriptId && !milestoneExists(existing.current_milestone)) {
        console.warn('[MainPage] save milestone not found, prompting user:', existing.current_milestone);
        setSaveConflict({ milestoneId: existing.current_milestone, startMilestone: loadedMeta.start });
        setMeta(loadedMeta);
        setMilestones(loadedMilestones);
        return;
      } else {
        const newGame: SaveGame = {
          script_id: scriptId,
          current_milestone: loadedMeta.start,
          history: [],
        };
        console.log('[MainPage] new game, start milestone:', newGame.current_milestone);
        setSaveGame(newGame);
        saveSaveGame(newGame);
      }
    }).catch(err => {
      console.error('[MainPage] load error:', err);
      setError(String(err));
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayText]);

  const rewriteChoices = (choices: string[], narrative: string): (() => void) => {
    let cancelled = false;
    if (!choices.length || !narrative) return () => {};
    const messages = [
      {
        role: 'system' as const,
        content: '你是敘事助理。根據以下劇情，將選項文字改寫得更自然，更融入當前氛圍。保持每個選項的核心決策意圖不變，只優化措辭和語感。回覆格式：只回覆JSON陣列，例如["選項A","選項B"]，不要任何其他文字。',
      },
      {
        role: 'user' as const,
        content: `剛才的劇情：\n${narrative}\n\n原選項：${JSON.stringify(choices)}`,
      },
    ];
    generateText(config, messages)
      .then((text) => {
        if (cancelled) return;
        const match = text.match(/\[[\s\S]*?\]/);
        if (!match) return;
        const parsed = JSON.parse(match[0]) as string[];
        if (Array.isArray(parsed) && parsed.length === choices.length) {
          setDynamicChoices(parsed);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  };

  useEffect(() => {
    setDynamicChoices(null);
    if (!currentMilestone || !lastNarrativeRef.current || !meta) return;
    const cancel = rewriteChoices(currentMilestone.choices, lastNarrativeRef.current);
    return cancel;
  }, [currentMilestone?.id]);

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

    setDisplayText(prev => prev + `\n\n> ${choice}\n`);

    let accumulated = '';
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
        lastNarrativeRef.current = fullText;
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

  const handleFreeInput = () => {
    if (!meta || !currentMilestone || !saveGame || isStreaming) return;

    const sanitized = sanitizePlayerInput(freeInputText);
    if (!sanitized) {
      setFreeInputError(true);
      setTimeout(() => setFreeInputError(false), 800);
      return;
    }

    setFreeInputText('');
    setIsStreaming(true);
    setError(null);

    const userMessage = `情境：${currentMilestone.context}，玩家自由行動：${sanitized}`;
    const messages = [
      { role: 'system' as const, content: meta.system_prompt },
      ...saveGame.history,
      { role: 'user' as const, content: userMessage },
    ];

    setDisplayText(prev => prev + `\n\n> ${sanitized}\n`);

    streamCompletion(
      config,
      messages,
      (chunk) => {
        setDisplayText(prev => prev + chunk);
        if (Math.random() > 0.97) {
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 80);
        }
      },
      (fullText) => {
        // milestone does NOT advance for free input
        lastNarrativeRef.current = fullText;
        setDynamicChoices(null);
        rewriteChoices(currentMilestone.choices, fullText);
        const updatedHistory = [
          ...saveGame.history,
          { role: 'user' as const, content: userMessage },
          { role: 'assistant' as const, content: fullText },
        ];
        const updatedGame: SaveGame = {
          ...saveGame,
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

  useEffect(() => {
    if (currentMilestone && !displayText) {
      setDisplayText(`>> ${currentMilestone.title}\n\n${currentMilestone.context}`);
    }
  }, [currentMilestone]);

  if (saveConflict) {
    const handleReset = () => {
      clearSaveGame(scriptId);
      const newGame: SaveGame = {
        script_id: scriptId,
        current_milestone: saveConflict.startMilestone,
        history: [],
      };
      setSaveGame(newGame);
      saveSaveGame(newGame);
      setSaveConflict(null);
    };
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <div className="noise" />
        <div className="relative z-10 border border-tactical-amber/40 bg-tactical-panel/80 p-8 max-w-md w-full mx-4 rounded-lg">
          <div className="text-[8px] text-tactical-amber uppercase tracking-[0.3em] font-tech mb-3">存檔衝突</div>
          <div className="text-white/80 text-sm font-mono mb-2">
            你的存檔指向的節點已不存在：
          </div>
          <div className="text-tactical-amber font-mono text-xs bg-black/30 px-3 py-2 rounded mb-4 border border-tactical-amber/20">
            {saveConflict.milestoneId}
          </div>
          <div className="text-white/50 text-xs font-tech mb-6 leading-relaxed">
            劇本可能已更新，此節點已被移除。你可以重置進度從頭開始，或返回選擇其他劇本。
            <br /><br />
            <span className="text-tactical-error/80">重置將清除此劇本的所有存檔記錄，此操作無法復原。</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 py-3 border border-white/15 text-white/40 text-[10px] font-tech tracking-widest rounded-lg hover:border-white/30 hover:text-white/60 transition-colors"
            >
              返回
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3 border border-tactical-error/50 bg-tactical-error/10 text-tactical-error text-[10px] font-tech tracking-widest rounded-lg hover:bg-tactical-error/20 transition-colors"
            >
              重置進度
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <div className="text-tactical-error font-mono text-sm p-8 border border-tactical-error/40 max-w-md">
          <div className="text-[8px] uppercase tracking-widest mb-2">系統錯誤</div>
          {error}
          <button type="button" onClick={() => setError(null)} className="mt-4 text-xs bg-tactical-teal/10 border border-tactical-teal/50 text-tactical-teal px-4 py-2 rounded-lg hover:bg-tactical-teal/20 transition-colors font-tech tracking-widest uppercase">
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
      <div className="noise" />
      <div className="space-dust" />
      <div className="tactical-grid" />

      {/* Nav bar */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 h-12 shrink-0 bg-tactical-bg border-b border-tactical-teal/20">
        {/* Left */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-2 h-2 rounded-full bg-tactical-teal animate-pulse" />
          <span className="text-[10px] text-tactical-teal font-display tracking-widest">NEON-HELL-2088</span>
          <div className="w-px h-4 bg-tactical-teal/20 mx-1 hidden md:block" />
          <span className="text-xs text-white/50 font-tech hidden md:inline">{currentMilestone.title}</span>
        </div>
        {/* Right */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[7px] text-white/20 uppercase tracking-widest font-tech">當前劇本</span>
            <span className="text-xs text-white/40 font-tech">{meta.title}</span>
          </div>
          <div className="hidden md:block w-px h-5 bg-white/10" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded text-[9px] font-bold font-tech tracking-widest uppercase ${
            isStreaming
              ? 'border-tactical-amber/50 bg-tactical-amber/10 text-tactical-amber'
              : 'border-tactical-teal/30 bg-tactical-teal/5 text-tactical-teal'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStreaming ? 'bg-tactical-amber' : 'bg-tactical-teal'}`} />
            {isStreaming ? 'AI 生成中' : '等待指令'}
          </div>
          <span className="text-[8px] text-white/20 font-mono hidden md:inline">{config.model.substring(0, 14)}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Scene image panel — top banner on mobile, left panel on desktop */}
        <div className="relative shrink-0 overflow-hidden h-[200px] md:h-auto md:w-[380px]">
          <img
            src={`/assets/generated/${currentMilestone.image}`}
            alt={currentMilestone.title}
            className="w-full h-full object-cover opacity-70"
          />
          {/* gradient overlay: fades down on mobile, fades right on desktop */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tactical-bg/20 to-tactical-bg md:bg-gradient-to-r md:from-transparent md:via-tactical-bg/10 md:to-tactical-bg" />
          <div className="scanline pointer-events-none" />

          {/* Scene info bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 md:px-6 md:py-5 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[7px] border border-tactical-teal/50 text-tactical-teal px-1.5 py-0.5 font-tech uppercase tracking-widest bg-black/50">
                  {currentMilestone.id.toUpperCase()}
                </span>
                {isStreaming && (
                  <span className="text-[7px] border border-tactical-amber/50 text-tactical-amber px-1.5 py-0.5 font-tech uppercase tracking-widest animate-pulse bg-black/50">
                    AI_GEN
                  </span>
                )}
              </div>
              <div className="text-base md:text-xl font-display text-white font-bold">{currentMilestone.title}</div>
            </div>
            <div className="text-[8px] text-white/20 font-tech uppercase tracking-widest hidden md:block">
              節點 · AWAKENING
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden bg-tactical-bg">

          {/* Narrative section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tactical-teal" />
                <span className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-tech">任務日誌</span>
              </div>
              <span className="text-[8px] text-white/15 font-mono">
                {saveGame?.history.length ?? 0} ENTRIES
              </span>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 text-white/70 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-mono"
            >
              {displayText}
              {isStreaming ? (
                <span className="inline-block w-1.5 h-3.5 bg-tactical-amber ml-1 animate-pulse align-text-bottom" />
              ) : (
                <span className="inline-block w-1.5 h-3.5 bg-tactical-teal ml-1 animate-pulse align-text-bottom" />
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-white/5 shrink-0" />

          {/* Choices section */}
          <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-tactical-panel/60 border-t border-tactical-amber/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-tactical-amber" />
              <span className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-tech">
                {isEnding ? '結局' : '指令緩衝區'}
              </span>
            </div>

            {isEnding ? (
              <button
                type="button"
                onClick={() => { clearSaveGame(scriptId); onRestart(); }}
                className="bg-tactical-teal hover:bg-tactical-teal/90 text-tactical-bg font-bold py-3 px-6 text-[10px] tracking-widest font-tech rounded-lg transition-colors"
              >
                重新開始
              </button>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  {(dynamicChoices ?? currentMilestone.choices).map((displayChoice: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChoice(currentMilestone.choices[idx])}
                      disabled={isStreaming}
                      className={`flex items-start gap-3 p-3 md:p-4 border rounded-lg text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        idx % 2 === 0
                          ? 'border-tactical-amber/30 hover:border-tactical-amber/60 hover:bg-tactical-amber/5'
                          : 'border-tactical-teal/30 hover:border-tactical-teal/60 hover:bg-tactical-teal/5'
                      }`}
                    >
                      <span className={`text-[10px] font-bold tracking-[0.2em] shrink-0 pt-0.5 font-mono ${
                        idx % 2 === 0 ? 'text-tactical-amber' : 'text-tactical-teal'
                      }`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className={`w-px self-stretch rounded-full shrink-0 ${
                        idx % 2 === 0 ? 'bg-tactical-amber/20' : 'bg-tactical-teal/20'
                      }`} />
                      <span className="text-xs md:text-sm text-white/60 leading-relaxed font-tech">{displayChoice}</span>
                    </button>
                  ))}
                </div>

                {/* Free input */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                    <span className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-tech">自由行動</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={freeInputText}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFreeInputText(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleFreeInput(); }}
                      disabled={isStreaming}
                      maxLength={300}
                      placeholder="輸入任意行動..."
                      className={`flex-1 bg-tactical-panel border rounded-lg px-3 py-2 text-sm text-white/70 font-mono placeholder:text-white/15 outline-none transition-colors focus:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed ${
                        freeInputError ? 'border-tactical-error flicker' : 'border-white/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleFreeInput}
                      disabled={isStreaming}
                      className="shrink-0 px-4 py-2 border border-white/15 text-white/40 text-[10px] font-tech tracking-widest rounded-lg hover:border-white/30 hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      送出
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="relative z-20 border-t border-white/10 bg-tactical-panel/95 px-4 md:px-6 py-4 shrink-0">
          <div className="text-[8px] text-white/25 uppercase tracking-[0.3em] font-tech mb-3">切換模型</div>
          <div className="flex gap-2 items-end">
            {config.provider === 'openrouter' && (
              <div className="w-40 shrink-0">
                <div className="text-[7px] text-white/20 uppercase tracking-widest font-tech mb-1">API KEY</div>
                <input
                  type="password"
                  value={settingsKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSettingsKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full bg-tactical-bg border border-white/10 rounded px-3 py-2 text-xs text-tactical-teal font-mono placeholder:text-white/15 outline-none focus:border-tactical-teal/50"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="text-[7px] text-white/20 uppercase tracking-widest font-tech mb-1">MODEL</div>
              <input
                type="text"
                value={settingsModel}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSettingsModel(e.target.value)}
                placeholder={config.provider === 'openrouter' ? 'meta-llama/llama-3.1-8b-instruct:free' : 'model-name'}
                className="w-full bg-tactical-bg border border-white/10 rounded px-3 py-2 text-xs text-tactical-teal font-mono placeholder:text-white/15 outline-none focus:border-tactical-teal/50"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const updated: OllamaConfig = {
                  ...config,
                  model: settingsModel.trim() || config.model,
                  ...(config.provider === 'openrouter' ? { apiKey: settingsKey.trim() || config.apiKey } : {}),
                };
                saveOllamaConfig(updated);
                onUpdateConfig(updated);
                setShowSettings(false);
              }}
              className="shrink-0 px-4 py-2 bg-tactical-teal text-tactical-bg text-[9px] font-tech tracking-widest rounded hover:bg-tactical-teal/80 transition-colors"
            >
              套用
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="shrink-0 px-3 py-2 border border-white/10 text-white/30 text-[9px] font-tech rounded hover:border-white/25 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-4 md:px-6 h-8 bg-black/30 border-t border-white/5 shrink-0">
        <div className="flex gap-4 text-[7px] text-white/20 uppercase tracking-widest font-tech">
          <span className="tactical-blink">{meta.id}</span>
          <button
            type="button"
            onClick={() => { setSettingsModel(config.model); setSettingsKey(config.apiKey ?? ''); setShowSettings((v) => !v); }}
            className="text-white/20 hover:text-tactical-teal/60 transition-colors font-mono"
            title="切換模型"
          >
            {config.model}
          </button>
        </div>
        <div className="flex items-center gap-3 text-[7px] text-white/20 uppercase tracking-widest font-tech">
          <span className="text-tactical-teal/40 animate-pulse">LOCAL-FIRST</span>
          <span>&copy; 2088</span>
        </div>
      </footer>
    </div>
  );
};

// --- App Root ---
export default function App() {
  const [session, setSession] = useState<{ config: OllamaConfig; scriptId: ScriptId } | null>(null);

  useEffect(() => {
    const pm = PerformanceManager.getInstance();
    pm.initialize();
    return () => pm.destroy();
  }, []);

  const handleJoin = (config: OllamaConfig, scriptId: ScriptId) => {
    setSession({ config, scriptId });
  };

  const handleUpdateConfig = (config: OllamaConfig) => {
    setSession((prev) => prev ? { ...prev, config } : null);
  };

  if (!session) return <EntryPage onJoin={handleJoin} />;
  return (
    <MainPage
      config={session.config}
      scriptId={session.scriptId}
      onRestart={() => setSession(null)}
      onUpdateConfig={handleUpdateConfig}
    />
  );
}

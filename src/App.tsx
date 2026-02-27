import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { PerformanceManager } from './utils/PerformanceManager';
import type { OllamaConfig, ScriptMeta, Milestone, SaveGame } from './types/script';
import { loadOllamaConfig, saveOllamaConfig, loadSaveGame, saveSaveGame, clearSaveGame } from './services/storage';
import { streamCompletion } from './services/ollama';
import { loadScriptMeta, loadMilestones, getMilestoneById } from './services/scriptLoader';
import './App.css';

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
const EntryPage = ({ onJoin }: { onJoin: (config: OllamaConfig, scriptId: ScriptId) => void }) => {
  const saved = loadOllamaConfig();
  const [endpoint, setEndpoint] = useState<string>(saved.endpoint);
  const [model, setModel] = useState<string>(saved.model);
  const [scripts, setScripts] = useState<ScriptEntry[]>([]);
  const [selectedScript, setSelectedScript] = useState<ScriptId>('');

  useEffect(() => {
    fetch('/scenarios/manifest.json')
      .then((r) => r.json())
      .then((data: ScriptEntry[]) => {
        setScripts(data);
        if (data.length > 0) setSelectedScript(data[0].id);
      })
      .catch((err) => console.error('Failed to load scenario manifest:', err));
  }, []);
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

        {/* Ollama config */}
        <div className="mb-6">
          <div className="text-[8px] text-white/25 uppercase tracking-[0.3em] font-tech mb-3">OLLAMA 設 定</div>
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
              <div className="text-[8px] text-white/20 uppercase tracking-widest font-tech mb-1.5">MODEL</div>
              <input
                type="text"
                className={`w-full bg-tactical-panel border rounded-lg px-4 py-3 text-sm text-tactical-teal font-mono placeholder:text-white/20 outline-none transition-colors focus:border-tactical-teal/60 ${isError ? 'border-tactical-error flicker' : 'border-white/10'}`}
                placeholder="minimax-m2.5:cloud"
                value={model}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
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
          <span>OLLAMA POWERED</span>
          <span>&copy; 2088</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
const MainPage = ({ config, scriptId, onRestart }: { config: OllamaConfig; scriptId: string; onRestart: () => void }) => {
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

  useEffect(() => {
    Promise.all([
      loadScriptMeta(scriptId),
      loadMilestones(scriptId),
    ]).then(([loadedMeta, loadedMilestones]) => {
      setMeta(loadedMeta);
      setMilestones(loadedMilestones);
      const existing = loadSaveGame(scriptId);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {currentMilestone.choices.map((choice: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChoice(choice)}
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
                    <span className="text-xs md:text-sm text-white/60 leading-relaxed font-tech">{choice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-4 md:px-6 h-8 bg-black/30 border-t border-white/5 shrink-0">
        <div className="flex gap-4 text-[7px] text-white/20 uppercase tracking-widest font-tech">
          <span className="tactical-blink">{meta.id}</span>
          <span>{config.model}</span>
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

  if (!session) return <EntryPage onJoin={handleJoin} />;
  return <MainPage config={session.config} scriptId={session.scriptId} onRestart={() => setSession(null)} />;
}

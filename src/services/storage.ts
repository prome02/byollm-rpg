// src/services/storage.ts
import type { SaveGame, OllamaConfig } from '../types/script';

const KEYS = {
  OLLAMA_CONFIG: 'ollama_config',
  SAVE_GAME: 'neon-hell-save',
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

function saveGameKey(scriptId: string): string {
  return `${KEYS.SAVE_GAME}:${scriptId}`;
}

export function loadSaveGame(scriptId: string): SaveGame | null {
  try {
    const raw = localStorage.getItem(saveGameKey(scriptId));
    if (!raw) return null;
    return JSON.parse(raw) as SaveGame;
  } catch {
    return null;
  }
}

export function saveSaveGame(game: SaveGame): void {
  const record: SaveGame = { ...game, savedAt: new Date().toISOString() };
  localStorage.setItem(saveGameKey(game.script_id), JSON.stringify(record));
}

export function clearSaveGame(scriptId: string): void {
  localStorage.removeItem(saveGameKey(scriptId));
}

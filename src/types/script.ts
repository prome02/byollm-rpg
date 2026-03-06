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
  savedAt?: string;
}

export interface OllamaConfig {
  provider: 'ollama' | 'openrouter';
  endpoint: string;
  model: string;
  apiKey?: string;
}

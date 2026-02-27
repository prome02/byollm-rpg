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

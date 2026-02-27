export interface Choice {
  text: string;
  nextSceneId: string;
}

export interface Scene {
  id: string;
  story: string;
  image: string;
  options: Choice[];
}

export interface Scenario {
  id: string;
  title: string;
  startSceneId: string;
  scenes: Record<string, Scene>;
}

export interface PlayerStats {
  distance: number;
  power: number;
  temp: number;
  velocity: number;
}

export interface SaveGame {
  playerId: string;
  playerName: string;
  currentScenarioId: string;
  currentSceneId: string;
  stats: PlayerStats;
  timestamp: string;
}

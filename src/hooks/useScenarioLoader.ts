import { useState, useEffect } from 'react';
import { Scenario } from '../types/game';

export const useScenarioLoader = (scenarioPath: string) => {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScenario = async () => {
      try {
        setLoading(true);
        const response = await fetch(scenarioPath);
        if (!response.ok) {
          throw new Error(`Failed to load scenario: ${response.statusText}`);
        }
        const data = await response.json();
        setScenario(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadScenario();
  }, [scenarioPath]);

  return { scenario, loading, error };
};

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
          // ignore malformed chunks
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    onError(`網路錯誤：${err instanceof Error ? err.message : String(err)}`);
  }
}

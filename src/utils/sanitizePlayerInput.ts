// Role-switching tokens that could be used for prompt injection
const INJECTION_TOKENS = [
  'system:',
  'assistant:',
  'user:',
  '<|im_start|>',
  '<|im_end|>',
  '<|endoftext|>',
];

const MAX_INPUT_LENGTH = 200;

export function sanitizePlayerInput(input: string): string {
  let result = input.trim();

  // Truncate to max length
  if (result.length > MAX_INPUT_LENGTH) {
    result = result.slice(0, MAX_INPUT_LENGTH);
  }

  // Remove role-switching tokens (case-insensitive)
  for (const token of INJECTION_TOKENS) {
    const pattern = new RegExp(token.replace(/[|<>]/g, '\\$&'), 'gi');
    result = result.replace(pattern, '');
  }

  // Collapse consecutive newlines (2+) to a single newline
  result = result.replace(/\n{2,}/g, '\n');

  // Remove triple backtick sequences
  result = result.replace(/```/g, '');

  return result.trim();
}

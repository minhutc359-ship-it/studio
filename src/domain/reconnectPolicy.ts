const INITIAL_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

export function reconnectDelay(attempt: number, random = Math.random): number {
  const exponent = Math.max(0, Math.floor(attempt))
  const baseDelay = Math.min(MAX_DELAY_MS, INITIAL_DELAY_MS * 2 ** exponent)
  const jitter = 0.8 + random() * 0.4
  return Math.min(MAX_DELAY_MS, Math.floor(baseDelay * jitter))
}
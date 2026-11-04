import { describe, expect, it } from 'vitest'
import { reconnectDelay } from './reconnectPolicy'

describe('reconnectDelay', () => {
  it('uses exponential backoff from one second up to a 30-second cap', () => {
    expect([0, 1, 2, 3, 4, 5].map((attempt) => reconnectDelay(attempt, () => 0.5)))
      .toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000])
  })

  it('adds bounded jitter without exceeding the maximum delay', () => {
    expect(reconnectDelay(2, () => 0)).toBe(3_200)
    expect(reconnectDelay(2, () => 1)).toBe(4_800)
    expect(reconnectDelay(20, () => 1)).toBe(30_000)
  })
})
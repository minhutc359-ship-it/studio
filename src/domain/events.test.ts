import { describe, expect, it } from 'vitest'
import { parseCommand } from './events'

describe('parseCommand', () => {
  it('parses join, leave and valid seat requests', () => {
    expect(parseCommand('  !JOIN ')).toEqual({ kind: 'join' })
    expect(parseCommand('!leave')).toEqual({ kind: 'leave' })
    expect(parseCommand('!seat 12')).toEqual({ kind: 'seat', seatId: 12 })
  })

  it('rejects invalid seats and unsupported commands', () => {
    expect(parseCommand('!seat 13')).toBeNull()
    expect(parseCommand('!seat 1.5')).toBeNull()
    expect(parseCommand('!ban viewer')).toBeNull()
  })
})
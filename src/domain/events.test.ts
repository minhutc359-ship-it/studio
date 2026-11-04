import { describe, expect, it } from 'vitest'
import { parseCommand } from './events'

describe('parseCommand', () => {
  it('parses join, leave and valid seat requests', () => {
    expect(parseCommand('  !JOIN ')).toEqual({ kind: 'join' })
    expect(parseCommand('!leave')).toEqual({ kind: 'leave' })
    expect(parseCommand('!seat 12')).toEqual({ kind: 'seat', seatId: 12 })
  })

  it('parses room and seat reactions', () => {
    expect(parseCommand('!react heart')).toEqual({ kind: 'react', reaction: 'heart' })
    expect(parseCommand('react heart')).toEqual({ kind: 'react', reaction: 'heart' })
    expect(parseCommand('React Heart 2')).toEqual({ kind: 'react', reaction: 'heart', seatId: 2 })
    expect(parseCommand('!react wave 12')).toEqual({ kind: 'react', reaction: 'wave', seatId: 12 })
    expect(parseCommand('!react cheer 13')).toBeNull()
    expect(parseCommand('!react heart 2 extra')).toBeNull()
  })

  it('parses team, silent, and oxygen image emotes', () => {
    expect(parseCommand('!react oxygen')).toEqual({ kind: 'react', reaction: 'oxygen' })
    expect(parseCommand('!react t1 2')).toEqual({ kind: 'react', reaction: 't1', seatId: 2 })
    expect(parseCommand('!react geng')).toEqual({ kind: 'react', reaction: 'geng' })
    expect(parseCommand('!react silent 3')).toEqual({ kind: 'react', reaction: 'silent', seatId: 3 })
  })

  it('accepts clap as an alias for the cheer reaction', () => {
    expect(parseCommand('react clap')).toEqual({ kind: 'react', reaction: 'cheer' })
  })

  it('turns the six standalone emote words into reactions', () => {
    expect(parseCommand(' T1 ')).toEqual({ kind: 'react', reaction: 't1' })
    expect(parseCommand('geng')).toEqual({ kind: 'react', reaction: 'geng' })
    expect(parseCommand('oxi')).toEqual({ kind: 'react', reaction: 'oxygen' })
    expect(parseCommand('silent')).toEqual({ kind: 'react', reaction: 'silent' })
    expect(parseCommand('clap')).toEqual({ kind: 'react', reaction: 'cheer' })
    expect(parseCommand('wave')).toEqual({ kind: 'react', reaction: 'wave' })
    expect(parseCommand('t1 tonight')).toBeNull()
  })

  it('rejects invalid seats and unsupported commands', () => {
    expect(parseCommand('join now')).toBeNull()
    expect(parseCommand('react heart please')).toBeNull()
    expect(parseCommand('!seat 13')).toBeNull()
    expect(parseCommand('!seat 1.5')).toBeNull()
    expect(parseCommand('!ban viewer')).toBeNull()
  })
})
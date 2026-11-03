import { describe, expect, it } from 'vitest'
import { createSeatState, seatReducer, type Viewer } from './seatManager'

const viewer = (id: string): Viewer => ({ id, name: id, avatar: '🧑🏻‍🚀' })

describe('seatReducer', () => {
  it('assigns a viewer once and keeps them in the same seat on duplicate join', () => {
    const first = seatReducer(createSeatState(), { type: 'join', viewer: viewer('a'), now: 10 })
    const second = seatReducer(first, { type: 'join', viewer: viewer('a'), now: 20 })
    expect(second.seats.filter((seat) => seat.viewer?.id === 'a')).toHaveLength(1)
    expect(second.seats[0]?.lastInteractionAt).toBe(20)
  })

  it('queues overflow and moves the next viewer into an explicitly freed seat', () => {
    let state = createSeatState()
    for (let index = 0; index < 13; index += 1) {
      state = seatReducer(state, { type: 'join', viewer: viewer(String(index)), now: index })
    }
    expect(state.seats.filter((seat) => seat.viewer)).toHaveLength(12)
    expect(state.queue).toHaveLength(1)
    state = seatReducer(state, { type: 'leave', viewerId: '0', now: 20 })
    expect(state.seats[0]?.viewer?.id).toBe('12')
    expect(state.queue).toHaveLength(0)
  })

  it('does not assign a locked seat or reclaim inactive seats automatically', () => {
    let state = seatReducer(createSeatState(), { type: 'lock', seatId: 1, locked: true })
    state = seatReducer(state, { type: 'join', viewer: viewer('a'), now: 1 })
    state = seatReducer(state, { type: 'mark-inactive', before: 2 })
    expect(state.seats[0]?.status).toBe('locked')
    expect(state.seats[1]?.status).toBe('inactive')
    expect(state.seats[1]?.viewer?.id).toBe('a')
  })

  it('rejects a request for a locked seat without assigning another seat', () => {
    let state = seatReducer(createSeatState(), { type: 'lock', seatId: 4, locked: true })
    state = seatReducer(state, { type: 'join', viewer: viewer('a'), preferredSeat: 4, now: 1 })
    expect(state.seats.every((seat) => !seat.viewer)).toBe(true)
    expect(state.queue).toHaveLength(0)
  })

  it('moves a seated viewer to a requested empty seat and does not displace another viewer', () => {
    let state = createSeatState()
    state = seatReducer(state, { type: 'join', viewer: viewer('a'), now: 1 })
    state = seatReducer(state, { type: 'join', viewer: viewer('b'), now: 2 })
    state = seatReducer(state, { type: 'join', viewer: viewer('a'), preferredSeat: 3, now: 3 })
    expect(state.seats[0]?.status).toBe('empty')
    expect(state.seats[2]?.viewer?.id).toBe('a')

    const unchanged = seatReducer(state, { type: 'join', viewer: viewer('a'), preferredSeat: 2, now: 4 })
    expect(unchanged.seats[1]?.viewer?.id).toBe('b')
    expect(unchanged.seats[2]?.viewer?.id).toBe('a')
  })

  it('lets a queued viewer choose a specific empty seat', () => {
    let state = createSeatState()
    for (let index = 0; index < 11; index += 1) {
      state = seatReducer(state, { type: 'join', viewer: viewer(String(index)), now: index })
    }
    state = { ...state, queue: [{ ...viewer('waiting'), requestedAt: 11 }] }
    state = seatReducer(state, { type: 'join', viewer: viewer('waiting'), preferredSeat: 12, now: 20 })
    expect(state.seats[11]?.viewer?.id).toBe('waiting')
    expect(state.queue).toHaveLength(0)
  })
})
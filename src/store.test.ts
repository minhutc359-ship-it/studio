import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeProviderEvent, resolveProviderViewerId } from './domain/providerEvent'
import { useStudioStore } from './store'

describe('chat seat bubbles', () => {
  beforeEach(() => {
    useStudioStore.getState().resetSession()
    vi.stubGlobal('window', { setTimeout: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows a welcome bubble when a viewer joins an available seat', () => {
    const viewer = { id: 'viewer-1', name: 'Viewer One', avatar: '🎟️' }

    useStudioStore.getState().addChat(viewer, '!join', false)

    const state = useStudioStore.getState()
    expect(state.seatState.seats.some((seat) => seat.viewer?.id === viewer.id)).toBe(true)
    expect(state.seatBubbles[viewer.id]?.text).toBe('đã vào rạp 🍿')
  })

  it('executes a bare react command from a seated viewer', () => {
    const viewer = { id: 'viewer-2', name: 'Viewer Two', avatar: '🎟️' }
    const store = useStudioStore.getState()

    store.addChat(viewer, 'join', false)
    useStudioStore.getState().addChat(viewer, 'react heart', false)

    const state = useStudioStore.getState()
    const seat = state.seatState.seats.find((item) => item.viewer?.id === viewer.id)
    expect(seat).toBeDefined()
    expect(state.seatBubbles[viewer.id]?.text).toContain('💗')
    expect(state.seatAnimations[viewer.id]?.kind).toBe('heart')
  })

  it('uses distinct bubble and sprite IDs for both seats targeted by a reaction', () => {
    const first = { id: 'viewer-first', name: 'Viewer First', avatar: '🎟️' }
    const second = { id: 'viewer-second', name: 'Viewer Second', avatar: '🎟️' }
    useStudioStore.getState().addChat(first, 'join', false)
    useStudioStore.getState().addChat(second, 'join', false)

    useStudioStore.getState().addChat(first, 'react cheer 2', false)

    const state = useStudioStore.getState()
    const effectIds = [
      state.seatBubbles[first.id]?.id,
      state.seatAnimations[first.id]?.id,
      state.seatBubbles[second.id]?.id,
      state.seatAnimations[second.id]?.id,
    ]
    expect(new Set(effectIds).size).toBe(4)
    expect(state.seatAnimations[first.id]?.kind).toBe('cheer')
    expect(state.seatAnimations[second.id]?.kind).toBe('cheer')
  })

  it('routes a reaction with a different provider identity field to the existing seat', () => {
    const member = normalizeProviderEvent({
      event: 'member',
      data: { user: { id: 'viewer-3-id', uniqueId: 'viewer_three', nickname: 'Viewer Three' } },
    })
    const aliases = new Map(member.identityKeys.map((key) => [key, member.id]))
    const joinedViewer = { id: member.id, name: member.name, avatar: '🎟️' }
    useStudioStore.getState().addChat(joinedViewer, 'join', false)

    const chat = normalizeProviderEvent({
      event: 'chat',
      data: { user: { uniqueId: 'viewer_three', nickname: 'Viewer Three' }, comment: 'react heart' },
    })
    const canonicalId = resolveProviderViewerId(chat.identityKeys, aliases, new Set([member.id]), chat.id)
    useStudioStore.getState().addChat({ ...joinedViewer, id: canonicalId }, chat.comment, false)

    const state = useStudioStore.getState()
    expect(state.seatState.seats.find((seat) => seat.viewer?.id === member.id)).toBeDefined()
    expect(state.seatBubbles[member.id]?.text).toContain('💗')
    expect(state.seatAnimations[member.id]?.kind).toBe('heart')
    expect(state.seatBubbles[member.id]?.id).not.toBe(state.seatAnimations[member.id]?.id)
  })

  it('refreshes a seated viewer activity timestamp when an event arrives', () => {
    const viewer = { id: 'viewer-active', name: 'Viewer Active', avatar: '🎟️' }
    useStudioStore.getState().addChat(viewer, 'join', false)
    const before = Date.now()
    useStudioStore.getState().touchViewer(viewer.id)

    const state = useStudioStore.getState()
    const seat = state.seatState.seats.find((item) => item.viewer?.id === viewer.id)
    expect(seat?.lastInteractionAt).toBeGreaterThanOrEqual(before)
  })

  it('releases a stale viewer seat and clears its transient bubble and animation', () => {
    const viewer = { id: 'viewer-stale', name: 'Viewer Stale', avatar: '🎟️' }
    useStudioStore.getState().addChat(viewer, 'join', false)
    useStudioStore.setState((state) => ({
      seatState: {
        ...state.seatState,
        seats: state.seatState.seats.map((seat) => seat.viewer?.id === viewer.id
          ? { ...seat, lastInteractionAt: 100 }
          : seat),
      },
    }))

    useStudioStore.getState().reclaimInactiveViewers(1_000)

    const state = useStudioStore.getState()
    expect(state.seatState.seats.some((seat) => seat.viewer?.id === viewer.id)).toBe(false)
    expect(state.seatBubbles[viewer.id]).toBeUndefined()
    expect(state.seatAnimations[viewer.id]).toBeUndefined()
  })
})
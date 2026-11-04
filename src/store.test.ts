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

  it('places overflow viewers in standing and caps the area at 20', () => {
    const viewers = Array.from({ length: 34 }, (_, index) => ({
      id: `standing-${index}`,
      name: `Standing ${index}`,
      avatar: '🎟️',
    }))
    for (const viewer of viewers) useStudioStore.getState().addChat(viewer, 'join', false)

    const state = useStudioStore.getState()
    expect(state.seatState.seats.filter((seat) => seat.viewer)).toHaveLength(12)
    expect(state.standingViewers).toHaveLength(20)
    expect(state.seatState.queue.map((viewer) => viewer.id)).toEqual(['standing-32', 'standing-33'])
    expect(state.seatBubbles['standing-12']?.text).toBe('đã vào khu standing 🚶')

    useStudioStore.getState().addChat(viewers[12]!, 'react heart', false)
    expect(useStudioStore.getState().seatAnimations['standing-12']?.kind).toBe('heart')
    expect(useStudioStore.getState().seatBubbles['standing-12']?.text).toBe('💗')
  })

  it('refills standing from the queue when a standing viewer leaves', () => {
    const viewers = Array.from({ length: 33 }, (_, index) => ({
      id: `overflow-${index}`,
      name: `Overflow ${index}`,
      avatar: '🎟️',
    }))
    for (const viewer of viewers) useStudioStore.getState().addChat(viewer, 'join', false)

    useStudioStore.getState().addChat(viewers[12]!, '!leave', false)

    const state = useStudioStore.getState()
    expect(state.standingViewers.some((viewer) => viewer.id === 'overflow-12')).toBe(false)
    expect(state.standingViewers.some((viewer) => viewer.id === 'overflow-32')).toBe(true)
    expect(state.seatState.queue).toHaveLength(0)
  })

  it('keeps repeat join commands idempotent for a standing viewer', () => {
    const viewers = Array.from({ length: 13 }, (_, index) => ({
      id: `repeat-join-${index}`,
      name: `Repeat ${index}`,
      avatar: '🎟️',
    }))
    for (const viewer of viewers) useStudioStore.getState().addChat(viewer, 'join', false)

    useStudioStore.getState().addChat(viewers[12]!, 'join', false)
    expect(useStudioStore.getState().standingViewers.filter((viewer) => viewer.id === 'repeat-join-12')).toHaveLength(1)
    expect(useStudioStore.getState().seatState.queue).toHaveLength(0)

    useStudioStore.getState().leaveViewer('repeat-join-0')
    expect(useStudioStore.getState().standingViewers).toHaveLength(0)
    expect(useStudioStore.getState().seatState.seats[0]?.viewer?.id).toBe('repeat-join-12')
  })

  it('animates gifts on the standing viewer who sent them', () => {
    const viewers = Array.from({ length: 13 }, (_, index) => ({
      id: `gift-stand-${index}`,
      name: `Gift Stand ${index}`,
      avatar: '🎟️',
    }))
    for (const viewer of viewers) useStudioStore.getState().addChat(viewer, 'join', false)

    useStudioStore.getState().addGiftEvent(viewers[12]!, 'Bắp Rang')

    expect(useStudioStore.getState().seatAnimations['gift-stand-12']?.kind).toBe('gift')
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

  it('renders an image emote when a viewer sends only its keyword', () => {
    const viewer = { id: 'viewer-t1', name: 'Viewer T1', avatar: '🎟️' }
    const store = useStudioStore.getState()

    store.addChat(viewer, 'join', false)
    useStudioStore.getState().addChat(viewer, 't1', false)

    const state = useStudioStore.getState()
    expect(state.seatBubbles[viewer.id]?.image).toBe('/assets/emotes/t1.png')
    expect(state.seatAnimations[viewer.id]?.kind).toBe('t1')
  })

  it('renders the supplied images and animation kinds for the new emotes', () => {
    for (const [index, emote] of (['chovy', 'sao', 'bakayaru'] as const).entries()) {
      const viewer = { id: `viewer-new-emote-${index}`, name: `Viewer ${emote}`, avatar: '🎟️' }
      useStudioStore.getState().addChat(viewer, 'join', false)
      useStudioStore.getState().addChat(viewer, emote, false)
      const state = useStudioStore.getState()
      expect(state.seatBubbles[viewer.id]?.image).toBe(`/assets/emotes/${emote}.png`)
      expect(state.seatAnimations[viewer.id]?.kind).toBe(emote)
    }
  })

  it('shows the full normalized WebSocket chat text in the seated viewer bubble', () => {
    const viewer = { id: 'viewer-chat', name: 'Viewer Chat', avatar: '🎟️' }
    const comment = 'Cả nhà ơi, xem trận này vui quá! Mọi người đang cổ vũ đội nào vậy?'
    const event = normalizeProviderEvent({
      event: 'chat',
      data: { user: { uniqueId: viewer.id, nickname: viewer.name }, comment },
    })
    useStudioStore.getState().addChat(viewer, 'join', false)
    useStudioStore.getState().addChat(viewer, event.comment, false)

    const state = useStudioStore.getState()
    expect(state.seatBubbles[viewer.id]?.text).toBe(comment)
    expect(state.chat[state.chat.length - 1]?.text).toBe(comment)
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
    expect(state.seatBubbles[first.id]?.text).toBe('👏')
    expect(state.seatBubbles[second.id]?.text).toBe('👏')
    expect(state.seatBubbles[first.id]?.text).not.toContain('ghế')
    expect(state.seatBubbles[second.id]?.text).not.toContain('ghế')
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

  it('removes a WS-leaving viewer and fills their seat from the queue', () => {
    const viewers = Array.from({ length: 13 }, (_, index) => ({
      id: `viewer-${index}`,
      name: `Viewer ${index}`,
      avatar: '🎟️',
    }))
    for (const viewer of viewers) useStudioStore.getState().addChat(viewer, 'join', false)
    useStudioStore.getState().leaveViewer('viewer-0')
    const state = useStudioStore.getState()
    expect(state.seatState.seats[0]?.viewer?.id).toBe('viewer-12')
    expect(state.seatState.queue).toHaveLength(0)
    expect(state.seatBubbles['viewer-0']).toBeUndefined()
    expect(state.seatAnimations['viewer-0']).toBeUndefined()
  })

  it('removes a WS-leaving viewer from the waiting queue', () => {
    for (let index = 0; index < 13; index += 1) {
      useStudioStore.getState().addChat({ id: `queue-viewer-${index}`, name: `Viewer ${index}`, avatar: '🎟️' }, 'join', false)
    }
    useStudioStore.getState().leaveViewer('queue-viewer-12')

    const state = useStudioStore.getState()
    expect(state.seatState.queue.some((viewer) => viewer.id === 'queue-viewer-12')).toBe(false)
    expect(state.seatState.seats.filter((seat) => seat.viewer)).toHaveLength(12)
  })

  it('does not release a real-provider seat from a chat leave command', () => {
    const viewer = { id: 'viewer-provider', name: 'Viewer Provider', avatar: '🎟️' }
    useStudioStore.getState().updateSettings({ provider: 'tiktools' })
    useStudioStore.getState().addChat(viewer, 'join', false)
    useStudioStore.getState().addChat(viewer, '!leave', false)

    expect(useStudioStore.getState().seatState.seats[0]?.viewer?.id).toBe(viewer.id)
    useStudioStore.getState().leaveViewer(viewer.id)
    expect(useStudioStore.getState().seatState.seats[0]?.viewer).toBeUndefined()
  })
})
import { create } from 'zustand'
import { parseCommand, type Reaction } from './domain/events'
import { createSeatState, seatReducer, type SeatState, type Viewer } from './domain/seatManager'

export type ProviderId = 'mock' | 'tikfinity' | 'tiktools'
export type ScreenMode = 'placeholder' | 'local-video' | 'direct-url' | 'screen-share' | 'external'

export interface StudioSettings {
  provider: ProviderId
  username: string
  screenMode: ScreenMode
  screenUrl: string
  screenSize: number
  showChat: boolean
  seatMode: 'hybrid' | 'manual-command' | 'auto-on-join'
  reducedMotion: boolean
  showNicknames: boolean
}

const defaultSettings: StudioSettings = {
  provider: 'mock',
  username: '',
  screenMode: 'placeholder',
  screenUrl: '',
  screenSize: 100,
  showChat: true,
  seatMode: 'hybrid',
  reducedMotion: false,
  showNicknames: true,
}

function readSettings(): StudioSettings {
  try {
    const saved = localStorage.getItem('viewing-party-settings-v1')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) as Partial<StudioSettings> } : defaultSettings
  } catch {
    return defaultSettings
  }
}

export interface ChatEntry {
  id: string
  name: string
  avatar: string
  text: string
  kind: 'chat' | 'gift' | 'system' | 'reaction'
  time: string
}

export interface SeatBubble {
  id: string
  text: string
  image?: string
}

export type SeatAnimation = 'enter' | 'talk' | 'cheer' | 'gift' | 'wave' | 'heart' | 'oxygen' | 't1' | 'geng' | 'silent' | 'chovy' | 'sao' | 'bakayaru'
export const MAX_STANDING_VIEWERS = 20

const reactionIcons: Record<Reaction, string> = {
  heart: '💗', cheer: '👏', wave: '👋', oxygen: '😷', t1: '🔴', geng: '🟡', silent: '🤫',
  chovy: '⭐', sao: '★', bakayaru: '😠',
}
const reactionImages: Partial<Record<Reaction, string>> = {
  oxygen: '/assets/emotes/oxygen.png', t1: '/assets/emotes/t1.png',
  geng: '/assets/emotes/geng.png', silent: '/assets/emotes/silent.png',
  chovy: '/assets/emotes/chovy.png', sao: '/assets/emotes/sao.png',
  bakayaru: '/assets/emotes/bakayaru.png',
}
const reactionLabels: Record<Reaction, string> = {
  heart: 'gửi tim', cheer: 'cổ vũ', wave: 'vẫy chào', oxygen: 'thở oxy',
  t1: 'T1', geng: 'Gen.G', silent: 'silent', chovy: 'Chovy', sao: 'SAO', bakayaru: 'Bakayaru',
}

interface StudioState {
  settings: StudioSettings
  videoFile?: File
  seatState: SeatState
  standingViewers: Viewer[]
  mockAudienceIds: string[]
  chat: ChatEntry[]
  seatBubbles: Record<string, SeatBubble>
  reactionCooldowns: Record<string, number>
  seatAnimations: Record<string, { id: string; kind: SeatAnimation }>
  highlightedGiftId: string | null
  connection: 'waiting' | 'connected' | 'reconnecting' | 'connecting' | 'error'
  connectionDetail: string
  resetSession: () => void
  viewerCount: number
  likes: number
  gifts: number
  quietMode: boolean
  updateSettings: (settings: Partial<StudioSettings>) => void
  setConnection: (connection: StudioState['connection']) => void
  addChat: (viewer: Viewer, text: string, respond?: boolean) => void
  clearSeatBubble: (viewerId: string, bubbleId: string) => void
  clearSeatAnimation: (viewerId: string, animationId: string) => void
  clearGiftHighlight: (giftId: string) => void
  addMockViewer: (respond?: boolean) => void
  runMockEvent: () => void
  sendMockGift: () => void
  addGiftEvent: (viewer: Viewer, giftName: string, count?: number) => void
  touchViewer: (viewerId: string) => void
  leaveViewer: (viewerId: string) => void
  addMockLikes: () => void
  setViewerCount: (count: number) => void
  toggleQuietMode: () => void
}

const avatars = ['🧙🏻‍♀️', '🧝🏽‍♂️', '🧑🏻‍🚀', '🧚🏼‍♀️', '🧑🏾‍🎤', '🧛🏻‍♂️', '🧝🏻‍♀️', '🧑🏼‍🍳', '🧞‍♀️', '🧑🏽‍🎨', '🧑🏻‍🌾', '🧜🏼‍♀️']
const names = ['Mây Nhỏ', 'Minh Khang', 'Phương Nhi', 'Hoàng Minh', 'Thảo Vy', 'Gia Bảo', 'Linh Đan', 'An Nhiên', 'Bảo Trâm', 'Đức Anh', 'Mai Chi', 'Vân Kiệt']
let mockIndex = 0

function createMockViewer(): Viewer {
  const index = mockIndex++ % names.length
  return { id: `mock-${index}-${Date.now()}-${mockIndex}`, name: names[index] ?? 'Khách mời', avatar: avatars[index] ?? '🧑🏻‍🚀' }
}

function timeLabel() {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

function entry(viewer: Viewer, text: string, kind: ChatEntry['kind'] = 'chat'): ChatEntry {
  return { id: `${Date.now()}-${Math.random()}`, name: viewer.name, avatar: viewer.avatar, text: text.slice(0, 500), kind, time: timeLabel() }
}

function fillStandingFromQueue(seatState: SeatState, standingViewers: Viewer[]) {
  const capacity = MAX_STANDING_VIEWERS - standingViewers.length
  const joining = seatState.queue.slice(0, capacity)
  return {
    seatState: { ...seatState, queue: seatState.queue.slice(joining.length) },
    standingViewers: [...standingViewers, ...joining.map(({ id, name, avatar }) => ({ id, name, avatar }))],
  }
}

function removeAudienceViewer(seatState: SeatState, standingViewers: Viewer[], viewerId: string) {
  const leavingSeat = seatState.seats.find((seat) => seat.viewer?.id === viewerId)
  const nextStanding = standingViewers.filter((viewer) => viewer.id !== viewerId)
  let nextSeatState = seatState

  if (leavingSeat && standingViewers.length > 0) {
    const now = Date.now()
    const queue = seatState.queue.filter((viewer) => now - viewer.requestedAt < 600_000)
    const promoted = standingViewers.find((viewer) => viewer.id !== viewerId)
    if (promoted) nextStanding.splice(nextStanding.findIndex((viewer) => viewer.id === promoted.id), 1)
    const emptied = seatReducer({ ...seatState, queue: [] }, { type: 'leave', viewerId, now })
    nextSeatState = promoted
      ? { ...seatReducer(emptied, { type: 'join', viewer: promoted, preferredSeat: leavingSeat.id, now }), queue }
      : { ...emptied, queue }
  } else {
    nextSeatState = seatReducer(seatState, { type: 'leave', viewerId })
  }

  const filled = fillStandingFromQueue(nextSeatState, nextStanding)
  return filled
}

export const useStudioStore = create<StudioState>((set, get) => ({
  settings: readSettings(),
  seatState: createSeatState(),
  standingViewers: [],
  mockAudienceIds: [],
  chat: [
    { id: 'welcome-1', name: 'Rạp trưởng', avatar: '🎬', text: 'Rạp đã mở cửa. Gõ !join để chọn ghế nhé!', kind: 'system', time: timeLabel() },
    { id: 'welcome-2', name: 'Mây Nhỏ', avatar: '🧚🏼‍♀️', text: 'Tối nay xem gì đây mọi người? ✨', kind: 'chat', time: timeLabel() },
  ],
  seatBubbles: {},
  reactionCooldowns: {},
  seatAnimations: {},
  highlightedGiftId: null,
  connection: 'waiting',
  connectionDetail: '',
  resetSession: () => set({ seatState: createSeatState(), standingViewers: [], mockAudienceIds: [], chat: [], seatBubbles: {}, reactionCooldowns: {}, seatAnimations: {}, highlightedGiftId: null, viewerCount: 0, likes: 0, gifts: 0 }),
  viewerCount: 0,
  likes: 0,
  gifts: 0,
  quietMode: false,
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch }
    try { localStorage.setItem('viewing-party-settings-v1', JSON.stringify(settings)) } catch { /* storage may be unavailable */ }
    set({ settings })
  },
  setConnection: (connection) => set({ connection }),
  touchViewer: (viewerId) => set((state) => ({
    seatState: seatReducer(state.seatState, { type: 'touch', viewerId }),
  })),
  leaveViewer: (viewerId) => set((state) => {
    const { seatState, standingViewers } = removeAudienceViewer(state.seatState, state.standingViewers, viewerId)
    const seatBubbles = { ...state.seatBubbles }
    const seatAnimations = { ...state.seatAnimations }
    const reactionCooldowns = { ...state.reactionCooldowns }
    delete seatBubbles[viewerId]
    delete seatAnimations[viewerId]
    delete reactionCooldowns[viewerId]
    return { seatState, standingViewers, seatBubbles, seatAnimations, reactionCooldowns }
  }),
  addChat: (viewer, text, respond = true) => {
    const state = get()
    const parsedCommand = parseCommand(text)
    const command = parsedCommand?.kind === 'leave' && state.settings.provider !== 'mock' ? null : parsedCommand
    let seatState = state.seatState
    let standingViewers = state.standingViewers
    let response: string | undefined
    let reactionTargets: Viewer[] = []
    let reactionSource: string | undefined
    let kind: ChatEntry['kind'] = 'chat'

    if (command?.kind === 'join') {
      seatState = seatReducer(seatState, { type: 'join', viewer })
      const assigned = seatState.seats.some((seat) => seat.viewer?.id === viewer.id)
      const alreadyStanding = standingViewers.some((standing) => standing.id === viewer.id)
      if (assigned) standingViewers = standingViewers.filter((standing) => standing.id !== viewer.id)
      else if (alreadyStanding) seatState = { ...seatState, queue: seatState.queue.filter((queued) => queued.id !== viewer.id) }
      const filled = fillStandingFromQueue(seatState, standingViewers)
      seatState = filled.seatState
      standingViewers = filled.standingViewers
      response = seatState.seats.some((seat) => seat.viewer?.id === viewer.id) ? 'đã vào rạp 🍿'
        : standingViewers.some((standing) => standing.id === viewer.id) ? 'đã vào khu standing 🚶'
          : seatState.queue.some((queued) => queued.id === viewer.id) ? 'đã vào hàng chờ ⏳' : 'hàng chờ đã đầy'
      kind = 'system'
    } else if (command?.kind === 'leave') {
      const hadSeat = seatState.seats.some((seat) => seat.viewer?.id === viewer.id)
      const wasStanding = standingViewers.some((standing) => standing.id === viewer.id)
      const removed = removeAudienceViewer(seatState, standingViewers, viewer.id)
      seatState = removed.seatState
      standingViewers = removed.standingViewers
      response = hadSeat ? 'đã rời ghế 👋' : wasStanding ? 'đã rời khu standing 👋' : 'đã rời hàng chờ'
      kind = 'system'
    } else if (command?.kind === 'seat') {
      const before = seatState
      seatState = seatReducer(seatState, { type: 'join', viewer, preferredSeat: command.seatId })
      const assigned = seatState.seats.find((seat) => seat.viewer?.id === viewer.id)
      if (assigned) standingViewers = standingViewers.filter((standing) => standing.id !== viewer.id)
      const requestedSeat = seatState.seats.find((seat) => seat.id === command.seatId)
      response = assigned?.id === command.seatId ? `đã chọn ghế ${command.seatId}`
        : requestedSeat?.status === 'locked' ? `ghế ${command.seatId} đang khóa`
          : requestedSeat?.viewer ? `ghế ${command.seatId} đã có người`
            : assigned ? `đang ở ghế ${assigned.id}` : before === seatState ? 'không thể chọn ghế này' : 'đã vào hàng chờ'
      kind = 'system'
    } else if (command?.kind === 'react') {
      seatState = seatReducer(seatState, { type: 'touch', viewerId: viewer.id })
      const seatedSource = seatState.seats.find((seat) => seat.viewer?.id === viewer.id)?.viewer
      const source = seatedSource ?? standingViewers.find((standing) => standing.id === viewer.id)
      const target = seatState.seats.find((seat) => seat.id === command.seatId)
      if (!source) response = command.seatId
        ? 'Gõ !join để tham gia rạp rồi gửi biểu cảm.'
        : `${reactionIcons[command.reaction]} ${reactionLabels[command.reaction]} cả rạp`
      else if (target?.viewer?.id === source.id) response = 'Hãy chọn ghế của một khán giả khác.'
      else if (command.seatId && !target?.viewer) response = `Ghế ${command.seatId} chưa có người.`
      else {
        if (Date.now() - (state.reactionCooldowns[source.id] ?? -Infinity) < 2500) return
        reactionSource = source.id
        reactionTargets = [source, ...(target?.viewer ? [target.viewer] : [])]
        response = `${reactionIcons[command.reaction]} ${reactionLabels[command.reaction]} ${target ? `ghế ${target.id}` : 'cả rạp'}`
      }
      kind = 'reaction'
    } else if (command?.kind === 'help') {
      seatState = seatReducer(seatState, { type: 'touch', viewerId: viewer.id })
      response = 'Emote chat: t1 · geng · oxi · silent · clap · wave'
      kind = 'system'
    } else {
      seatState = seatReducer(seatState, { type: 'touch', viewerId: viewer.id })
    }

    const nextChat = [...state.chat, entry(viewer, text, command ? kind : 'chat')]
    if (response && respond) nextChat.push(entry({ ...viewer, id: 'system', name: 'Rạp trưởng', avatar: '🎬' }, response, 'system'))
    const audienceMember = seatState.seats.some((seat) => seat.viewer?.id === viewer.id)
      || standingViewers.some((standing) => standing.id === viewer.id)
    const bubbleId = `${viewer.id}-${Date.now()}`
    const previousSeatId = state.seatState.seats.find((seat) => seat.viewer?.id === viewer.id)?.id
    const currentSeatId = seatState.seats.find((seat) => seat.viewer?.id === viewer.id)?.id
    const newlySeated = previousSeatId === undefined && currentSeatId !== undefined
    const movedSeat = previousSeatId !== undefined && currentSeatId !== previousSeatId
    const previouslyInAudience = state.seatState.seats.some((seat) => seat.viewer?.id === viewer.id)
      || state.standingViewers.some((standing) => standing.id === viewer.id)
    const joinedAudience = !previouslyInAudience && audienceMember
    const audienceEntryBubble = (newlySeated || movedSeat || joinedAudience) && (command?.kind === 'join' || command?.kind === 'seat')
    const animationKind: SeatAnimation | undefined = newlySeated || joinedAudience ? 'enter' : audienceMember && !command ? 'talk' : undefined
    const animationId = `${viewer.id}-${Date.now()}-${Math.random()}`
    const isMockLeave = command?.kind === 'leave' && state.mockAudienceIds.includes(viewer.id)
    set({
      seatState,
      standingViewers,
      chat: nextChat.slice(-24),
      ...(isMockLeave ? { mockAudienceIds: state.mockAudienceIds.filter((viewerId) => viewerId !== viewer.id), viewerCount: Math.max(0, state.viewerCount - 1) } : {}),
      ...(audienceMember || audienceEntryBubble ? { seatBubbles: { ...state.seatBubbles, [viewer.id]: { id: bubbleId, text: (audienceEntryBubble ? response : text)?.slice(0, 500) ?? '' } } } : {}),
      ...(animationKind ? { seatAnimations: { ...state.seatAnimations, [viewer.id]: { id: animationId, kind: animationKind } } } : {}),
    })
    if (command?.kind === 'react' && reactionSource !== undefined) {
      const reaction = command.reaction
      const source = reactionSource
      set((current) => ({
        reactionCooldowns: { ...current.reactionCooldowns, [source]: Date.now() },
        seatBubbles: {
          ...current.seatBubbles,
          ...Object.fromEntries(reactionTargets.map((targetViewer) => [targetViewer.id, {
            id: `${animationId}:bubble:${targetViewer.id}`,
            text: reactionIcons[reaction],
            image: reactionImages[reaction],
          }])),
        },
        seatAnimations: {
          ...current.seatAnimations,
          ...Object.fromEntries(reactionTargets.map((targetViewer) => [targetViewer.id, { id: `${animationId}:animation:${targetViewer.id}`, kind: reaction }]))
        },
      }))
      for (const targetViewer of reactionTargets) {
        const id = targetViewer.id
        const seatBubbleId = `${animationId}:bubble:${id}`
        const seatAnimationId = `${animationId}:animation:${id}`
        window.setTimeout(() => get().clearSeatBubble(id, seatBubbleId), 3600)
        window.setTimeout(() => get().clearSeatAnimation(id, seatAnimationId), 2000)
      }
    }
    if (audienceMember || audienceEntryBubble) window.setTimeout(() => get().clearSeatBubble(viewer.id, bubbleId), 3600)
    if (animationKind) window.setTimeout(() => get().clearSeatAnimation(viewer.id, animationId), animationKind === 'talk' ? 1500 : 1400)
  },
  clearSeatBubble: (viewerId, bubbleId) => set((state) => {
    if (state.seatBubbles[viewerId]?.id !== bubbleId) return state
    const seatBubbles = { ...state.seatBubbles }
    delete seatBubbles[viewerId]
    return { seatBubbles }
  }),
  clearSeatAnimation: (viewerId, animationId) => set((state) => {
    if (state.seatAnimations[viewerId]?.id !== animationId) return state
    const seatAnimations = { ...state.seatAnimations }
    delete seatAnimations[viewerId]
    return { seatAnimations }
  }),
  clearGiftHighlight: (giftId) => set((state) => state.highlightedGiftId === giftId ? { highlightedGiftId: null } : state),
  addMockViewer: (respond = true) => {
    const viewer = createMockViewer()
    get().addChat(viewer, '!join', respond)
    set((state) => ({ mockAudienceIds: [...state.mockAudienceIds, viewer.id], viewerCount: state.viewerCount + 1 }))
  },
  runMockEvent: () => {
    const state = get()
    const eventTypes = state.mockAudienceIds.length > 1
      ? ['chat', 'chat', 'gift', 'like', 'join', 'leave']
      : ['chat', 'chat', 'gift', 'like', 'join']
    const selectedEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const activeViewer = state.mockAudienceIds
      .map((viewerId) => state.seatState.seats.find((seat) => seat.viewer?.id === viewerId)?.viewer
        ?? state.standingViewers.find((viewer) => viewer.id === viewerId)
        ?? state.seatState.queue.find((viewer) => viewer.id === viewerId))
      .filter((viewer): viewer is Viewer => Boolean(viewer))
    const actor = activeViewer[Math.floor(Math.random() * activeViewer.length)] ?? createMockViewer()

    if (selectedEvent === 'join') {
      get().addMockViewer(false)
      return
    }
    if (selectedEvent === 'leave' && activeViewer.length > 1) {
      get().addChat(actor, '!leave', false)
      return
    }
    if (selectedEvent === 'gift') {
      get().addGiftEvent(actor, ['Bắp Rang', 'Trà Sữa', 'Hoa Sen'][Math.floor(Math.random() * 3)] ?? 'Bắp Rang', 1)
      return
    }
    if (selectedEvent === 'like') {
      set((current) => ({ likes: current.likes + 1, chat: [...current.chat, entry({ id: 'crowd', name: 'Khán giả', avatar: '💖' }, '+1 lượt thích', 'reaction')].slice(-24) }))
      return
    }
    const messages = ['Tối nay vui quá!', 'Màn chiếu đẹp ghê ✨', '🍿🍿🍿', 'Xin chào cả rạp!']
    get().addChat(actor, messages[Math.floor(Math.random() * messages.length)] ?? 'Xin chào!', false)
  },
  sendMockGift: () => {
    const state = get()
    const audienceViewer = state.seatState.seats.find((seat) => seat.viewer)?.viewer ?? state.standingViewers[0]
    const viewer: Viewer = audienceViewer ?? createMockViewer()
    get().addGiftEvent(viewer, 'Bắp Rang', 10)
  },
  addGiftEvent: (viewer, giftName, count = 1) => {
    const normalizedName = giftName.trim().slice(0, 48) || 'Quà tặng'
    const settledCount = Math.max(1, Math.min(100_000, Math.floor(count) || 1))
    const giftEntry = entry(viewer, `đã gửi ${normalizedName} ×${settledCount}`, 'gift')
    const giftAnimationId = `${viewer.id}-${Date.now()}-${Math.random()}`
    const state = get()
    const audienceIds = [
      ...state.seatState.seats.flatMap((seat) => seat.viewer ? [seat.viewer.id] : []),
      ...state.standingViewers.map((standing) => standing.id),
    ]
    const animationTargets = audienceIds.includes(viewer.id) ? [viewer.id] : audienceIds
    const targetAnimationIds = new Map(animationTargets.map((viewerId) => [viewerId, `${giftAnimationId}:${viewerId}`]))
    set((state) => {
      return {
        seatState: seatReducer(state.seatState, { type: 'touch', viewerId: viewer.id }),
        gifts: state.gifts + 1,
        chat: [...state.chat, giftEntry].slice(-24),
        highlightedGiftId: giftEntry.id,
        seatAnimations: {
          ...state.seatAnimations,
          ...Object.fromEntries(animationTargets.map((viewerId) => [viewerId, { id: targetAnimationIds.get(viewerId)!, kind: viewerId === viewer.id ? 'gift' : 'cheer' }]))
        },
      }
    })
    window.setTimeout(() => get().clearGiftHighlight(giftEntry.id), 2600)
    animationTargets.forEach((viewerId) => window.setTimeout(() => get().clearSeatAnimation(viewerId, targetAnimationIds.get(viewerId)!), 1400))
  },
  addMockLikes: () => set((state) => ({ likes: state.likes + 100, chat: [...state.chat, entry({ id: 'crowd', name: 'Khán giả', avatar: '💖' }, '+100 lượt thích', 'reaction')].slice(-24) })),
  setViewerCount: (count) => set({ viewerCount: Math.max(0, count) }),
  toggleQuietMode: () => set((state) => ({ quietMode: !state.quietMode })),
}))
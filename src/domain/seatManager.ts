export type SeatStatus = 'empty' | 'occupied' | 'inactive' | 'locked'

export interface Viewer {
  id: string
  name: string
  avatar: string
}

export interface Seat {
  id: number
  status: SeatStatus
  viewer?: Viewer
  assignedAt?: number
  lastInteractionAt?: number
}

export interface WaitingViewer extends Viewer {
  requestedAt: number
}

export interface SeatState {
  seats: Seat[]
  queue: WaitingViewer[]
}

export type SeatAction =
  | { type: 'join'; viewer: Viewer; preferredSeat?: number; now?: number }
  | { type: 'leave'; viewerId: string; now?: number }
  | { type: 'lock'; seatId: number; locked: boolean }
  | { type: 'touch'; viewerId: string; now?: number }
  | { type: 'mark-inactive'; before: number }

export function createSeatState(): SeatState {
  return { seats: Array.from({ length: 12 }, (_, index) => ({ id: index + 1, status: 'empty' })), queue: [] }
}

export function seatReducer(state: SeatState, action: SeatAction): SeatState {
  if (action.type === 'join') {
    const alreadySeated = state.seats.find((seat) => seat.viewer?.id === action.viewer.id)
    if (alreadySeated) {
      return {
        ...state,
        seats: state.seats.map((seat) => seat.id === alreadySeated.id
          ? { ...seat, status: 'occupied', lastInteractionAt: action.now ?? Date.now() }
          : seat),
      }
    }
    if (state.queue.some((viewer) => viewer.id === action.viewer.id)) return state

    const preferred = action.preferredSeat !== undefined
      ? state.seats.find((seat) => seat.id === action.preferredSeat)
      : undefined
    if (action.preferredSeat !== undefined && preferred?.status === 'locked') return state
    const available = (seat: Seat) => seat.status === 'empty'
    const target = preferred && available(preferred)
      ? preferred
      : state.seats.find(available)

    if (target) {
      const now = action.now ?? Date.now()
      return {
        ...state,
        seats: state.seats.map((seat) => seat.id === target.id
          ? { ...seat, status: 'occupied', viewer: action.viewer, assignedAt: now, lastInteractionAt: now }
          : seat),
      }
    }
    return { ...state, queue: [...state.queue, { ...action.viewer, requestedAt: action.now ?? Date.now() }] }
  }

  if (action.type === 'leave') {
    const leavingSeat = state.seats.find((seat) => seat.viewer?.id === action.viewerId)
    const queue = state.queue.filter((viewer) => viewer.id !== action.viewerId)
    if (!leavingSeat) return queue.length === state.queue.length ? state : { ...state, queue }
    const nextViewer = queue.shift()
    return {
      seats: state.seats.map((seat) => seat.id === leavingSeat.id
        ? nextViewer
          ? { ...seat, status: 'occupied', viewer: nextViewer, assignedAt: action.now ?? Date.now(), lastInteractionAt: action.now ?? Date.now() }
          : { id: seat.id, status: 'empty' }
        : seat),
      queue,
    }
  }

  if (action.type === 'lock') {
    return {
      ...state,
      seats: state.seats.map((seat) => seat.id === action.seatId && !seat.viewer
        ? { ...seat, status: action.locked ? 'locked' : 'empty' }
        : seat),
    }
  }

  if (action.type === 'touch') {
    return {
      ...state,
      seats: state.seats.map((seat) => seat.viewer?.id === action.viewerId
        ? { ...seat, status: 'occupied', lastInteractionAt: action.now ?? Date.now() }
        : seat),
    }
  }

  return {
    ...state,
    seats: state.seats.map((seat) => seat.viewer && seat.status === 'occupied' && (seat.lastInteractionAt ?? 0) < action.before
      ? { ...seat, status: 'inactive' }
      : seat),
  }
}
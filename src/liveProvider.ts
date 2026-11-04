import { providerUrl } from './domain/providerConfig'
import { normalizeProviderEvent, resolveProviderViewerId } from './domain/providerEvent'
import { reconnectDelay } from './domain/reconnectPolicy'
import { useStudioStore, type StudioSettings } from './store'

const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined

let disconnect: (() => void) | undefined
export function stopProvider() {
  disconnect?.()
  disconnect = undefined
}

export function connectProvider(settings: StudioSettings, input: string) {
  stopProvider()
  if (settings.provider === 'mock') return
  let url: URL
  try {
    url = providerUrl(settings.provider, settings.username, input)
  } catch (error) {
    useStudioStore.setState({ connection: 'error', connectionDetail: error instanceof Error ? error.message : 'Cấu hình kết nối không hợp lệ.' })
    return false
  }

  let socket: WebSocket
  let timeout: number
  let retry: number
  let attempts = 0
  let stopped = false
  const seen = new Set<string>()
  const viewerAliases = new Map<string, string>()
  const status = (connection: ReturnType<typeof useStudioStore.getState>['connection'], connectionDetail = '') =>
    useStudioStore.setState({ connection, connectionDetail })

  function open() {
    status('connecting')
    try {
      socket = new WebSocket(url)
    } catch {
      status('error', 'Trình duyệt không thể mở WebSocket.')
      return
    }
    timeout = window.setTimeout(() => socket.close(), 8000)
    socket.onopen = () => {
      if (stopped) return
      window.clearTimeout(timeout)
      status('connected', 'Đã mở WebSocket · đang chờ sự kiện LIVE.')
    }
    socket.onclose = () => {
      window.clearTimeout(timeout)
      if (stopped) return
      attempts += 1
      const delay = reconnectDelay(attempts - 1)
      status('reconnecting', `Thử lại sau ${(delay / 1000).toFixed(1)} giây (lần ${attempts}).`)
      retry = window.setTimeout(open, delay)
    }
    socket.onmessage = ({ data: frame }) => {
      if (stopped || typeof frame !== 'string' || frame.length > 256_000) return
      let parsed: unknown
      try { parsed = JSON.parse(frame) } catch { return }
      const { type, data, id: providerId, identityKeys, name, comment, messageId } = normalizeProviderEvent(parsed)
      const currentState = useStudioStore.getState()
      const seatedIds = new Set([
        ...currentState.seatState.seats.flatMap((seat) => seat.viewer ? [seat.viewer.id] : []),
        ...currentState.seatState.queue.map((viewer) => viewer.id),
      ])
      const id = resolveProviderViewerId(identityKeys, viewerAliases, seatedIds, providerId)
      identityKeys.forEach((key) => viewerAliases.set(key, id))
      const viewer = { id, name: (name || id).slice(0, 48), avatar: '🎟️' }
      const store = currentState
      if (id) store.touchViewer(id)
      if (type === 'gift' && (data.giftType === 1 || data.repeatEnd === false || data.repeatEnd === 0) && data.repeatEnd !== true && data.repeatEnd !== 1) return
      const key = messageId && `${type}:${messageId}`
      if (key && seen.has(key)) return
      if (key) {
        seen.add(key)
        if (seen.size > 2048) seen.delete(seen.values().next().value!)
      }
      const viewers = count(data.viewerCount ?? data.totalUser)
      if ((type === 'roomUser' || type === 'roomUserSeq') && viewers !== undefined) store.setViewerCount(viewers)
      if (type === 'like') {
        const total = count(data.totalLikeCount)
        const delta = count(data.likeCount)
        if (total !== undefined || delta !== undefined) useStudioStore.setState({ likes: total ?? store.likes + (delta ?? 0) })
      }
      if (id && type === 'chat' && comment) store.addChat(viewer, comment.slice(0, 500))
      if (id && type === 'leave') store.leaveViewer(id)
      if (id && type === 'member' && store.settings.seatMode !== 'manual-command') store.addChat(viewer, '!join', false)
      const gift = data.gift && typeof data.gift === 'object' && !Array.isArray(data.gift) ? data.gift as Record<string, unknown> : {}
      if (id && type === 'gift') store.addGiftEvent(viewer, typeof data.giftName === 'string' ? data.giftName : typeof gift.name === 'string' ? gift.name : '', count(data.repeatCount))
      if (type === 'roomInfo' || type === 'chat' || type === 'gift' || type === 'like' || type === 'member' || type === 'leave') {
        attempts = 0
        if (store.connectionDetail) status('connected')
      }
    }
  }

  disconnect = () => {
    stopped = true
    window.clearTimeout(timeout)
    window.clearTimeout(retry)
    socket?.close()
    status('waiting')
  }
  open()
  return true
}

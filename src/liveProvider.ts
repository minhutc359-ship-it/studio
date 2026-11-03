import { useStudioStore, type StudioSettings } from './store'

type Payload = Record<string, unknown>
const object = (value: unknown): Payload =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Payload : {}
const string = (value: unknown) => typeof value === 'string' ? value : ''
const identifier = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : string(value)
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined

let disconnect: (() => void) | undefined
export function stopProvider() {
  disconnect?.()
  disconnect = undefined
}

export function connectProvider(settings: StudioSettings, token: string) {
  stopProvider()
  if (settings.provider === 'mock') return
  const url = new URL(settings.provider === 'tikfinity' ? 'ws://localhost:21213/' : 'wss://api.tik.tools/')
  if (settings.provider === 'tiktools') {
    if (!/^[\w.]{1,32}$/.test(settings.username) || !token.trim()) {
      useStudioStore.setState({ connection: 'error', connectionDetail: 'Nhập tên TikTok và JWT phiên trước khi kết nối.' })
      return
    }
    url.searchParams.set('uniqueId', settings.username)
    url.searchParams.set('jwtKey', token.trim())
  }

  let socket: WebSocket
  let timeout: number
  let retry: number
  let attempts = 0
  let stopped = false
  const seen = new Set<string>()
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
      if (++attempts > 5) {
        status('error', 'Đã hết lượt thử. Kiểm tra TikFinity, mạng hoặc JWT rồi kết nối lại.')
        return
      }
      const seconds = 2 ** attempts
      status('reconnecting', `Thử lại sau ${seconds} giây (${attempts}/5).`)
      retry = window.setTimeout(open, seconds * 1000)
    }
    socket.onmessage = ({ data: frame }) => {
      if (stopped || typeof frame !== 'string' || frame.length > 256_000) return
      let envelope: Payload
      try { envelope = object(JSON.parse(frame)) } catch { return }
      const type = string(envelope.event)
      const data = object(envelope.data)
      const user = object(data.user)
      const id = identifier(user.userId ?? user.id ?? data.userId) || string(user.uniqueId ?? data.uniqueId ?? data.user_unique_id)
      const viewer = { id, name: (string(user.nickname ?? data.nickname) || string(user.uniqueId ?? data.uniqueId) || id).slice(0, 48), avatar: '🎟️' }
      const store = useStudioStore.getState()
      const messageId = identifier(data.msgId ?? object(data.common).msgId ?? envelope.msgId)
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
      if (id && type === 'chat' && string(data.comment)) store.addChat(viewer, string(data.comment).slice(0, 500))
      if (id && type === 'member' && store.settings.seatMode !== 'manual-command') store.addChat(viewer, '!join', false)
      if (id && type === 'gift') store.addGiftEvent(viewer, string(data.giftName ?? object(data.gift).name), count(data.repeatCount))
      if (type === 'roomInfo' || type === 'chat' || type === 'gift' || type === 'like' || type === 'member') {
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
}

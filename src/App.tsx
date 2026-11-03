import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowDownToLine, ArrowLeft, ArrowUpRight, AudioLines, Bell, Check, ChevronDown, CircleHelp,
  Clapperboard, Film, Gift, Heart, Link2, LockKeyhole, MessageCircle, MonitorPlay, Moon,
  Maximize2, Minimize2, MoreHorizontal, Play, Plus, Radio, Settings2, ShieldCheck,
  Sparkles, Users, Volume2, VolumeX, WandSparkles, X,
} from 'lucide-react'
import { useStudioStore, type ChatEntry, type ProviderId, type ScreenMode, type StudioSettings } from './store'
import { seatReducer, type Seat } from './domain/seatManager'
import { connectProvider, stopProvider } from './liveProvider'
import { TIKFINITY_DEFAULT } from './domain/providerConfig'

const connectionLabels = {
  waiting: 'Chờ kết nối', connecting: 'Đang mở kết nối', connected: 'Đã kết nối',
  reconnecting: 'Đang nối lại', error: 'Lỗi kết nối',
}


const providerLabels: Record<ProviderId, string> = {
  mock: 'Demo · Mock provider',
  tikfinity: 'TikFinity Local',
  tiktools: 'TikTools Cloud',
}

function AppShell() {
  const location = useLocation()
  const { connection, viewerCount, settings, resetSession } = useStudioStore()
  useEffect(() => {
    stopProvider()
    resetSession()
    useStudioStore.setState({ connection: 'waiting', connectionDetail: '' })
  }, [settings.provider, settings.username, resetSession])
  useEffect(() => {
    const timer = window.setInterval(() => useStudioStore.setState((state) => ({
      seatState: seatReducer(state.seatState, { type: 'mark-inactive', before: Date.now() - 300_000 }),
    })), 15_000)
    return () => window.clearInterval(timer)
  }, [])
  const isLive = location.pathname === '/live'
  const isSetup = location.pathname === '/setup'
  return (
    <div className={`app-shell ${isLive ? 'live-shell' : ''}`}>
      <header className="topbar">
        <Link className="brand" to="/setup" aria-label="Viewing Party Studio, về cài đặt">
          <span className="brand-mark"><Film size={19} /></span>
          <span className="brand-copy"><strong>VIEWING PARTY</strong><small>LIVE STUDIO</small></span>
        </Link>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <Link className={isSetup ? 'active' : ''} to="/setup"><Settings2 size={15} /> Studio</Link>
          <Link className={location.pathname === '/preview' ? 'active' : ''} to="/preview"><MonitorPlay size={15} /> Xem thử</Link>
          <Link className={isLive ? 'active' : ''} to="/live"><Radio size={15} /> Live canvas</Link>
        </nav>
        <div className="topbar-right">
          <span className={`connection-pill ${connection}`}><i />{settings.provider === 'mock' && connection === 'waiting' ? 'Chế độ demo' : connectionLabels[connection]}</span>
          <span className="viewer-pill"><Users size={14} /> {viewerCount.toLocaleString('vi-VN')}</span>
          <button className="icon-button" title="Trợ giúp" aria-label="Trợ giúp"><CircleHelp size={17} /></button>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/preview" element={<CanvasPage preview />} />
        <Route path="/live" element={<CanvasPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </div>
  )
}

function SetupPage() {
  const { settings, updateSettings, connection, setConnection, addMockViewer, sendMockGift, addMockLikes } = useStudioStore()
  const connectionDetail = useStudioStore((state) => state.connectionDetail)
  const [providerInput, setProviderInput] = useState('')
  const [section, setSection] = useState('Kết nối')
  const [saved, setSaved] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const sections = [
    { label: 'Kết nối', icon: Radio }, { label: 'Màn chiếu', icon: Film },
    { label: 'Ghế ngồi', icon: Users }, { label: 'Chat & quà', icon: Gift },
    { label: 'OBS / Studio', icon: MonitorPlay },
  ]

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }
  const exportConfig = () => {
    const payload = { schemaVersion: 1, appVersion: '0.1.0', createdAt: new Date().toISOString(), settings }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'viewing-party-preset.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const importConfig = async (file?: File) => {
    if (!file) return
    try {
      if (file.size > 1_000_000) throw new Error('Tệp vượt giới hạn 1 MB.')
      const parsed = JSON.parse(await file.text()) as { schemaVersion?: number; settings?: Partial<StudioSettings> }
      if (parsed.schemaVersion !== 1 || !parsed.settings || typeof parsed.settings !== 'object') throw new Error('Preset không đúng phiên bản.')
      const { provider, username, screenMode, screenUrl, showChat, seatMode, reducedMotion, showNicknames } = parsed.settings
      if (provider !== undefined && !['mock', 'tikfinity', 'tiktools'].includes(provider)) throw new Error('Provider không hợp lệ.')
      if ((username !== undefined && typeof username !== 'string')
        || (screenUrl !== undefined && typeof screenUrl !== 'string')
        || (screenMode !== undefined && !['placeholder', 'local-video', 'direct-url', 'external'].includes(screenMode))
        || (seatMode !== undefined && !['hybrid', 'manual-command', 'auto-on-join'].includes(seatMode))
        || [showChat, reducedMotion, showNicknames].some((value) => value !== undefined && typeof value !== 'boolean')) {
        throw new Error('Preset chứa giá trị không hợp lệ.')
      }
      const patch = { provider, username, screenMode, screenUrl, showChat, seatMode, reducedMotion, showNicknames }
      updateSettings(Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)))
      setImportMessage('Preset đã nhập thành công.')
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Không thể đọc preset.')
    }
  }

  return (
    <main className="studio-page">
      <aside className="studio-sidebar">
        <div className="sidebar-heading"><span className="eyebrow">CONTROL ROOM</span><h1>Studio setup</h1><p>Chuẩn bị rạp trước giờ lên sóng.</p></div>
        <div className="sidebar-nav" role="tablist" aria-label="Nhóm cài đặt">
          {sections.map(({ label, icon: Icon }) => <button key={label} role="tab" aria-selected={section === label} className={section === label ? 'selected' : ''} onClick={() => setSection(label)}><Icon size={17} /><span>{label}</span>{label === 'Kết nối' && <i className={`nav-status ${connection}`} />}</button>)}
        </div>
        <div className="sidebar-bottom">
          <div className="local-note"><ShieldCheck size={17} /><span><b>Local-first</b><small>Cấu hình ở trên máy này</small></span></div>
          <button className="quiet-link" onClick={exportConfig}><ArrowDownToLine size={15} /> Xuất preset</button>
          <label className="quiet-link file-link"><Plus size={15} /> Nhập preset<input type="file" accept="application/json" onChange={(event) => void importConfig(event.target.files?.[0])} /></label>
          {importMessage && <small className="inline-feedback">{importMessage}</small>}
        </div>
      </aside>

      <section className="setup-content">
        <div className="page-heading"><div><span className="eyebrow">{section.toUpperCase()}</span><h2>{section === 'Kết nối' ? 'Kết nối phòng LIVE' : section === 'Màn chiếu' ? 'Chọn nội dung trình chiếu' : section}</h2><p>{section === 'Kết nối' ? 'Dùng Demo để làm quen. Provider bên thứ ba cần được xác minh trên máy livestream.' : 'Mọi thay đổi được lưu cục bộ trong trình duyệt.'}</p></div><div className="heading-actions"><button className="button button-quiet" onClick={exportConfig}><ArrowDownToLine size={15} /> Xuất preset</button><button className="button button-primary" onClick={save}>{saved ? <Check size={16} /> : null}{saved ? 'Đã lưu' : 'Lưu cấu hình'}</button></div></div>

        {section === 'Kết nối' && <div className="setup-grid">
          <div className="settings-column">
            <section className="settings-panel">
              <div className="panel-title"><span className="step-number">01</span><div><h3>Nguồn sự kiện</h3><p>Chọn nơi gửi chat, quà và lượt thích.</p></div></div>
              <div className="provider-options">
                {(['mock', 'tikfinity', 'tiktools'] as ProviderId[]).map((provider) => <button key={provider} onClick={() => { if (provider !== settings.provider) { setProviderInput(''); updateSettings({ provider }) } }} className={`provider-option ${settings.provider === provider ? 'chosen' : ''}`}><span className="provider-icon">{provider === 'mock' ? <WandSparkles size={18} /> : provider === 'tikfinity' ? <AudioLines size={18} /> : <Link2 size={18} />}</span><span className="provider-text"><b>{providerLabels[provider]}</b><small>{provider === 'mock' ? 'Không cần tài khoản · sẵn sàng' : provider === 'tikfinity' ? 'WebSocket local · cần kiểm chứng' : 'WebSocket cloud · cần token phiên'}</small></span><i className="radio-dot" /></button>)}
              </div>
              {settings.provider === 'tiktools' && <>
                <label className="field-label" htmlFor="username">Kênh TikTok <span>bỏ trống nếu link WebSocket đã có kênh</span></label>
                <input id="username" value={settings.username} onChange={(event) => updateSettings({ username: event.target.value.trim().replace(/^@/, '') })} placeholder="@tenkenh hoặc https://www.tiktok.com/@tenkenh/live" autoComplete="off" />
              </>}
              {settings.provider !== 'mock' && <>
                <label className="field-label" htmlFor="provider-input">{settings.provider === 'tikfinity' ? 'Link WebSocket TikFinity' : 'JWT, API key hoặc link WebSocket TikTools'}</label>
                <input id="provider-input" type="password" autoComplete="off" spellCheck={false} value={providerInput} onChange={(event) => setProviderInput(event.target.value)} placeholder={settings.provider === 'tikfinity' ? TIKFINITY_DEFAULT : 'Dán token hoặc wss://api.tik.tools/…'} />
                <p className="provider-warning">{settings.provider === 'tikfinity'
                  ? `Mở TikFinity và kết nối phòng LIVE trước. Để trống để dùng ${TIKFINITY_DEFAULT}`
                  : 'Dán link WebSocket đầy đủ hoặc nhập kênh và token. Ưu tiên JWT ngắn hạn. Token và link chỉ giữ trong bộ nhớ phiên.'}</p>
              </>}
              <div className="button-row">
                <button className="button button-primary" onClick={() => {
                  if (settings.provider === 'mock') setConnection('connected')
                  else if (connectProvider(settings, providerInput)) setProviderInput('')
                }}><Radio size={15} />{settings.provider === 'mock' ? 'Bật Mock provider' : 'Kết nối'}</button>
                {settings.provider !== 'mock' && <button className="button button-quiet" onClick={stopProvider}>Ngắt kết nối</button>}
                <span role="status" className="connection-detail">{connectionLabels[connection]}{connectionDetail && ` · ${connectionDetail}`}</span>
              </div>
            </section>
            <section className="settings-panel settings-panel-compact">
              <div className="panel-title"><span className="step-number">02</span><div><h3>Chính sách ghế</h3><p>Không tự giải phóng ghế khi chỉ mất tương tác.</p></div></div>
              <label className="field-label" htmlFor="seatMode">Cách vào ghế</label>
              <select id="seatMode" value={settings.seatMode} onChange={(event) => updateSettings({ seatMode: event.target.value as StudioSettings['seatMode'] })}><option value="hybrid">Lệnh !join + sự kiện join nếu có</option><option value="manual-command">Chỉ qua lệnh chat</option><option value="auto-on-join">Tự vào khi provider gửi member</option></select>
              <div className="policy-caption"><LockKeyhole size={14} /> Thu hồi ghế: thủ công · Hàng chờ: bật · Tối đa 12 ghế</div>
            </section>
          </div>
          <aside className="preview-column">
            <div className="preview-heading"><div><span className="eyebrow">LIVE PREVIEW</span><h3>Khung rạp</h3></div><Link to="/preview" className="text-action">Mở preview <ArrowUpRight size={14} /></Link></div>
            <MiniTheater />
            <div className="preview-stats"><span><i className="tiny-light" /> 12 ghế sẵn sàng</span><span><Users size={14} /> {useStudioStore.getState().seatState.queue.length} chờ</span></div>
            {settings.provider === 'mock' && <div className="mock-box"><div className="mock-box-title"><span><Sparkles size={16} /> Thử sự kiện</span><span className="mock-tag">MOCK</span></div><div className="mock-actions"><button onClick={() => addMockViewer()}><Plus size={15} /> !join</button><button onClick={sendMockGift}><Gift size={15} /> Quà</button><button onClick={addMockLikes}><Heart size={15} /> +100</button></div><small>Sự kiện demo chỉ tác động lên phiên đang mở.</small></div>}
          </aside>
        </div>}

        {section === 'Màn chiếu' && <MediaSettings settings={settings} updateSettings={updateSettings} />}
        {section === 'Ghế ngồi' && <SeatSettings />}
        {section === 'Chat & quà' && <ChatSettings settings={settings} updateSettings={updateSettings} />}
        {section === 'OBS / Studio' && <BroadcastSettings />}
        <div className="setup-footer"><span><ShieldCheck size={15} /> Không lưu lịch sử chat hoặc khóa API.</span><span>Cấu hình đã lưu trong trình duyệt này</span></div>
      </section>
    </main>
  )
}

function MediaSettings({ settings, updateSettings }: { settings: StudioSettings; updateSettings: (patch: Partial<StudioSettings>) => void }) {
  const videoFile = useStudioStore((state) => state.videoFile)
  const [error, setError] = useState('')
  const pickVideo = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('video/')) { setError('Hãy chọn một tệp video.'); return }
    useStudioStore.setState({ videoFile: file })
    setError('')
    updateSettings({ screenMode: 'local-video' })
  }
  return <div className="single-settings"><section className="settings-panel"><div className="panel-title"><span className="step-number">01</span><div><h3>Nguồn màn chiếu</h3><p>Chỉ phát nội dung bạn có quyền stream.</p></div></div><div className="source-tiles">{([['placeholder', 'Chờ mở màn', 'Nền rạp và tiêu đề'], ['local-video', 'Video trên máy', 'Chọn file phiên này'], ['direct-url', 'Video URL', 'Nguồn trực tiếp / HLS'], ['external', 'OBS composition', 'Ghép layer trong OBS']] as [ScreenMode, string, string][]).map(([mode, label, detail]) => <button key={mode} className={`source-tile ${settings.screenMode === mode ? 'chosen' : ''}`} onClick={() => updateSettings({ screenMode: mode })}><Film size={18} /><b>{label}</b><small>{detail}</small></button>)}</div>{settings.screenMode === 'local-video' && <label className="upload-zone"><ArrowDownToLine size={20} /><b>{videoFile?.name || 'Chọn video từ thiết bị'}</b><small>Tệp chỉ dùng trong phiên hiện tại, không tải lên.</small><input type="file" accept="video/*" onChange={(event) => pickVideo(event.target.files?.[0])} /></label>}{settings.screenMode === 'direct-url' && <><label className="field-label" htmlFor="screenUrl">URL video</label><input id="screenUrl" value={settings.screenUrl} onChange={(event) => updateSettings({ screenUrl: event.target.value })} placeholder="https://..." /></>}{error && <p className="form-error">{error}</p>}<label className="field-label" htmlFor="screenTitle">Tiêu đề màn chiếu</label><input id="screenTitle" placeholder="Đêm xem phim cùng nhau" /></section></div>
}

function SeatSettings() {
  const { seatState, addMockViewer, settings } = useStudioStore()
  return <div className="single-settings"><section className="settings-panel"><div className="panel-title"><span className="step-number">12</span><div><h3>Sơ đồ ghế</h3><p>Ghế trống có thể khóa từ canvas. Người chờ được đưa vào khi có ghế được giải phóng.</p></div></div><div className="settings-seat-grid">{seatState.seats.map((seat) => <SeatTile key={seat.id} seat={seat} compact />)}</div>{settings.provider === 'mock' && <button className="button button-quiet" onClick={() => addMockViewer()}><Plus size={15} /> Thêm người xem demo</button>}</section></div>
}

function ChatSettings({ settings, updateSettings }: { settings: StudioSettings; updateSettings: (patch: Partial<StudioSettings>) => void }) {
  return <div className="single-settings"><section className="settings-panel"><div className="panel-title"><span className="step-number">03</span><div><h3>Chat & hiển thị</h3><p>Giới hạn tin hiển thị trong phiên, không lưu lịch sử.</p></div></div><ToggleRow title="Hiển thị chat trên canvas" detail="Ẩn rail khi dùng chat của phần mềm livestream" checked={settings.showChat} onChange={(showChat) => updateSettings({ showChat })} /><ToggleRow title="Hiện tên người xem" detail="Tắt để ẩn nickname ở ghế" checked={settings.showNicknames} onChange={(showNicknames) => updateSettings({ showNicknames })} /><ToggleRow title="Giảm chuyển động" detail="Giảm animation và hiệu ứng ánh sáng" checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} /><div className="command-list"><span className="eyebrow">LỆNH ĐANG BẬT</span><code>!join</code><code>!leave</code><code>!seat 1–12</code><code>!react heart 2</code><code>!react wave 2</code><code>!react cheer 2</code><code>!help</code></div></section></div>
}

function BroadcastSettings() {
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard?.writeText(`${window.location.origin}/live`); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }
  return <div className="single-settings"><section className="settings-panel"><div className="panel-title"><span className="step-number">OBS</span><div><h3>Đưa rạp lên sóng</h3><p>Chạy một cửa sổ / tab live và dùng Window Capture để giữ đồng bộ.</p></div></div><div className="url-copy"><code>{window.location.origin}/live</code><button className="button button-quiet" onClick={copy}>{copied ? <Check size={15} /> : <Link2 size={15} />}{copied ? 'Đã chép' : 'Chép URL'}</button></div><ol className="broadcast-steps"><li>Mở Live canvas trong trình duyệt, phóng toàn màn hình.</li><li>Trong OBS hoặc LIVE Studio, thêm Window Capture hoặc Browser Source.</li><li>Kiểm tra tỷ lệ 16:9, tắt nguồn chat nếu phần mềm đã hiển thị chat riêng.</li><li>Tự bắt đầu livestream trong phần mềm phát sóng.</li></ol><div className="provider-warning"><ShieldCheck size={15} /><span>Không có nút tự phát sóng. Website chỉ dựng canvas và đọc provider đã cấu hình.</span></div></section></div>
}

function ToggleRow({ title, detail, checked, onChange }: { title: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-row"><span><b>{title}</b><small>{detail}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>
}

function MiniTheater() {
  return <div className="mini-theater"><div className="mini-curtain"><span>✦</span><div className="mini-screen"><Film size={23} /><b>ĐÊM XEM CHUNG</b><small>màn chiếu của bạn</small></div><span>✦</span></div><div className="mini-seats">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i < 3 ? 'filled' : ''} />)}</div><div className="mini-stage-lights"><i /><i /><i /></div></div>
}

function CanvasPage({ preview = false }: { preview?: boolean }) {
  const { settings, seatState, chat, connection, viewerCount, likes, gifts, quietMode, highlightedGiftId, observedGifts, addMockViewer, sendMockGift, addMockLikes, addChat, setConnection, toggleQuietMode } = useStudioStore()
  const videoFile = useStudioStore((state) => state.videoFile)
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaError, setMediaError] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [mockOpen, setMockOpen] = useState(false)
  const [mockPosition, setMockPosition] = useState({ x: 24, y: 92 })
  const [showControls, setShowControls] = useState(true)
  const [fileMessage, setFileMessage] = useState('')
  const cinemaRef = useRef<HTMLElement>(null)
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)
  const mediaSrc = settings.screenMode === 'local-video' ? videoUrl
    : settings.screenMode === 'direct-url' && /^https?:\/\//i.test(settings.screenUrl.trim()) ? settings.screenUrl.trim() : ''
  const occupied = seatState.seats.filter((seat) => seat.viewer).length
  const onVideoFile = (file?: File) => {
    if (!file) return
    if (file.type && !file.type.startsWith('video/')) {
      setFileMessage('Hãy chọn một tệp video.')
      return
    }
    useStudioStore.setState({ videoFile: file })
    useStudioStore.getState().updateSettings({ screenMode: 'local-video' })
    setFileMessage('')
  }
  useEffect(() => {
    const url = videoFile ? URL.createObjectURL(videoFile) : ''
    setVideoUrl(url)
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [videoFile])
  useEffect(() => setMediaError(false), [videoUrl, settings.screenUrl, settings.screenMode])
  useEffect(() => {
    if (settings.provider !== 'mock') return
    let timerId: number
    let cancelled = false
    const scheduleNext = () => {
      timerId = window.setTimeout(() => {
        if (cancelled) return
        useStudioStore.getState().runMockEvent()
        scheduleNext()
      }, 8_000 + Math.random() * 7_000)
    }
    scheduleNext()
    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [settings.provider])
  useEffect(() => {
    const syncFullscreen = () => {
      const active = document.fullscreenElement === cinemaRef.current
      setFullscreen(active)
      setMockOpen(false)
    }
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])
  const goFullscreen = async () => {
    if (document.fullscreenElement === cinemaRef.current) await document.exitFullscreen()
    else await cinemaRef.current?.requestFullscreen?.()
  }
  const startMockDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, ...mockPosition }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveMockDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin.current) return
    setMockPosition({
      x: Math.max(8, Math.min(window.innerWidth - 308, dragOrigin.current.x + event.clientX - dragOrigin.current.pointerX)),
      y: Math.max(8, Math.min(window.innerHeight - 278, dragOrigin.current.y + event.clientY - dragOrigin.current.pointerY)),
    })
  }
  const endMockDrag = () => { dragOrigin.current = null }
  const act = (event: string) => {
    const mock = { id: `canvas-${Date.now()}`, name: 'Khách xem', avatar: '🧑🏻‍🚀' }
    if (event.startsWith('reaction-')) {
      const [source, target] = seatState.seats.filter((seat) => seat.viewer)
      if (source?.viewer && target) addChat(source.viewer, `!react ${event.slice(9)} ${target.id}`)
      return
    }
    if (event === 'join') addMockViewer()
    if (event === 'gift') sendMockGift()
    if (event === 'like') addMockLikes()
    if (event === 'leave') {
      const seated = useStudioStore.getState().seatState.seats.find((seat) => seat.viewer)
      if (seated?.viewer) addChat(seated.viewer, '!leave')
    }
    if (event === 'disconnect') setConnection(connection === 'reconnecting' ? 'connected' : 'reconnecting')
    if (event === 'chat') {
      const seatedViewer = useStudioStore.getState().seatState.seats.find((seat) => seat.viewer)?.viewer
      addChat(seatedViewer ?? mock, ['Tối nay vui quá!', 'Cho mình xin ghế với 🍿', 'Màn chiếu đẹp ghê ✨'][Math.floor(Math.random() * 3)] ?? 'Chào mọi người')
    }
  }

  return <main className={`canvas-page ${preview ? 'preview-page' : ''} ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
    <div className="canvas-heading"><div><span className="eyebrow">{preview ? 'PREVIEW MODE' : 'BROADCAST CANVAS'}</span><h1>{preview ? 'Rạp đang mở cửa' : 'Đêm xem chung'}</h1></div><div className="canvas-heading-actions"><span className="live-badge"><i />{preview ? 'PREVIEW' : settings.provider === 'mock' ? 'DEMO' : connectionLabels[connection]}</span><button hidden={settings.provider !== 'mock'} className="icon-button" title="Mở Mock Event Deck" aria-label="Mở Mock Event Deck" onClick={() => setMockOpen(!mockOpen)}><WandSparkles size={17} /></button><button className="icon-button" title={quietMode ? 'Bật lại hiệu ứng' : 'Chế độ yên tĩnh'} onClick={toggleQuietMode}>{quietMode ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><button className="icon-button" title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} onClick={() => void goFullscreen()}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button></div></div>

    <section className="cinema-layout theater-scene" aria-label="Canvas rạp chiếu" ref={cinemaRef}>
      <div className="fullscreen-tools"><button hidden={settings.provider !== 'mock'} className="fullscreen-mock-launcher" onClick={() => setMockOpen(!mockOpen)}><WandSparkles size={14} /> Mock Event</button><button className="fullscreen-exit" onClick={() => void goFullscreen()}><Minimize2 size={14} /> Thoát toàn màn hình</button></div>
      <aside className="action-rail">
        <div className="rail-title"><Sparkles size={15} /><span>HƯỚNG DẪN</span></div>
        <div className="action-item"><span className="action-emoji">🍿</span><span><b>Cùng xem LIVE</b><small>Thưởng thức nội dung chung</small></span></div>
        <div className="action-item"><span className="action-emoji">💬</span><span><b>Trò chuyện</b><small>Bình luận, chia sẻ cảm xúc</small></span></div>
        <div className="action-item"><span className="action-emoji">💗</span><span><b>Thả reaction</b><small>Gõ !react heart 2 để gửi tim đến ghế 2</small></span></div>
        <div className="action-item"><span className="action-emoji">🎁</span><span><b>Chọn ghế</b><small>Gõ !join để tham gia</small></span></div>
        <div className="viewer-command-guide">
          <div className="rail-title"><MessageCircle size={13} /><span>LỆNH KHÁN GIẢ</span></div>
          <div><code>!join</code><span>Vào ghế trống hoặc hàng chờ</span></div>
          <div><code>!seat 1–12</code><span>Chọn / đổi sang ghế trống</span></div>
          <div><code>!leave</code><span>Rời ghế hoặc hàng chờ</span></div>
          <div><code>!react heart 2</code><span>Gửi reaction đến ghế 2</span></div>
          <div><code>!react heart</code><span>Thả tim cho cả rạp</span></div>
          <div><code>!react wave</code><span>Chào cả rạp</span></div>
          <div><code>!react cheer 2</code><span>Cổ vũ người ở ghế 2</span></div>
          <div><code>!help</code><span>Xem hướng dẫn lệnh</span></div>
        </div>
        <div className="rail-divider" />
        <div className="rail-title rail-title-small">{observedGifts.length ? 'QUÀ ĐÃ NHẬN' : 'ĐANG CHỜ QUÀ'}</div>
        <div className="gift-picks">{observedGifts.length ? observedGifts.slice(0, 6).map((gift) => <div key={gift.name} className="observed-gift"><span>🎁</span><b>{gift.name}</b><small>×{gift.count}</small></div>) : <p className="empty-gifts">Quà xuất hiện tại đây sau khi có gift event.</p>}</div>
        <p className="gift-note">Danh sách chỉ gồm quà đã quan sát trong phiên này.</p>
      </aside>

      <div className="stage-column">
        <div className="stage-frame"><div className="marquee-lights" aria-hidden="true" />
          <div className="stage-topline"><span><i /> ĐANG PHÁT</span><span>{/^[\w.]+$/.test(settings.username) ? `@${settings.username}` : 'VIEWING PARTY'}</span></div>
          <div className={`screen-content mode-${settings.screenMode}`}>
            {mediaSrc ? <video key={mediaSrc} src={mediaSrc} controls playsInline muted={quietMode} onError={() => setMediaError(true)} /> : settings.screenMode === 'local-video' ? <label className="screen-upload"><Film size={30} /><b>{fileMessage || 'Chọn video trong phiên này'}</b><small>Video chỉ phát trong trình duyệt hiện tại</small><input type="file" accept="video/*" onChange={(event) => onVideoFile(event.target.files?.[0])} /></label> : settings.screenMode === 'external' ? <div className="external-screen"><MonitorPlay size={32} /><b>Vùng ghép nội dung OBS</b><small>Đặt nguồn game/video bên dưới canvas trong phần mềm phát sóng.</small></div> : <div className="screen-art"><div className="screen-art-stars">✦　·　✧　·　✦</div><span className="screen-kicker">THEATER No. 01</span><div className="screen-title">Đêm xem<br /><em>chung</em></div><div className="screen-filmstrip"><span>◈</span><i /><span>◈</span><i /><span>◈</span></div><div className="screen-caption">MỘT CHIẾC RẠP · RẤT NHIỀU CẢM XÚC</div><div className="screen-orbit orbit-a" /><div className="screen-orbit orbit-b" /></div>}
            {(mediaError || (settings.screenMode === 'direct-url' && !mediaSrc)) && <p className="media-error" role="alert">Không phát được video. Kiểm tra URL hoặc chọn định dạng khác.</p>}
          </div>
          <div className="stage-controls"><span><Play size={13} fill="currentColor" /> SÂN KHẤU</span><span>{settings.screenMode === 'placeholder' ? 'Nội dung có quyền phát sóng' : settings.screenMode.replace('-', ' ').toUpperCase()}</span><button title="Ẩn/hiện điều khiển" onClick={() => setShowControls(!showControls)}>{showControls ? <ChevronDown size={16} /> : <MoreHorizontal size={16} />}</button></div>
          {showControls && <div className="floating-scene-controls"><button title="Chế độ rạp" onClick={toggleQuietMode}><Moon size={14} /></button><button title="Âm thanh" onClick={toggleQuietMode}><AudioLines size={14} /></button><button title="Chọn video"><label><Plus size={14} /><input type="file" accept="video/*" onChange={(event) => onVideoFile(event.target.files?.[0])} /></label></button></div>}
        </div>
        <div className="audience-section"><div className="audience-heading"><span><Users size={16} /> KHÁN GIẢ <b>{occupied}/12</b></span><span className="queue-label">{seatState.queue.length > 0 ? `${seatState.queue.length} đang chờ` : 'ghế trống đang mở'}</span></div><div className="seats-grid">{seatState.seats.map((seat) => <SeatTile key={seat.id} seat={seat} compact={!settings.showNicknames} />)}</div><div className="seat-footnote"><span><i className="seat-legend occupied-legend" /> Đang xem</span><span><i className="seat-legend" /> Ghế trống</span><span><i className="seat-legend locked-legend" /> Đã khóa</span></div></div>
      </div>

      {settings.showChat && <ChatRail chat={chat} quietMode={quietMode} highlightedGiftId={highlightedGiftId} />}

      {mockOpen && settings.provider === 'mock' && <div className="mock-event-popover" style={{ left: mockPosition.x, top: mockPosition.y }}>
        <div className="mock-event-header" onPointerDown={startMockDrag} onPointerMove={moveMockDrag} onPointerUp={endMockDrag} onPointerCancel={endMockDrag}>
          <span className="mock-toolbar-dot" /><b>MOCK EVENT DECK</b><small>Kéo để di chuyển</small>
          <button title="Đóng bảng sự kiện" aria-label="Đóng bảng sự kiện" onClick={() => setMockOpen(false)}><X size={14} /></button>
        </div>
        <div className="mock-event-actions">
          <button disabled={occupied < 2} onClick={() => act('reaction-heart')}>💗 Gửi tim</button>
          <button disabled={occupied < 2} onClick={() => act('reaction-wave')}>👋 Vẫy chào</button>
          <button disabled={occupied < 2} onClick={() => act('reaction-cheer')}>👏 Cổ vũ</button><button onClick={() => act('join')}><Plus size={14} /> !join</button><button onClick={() => act('leave')}><X size={14} /> !leave</button><button onClick={() => act('chat')}><MessageCircle size={14} /> Chat</button><button onClick={() => act('gift')}><Gift size={14} /> Gift</button><button onClick={() => act('like')}><Heart size={14} /> +100 like</button><button onClick={() => act('disconnect')}><Radio size={14} /> {connection === 'reconnecting' ? 'Nối lại' : 'Ngắt kết nối'}</button></div>
      </div>}
    </section>

    <footer className="canvas-footer"><div className="footer-session"><span className="footer-icon"><Clapperboard size={17} /></span><span><small>PHIÊN XEM</small><b>Đêm xem chung</b></span></div><div className="footer-stat"><small>ĐANG XEM</small><b><Users size={15} /> {viewerCount.toLocaleString('vi-VN')}</b></div><div className="footer-stat"><small>LƯỢT THÍCH</small><b><Heart size={14} /> {likes.toLocaleString('vi-VN')}</b></div><div className="footer-stat"><small>QUÀ</small><b><Gift size={14} /> {gifts}</b></div><Link className="join-button" to="/setup"><span><ArrowLeft size={15} /> STUDIO</span> Vào setup</Link></footer>

  </main>
}

function SeatTile({ seat, compact = false }: { seat: Seat; compact?: boolean }) {
  const seated = Boolean(seat.viewer)
  const bubble = useStudioStore((state) => seat.viewer ? state.seatBubbles[seat.viewer.id] : undefined)
  const animation = useStudioStore((state) => seat.viewer ? state.seatAnimations[seat.viewer.id] : undefined)
  const lockSeat = () => {
    if (!seated) {
      useStudioStore.setState((state) => ({ seatState: seatReducer(state.seatState, { type: 'lock', seatId: seat.id, locked: seat.status !== 'locked' }) }))
    }
  }
  return <button className={`seat-tile ${seated ? 'occupied' : ''} ${seat.status === 'locked' ? 'locked' : ''} ${seat.status === 'inactive' ? 'inactive' : ''} ${compact ? 'seat-compact' : ''}`} onClick={lockSeat} aria-label={`Ghế ${seat.id}${seated ? `, ${seat.viewer?.name}` : seat.status === 'locked' ? ', đã khóa' : ', trống'}`} title={seated ? seat.viewer?.name : seat.status === 'locked' ? 'Nhấn để mở khóa' : 'Ghế trống · nhấn để khóa'}>
    {bubble && <span key={bubble.id} className="seat-chat-bubble">{bubble.text}</span>}
    <span className="seat-number">{String(seat.id).padStart(2, '0')}</span><span key={animation?.id ?? seat.viewer?.id} style={seated ? {
      backgroundPosition: `${((seat.id - 1) % 4) * 100 / 3}% ${Math.floor((seat.id - 1) / 4) * 50}%`,
    } : undefined} className={`seat-avatar ${seated ? `audience-sprite  animation-${animation?.kind ?? 'idle'}` : ''}`}>{seated ? null : seat.status === 'locked' ? <LockKeyhole size={14} /> : '✦'}</span><span className="seat-back" aria-hidden="true" /><span className="seat-name">{seat.viewer ? seat.viewer.name : seat.status === 'locked' ? 'Đã khóa' : 'Ghế trống'}</span>{seat.status === 'inactive' && <span className="inactive-mark">●</span>}
  </button>
}

function ChatRail({ chat, quietMode, highlightedGiftId }: { chat: ChatEntry[]; quietMode: boolean; highlightedGiftId: string | null }) {
  const listRef = useRef<HTMLDivElement>(null)
  const lastMessageId = chat[chat.length - 1]?.id
  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [lastMessageId])
  return <aside className="chat-rail"><div className="chat-heading"><div><MessageCircle size={16} /><h2>Trò chuyện</h2></div><span><Users size={13} /> LIVE</span></div><div className="chat-subhead"><span>{chat.length} sự kiện gần đây</span><button title="Tùy chọn chat"><MoreHorizontal size={17} /></button></div><div className="chat-list" ref={listRef} aria-live="polite">{chat.slice(-24).map((message) => <ChatMessage key={message.id} message={message} quietMode={quietMode} highlight={message.id === highlightedGiftId} />)}</div><div className="chat-input-hint"><span>⌘</span> Sự kiện chat hiển thị tại đây <Bell size={13} /></div><div className="chat-footer"><i className="status-dot connected" /><span>Chỉ nhận sự kiện · không tự trả lời TikTok</span></div></aside>
}

function ChatMessage({ message, quietMode, highlight = false }: { message: ChatEntry; quietMode: boolean; highlight?: boolean }) {
  return <div className={`chat-message ${message.kind} ${highlight ? 'gift-highlight' : ''} ${quietMode && message.kind === 'reaction' ? 'muted-message' : ''}`}><span className="chat-avatar">{message.avatar}</span><div className="chat-message-body"><div className="chat-meta"><b>{message.name}</b><time>{message.time}</time></div><p>{message.text}</p></div>{message.kind === 'gift' && <Gift size={14} className="chat-gift-icon" />}</div>
}

export default function App() {
  return <AppShell />
}
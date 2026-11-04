# VIEWING PARTY LIVE STUDIO
## Product Requirements Document (PRD) + Technical Design Specification

**Phiên bản tài liệu:** 2.0 — 04/11/2026 (Reference Edition; giữ baseline V1.0)  
**Trạng thái:** Đặc tả triển khai V2.0 / cần xác minh provider & đối chiếu UI tham chiếu thực tế  
**Nền tảng:** Frontend-only, local-first, TikTok LIVE Studio / OBS  
**Ngôn ngữ giao diện:** Tiếng Việt  
**Định hướng đồ họa:** Rạp chiếu phim chibi fantasy RPG, 2.5D/isometric, không có chiến đấu  
**Tài liệu dành cho:** Owner, UI/UX, frontend developers, AI coding agents, QA
**Thiết kế tham chiếu:** https://t1win.online/ — mục tiêu 90% về UX / 10% bản sắc riêng; chưa xác minh được screenshot UI động

> **Quyết định sản phẩm quan trọng:** Đây là **Viewing Party LIVE** kiểu **rạp chiếu phim**, **KHÔNG phải chùa online** và **KHÔNG phải game chiến đấu**. Màn hình trung tâm để chiếu game/video/live của streamer; khán giả chibi chiếm 12 ghế (2 hàng x 6), trò chuyện, biểu cảm, tặng quà và tương tác. Website chạy local, chỉ có frontend. TikTok LIVE Studio là công cụ đưa hình lên sóng; dữ liệu sự kiện TikTok cần một provider bên ngoài hỗ trợ realtime.

---

## 0. Tóm tắt điều hành

**Mục tiêu:** Xây dựng một ứng dụng web có phần **Setup Studio** dành cho người livestream và phần **Live Canvas** hiển thị trong OBS/TikTok LIVE Studio. Khi TikTok phát sinh chat, quà tặng, lượt thích hoặc sự kiện vào phòng (nếu provider hỗ trợ), nhân vật/ghế/chữ/VFX trong rạp sẽ cập nhật gần thời gian thực.

**Kiến trúc đề xuất:** React + TypeScript + Vite + Tailwind/shadcn/ui + PixiJS + Zustand + Dexie/IndexedDB + native WebSocket. Không tự xây HTTP API, websocket server, cơ sở dữ liệu máy chủ hay hệ thống tài khoản.

**Các nguyên tắc ràng buộc:**

1. **FE-only nghĩa là không tự vận hành backend nghiệp vụ**, không có nghĩa là kết nối trực tiếp tới một API TikTok LIVE chính thức mà không cần bên thứ ba.
2. Tích hợp TikTok qua abstraction `LiveEventProvider`, tối thiểu có `MockProvider`, `TikFinityProvider`, `TikToolsProvider`.
3. Không hứa hẹn phát hiện **người rời LIVE** chính xác; chỉ sử dụng `!leave`, thao tác quản trị, hoặc chính sách thu hồi ghế theo trạng thái không hoạt động.
4. Không được suy ra một người còn xem hay đã rời chỉ từ tổng viewer count hoặc thiếu tương tác.
5. Phiên bản v1 ưu tiên chạy ổn định và dễ setup, hơn là hiệu ứng cực nặng.
6. Nội dung chiếu trong màn hình trung tâm phải có quyền phát sóng/stream lại và phải tuân thủ quy định của nền tảng.

### 0.1 Kết quả bàn giao kỳ vọng

- Trang `/setup`: cài đặt provider, room, screen source, ghế, nhân vật, chat, quà, hiệu ứng, âm thanh, cấu hình OBS và kiểm thử giả lập.
- Trang `/live`: giao diện trình chiếu sạch, phù hợp capture/broadcast, giữ layout gốc 3 cột + 12 ghế.
- Event pipeline với chuẩn hóa dữ liệu, retry kết nối, deduplication và chống spam.
- Hệ thống seat reservation / occupancy 12 ghế, hàng đợi và chính sách thu hồi an toàn.
- Cơ chế chat command, reaction, gifting và animation queue.
- Preset giao diện và cấu hình có thể import/export JSON.
- Unit/integration/E2E + thử nghiệm trong một buổi livestream thật trước khi chốt mức tương thích provider.

---

## PHỤ LỤC ƯU TIÊN: REFERENCE EDITION V2.0 — MỤC TIÊU 90/10

**Cập nhật:** 04/11/2026  
**Tài liệu:** Product/UI/Engineering upgrade specification; dùng kèm PRD & Technical Spec v1.0.  
**Tham chiếu:** https://t1win.online/ (tiêu đề được xác nhận khi truy cập: *Viewing Party Online*).  
**Quy ước 90/10:** 90% là **mục tiêu tương đồng trải nghiệm** sau khi kiểm tra bằng hình ảnh/trình duyệt; 10% là phần tạo dấu ấn riêng. Không phải kết quả kiểm định hiện tại.  
**Giới hạn bằng chứng:** Trang tham chiếu tải giao diện động; công cụ duyệt chỉ xác nhận trang và tiêu đề, **chưa trích xuất được cấu trúc DOM, CSS, screenshots hay chức năng chi tiết**. Vì thế tài liệu dưới đây phân biệt *yêu cầu định hướng* với *chức năng đã đối chiếu*, và không khẳng định một tính năng cụ thể có trên website tham chiếu khi chưa kiểm chứng.

> **Product lock:** Viewing Party LIVE dạng **rạp chiếu phim**, tuyệt đối không phải concept chùa, không có combat. Màn hình live/video/game nằm giữa; **12 ghế chibi (2 × 6)** phía dưới; hai sidebar là hành động/quà và chat. **Chạy local, FE-only** và nhận sự kiện TikTok qua provider bên thứ ba khi nhà cung cấp cho phép.

---

### A. Những gì thay đổi so với phiên bản 1.0

| Trục | V1.0 | V2.0 Reference Edition |
|---|---|---|
| Trải nghiệm | Website rạp chiếu + các tab setup | **Streaming studio** hoàn chỉnh: Setup → Preview → Test → Live → Post-live |
| Nhận diện | Fantasy chibi rực rỡ | Tối ưu theo UI tham chiếu ở **bố cục, nhịp tương tác, khả năng đọc trên stream**, nhưng giữ nét vẽ/nhân vật thương hiệu riêng |
| Khán giả | 12 ghế + chat command | Ghế + hàng chờ, ghim ghế VIP, trạng thái nghi vấn, quản lý hành động, quy tắc chuyển ghế có xác nhận |
| Chat | Danh sách chat realtime | Timeline lọc, toast, bubble trên ghế, từ khóa, slow mode, ưu tiên tin streamer |
| Gift | Mapping gift → animation | Visual gift tier, streak aggregation, hàng đợi hiệu ứng, preview từng effect |
| Setup | Nhiều tab cấu hình | Wizard dễ dùng + preview trực tiếp + inspector chỉnh kéo thả và preset |
| Kiểm thử | Mock events | Scenario builder, log, replay, báo cáo FPS/drop/queue/WS |
| Khả năng đưa lên sóng | `/live` và capture | Safe area 9:16 / 16:9, overlay debug, cảnh dự phòng, source switch |
| Kiến trúc | React/PixiJS local-first | Giữ FE-only, phân module theo adapter/renderer/scene; **không thêm API server** |

### B. Reference fidelity — hiểu đúng mục tiêu “90% giống”

#### B.1 Bản đồ tương đồng mục tiêu

Các mục bên dưới là **rubric để đối chiếu sau khi có ảnh hoặc thao tác trực tiếp được trên site**, không phải mô tả tính năng đã quan sát thấy tại `t1win.online`.

| Nhóm đánh giá | Trọng số | Tiêu chí đo | Trạng thái bằng chứng |
|---|---:|---|---|
| Information architecture & bố cục | 25% | Vị trí/phân cấp main screen, chat, action, viewer seats; mật độ hiển thị | Chưa xác minh ảnh ref |
| Interaction flow & behavior | 20% | Khởi tạo buổi xem, join seat, reaction, gift, live switching | Chưa xác minh ref |
| Visual states & responsiveness | 15% | Empty/loading/occupied/full/error, typography, tỷ lệ, chuyển cảnh | Chưa xác minh ref |
| Streamer setup experience | 15% | Setup trước Live, preview, cấu hình trực tiếp, diagnostics | Chưa xác minh ref |
| Chat/gift overlay hierarchy | 10% | Thứ tự ưu tiên chat, gift, bubble, VFX tránh che màn chiếu | Chưa xác minh ref |
| Motion, timing & interaction feedback | 5% | Nhịp chuyển động, chờ đợi, sự kiện được phản hồi rõ | Chưa xác minh ref |
| **Tổng fidelity target** | **90%** | Chấm điểm bằng screenshot + thao tác A/B, không dựa cảm giác | **Pending audit** |

**10% bản sắc thương hiệu phải rõ ràng nhưng không ảnh hưởng bố cục cốt lõi:** nhân vật chibi nguyên bản (4%), art direction rạp fantasy/ghế lục giác (3%), bộ reaction/gift VFX và âm thanh riêng (3%). Không sử dụng logo, ảnh, source code, icon đặc thù hay nội dung có bản quyền của site tham chiếu.

#### B.2 Acceptance cho yêu cầu 90/10

- Có **reference audit sheet** liệt kê màn hình, kích thước viewport, widget, interaction, screenshot source, nhận xét khác biệt.
- Có **side-by-side visual regression** ở 1920×1080 và 1080×1920; ảnh nền/quyền sở hữu của site tham chiếu không được đóng gói vào sản phẩm.
- Trước khi tuyên bố **đạt 90%**, phải đo trên rubric B.1 dựa trên bằng chứng. Không chấp nhận tự gán điểm.
- Không triển khai logic betting/casino, nạp tiền, thanh toán hoặc mô phỏng nội dung không liên quan tới Viewing Party chỉ vì tên domain gây liên tưởng.

---

### C. Thiết kế giao diện chi tiết

#### C.1 Cấu trúc màn hình chuẩn (1920 × 1080)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: Logo, room title, LIVE status, event provider health, settings       │  68px
├───────────────┬─────────────────────────────────────────────┬───────────────┤
│ ACTIONS/GIFTS │              MAIN SCREEN                   │ LIVE CHAT     │
│ width 285px   │    play video / game / blank / source      │ width 315px   │
│               │    safe overlay + status + soft VFX        │ messages      │
│ help + rules  │                                             │ events        │
│ gift mapping  │                                             │ filters       │
│ quick actions │                                             │               │
├───────────────┴─────────────────────────────────────────────┴───────────────┤
│ CINEMA SEATS:   [01] [02] [03] [04] [05] [06]                              │
│                 [07] [08] [09] [10] [11] [12]                              │
│ streamer info · waitlist · seat status · compact events · fallback             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout constraints:** header 56–72 px; lower seats area 255–315 px; side panels independent scroll; video center must be largest component. Do not allow chat/gift to permanently overlay video; bubble on seat fades automatically. Inner max width is fluid; supports 1440×900 and 1920×1080 without clipping.

**Stream-first safe areas:** define 16:9 and 9:16 guides; when TikTok vertical stream, prefer **vertical composition mode** (video top, two-row seating below, chat ticker instead of full sidebar). Scale contents, do not simply crop the desktop layout.

#### C.2 Color and UI system

| Token | Suggested base | Usage |
|---|---|---|
| `--surface-0` | `#101524` | Màn nền tối điện ảnh |
| `--surface-1` | `#1B2236` | Sidebar/card |
| `--gold` | `#E9B96A` | CTA, highlight nhỏ |
| `--violet` | `#8D6BE8` | Viền fantasy, accent |
| `--cyan` | `#6DD5DC` | Connected trạng thái tốt |
| `--danger` | `#F06B78` | Disconnect, lỗi |
| `--text` | `#F8F6FA` | Text chính |
| `--muted` | `#A9B1C7` | Text phụ |

Typography: Inter/Be Vietnam Pro cho UI và chat; một display font có dấu tiếng Việt cho tiêu đề, không dùng font thương hiệu từ site tham chiếu. Cỡ tối thiểu trên video stream: tên ghế 17–20px, chat 19–22px (ở 1080p), metadata 14–16px. Tương phản WCAG AA ở vùng điều khiển.

#### C.3 Components và states

1. `RoomHeader`: Room name, LIVE/OFFLINE, indicator provider, clock, layout preset, FPS status chỉ hiện trong Studio.
2. `CinemaScreen`: local video/URL/HLS/transparent/placeholder; trạng thái no-source, buffering, failed, recovered.
3. `LeftDock`: hướng dẫn command, gift board, hành động nổi bật; có collapse và minified state.
4. `LiveChatPanel`: 20–50 dòng nhìn thấy qua virtual scroll; highlight gift/chat viewer đang ngồi; filter.
5. `SeatDeck`: 12 ghế theo ID ổn định; optional chibi sprites 2.5D, nameplate, level of motion, reaction bubble.
6. `SeatWaitlist`: drawer/compact badge, không chiếm video.
7. `EventToast`: xuất hiện 2–4s rồi nhường chỗ; gift lớn có lịch trình riêng.
8. `StreamerToolbar`: chỉ thấy trong Studio/control, ẩn khỏi capture stream bằng Presentation toggle.
9. `EmptyRoomOverlay`: giới thiệu lệnh `!join`; không che video khi đã live.
10. `SessionStatus`: stream elapsed, connected, 12/12, queue length, dropped-event diagnostics chỉ dành cho streamer.

#### C.4 UI State Matrix

| State | Main screen | Seats | Side panels | CTA |
|---|---|---|---|---|
| First launch | Demo video/poster | 12 trống | Hướng dẫn + mock chat | `Bắt đầu cấu hình` |
| Setup connected | Preview source | Test data | Event inspector | `Kiểm thử` |
| Waiting LIVE | Poster + readiness banner nhỏ | Ghế trống/giữ trạng thái | Thông báo provider | `Vào Live Mode` nếu streamer muốn xem trước |
| Live normal | Source/game đang chiếu | Người xem theo trạng thái | Chat+gift realtime | Ẩn control |
| Full room | Source không đổi | 12/12 + queue | Badge chờ | Quản lý hàng chờ trong Studio |
| WS disconnected | Source tiếp tục chiếu | Ghế **giữ nguyên** | Toast nhỏ & reconnect | `Thử lại` trong Studio |
| Source failed | Fallback still/background | Ghế tiếp tục | Event không bị xóa | `Đổi nguồn` trong Studio |
| Session ended | End slate/thank-you | Kết thúc animation | Summary | `Buổi live mới` |

#### C.5 Quy tắc chuyển động

- Avatar idle: 4–8s random blink, nhỏ gọn, không liên tục phát animation toàn thân.
- `join`: 0.5–0.9s chạy tới ghế, 0.2s chào, ngồi xuống.
- `chat`: bubble 2.5–4s, giới hạn 2 dòng, loại bỏ HTML, không render emoji lạ gây layout shift.
- `like`: react 0.5–0.8s với aggregation; không tạo mỗi like một sprite.
- `gift`: small 1.3–1.8s; medium 2–3s; large 3–4.5s, không chặn playback.
- `leave`: 0.6–1s đi ra; chỉ khi người dùng gõ `!leave`, admin remove hoặc rule seat reclaim kích hoạt.
- Reduced motion: disable screen shake, shorten particle count, retain essential state change.

---

### D. Streamer Studio UX — phải dùng được mà không biết code

#### D.1 Routes

- `/setup` — wizard + workspace, là route mở đầu mặc định.
- `/preview` — preview fullscreen có toggle `Mock/Real`; không hiển thị key.
- `/live` — presentation canvas để Window Capture hoặc Browser Source.
- `/diagnostics` — realtime log và provider health (ẩn khỏi stream).
- `/assets` — quản lý avatar/background/effects (dữ liệu được lưu local).

#### D.2 Wizard 5 bước

| Bước | Người dùng nhập/chọn | Kiểm tra | Kết quả |
|---|---|---|---|
| 1. Nguồn sự kiện | Mock / TikFinity / TikTools, username | Schema, khả năng dùng trên browser, kết nối | Status + capabilities |
| 2. Nguồn hình | Local file / stream URL / Transparent / Poster | CORS, HLS, autoplay, kích thước | Preview với fallback |
| 3. Khán giả | 12 ghế, join mode, waitlist, inactive policy | Không trùng seat ID, không tự suy ra leave | Seat simulator |
| 4. Giao diện | Theme, 16:9/9:16, font, effect quality | Contrast, safe-zone, fps estimate | Fullscreen preview |
| 5. Kiểm thử & Go Live | Mock event pack, kiểm tra checklist | Health status và quyền phát hình | `Vào Live Mode` |

#### D.3 Preview Studio

- Left settings 280–320px; center live 16:9/9:16 frame; right event inspector 280px.
- Click một ghế mở Seat Inspector: avatar, khóa/mở, assign mock viewer, remove, pin, priority.
- Click video screen mở Source Inspector; chỉnh scale, fit/crop, position, mute, background.
- Thử một gift bằng nút `Play effect`; thay đổi cấu hình có thể Undo/Redo trong phiên.
- Có `Save preset`, `Duplicate`, `Restore defaults`, `Export JSON`, `Import JSON` và snapshot trước live.
- Không cho API key vào export; nếu key được nhớ chỉ lưu session-memory bằng mặc định.

#### D.4 Pre-Go-Live readiness checklist

- [ ] Provider kết nối hoặc Mock mode được chủ động chọn.
- [ ] Source video/game hoặc background hoạt động.
- [ ] 12 ghế hiển thị đủ, 0 ghế chồng nhau, bubble không che màn chiếu.
- [ ] Có ít nhất một test chat, gift, join và leave thành công trong mô phỏng.
- [ ] Audio/VFX sample test không quá lớn và có mute riêng.
- [ ] 16:9 hoặc 9:16 safe area đúng với output LIVE Studio.
- [ ] Không hiển thị key, đường dẫn local nhạy cảm, token trong UI live.
- [ ] Không chia sẻ nội dung video chưa có quyền phát sóng.

`Go Live` trong web **KHÔNG phải** bấm phát trực tiếp TikTok; đổi sang Presentation Mode để LIVE Studio capture. Hiển thị hướng dẫn trên UI rõ ràng.

---

### E. Data integration: TikTok realtime, chính xác về khả năng

#### E.1 Event architecture

```text
TikTok LIVE -> external provider -> WebSocket (direct from browser when allowed)
  -> Provider Adapter -> Event Normalizer -> Dedup/Rate Limit/Queue
  -> Seat Engine / Chat Store / Gift Animator / Stats Aggregator
  -> Zustand state -> React UI + PixiJS scene
```

Provider capabilities phải được **phát hiện / cấu hình** thay vì mặc định mọi provider có `join`, `leave`, `giftStreakEnd`.

```ts
export type ProviderCapability =
  | 'chat' | 'gift' | 'like' | 'follow' | 'share'
  | 'member_join' | 'member_leave' | 'viewer_count' | 'subscribe';

export type NormalizedEvent = {
  id: string; source: string; type: ProviderCapability | 'system';
  occurredAt: number; receivedAt: number;
  user?: { id: string; nickname?: string; avatarUrl?: string };
  gift?: { id: string; countDelta?: number; streakId?: string; streakEnded?: boolean };
  chat?: { text: string }; viewerCount?: number;
  rawHash?: string; // không cần lưu raw packet nhạy cảm
};
```

#### E.2 Join / Leave rules

**Cốt lõi:** `member_join` nếu provider có; command `!join` luôn được hỗ trợ. Không được dùng `viewerCount` giảm để kết luận một `userId` cụ thể đã rời.

State machine cho một slot:

`EMPTY → RESERVED → OCCUPIED → INACTIVE_CANDIDATE → (OCCUPIED | RECLAIMED) → EMPTY`

- `RESERVED`: set nickname/avatar và giữ ghế khi animation join đang chạy; 5s timeout nếu animation lỗi.
- `OCCUPIED`: nhận event chat/gift/like -> update `lastSeenActivity`, **không phải lastSeenInRoom**.
- `INACTIVE_CANDIDATE`: chỉ dựa vào chính sách tương tác; vẫn ghi rõ **không xác nhận viewer đã out**.
- `RECLAIMED`: admin hoặc seat policy tự thay thế; log reason và cooldown.
- `LOCKED`: ghế bị khóa, không auto-assign, không auto-reclaim.

Default v2: **`!join` ưu tiên**, cho phép bật Auto Join; **Auto Reclaim tắt mặc định** (hoặc bật theo threshold với disclaimer rõ). `!leave` hoặc admin Remove mới được coi là rời ghế chủ động. Reconnect giữ nguyên state đã có.

#### E.3 Gift semantics

- Mapping theo `giftId` của provider, không theo chuỗi tên quà nhập thủ công khi thiếu ID.
- Gift combo/streak có thể là cumulative -> adapter phải chọn cách tính delta và dedup theo `(provider,eventId/streakId,userId)`.
- Nếu không phân biệt được, hiển thị **notification** nhưng không cộng điểm/lượt phát trùng.
- Không thêm nạp tiền/ví/coin nội bộ; gifts là sự kiện nhận từ TikTok.

#### E.4 Error/reconnect

- Backoff 1s, 2s, 4s, 8s... giới hạn 30s với jitter; có nút reconnect manual.
- Cùng lúc tối đa 1 socket active/provider instance. Cleanup on unmount, split-brain prevention.
- Buffer 500 events / TTL 15s; drop/aggregate likes trước, không block chat/gift.
- Display `CONNECTED`, `CONNECTING`, `LIVE_WAITING`, `DISCONNECTED`, `AUTH_ERROR`, `UNSUPPORTED` riêng.
- Browser mixed-content / TLS / CORS WebSocket / WebSocket handshake issues phải có diagnostics dễ hiểu.

#### E.5 Frontend-only limits

- **Không có backend riêng**, nhưng phụ thuộc nhà cung cấp TikTok event: desktop agent hoặc cloud relay.
- API key của provider trong browser không thể bảo mật tuyệt đối; nhập khi setup, không đưa vào Git hay URL.
- OBS/TikTok LIVE Studio browser source có thể **không chia sẻ IndexedDB/sessionStorage** với trình duyệt config. Trong bản v2, **Window Capture một runtime** được khuyến nghị. Nếu dùng 2 runtime, cần cách đồng bộ được kiểm chứng; không giả định BroadcastChannel hoạt động xuyên browser profile.
- Web app không thể tự phát hiện đầy đủ danh sách viewer rời phòng nếu provider không cấp sự kiện có định danh.

---

### F. 12 seats + viewer engagement

#### F.1 Seat reservation priorities

1. Pinned VIP seat / moderator reserved seat (được người điều khiển cho phép).
2. Viewer gõ `!seat N` đến seat trống, nếu enabled.
3. Viewer `!join` → ghế trống thấp nhất hoặc seat ngẫu nhiên tùy config.
4. `member_join` auto assignment nếu Auto Join enabled và không bị spam-filter.
5. Room full → waitlist FIFO, optionally weighted by tenure **nhưng không ưu tiên nạp tiền trong web**.

Seat ID cố định 1–12, `userId` stable; mọi event phải idempotent. Một viewer không chiếm 2 ghế. Khi người ngồi chat/gift, effect phải định tuyến tới đúng ghế của họ.

#### F.2 Chibi avatar library

- 6 avatar base gốc cho MVP, 12 model variants hoặc 6 avatar + skin/color/preset vẫn tạo cảm giác đa dạng.
- Tối thiểu 6 states: `idle`, `enter`, `sit`, `chat`, `cheer`, `leave`; optionally `sleep`, `gift`, `react`.
- Tên, avatar profile của người xem chỉ hiển thị theo event provider + policy privacy; có fallback `Khán giả #N`.
- Animation spritesheet/WebP/atlas (không dùng video cho mỗi avatar), animation pool và cache, preload trước stream.

#### F.3 Quality tiers

| Tier | Target | Effects |
|---|---|---|
| Low | 30 FPS | 2D sprites, tối đa 200 particle, shadow giản lược |
| Balanced | 60 FPS kỳ vọng trên desktop phù hợp | 2.5D + effect batching, 600 particle |
| High | 60 FPS kỳ vọng trên máy mạnh | Lighting/bloom có giới hạn, 1.200 particle |

Luôn đo thực tế và tự giảm chất lượng khi FPS liên tục dưới ngưỡng, tránh làm ảnh hưởng video stream.

---

### G. Chat, quà, phản ứng và khả năng tương tác

#### G.1 Chat commands mặc định

| Command | Action | Guard |
|---|---|---|
| `!join` | Join ghế trống / vào hàng đợi | cooldown 10s / user |
| `!leave` | Rời ghế và/hoặc hàng đợi | immediate |
| `!seat 1..12` | Xin ghế chỉ định | chỉ khi trống / không khóa |
| `!wave` | Nhân vật vẫy tay | 10s cooldown |
| `!heart` | Reaction trái tim | aggregate |
| `!help` | Hiện hướng dẫn ngắn | không spam chat overlay |

Các command được parse theo Unicode trim, case-insensitive, check boundary tránh bắt nhầm substring. `!join` hoạt động trong Mock Mode và khi Chat Event thật có data hợp lệ.

#### G.2 Chat appearance

- Browser stream view hiển thị 8–14 messages + virtualized history; adjustable on Setup.
- Tin nhắn người đang ngồi hiển thị bubble trên avatar; người chưa ngồi chỉ ở chat panel.
- Gift/system message khác style chat thường và được rate-limit; không show raw provider payload.
- Nút Hide bad words, hide command spam, ban/mute local (chỉ ẩn trong web, không tự moderation TikTok nếu API không hỗ trợ).

#### G.3 Visual Gift Tiers

| Tier | Rules | Animation | Max |
|---|---|---|---|
| Micro | like/low gift | chớp/heart ở ghế | aggregate 5s |
| Small | quà thường | sparkle quanh người gửi | 1.5s |
| Medium | mapped premium | seat aura + toast | 2.7s |
| Large | mapped major | cinema-light sweep + mini-stage | 4s |
| Showcase | chủ phòng chủ động chọn | cinematic tối đa 5s | 1 at a time |

Cài `maxConcurrentVFX` (mặc định 3), không làm tối nội dung video quá mức, không tắt audio nguồn chính, cho phép streamer mute SFX.

---

### H. Source manager — xem chung chứ không phải game riêng

Nguồn phát được hỗ trợ trong phiên bản FE-only:

| Source | Cách triển khai | Ghi chú |
|---|---|---|
| Local file | `<input type=file>` + `URL.createObjectURL(file)` | Không thể phục hồi file sau reload mà không xin lại quyền/chọn lại |
| Direct video URL | HTML5 `<video>` | Có thể bị CORS/cấm nhúng/codecs |
| HLS stream | `hls.js` hoặc native HLS | Tùy loại MIME và browser |
| Image/slideshow | image element + timeline | Hợp cho break/offline |
| Transparent stage | CSS transparent center | LIVE Studio ghép gameplay capture vào phía sau |
| Screen capture (optional) | `getDisplayMedia()` sau user gesture | Không dựa vào đây cho embedded Browser Source; quyền capture có thể không khả dụng |
| Third-party embed | iframe nếu site cho phép | DRM/X-Frame-Options/CSP có thể chặn |

**Không** khẳng định website có thể tự lấy game/window capture trong TikTok LIVE Studio. Với source game, dùng LIVE Studio/OBS trực tiếp và ghép overlay là phương án bền vững.

---

### I. Performance, privacy & stream reliability

**Rendering budgets / mục tiêu đề xuất:** 1920×1080 và 1080×1920, video FPS không bị ảnh hưởng bởi avatar rendering; no frequent React rerender per every like. Chunk/lazy load tài nguyên; scene có max effect queue; sau 2h stress test bộ nhớ không tăng tuyến tính. Bundle JS được code-split; file asset cache sử dụng local runtime.

**Privacy:** không in event token/key vào console; không persist raw chat lâu dài mặc định; allow purge logs; tránh lưu avatar ảnh người xem không cần thiết; export preset không có username/key/TikTok auth; clear session dễ dùng.

**Safety:** nhận dữ liệu chat như untrusted input, escape HTML, không dùng `dangerouslySetInnerHTML`, không thực thi eval từ gift mappings, không tải script động từ provider không tin cậy. Không tạo chức năng thanh toán nội bộ hoặc nạp coin.

---

### J. Backlog triển khai V2.0 — ưu tiên

| Priority | Story | Deliverable | Test gate |
|---|---|---|---|
| P0 | V2-01 | 3-column cinema layout + 12 seats + 16:9 & 9:16 layouts | screenshot smoke |
| P0 | V2-02 | Setup Wizard 5 bước / Preview | run không chỉnh code |
| P0 | V2-03 | Mock adapter + scenario runner | replay 100 events |
| P0 | V2-04 | Provider abstraction, WS, diagnostics | connect/disconnect logs |
| P0 | V2-05 | Seat State Machine + join/leave/waitlist | zero duplicate seat |
| P0 | V2-06 | Chat panel + bubble + filter | 1000 chat events |
| P0 | V2-07 | Source Manager + output mode | presentation no key |
| P1 | V2-08 | Gift mapping + tiers + streak handling | correct dedup |
| P1 | V2-09 | 6 base chibi + animations + asset cache | no sprite flicker |
| P1 | V2-10 | Drag-and-drop Studio, presets & export/import | restore v2 schema |
| P1 | V2-11 | VFX quality tiers + watchdog | 30/60 fps target |
| P1 | V2-12 | Streamer controls & keyboard shortcuts | no UI leaked |
| P1 | V2-13 | Accessibility/reduced-motion/9:16 | vertical stream QA |
| P2 | V2-14 | Reference parity visual regression | rubric B.1 evidenced |
| P2 | V2-15 | Multi-theme rạp, branded sound effects | original assets only |

#### J.1 Rollout plan

**Milestone 0 — Proof of Concept:** mock 12 seats, video/transparent, 16:9 + 9:16, live capture, no provider.  
**Milestone 1 — Studio & Event:** setup, mock testing, provider adapters, realtime chat/seat.  
**Milestone 2 — Polished Theater:** avatars, gift VFX, effects, audio, camera transitions.  
**Milestone 3 — Hardening & Ref Audit:** soak tests, real TikTok LIVE verification, reference screenshot audit, updated parity score.

---

### K. Test scenarios / Definition of Done

| ID | Scenario | Expected |
|---|---|---|
| R01 | Fresh install localhost | UI mở `/setup`, hoạt động Mock Mode |
| R02 | No provider | Không crash, có chọn mock/đổi provider |
| R03 | Provider malformed event | Event bị bỏ qua + diagnostics, không leak info |
| R04 | 12 người `!join` | Ghế 1–12 đầy, đúng một viewer/ghế |
| R05 | Viewer join 2 lần | Không duplicate seat |
| R06 | Viewer thứ 13 | Vào waitlist, không ghi đè ghế |
| R07 | Viewer gửi `!leave` | Rời ghế, người đầu waitlist nhận ghế |
| R08 | Viewer silent 5 phút | Không tự giả định đã rời LIVE |
| R09 | WS reconnect | Trạng thái ghế không reset, event không duplicate |
| R10 | Simulate 10.000 likes | Aggregate, không render 10.000 sprite |
| R11 | Streak gift repeated packets | Không cộng trùng, animation đúng tier |
| R12 | Unicode chat/emoji/XSS | Sanitized, không thực thi HTML/JS |
| R13 | Local video source reload | Hiện prompt chọn lại file nếu cần |
| R14 | 9:16 scene | Không crop ghế/chat cần thiết |
| R15 | Live scene capture | Không để lộ controls, API key, debug |
| R16 | Gift VFX overload | Queue giới hạn, video vẫn xem được |
| R17 | No video source | Fallback rạp, ghế và chat vẫn chạy |
| R18 | Browser source separate context | Không suy diễn chia sẻ local state; có cảnh báo rõ |
| R19 | Go Live website | Chỉ đổi chế độ web, không tự phát TikTok |
| R20 | 2h soak test | Không memory leak tuyến tính; recovery ổn định |
| R21 | Tham chiếu `t1win.online` | Chỉ chấm fidelity khi có visual audit thật |
| R22 | Gift/seat live real stream | Chạy kiểm chứng schema theo provider đã chọn |

**Definition of Done V2:** P0 hoàn tất và test pass; màn hình live hợp lý trên 16:9/9:16; mock flow đầy đủ; có ít nhất một provider test thực tế trước khi tuyên bố tích hợp live đã hoạt động; 90/10 chỉ đánh giá khi có ảnh/recording trang tham chiếu.

---

### L. Hướng dẫn cho AI coding agent (CLAUDE CODE / CODEX)

```text
Đọc VIEWING_PARTY_LIVE_PRD_TECH_SPEC_V2.md và REFERENCE_EDITION_V2.md trước khi chỉnh code.
Giữ nguyên product lock: Viewing Party kiểu RẠP CHIẾU PHIM, không chùa, không combat.
Frontend-only 100%, local-first, React + TS + PixiJS + Zustand + IndexedDB.
UI phải có Setup Wizard, Preview, Live, 12 seats, chat, gift/reactions, mock provider.
Các provider bên thứ ba chỉ triển khai theo tài liệu và kiểm thử thực tế; không giả định event leave.
Không đưa key vào bundle, URL, logs hoặc exported preset.
Không sao chép brand/asset/source code từ trang tham chiếu.
Lần lượt làm P0 -> P1 -> P2; mỗi thay đổi có unit/e2e/screenshot test.
Không tuyên bố đạt 90% similarity khi chưa có dữ liệu visual audit của trang tham chiếu.
```

#### L.1 Tài nguyên cần để đối chiếu đúng UI tham chiếu

Nếu cần kiểm định gần 90% thực tế, hãy bổ sung **ảnh full desktop**, **ảnh 9:16/phone**, **ảnh khi có người vào ghế**, **ảnh gift animation**, và **clip thao tác Setup → Live** của trang tham chiếu (chỉ để đối chiếu UI/behavior, không để chép asset). Khi đó lập bảng difference và chấm fidelity rubric B.1.

---

### M. Reference & evidence log

1. URL: https://t1win.online/ — xác nhận trả về trang có tiêu đề “Viewing Party Online” tại thời điểm tra cứu. HTML/JS UI không được trình truy xuất văn bản hiển thị đầy đủ; **chưa có ảnh DOM để xác minh feature parity**.
2. PRD hiện hành: `VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md` (v1.0, 03/11/2026) — base scope, event pipeline, seat manager, privacy.
3. Original owner sketch — 3 cột + 2 hàng × 6 ghế; đây là **user-supplied requirement**, không phải thiết kế của site tham chiếu.
4. Concept rạp chiếu chibi v1 — visual direction do dự án tự tạo, không lấy từ site tham chiếu.

**Ghi chú pháp lý thiết kế:** “Tham khảo 90%” ở đây áp dụng cho kiến trúc thông tin và tương tác chức năng. Không nên sao chép sát những chi tiết nhận diện có bản quyền/bảo hộ như logo, nhân vật, tranh minh họa, font độc quyền, nhãn hiệu, âm thanh hoặc source code của bên thứ ba.


---

# 1. Bối cảnh, phạm vi và những gì KHÔNG xây

## 1.1 Bài toán

Người tổ chức livestream muốn tạo một “rạp chiếu phim” ảo: màn hình giữa phát video/game, các ghế phía trước hiển thị avatar chibi của khán giả đang tương tác. Người xem tham gia/được ưu tiên vào ghế, gửi chat và quà để thấy phản ứng trực tiếp trên màn hình livestream. Streamer cần cấu hình qua GUI trước khi Go Live, không phải sửa code, JSON thủ công hoặc dùng terminal nhiều lần.

## 1.2 Đối tượng sử dụng

| Vai trò | Mục tiêu | Giao diện |
|---|---|---|
| Streamer/Owner | Cấu hình, thử nghiệm, vào Live Mode, xử lý ghế/chat | `/setup`, bảng điều khiển live |
| Người xem TikTok | Xem nội dung, tham gia ghế, chat, gửi quà, phản ứng | Tương tác qua TikTok LIVE |
| Moderator hỗ trợ | Đổi ghế/khóa ghế, ẩn chat, can thiệp khi có spam | Panel local (cùng trình duyệt) |
| QA | Giả lập hàng trăm/nghìn events, kiểm tra rendering | `/setup?tab=testing` |

## 1.3 In scope v1

- 1 streamer kết nối 1 phòng TikTok LIVE tại một thời điểm.
- 1 rạp / 1 canvas chính, 12 ghế hiển thị mặc định (có thể cấu hình 6/8/12 nhưng bản đầu chỉ tối ưu 12).
- 2 hàng × 6 ghế, gợi nhớ hình phác thảo ban đầu với **12 slot lục giác**; ngoài chế độ fantasy, có thể chuyển nền slot sang ghế nhung rạp phim.
- Video source: tệp video local đã chọn, video URL trực tiếp/HLS được phép truy cập, nền placeholder; hỗ trợ cách ghép nguồn game qua OBS/LIVE Studio.
- Realtime chat, gift, like, follow/share nếu provider gửi; member join chỉ khi provider gửi; viewer count độc lập.
- Auto seat, `!join`, `!leave`, `!seat N`, hàng đợi chờ, trạng thái inactive và manual kick.
- Avatar chibi gốc, reaction bubble, gift effects, idle animation.
- Control panel, preview, test events, live transition, theme / audio / layout settings.
- Local-only settings, session analytics tối giản và log có giới hạn.

## 1.4 Out of scope v1

- Không dựng server BE, không cần database server, không có Supabase/Firebase bắt buộc.
- Không có đấu tướng, level, tăng sức mạnh, RPG combat, loot box hoặc hệ thống thanh toán trong web.
- Không tích hợp API phát trực tiếp video/điều khiển Start Stream của TikTok LIVE Studio nếu không có khả năng chính thức tương thích.
- Không bypass DRM, không download nội dung trả phí, không nhúng trái phép phim/stream bị chặn.
- Không đảm bảo biết chính xác tất cả người vào/ra phòng theo từng giây.
- Không bắt buộc hai máy/2 browser độc lập điều khiển đồng bộ live trong v1 (FE-only không có relay đồng bộ sẵn).
- Không cam kết một provider bên thứ ba duy trì API vĩnh viễn.

## 1.5 Mức độ tin cậy của dữ liệu

| Loại dữ liệu | Nguồn/cơ chế | Độ tin cậy và lưu ý |
|---|---|---|
| Chat | Provider realtime | Có thể nhận tốt khi provider, tài khoản, LIVE hoạt động; có thể trễ/mất khi gián đoạn |
| Gift | Provider realtime | Phải xử lý streak/duplicate đúng; không tính số tiền theo cách suy đoán |
| Like | Provider realtime | Có thể là số cộng dồn, số tăng thêm hoặc batch, tùy schema provider |
| Member join | Provider `member`/tương đương | Có thể thiếu trong một số kết nối/phòng, phải kiểm tra thực tế |
| Viewer count | `roomUser` / `roomUserSeq`/tương đương | Chỉ là số lượng, không xác định cá nhân nào rời |
| Viewer leave | Không có guarantee tổng quát | Không dùng làm điều kiện bắt buộc để thu hồi ghế |
| Trạng thái LIVE | Provider/control/WS state | Cần phân biệt `live_offline`, `unknown`, `disconnected` |

---

# 2. Trải nghiệm sản phẩm / User Journey

## 2.1 Luồng lần đầu

1. Người dùng mở `http://localhost:5173` → tự điều hướng `/setup`.
2. Wizard bước 1 — chọn **Demo/Mock** hoặc provider TikFinity/TikTools.
3. Wizard bước 2 — nhập username TikTok (không có `@`), thông tin kết nối theo provider.
4. Wizard bước 3 — kiểm tra kết nối (`CONNECTED`, `WAITING_FOR_LIVE`, `ERROR`), hiện chi tiết diagnostics.
5. Wizard bước 4 — chọn chủ đề rạp, set 12 ghế, chọn avatar pool và rule phân ghế.
6. Wizard bước 5 — chọn nguồn chiếu: local video/URL/OBS-composited screen.
7. Wizard bước 6 — test giả lập join/chat/gift/like; xem preview thực tế.
8. Bấm **Lưu cấu hình** → **Vào Live Mode**.
9. Mở OBS hoặc TikTok LIVE Studio, add nguồn video/web phù hợp; người dùng thao tác Go Live trong công cụ phát sóng.
10. Website kết nối provider và render sự kiện khi live bắt đầu; nếu offline sẽ hiện trạng thái chờ, không spam reconnect.

## 2.2 Luồng buổi live điển hình

1. Streamer bắt đầu phát nội dung chính trên màn chiếu.
2. Viewer A comment `!join` → hệ thống thêm A vào ghế trống đầu tiên, avatar chạy vào.
3. Viewer B gửi gift → quà được hiển thị chat, vật phẩm/VFX xuất hiện và B được ghi nhận.
4. Viewer C gửi `!seat 4` → nếu ghế 4 trống và hợp lệ, ngồi ghế 4; nếu không, phản hồi/hiệu ứng phù hợp.
5. Khi đủ 12 ghế, viewer mới được xếp trong hàng đợi có TTL.
6. Viewer A comment `!leave` → A rời ghế, người chờ đầu hàng vào thay.
7. Khi provider disconnect, website giữ cảnh đang chiếu, đánh dấu `RECONNECTING`; không xóa toàn bộ ghế ngay.
8. Streamer kết thúc live, chọn **Kết thúc phiên trong app** → tạo summary local, reset phần phiên nhưng bảo toàn cài đặt.

## 2.3 Các trạng thái UI cốt lõi

- **SETUP / INCOMPLETE**: chưa đủ cấu hình, các nút phát thử vẫn hoạt động.
- **READY / MOCK**: cấu hình xong, mock provider đang chạy.
- **WAITING_FOR_LIVE**: provider nhận được kết nối nhưng TikTok chưa live.
- **LIVE / CONNECTED**: đang nhận sự kiện live.
- **LIVE / RECONNECTING**: mất socket tạm thời; giữ nguyên giao diện, countdown retry.
- **LIVE / DEGRADED**: nhận được chat nhưng thiếu join event (hoặc provider không có join); tự chuyển gợi ý `!join`.
- **SESSION_ENDED**: kết thúc ứng dụng; hiển thị tóm tắt.

---

# 3. Yêu cầu giao diện / Design System

## 3.1 Ngôn ngữ thiết kế

**Style:** Cozy Cinema × Fantasy Chibi RPG × Esports Watch Party. Phong cách MOBA 2.5D/isometric, ánh sáng điện ảnh, nhưng **art tự thiết kế** (không sao chép nhân vật/skin/logo League of Legends).

- Palette: tím than `#15132A`, tím midnight `#272042`, vàng champagne `#E6BC70`, đỏ nhung `#7B254A`, cyan accent `#6CDAE5`.
- Font: `Be Vietnam Pro` hoặc `Noto Sans` hỗ trợ dấu tiếng Việt; số/badge có thể dùng font display phù hợp.
- Card: dark translucent surface, viền vàng mảnh, shadow nhẹ, góc bo 12–18px.
- Scene: sàn gỗ/nhung rạp phim, ghế nhung đỏ, màn hình tỷ lệ linh hoạt, rèm, đèn trần, đèn hắt, popcorn.
- Character: Chibi 2.5D, tỷ lệ đầu/thân khoảng 1:2, idles nhẹ, không chiếm spotlight nội dung màn chiếu.
- VFX: đẹp nhưng giới hạn bloom/particles ở vùng không che màn hình chính.

## 3.2 Bố cục theo hình gốc

**Canvas chuẩn:** 1920 × 1080, safe zone: 40px bốn phía; thiết lập OBS/Studio crop tùy nền tảng.

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                   HEADER: LOGO | NOW PLAYING | LIVE | SETTINGS                   │
├───────────────┬─────────────────────────────────────────────┬──────────────────┤
│ LEFT PANEL    │                                             │ LIVE CHAT PANEL  │
│ 14–17%        │              LARGE CINEMA SCREEN            │ 16–20%           │
│               │                                             │                  │
│ How-to        │         GAME / VIDEO / STREAM CONTENT       │ Chat message     │
│ Seat commands │                                             │ Gift alert       │
│ Gift map      │                                             │ Like/follow      │
│ Quick actions │                                             │ Recent events    │
├───────────────┴─────────────────────────────────────────────┴──────────────────┤
│  CINEMA AUDIENCE: row 1 → [01] [02] [03] [04] [05] [06]                        │
│                   row 2 → [07] [08] [09] [10] [11] [12]                        │
│                          [QUEUE COUNT] [SEAT POLICY]                           │
├────────────────────────────────────────────────────────────────────────────────┤
│ TICKER / SESSION INFO | SOUND | EVENT STATUS | OPTIONAL NOW PLAYING            │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Điều chỉnh tỷ lệ thực tế:** cột trái 15%, cột phải 17%, trung tâm 68% trong **vùng phía trên**; khu ghế chiếm ~24–29% chiều cao; header/footer vừa đủ. Nếu nội dung game cần tỷ lệ 16:9, không kéo dãn nó theo chiều rộng còn lại; dùng `object-fit: contain`, nền letterbox đẹp hoặc stream riêng nguồn game trong OBS.

## 3.3 Các thành phần của Live Canvas

| Thành phần | Nội dung và hành vi | Ưu tiên |
|---|---|---|
| StageScreen | video/game/media, overlay tên nội dung, nút hidden admin | P0 |
| AudienceSeats | 12 slots, tên viewer, avatar chibi, trạng thái | P0 |
| ChatRail | tối đa 20 chat visible, gift banner, command highlight | P0 |
| ActionGuide | lệnh `!join`, `!leave`, gift effects, QR/link không bắt buộc | P0 |
| StatusBar | connection, viewer count, occupied seats, queue | P0 |
| GiftVFX | animated props, particles, cinematic (không che màn chiếu quá lâu) | P1 |
| ReactionBubble | lời thoại, tim, vỗ tay, ngạc nhiên | P1 |
| LiveControls | mute/pause/lock seat, toggle scene (ẩn trên capture) | P1 |
| SceneThemes | classic cinema, fantasy cinema, neon esports theater | P2 |

## 3.4 Các trang và điều hướng

- `/` → redirect `/setup`.
- `/setup` → toàn bộ cấu hình; tabs bên trái, preview + event log bên phải.
- `/live` → giao diện phòng xem; chỉ có overlay controls khi hover/nhấn hotkey, có thể tắt vĩnh viễn cho source.
- `/preview` → xem bản demo, không phụ thuộc provider, có thanh trigger events.
- `/diagnostics` (có thể nằm trong Setup) → kết nối provider và test render.

## 3.5 Thiết kế chi tiết Setup Mode

### Tab 1 — Kết nối TikTok

Fields: chọn provider (Mock, TikFinity Local, TikTools Cloud), streamer username, provider URL readonly theo preset, key/token nhập tại phiên hiện tại nếu cần; `Connect`, `Disconnect`, `Test`, trạng thái online/offline/unknown, event counts, diagnostics, latest raw payload (đã redacted).

**Cảnh báo:** không lưu API Key mặc định vào IndexedDB và không nhúng vào preset JSON. Khi sử dụng API key trong browser, chủ tài khoản phải hiểu key có thể bị truy cập bởi code/chứng năng của browser; localhost giảm bề mặt phơi lộ chứ không biến key thành bí mật an toàn tuyệt đối.

### Tab 2 — Màn chiếu

Modes:

- **Placeholder / countdown**: hình nền, tiêu đề, countdown.
- **Local video**: người dùng chọn file bằng file input; xử lý Object URL cho phiên hiện tại; không tự động upload, reload cần chọn lại tệp (có thể lưu File System Access handle nếu trình duyệt hỗ trợ + quyền người dùng).
- **Direct URL / HLS**: URL từ nguồn hợp pháp, đủ CORS/CSP; HLS.js tùy trình duyệt, fallback native HLS nếu có; hiển thị nguyên nhân khi blocked.
- **External composition**: vùng stage trong suốt/placeholder với preset kích thước, để OBS/LIVE Studio xếp nguồn game/video bên dưới hoặc phía trước.
- **Screen capture (experimental)**: `getDisplayMedia()` khi người dùng click và cấp phép, không hỗ trợ autoplay capture ngầm và dễ gặp mirror recursion nếu chọn lại cùng tab.

Options: volume, mute, poster, fit contain/cover (mặc định contain), overlay title, crop, theater lighting sync (chỉ đồng bộ theme, không phân tích media bắt buộc).

### Tab 3 — Ghế ngồi

- Grid 2×6 mặc định, đánh số 01–12 rõ ràng.
- Seat mode: `manual-command`, `auto-on-join`, `hybrid` (mặc định `hybrid` nhưng fallback `manual-command` khi provider thiếu join).
- Lock/unlock từng ghế, đặt ghế VIP, pin người xem, swap/clear, reset all.
- Inactive threshold (ví dụ 5 phút) chỉ thay đổi **nhãn**; `reclaimMode = manual | opt_in_timeout` (mặc định **manual**).
- Queue capacity 100 (có thể chỉnh 20–500), TTL 10 phút, max 1 ghế/viewer.
- Option: chỉ người comment `!join` mới được vào hàng đợi; allow auto seating gift join; ưu tiên VIP do chủ phòng cấu hình.
- Preview drag/click để gán mock viewer.

### Tab 4 — Avatar Chibi

- 12–24 preset characters tự thiết kế (nam/nữ/phi giới tính, fantasy/casual), tóc/trang phục/ghế/biểu cảm.
- Có thể map nhân vật cho viewer ID hoặc random deterministic theo ID.
- Animation set tối thiểu: `idle`, `enter`, `sit`, `talk`, `cheer`, `gift`, `sleepy`, `exit`.
- Toggle show/hide nickname và streamer moderation (ẩn avatar/tên viewer cần thiết).
- Bộ asset thông qua atlas/spritesheet/WebP; không bắt buộc 3D realtime.

### Tab 5 — Quà tặng

- Event list đã quan sát (gift IDs/names tùy provider) và preset mapping.
- Rules: `giftId`/`giftName`/tier -> animation, sound, duration, priority, cooldown, target.
- Auto reconcile gift streak; không phát duplicate một streak theo mỗi bản cập nhật tổng lũy kế.
- Preview rule bằng gift mock; nút reset preview.
- Tuân thủ thương hiệu và không trình bày quà ngoài TikTok như là chức năng thanh toán độc lập.

### Tab 6 — Chat & Commands

- Style: số dòng, timeout, font, colors, word wrap, tần suất message; lọc flood, từ ngữ không phù hợp.
- Commands: `!join`, `!leave`, `!seat 7`, `!react heart`, `!help`.
- Có thể bật tắt command, cooldown per user, chỉ hiện command panel khi người dùng yêu cầu.
- Không tự động trả lời vào chat TikTok nếu provider chỉ hỗ trợ read-only.

### Tab 7 — Audio & Effects

- Volume sliders: background music, ambient, SFX, notification.
- Mute-all, allow audio after click (browser autoplay policy), reduced motion.
- VFX quality low/medium/high, max simultaneous effects, max duration.
- Prevent flashy effects: có toggle reduced flash và giới hạn luminance.

### Tab 8 — Kiểm thử & Diagnostics

- Mock control: add 1/12/50/500 members, 1/100 chats, 1/1000 likes, gift streak, disconnect/reconnect, ended.
- Event inspector: raw → normalized → reducer → render, idempotency id, timestamp, source name.
- Bộ đếm: input/sec, dropped/sec, queue size, FPS, memory estimate, stale socket.
- Xuất debug log đã bỏ API keys, có xác nhận trước khi download.

### Tab 9 — OBS/LIVE Studio

- Copy local URL, mở `/live`, fullscreen, fixed 1920×1080 canvas preview; crop safe area.
- Hướng dẫn Window Capture hoặc Browser/Link Source theo phiên bản công cụ của người dùng.
- Preset theme `Browser source transparent stage` và `Single window composited`.
- Kiểm tra khi cả Setup và `/live` mở ở khác browser context; không hứa state sync nếu không có kênh message chung.

---

# 4. Kết nối TikTok realtime: kiến trúc và giới hạn

## 4.1 Phân biệt LIVE Studio và Event Provider

- **TikTok LIVE Studio:** phần mềm phát hình/capture, **không coi là nguồn API sự kiện realtime được tự động truy cập bằng website**.
- **TikFinity Desktop:** ứng dụng có Event API WebSocket local theo tài liệu; phải chạy trên cùng máy, bản dùng này phù hợp Windows khi app có sẵn.
- **TikTools Cloud:** dịch vụ bên thứ ba cung cấp WebSocket từ xa và sự kiện `member`, `chat`, `gift`, `like`, `social`, `roomUserSeq` theo tài liệu; cần key/token và có giới hạn/thương mại.
- **Mock Provider:** phát sự kiện giả lập offline cho phát triển và kiểm thử, bắt buộc để người dùng test trước lúc TikTok LIVE thực sự bắt đầu.

Tài liệu tham chiếu:

- TikFinity Event API: https://tikfinity.zerody.one/tiktok/actionsandevents
- TikTools overview + WebSocket: https://tik.tools/docs
- TikTools event guide: https://tik.tools/guides/tiktok-live-websocket
- TikTok for Developers: https://developers.tiktok.com/docs/en/webhooks-events

**Không đồng nhất** TikTok Developer Webhooks chung với realtime viewer-chat/gifts API: tài liệu webhook chính thức này không tự chứng minh quyền truy cập toàn bộ sự kiện LIVE như yêu cầu của sản phẩm.

## 4.2 Provider capability matrix v1

| Capability | Mock | TikFinity Local | TikTools Cloud |
|---|---|---|---|
| chat | ✓ | ✓ (`chat`) | ✓ (`chat`) |
| gift | ✓ | ✓ (`gift`) | ✓ (`gift`) |
| like | ✓ | ✓ (`like`) | ✓ (`like`) |
| follow/share | ✓ | ✓ (`follow`/`share`) | ✓ (`social` + `data.action`) |
| viewer count | ✓ | ✓ (`roomUser`, tùy payload) | ✓ (`roomUserSeq`) |
| individual join | ✓ | **không mặc định coi là có** | ✓ (`member`) tùy luồng thực tế |
| individual leave | mock only | **không bảo đảm** | **không bảo đảm** |
| end/control | ✓ | cần xác minh event/connection | tùy `control`/room state |
| Ubuntu | ✓ | Windows desktop app theo công bố | Browser/network (phụ thuộc mạng, gói) |

**Feature detection:** `getCapabilities()` của provider quyết định có hiện toggle `Auto Seat on Join` hay không; nếu chưa xác nhận, UI phải ghi “chỉ hoạt động khi provider gửi sự kiện join” và đề xuất `!join`.

## 4.3 Provider interfaces

```ts
export type Capability =
  | 'chat' | 'gift' | 'like' | 'follow' | 'share'
  | 'member_join' | 'viewer_count' | 'subscribe' | 'control';

export interface ProviderCapabilities {
  supported: Capability[];
  verifiedAt?: number; // sau khi thử thực tế
  caveats: string[];
}

export interface LiveEventProvider {
  readonly id: 'mock' | 'tikfinity' | 'tiktools';
  connect(config: ProviderConfig): Promise<void>;
  disconnect(): Promise<void>;
  onEvent(handler: (event: NormalizedEvent) => void): () => void;
  onStatus(handler: (status: ConnectionStatus) => void): () => void;
  getCapabilities(): ProviderCapabilities;
}
```

```ts
type ConnectionStatus =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'waiting_for_live'; reason?: string }
  | { kind: 'connected'; since: number }
  | { kind: 'reconnecting'; attempt: number; nextRetryAt: number }
  | { kind: 'degraded'; reason: string }
  | { kind: 'disconnected'; reason?: string }
  | { kind: 'error'; code: string; safeMessage: string };
```

## 4.4 TikFinity Local Provider

Theo tài liệu nhà cung cấp:

```text
ws://localhost:21213/
```

Mẫu event:

```json
{ "event": "chat", "data": { "comment": "!join", "user": { "uniqueId": "abc" } } }
```

Event names tài liệu ghi: `chat`, `gift`, `share`, `follow`, `like`, `roomUser`, `subscribe`. Payload cụ thể phải kiểm tra tài liệu connector và log thật; ví dụ JSON ở trên là **minh họa** chứ không coi mọi trường là guarantee.

Nút `Connect` phải có timeout, kiểm tra error rõ ràng khi app TikFinity chưa mở, không lặp kết nối vô hạn quá nhanh. Không áp đặt logic “`roomUser` = viewer_join”; đây là event số lượng người xem.

## 4.5 TikTools Cloud Provider

Theo tài liệu nhà cung cấp:

```text
wss://api.tik.tools?uniqueId=STREAMER&apiKey=YOUR_KEY
```

Hoặc dùng JWT ngắn hạn theo khả năng của provider:

```text
wss://api.tik.tools?uniqueId=STREAMER&jwtKey=SHORT_LIVED_JWT
```

**Lưu ý:** Đưa API key vào URL kết nối của browser có nguy cơ lộ qua console, extensions, debug, telemetry và môi trường người dùng; không được đưa key thật vào source code, repository, preset export, screenshot hoặc stream. JWT server-minted là phương án chuẩn để giấu master key nhưng trái với ràng buộc không có backend; trong v1 FE-only cho phép user BYOK trên **máy local cá nhân** với cảnh báo rõ ràng, key lưu trong RAM (không persisted), đóng phiên là mất.

- `member` → `viewer_join` (event đầu vào không bảo đảm nhận mọi viewer).
- `chat` → `chat_message`.
- `gift` → `gift_progress` / `gift_complete` tùy `repeatEnd` hoặc logic provider.
- `like` → `like_delta` khi xác định được ngữ nghĩa; fallback `like_update` nếu chưa chắc số incremental.
- `social` → `follow`/`share` qua `data.action`.
- `roomUserSeq` → `viewer_count`.
- `roomInfo` → metadata kết nối, không phải người vào ghế.
- `control` → life-cycle hint; phân biệt ended/pause/provider disconnect.

Cần thêm cảnh báo: API và schema có thể thay đổi. Có thể chỉ dùng được khi chính streamer đang LIVE và nhà cung cấp cho phép đọc phòng đó.

## 4.6 Chuẩn hóa events

```ts
interface EventMeta {
  id: string;             // provider message id hoặc stable synthetic key
  source: 'mock' | 'tikfinity' | 'tiktools';
  streamId: string;       // room ID hoặc streamer unique ID
  receivedAt: number;     // client timestamp
  occurredAt?: number;    // provider timestamp (nếu có)
  rawType: string;
}

interface ViewerIdentity {
  userId: string;         // ưu tiên id bền vững từ provider, để nguyên string
  uniqueId?: string;
  nickname: string;
  avatarUrl?: string;
}

type NormalizedEvent =
  | { type: 'viewer_join'; meta: EventMeta; viewer: ViewerIdentity }
  | { type: 'chat_message'; meta: EventMeta; viewer: ViewerIdentity; text: string }
  | { type: 'gift_progress'; meta: EventMeta; viewer: ViewerIdentity; giftId: string; giftName: string; totalCount: number; streakId?: string; isFinal: boolean }
  | { type: 'like_update'; meta: EventMeta; viewer?: ViewerIdentity; amount?: number; total?: number; isDeltaKnown: boolean }
  | { type: 'follow'; meta: EventMeta; viewer: ViewerIdentity }
  | { type: 'share'; meta: EventMeta; viewer: ViewerIdentity }
  | { type: 'viewer_count'; meta: EventMeta; count: number }
  | { type: 'provider_status'; meta: EventMeta; status: ConnectionStatus };
```

**Normalize rule:** Không có identity đáng tin cậy thì không tự tạo viewer record/seat; event không hỗ trợ được ghi diagnostics nhưng không gây lỗi render. User ID / Room ID là string, không chuyển thành JS Number lớn.

## 4.7 Quy tắc an toàn cho pipeline

1. Bỏ bản tin JSON không hợp lệ; không crash cả app.
2. Kiểm tra schema với Zod (hoặc type guards) trước khi cập nhật store.
3. `eventId` dedupe với TTL cache (5–10 phút) để không double render khi reconnect/provider gửi trùng.
4. Rate limiting và batching: chat render ≤ 10–20 msg/s, like aggregate mỗi 300–1000ms, gifts priority queue.
5. Reconnect exponential backoff và jitter (1, 2, 4, 8, 15, tối đa 30 giây); UI hiển thị trạng thái.
6. Disconnect/reconnect không xóa ghế tự động; session reset phải do streamer xác nhận.
7. Unknown/missing field phải degrade gracefully.
8. Mọi user text render dưới dạng text node, không `dangerouslySetInnerHTML`.
9. Thông tin nhạy cảm (API Key/JWT) luôn redact trước khi ghi log.
10. Trạng thái `offline` khác `unknown`; không nhận được dữ liệu không đồng nghĩa stream đã kết thúc.

---

# 5. Seat Manager — 12 ghế + hàng chờ

## 5.1 Seat model và State Machine

```ts
type SeatStatus = 'empty' | 'reserved' | 'occupied' | 'inactive' | 'locked';
type AssignmentSource = 'command' | 'member_join' | 'gift' | 'owner';

interface Seat {
  seatId: number;         // 1..12
  status: SeatStatus;
  viewerId?: string;
  nickname?: string;
  characterId?: string;
  assignedAt?: number;
  lastInteractionAt?: number;
  assignmentSource?: AssignmentSource;
  lockedByOwner?: boolean;
  isProtected?: boolean;
  version: number;
}

interface WaitingViewer {
  viewerId: string;
  nickname: string;
  requestedAt: number;
  priority: number;
  source: AssignmentSource;
}
```

Transitions:

```text
EMPTY → RESERVED → OCCUPIED → INACTIVE → OCCUPIED (khi tương tác lại)
EMPTY → LOCKED → EMPTY
OCCUPIED → EMPTY (manual !leave / moderator / opt-in eviction)
INACTIVE → EMPTY (chỉ khi reclaimMode cho phép)
RESERVED → EMPTY (reservation timeout/failed enter animation)
```

## 5.2 Thuật toán phân ghế

**Ưu tiên:** ghế được chỉ định hợp lệ → ghế trống đầu tiên → hàng đợi. Tối đa một ghế cho mỗi viewer theo `userId` chuẩn hóa. Hai events cùng người đến sát nhau phải idempotent.

```text
assignSeat(viewer, preferredSeat?):
  if viewer already seated -> touchActivity(); return existing seat
  if viewer already queued -> keep queue position
  if preferredSeat in 1..12 && isAvailable(preferredSeat) -> reserve it
  else if any available seat -> reserve lowest seatId
  else -> enqueue viewer if within capacity
  confirm reserved => occupied after animation/start (fallback timeout)
```

**Tính nguyên tử:** tất cả seat mutations đi qua một reducer/action queue tuần tự trên 1 instance Zustand store. Không trực tiếp set nhiều ghế qua các callbacks WebSocket độc lập gây race.

## 5.3 Cách dùng event join và chat command

- Khi `viewer_join` **được provider thực sự gửi**: ở mode `auto-on-join`/`hybrid`, có thể assign tự động; nếu thiếu, chờ lệnh chat.
- Khi chat `!join`: gán ghế kể cả chưa từng nhận `viewer_join`.
- Khi chat `!seat N`: thực hiện như yêu cầu ghế chỉ định, không được đẩy người đang ngồi nếu họ không đồng ý.
- Khi chat `!leave`: gỡ khỏi ghế hoặc hàng chờ nếu đang ở trong queue.
- Khi message thường: nếu đang ngồi thì update `lastInteractionAt`; không thêm ghế nếu mode command-only.
- Khi gift: luôn trigger VFX; có thể assign ghế nếu bật `joinOnGift`.

## 5.4 Thế nào là “rời phòng”?

**Không có cơ chế xóa ngay khi rời TikTok LIVE đáng tin cậy cho mọi provider.** Vì thế phải tách:

- `explicit_leave` = chat `!leave` hoặc owner kick → giải phóng ghế ngay.
- `inactivity_detected` = không thấy tương tác sau N phút → chuyển `INACTIVE` **không khẳng định đã rời**.
- `auto_reclaim` = tùy chọn *opt-in* của streamer; sau N phút inactive + có hàng chờ, hiện cảnh báo rồi thay ghế nếu streamer đã bật policy. Mặc định TẮT.
- `confirmed_leave` = chỉ dùng khi provider thật sự có event leave theo cá nhân, đã kiểm thử định dạng và độ tin cậy; v1 không phụ thuộc vào nó.

**Policy mặc định:** `seatMode=hybrid`, `reclaimMode=manual`, `inactiveAfterMs=300000`, `queueMax=100`, `queueTTL=600000`.

## 5.5 Cần giữ phiên khi reconnect

- Mất socket < 2 phút: giữ toàn bộ 12 ghế và avatar tại chỗ.
- Sau khi reconnect, **không** tự fill tất cả ghế từ viewer count (vì chỉ có số tổng).
- Option `Resume session` và `Start fresh session` phải tách; `Start fresh` cần xác nhận.
- Khi local page reload: có thể khôi phục seat snapshot **với cờ stale** và yêu cầu xác nhận; tuyệt đối không xem snapshot là người còn online.

## 5.6 Ví dụ acceptance criteria cho ghế

- AC-SEAT-01: tối đa 12 `occupied`, không có trùng userId.
- AC-SEAT-02: hai lần `!join` liên tiếp cùng user không tạo 2 ghế.
- AC-SEAT-03: lệnh `!leave` gỡ ghế trong ≤ 1s kể từ lúc event đã đến web.
- AC-SEAT-04: không có `member` nhưng có `!join` thì vẫn ngồi được.
- AC-SEAT-05: không auto kick vì viewer count giảm.
- AC-SEAT-06: `reclaimMode=manual` không giải phóng ghế chỉ vì user inactive.
- AC-SEAT-07: khi ghế trống, ưu tiên người đầu queue còn hợp lệ.
- AC-SEAT-08: `locked` ghế không gán tự động.
- AC-SEAT-09: reconnect không reset ghế.

---

# 6. Hệ thống Chat / Reaction / Gift

## 6.1 Chat UI

- Message line: avatar nhỏ, nickname cắt chiều dài, text tiếng Việt tối đa 2–3 dòng (expand trong diagnostics).
- Hiển thị 15–20 tin nhắn gần nhất, auto-scroll trừ khi owner kéo lên kiểm tra.
- Dedupe/reject > 2000 ký tự, chặn script injection, từ xấu, link spam; owner cấu hình filters.
- Kiểu sự kiện: chat thường, command, gift banner, follow, share, system.
- Nếu streamer sử dụng chat TikTok có sẵn trên Live Studio, có thể tắt `ChatRail` để tối ưu khung hình.

## 6.2 Chat commands

| Command | Vai trò | Logic |
|---|---|---|
| `!join` | Đăng ký ghế | Assign/queue, per-user cooldown |
| `!leave` | Rời ghế | Free seat/queue |
| `!seat 1`..`!seat 12` | Chọn ghế | Chỉ chọn ghế trống hoặc ghế của mình |
| `!react heart` | Reaction | Cooldown 3–5s |
| `!react cheer` | Vỗ tay | Cooldown 3–5s |
| `!help` | Hiển thị hướng dẫn | UI hint chỉ viewer trigger, không auto TikTok reply |

Parser: trim, lowercase command token, Unicode-safe, từ chối command injection / malicious params, không dùng regex ReDoS phức tạp, một user không thể spam vô hạn.

## 6.3 Gift mapping

```ts
interface GiftRule {
  id: string;
  match: { giftId?: string; giftName?: string; minCount?: number };
  action: 'spawn_prop' | 'heart_burst' | 'cinematic' | 'seat_reaction' | 'audience_cheer';
  effectAssetId: string;
  soundId?: string;
  priority: 'low' | 'normal' | 'high';
  cooldownMs: number;
  maxDurationMs: number;
  enabled: boolean;
}
```

**Streak semantics:**

- Với provider báo **cumulative count** (ví dụ 1,2,3,4), không cộng lại 1+2+3+4 (sai).
- Với stream có `transactionId`, `repeatEnd`, `streakId`, quy đổi thành delta hoặc chỉ finalize theo key chuẩn.
- Nếu không đủ thông tin, hiển thị một popup “xN” ở final và không kết luận giá trị quy đổi.
- Quà duplicate có cùng event ID sẽ không render/tính hai lần.

## 6.4 Ưu tiên và bảo vệ trải nghiệm xem

- P0: màn hình chiếu không bị overlay che quá 10% diện tích trong sự kiện thường.
- P1: khán giả + bong bóng thoại, reactions xuất hiện ở khu vực ghế.
- P2: gift hiếm có thể hiện cinematic tối đa 2–3 giây, có giới hạn tần suất và có option tắt.
- Hiệu ứng gift có thể chờ queue; ưu tiên cao có thể preempt low priority nhưng không làm mất dữ liệu tổng kết.
- Nút **Quiet Mode**: tắt phần lớn popups, chỉ giữ chat/gift log.

---

# 7. Rendering & Animation Pipeline

## 7.1 Render stack

- React render DOM control panels, forms, chat, overlays ít chuyển động.
- PixiJS render khán giả, VFX, nền trang trí động; `Canvas` một hoặc hai layer.
- Stage video là native `<video>` / HLS hoặc transparent overlay tùy mode.
- `RequestAnimationFrame`/ticker cho animation; không setState React mỗi frame.
- Tách event ingestion rate khỏi render frame rate (batch messages & reducer).

## 7.2 Asset guidelines

- Mục tiêu initial app shell <= 3–5 MB gzip (ngoại trừ media do người dùng chọn); sprites tải lazy.
- Mỗi nhân vật có 8 animation quan trọng; dùng WebP/AVIF atlas nếu trình duyệt và renderer hỗ trợ, kiểm tra fallback.
- Khuyên có 12 mẫu avatar + biến thể tóc/màu đủ để nhìn không quá trùng lặp.
- Asset phải tự tạo/cấp phép hợp lệ; không dùng nhân vật, logo, mô hình hay biểu tượng độc quyền của LoL/Arcane.
- Màn hình chiếu không embed ảnh nhân vật/bộ phim có bản quyền làm ảnh demo mặc định.

## 7.3 Hoạt ảnh

| Animation | Duration đề xuất | Logic |
|---|---:|---|
| enter / walk to seat | 1.2–2.0s | Viewer vừa được gán ghế |
| sit | 0.5s | Chuyển sang occupied |
| idle | 3–8s loop | thở/chớp mắt/uống nước |
| talk | 1.2–2.0s | bong bóng chat |
| like/reaction | 0.6–1.2s | throttled |
| gift normal | 1.0–2.0s | particle nhẹ |
| gift cinematic | ≤3.0s | priority, quota |
| sleepy | loop | khi inactive |
| exit | 0.8–1.5s | manual leave / reclaim |

## 7.4 Hiệu năng mục tiêu

- Target 60 FPS tại 1920×1080 trên máy desktop phổ thông; **chấp nhận graceful degrade về 30 FPS** khi quá tải.
- P95 thời gian từ lúc **browser nhận event hợp lệ** tới UI phản hồi: < 500ms khi tải bình thường; không tính độ trễ TikTok/provider/network.
- 12 avatar luôn render ổn định; không rerender toàn bộ React tree vì mỗi like.
- Batching 100–1000 like events thành một hiệu ứng tổng hợp, không tạo 1000 sprites.
- Giới hạn particle hiện đồng thời, auto quality fallback dựa theo FPS.
- Theo dõi memory/session dài 2–4 giờ; cleanup Object URLs, event subscriptions, audio nodes, sockets, texture cache phù hợp.

---

# 8. Kiến trúc FE-only và multi-window

## 8.1 Thành phần

```text
TikTok LIVE ──► 3rd-party Event Provider
                      │  WebSocket
                      ▼
              Connection Manager
                      │
              Event Normalizer
                      │
           Validation / Dedup / Queue
                      │
             App Event Dispatcher
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      SeatManager  ChatManager  GiftManager
          └───────────┼───────────┘
                      ▼
                 Zustand Store
                  │       │
                 DOM    PixiJS Stage
                  └── Live Canvas

Setup Form ─► Settings Store ─► IndexedDB (no secrets)
```

## 8.2 Đề xuất mô hình runtime v1

**Mặc định:** Một cửa sổ trình duyệt duy nhất chạy `/live`; trong Live Mode có hotkey mở control drawer nổi, ẩn drawer khi capture. Streamer dùng Window Capture để đưa cửa sổ này vào phần mềm phát sóng. Cách này giảm rủi ro mất sync giữa cửa sổ.

**Nếu dùng Browser/Link Source riêng:** phải xem browser source và setup panel là **hai browsing contexts có thể cô lập**. Không cam kết cùng localStorage, IndexedDB, BroadcastChannel hoặc SharedWorker (tùy origin/engine/policy), nên cần POC thực tế trước khi chốt điều khiển xuyên cửa sổ.

Phương án tùy chọn sau v1:

- Nếu cả hai cửa sổ là cùng origin/browser và hỗ trợ, thử `BroadcastChannel` hoặc `SharedWorker` + leader election, test môi trường đích.
- Nếu khác process/origin, muốn đảm bảo control độc lập có thể phải dùng local bridge (một service) → **vi phạm FE-only tuyệt đối**, chỉ triển khai khi người dùng đồng ý đổi phạm vi.
- Cách không backend: browser source tự kết nối provider bằng key/token riêng và đọc preset import trước khi Go Live; không kỳ vọng realtime admin controls bên ngoài đồng bộ tức thì.

## 8.3 Persistence

**IndexedDB** lưu: layout, theme, seat policy, animation/gift mapping, volume, allowed moderation settings, thời điểm lưu. Không lưu secret API Key mặc định. Có thể lưu snapshot session khi crash/reload nhưng phải đánh dấu stale.

**Export JSON**: có `schemaVersion`, `appVersion`, `createdAt`, `settings`, `giftRules`, `seatLayout`; không chứa secret, raw chats hoặc tài khoản cá nhân trừ khi người dùng chủ động yêu cầu và cảnh báo.

**Import JSON**: validate Zod, size limit 1 MB hoặc hợp lý, migration nếu version cũ, preview diff và cho undo.

## 8.4 Security & privacy

- Mặc định chỉ mở địa chỉ loopback `127.0.0.1` bằng dev server; không bind `0.0.0.0` không kiểm soát.
- Không mở rộng remote control từ internet nếu không có auth/bảo vệ mạng.
- Không log hoặc export API Key, JWT, cookies và signature.
- Tránh giữ toàn bộ lịch sử chat TikTok; v1 chỉ lưu 200–500 message trong RAM và không persist mặc định.
- Cho phép hide nickname/avatar khi người xem yêu cầu hoặc streamer cần kiểm duyệt.
- URL ảnh/avatar TikTok tải từ bên thứ ba cần kiểm tra chính sách và fallback, tránh render bằng `innerHTML`.
- Quà tặng/like là dữ liệu tương tác, không phải giá trị doanh thu xác thực nếu provider không cung cấp thông tin đáng tin cậy.
- Không đưa text chat thô vào canvas mà không sanitize/limit length.

---

# 9. Tech Stack và cấu trúc repo

## 9.1 Stack khóa cho v1

| Layer | Tech | Lý do |
|---|---|---|
| App | React + TypeScript | reusable, tốt cho config UI |
| Build | Vite | nhanh, local-first |
| Styling | Tailwind + shadcn/ui | form, tabs, dialog, theme |
| Realtime | Native WebSocket | kết nối provider không cần tự host WS |
| State | Zustand | tránh rerender thừa, reducers rõ ràng |
| Storage | Dexie/IndexedDB | local presets, migrate |
| Rendering | PixiJS | hiệu ứng/avatars 2D mạnh và hiệu quả |
| Media | HTMLVideoElement + HLS.js | local/direct/HLS hợp pháp |
| Schema | Zod | guard provider payload và settings |
| Audio | Howler.js hoặc Web Audio API | music/SFX, mute |
| Unit | Vitest | logic seat and events |
| E2E | Playwright | Setup→Preview→Live smoke |

## 9.2 Folder structure

```text
viewing-party-live/
├── public/
│   ├── backgrounds/{cinema-classic,cinema-fantasy,neon-esports}/
│   ├── characters/{atlases,portraits}/
│   ├── decorations/
│   ├── effects/
│   └── audio/{ambient,sfx}/
├── src/
│   ├── app/{App.tsx,router.tsx,providers.tsx}
│   ├── pages/{SetupPage,PreviewPage,LivePage}
│   ├── features/
│   │   ├── providers/{types,MockProvider,TikFinityProvider,TikToolsProvider}
│   │   ├── events/{normalize,validate,dedupe,dispatcher,queue}
│   │   ├── seats/{seat.model,seat.reducer,seat.selectors,SeatGrid}
│   │   ├── chat/{parser,moderation,ChatRail}
│   │   ├── gifts/{gift.model,gift-streak,GiftMapping,GiftVFX}
│   │   ├── theater/{TheaterStage,MediaSurface,StageDecor}
│   │   ├── characters/{CharacterRenderer,animation-state,atlas-loader}
│   │   ├── session/{session.store,connection.store}
│   │   └── setup/{SetupWizard,forms,SetupTabs}
│   ├── shared/{components,config,utils,types}
│   ├── storage/{db,migrations,import-export}
│   ├── styles/
│   └── main.tsx
├── tests/{unit,integration,e2e,fixtures}
├── docs/{PRD.md,PROVIDER_INTEGRATION.md,QA_CHECKLIST.md}
├── package.json
├── vite.config.ts
└── README.md
```

## 9.3 Luật code

- Không hardcode bất kỳ secret nào trong repo.
- Provider adapter không được import React components.
- UI không trực tiếp xử lý raw WebSocket payload; chỉ nhận NormalizedEvent/state.
- SeatManager là single source of truth; không cho một viewer chiếm 2 ghế.
- Mọi effect phải có cleanup (timeout, listener, texture, sound).
- Mọi setInterval/setTimeout phải hủy khi unmount hoặc session end.
- Đảm bảo reduced motion, error boundary, no animation over the central screen by default.
- Viết test cho logic nghiệp vụ trước khi polish art.

---

# 10. Non-functional requirements

| ID | Yêu cầu | Chỉ tiêu |
|---|---|---|
| NFR-01 | Availability | UI xem phim không crash dù provider disconnect 5 lần |
| NFR-02 | Performance | 60 FPS mục tiêu / 30 FPS degrade tại 1080p |
| NFR-03 | Responsiveness | Layout 16:9 tốt, 9:16 portrait preset ở P2 |
| NFR-04 | Recoverability | reconnect giữ ghế, không double gift |
| NFR-05 | Security | không persist secret mặc định, không script injection |
| NFR-06 | Testability | tất cả event core phát được từ Mock Provider |
| NFR-07 | Usability | người ít code setup bằng GUI trong một phiên |
| NFR-08 | Observability | thấy trạng thái socket, lỗi, event raw/normalized redacted |
| NFR-09 | Compatibility | Chrome/Edge desktop ưu tiên; Firefox/Safari test có giới hạn |
| NFR-10 | Privacy | không lưu raw chat và danh tính người xem dài hạn mặc định |
| NFR-11 | Accessibility | keyboard navigation, contrast, reduced motion/flash |
| NFR-12 | Copyright | assets gốc/có giấy phép, nội dung chiếu có quyền sử dụng |

---

# 11. Kế hoạch triển khai / Backlog ưu tiên

## Sprint 0 — Technical POC (bắt buộc)

- [ ] Bootstrap Vite, React, TS, lint, Vitest, Playwright.
- [ ] Tạo một trang WS Diagnostics cho 3 providers; có mock fallback.
- [ ] Test kết nối TikFinity local trên Windows (nếu dùng Windows); kiểm tra schema `roomUser` là count.
- [ ] Test TikTools trên browser từ Ubuntu, CORS/auth/key policy, tài khoản đang livestream thật.
- [ ] Capture sanitized payload examples của `member`, `chat`, `gift` (streak), `like`, `social`, `roomUserSeq`, `control`.
- [ ] Kiểm tra quyền và cách thêm Browser Source/Window Capture trên phiên bản LIVE Studio/OBS đang dùng.
- [ ] Quyết định runtime mode v1: single-window vs source overlay.

**Gate:** nếu provider không nhận được join thì v1 vẫn có `!join`. Nếu provider không kết nối được qua browser ở môi trường user, giữ Mock và chọn provider khác; không âm thầm thêm BE khi chưa có đồng ý.

## Sprint 1 — Core Shell + Studio Setup (P0)

- [ ] Layout scene 16:9, viewport scale, header, left panel, right chat rail, bottom seats.
- [ ] Setup Wizard bằng GUI, settings store, import/export JSON có schema.
- [ ] Live & Preview routes, trạng thái connection.
- [ ] Media source placeholder, local video, HLS direct và mode external composition.
- [ ] Mock provider control panel; event inspector.

**Done:** không cần TikTok vẫn xem được rạp chiếu có 12 slot, chạy mock events và vào Live Mode.

## Sprint 2 — TikTok Event Pipeline (P0)

- [ ] Provider interface, connection manager, reconnect, handshake/state.
- [ ] Implement TikFinity adapter trên schema đã xác minh.
- [ ] Implement TikTools adapter trên schema đã xác minh.
- [ ] Normalize/validate, dedupe, counters, sanitization.
- [ ] Diagnostic labels cho `UNKNOWN`, `WAITING_FOR_LIVE`, `CONNECTED`, `RECONNECTING`.

**Done:** nhận chat/gift/like từ 1 LIVE thật ít nhất 15 phút mà không crash.

## Sprint 3 — 12 Seat Manager (P0)

- [ ] Occupancy reducer, idempotency, locking, queue + TTL.
- [ ] `!join`, `!leave`, `!seat N` command parser, cooldown.
- [ ] Auto Seat dựa trên `member` khi adapter có capabilities.
- [ ] Inactive status và manual reclaim, admin override.
- [ ] Persist snapshot chỉ với stale marker.

**Done:** test tranh chấp 100 viewer/12 ghế, không trùng seat, không auto kick theo viewer count.

## Sprint 4 — Chibi Art/Animation + Gift UX (P1)

- [ ] 12 nhân vật chibi gốc + 8 trạng thái animation.
- [ ] PixiJS renderer, reaction bubbles, cue sound, safe VFX.
- [ ] Gift mapping editor + streak settlement + priority queue.
- [ ] Theme rạp chiếu phim cổ điển fantasy + ambient sound.
- [ ] Reduced motion, performance quality control.

**Done:** sau khi nhận gift, có hoạt ảnh phù hợp mà không che màn chiếu chính quá lâu.

## Sprint 5 — Streamer Production Mode (P0/P1)

- [ ] Window Capture mode, full-screen/safe-area, hide controls.
- [ ] OBS/LIVE Studio setup guide bên trong app, copy URL và check list.
- [ ] Mute-all, quiet mode, pause reactions, reset session.
- [ ] Errors/reconnect overlay tinh gọn, không lộ key/debug trong capture.
- [ ] Test 2–4h giả lập và test 1 phiên LIVE thực tế với provider.

**Done:** có thể Go Live theo hướng dẫn UI không cần chỉnh source code.

## Sprint 6 — Stabilization (P1)

- [ ] Profile FPS/memory và batching.
- [ ] Fix font tiếng Việt, asset cache, media object cleanup.
- [ ] Test restore browser reload, session reset, importer migration.
- [ ] Accessibility / privacy / safety review.
- [ ] Release README, user guide, release notes, test report.

---

# 12. Test Plan / QA Matrix

## 12.1 Functional test cases

| Test ID | Scenario | Expected |
|---|---|---|
| TC-001 | Vào app lần đầu | Wizard mở, không crash, có Demo Mode |
| TC-002 | Setup thiếu TikTok username | Chặn Connect thật, hiển thị validation |
| TC-003 | TikFinity không mở | Timeout rõ ràng, không block UI |
| TC-004 | TikTools key sai | Hiển thị auth error, redact key |
| TC-005 | Provider không có join | Cho command `!join` dùng bình thường |
| TC-006 | 2 `member` trùng viewer | Chỉ cấp 1 ghế |
| TC-007 | 100 viewer / 12 ghế | 12 occupied tối đa, còn lại queue nếu có yêu cầu |
| TC-008 | `!seat 4` ghế locked | Từ chối, không chiếm/đè ghế |
| TC-009 | `!leave` | Ghế trống, tự chuyển queue candidate |
| TC-010 | Viewer count giảm 100→1 | Không tự xóa ghế |
| TC-011 | Viewer im lặng 5 phút | Trạng thái inactive, không auto kick ở default |
| TC-012 | Mất kết nối 30s | Giữ ghế, state reconnect, tự retry |
| TC-013 | Reconnect gift duplicate | Không tính/render gấp đôi |
| TC-014 | Gift streak 1,2,3,4 final | Settle x4, không tính tổng x10 |
| TC-015 | 1000 likes trong 2s | Aggregate effect, FPS ổn định |
| TC-016 | Chat chứa HTML/script | Hiện text thuần, không chạy script |
| TC-017 | URL HLS bị CORS block | Hiển thị fallback có thông báo hữu ích |
| TC-018 | Local video reload trang | Không âm thầm yêu cầu quyền file, hiện chọn lại file |
| TC-019 | Export preset | Không có API Key/JWT/raw chat |
| TC-020 | Import config lỗi | Báo lỗi schema, dữ liệu cũ giữ nguyên |
| TC-021 | Live mode fullscreen | Không thấy admin/debug và nội dung vẫn tỷ lệ đúng |
| TC-022 | Kết thúc LIVE | Không hiểu disconnect là confirmed end nếu chưa xác nhận |
| TC-023 | Reduced motion | Có giảm VFX, không flash mạnh |
| TC-024 | App running 4h mock | Không memory leak rõ rệt, không treo |

## 12.2 Load scenarios

- **Light:** 12 seated, 1–3 chat/s, 5 likes/s, 1 gift/min.
- **Normal:** 12 seated, 10 chat/s, 50 likes/s, 5 gifts/min.
- **Peak:** 100+ incoming events/s, 1000 likes batch, 20 gifts trong 10s; hệ thống được phép drop/gộp cosmetic events nhưng không lỗi seat semantics.
- **Soak:** 2–4 giờ, reconnect nhiều lần, media playback liên tục.

## 12.3 Definition of Done chung

- Typecheck, lint, unit, E2E critical paths pass.
- Không có blocker severity cao về key leak, duplicate seats, crash media, mất state.
- Test assets/pictures/streamer scene ở 1920×1080 và portrait crop test.
- Có ít nhất một biên bản xác minh provider trên LIVE thật, ghi event types thật sự thấy.
- README giải thích setup bằng 3–5 bước rõ ràng, không yêu cầu người dùng sửa code.

---

# 13. User stories & tiêu chí nghiệm thu

## US-01 — Là streamer, tôi muốn cấu hình provider bằng UI

**Given** trang setup đã mở, **When** tôi chọn provider và nhập thông tin, **Then** trang hiển thị trạng thái kết nối, capabilities, các cảnh báo và nút thử, không bắt tôi sửa `.env`/source.

## US-02 — Là streamer, tôi muốn preview trước khi Go Live

**Given** chưa có TikTok LIVE thật, **When** tôi kích hoạt Mock Provider, **Then** tôi xem đủ hiệu ứng 12 ghế, chat, quà, like và khung video để xác nhận layout.

## US-03 — Là viewer, tôi muốn tham gia ghế qua chat

**Given** ghế còn trống, **When** tôi comment `!join`, **Then** avatar chibi mang tên tôi vào ghế duy nhất trong thời gian ngắn sau khi event tới web.

## US-04 — Là viewer, tôi muốn rời ghế

**Given** tôi đang ngồi, **When** comment `!leave`, **Then** avatar đứng lên, ghế trống và người chờ tiếp theo có thể được vào.

## US-05 — Là streamer, tôi muốn không bị mất ghế khi mất mạng

**Given** app đang có ghế, **When** provider disconnect, **Then** UI giữ ghế, hiện reconnect; không giả định viewer rời và không reset session.

## US-06 — Là viewer, tôi muốn gift có phản ứng rõ

**Given** gift tương ứng với mapping, **When** gửi gift, **Then** xuất hiện VFX / nhân vật phản ứng, đồng thời không làm che nội dung trên màn hình chính quá lâu.

## US-07 — Là streamer, tôi muốn Go Live không lộ thông tin cá nhân

**Given** tôi đã cấu hình key, **When** mở `/live`, **Then** UI không chứa API Key, debug panel, raw network payload hoặc secret trong stream capture.

## US-08 — Là QA, tôi muốn tái hiện bug từ log

**Given** tôi có event fixture đã scrub, **When** import/replay fixture, **Then** hệ thống tái hiện seat state và gift flow quyết định mà không cần kết nối TikTok thật.

---

# 14. Rủi ro / Decision Log

| ID | Rủi ro | Mức | Cách xử lý |
|---|---|---:|---|
| R-01 | TikTok không cho join event đầy đủ | High | `!join` fallback, capability detection |
| R-02 | Không có leave event cá nhân | High | manual/opt-in inactive reclaim, thông báo minh bạch |
| R-03 | Third-party provider thay đổi schema/giá | High | adapters, fixtures, abstraction, mock |
| R-04 | Key xuất hiện trong frontend | High | BYOK local only, RAM only, redact, không đưa lên stream |
| R-05 | Studio browser source không chung storage | High | single-window default, POC cho multi-context |
| R-06 | Video URL bị CORS/DRM | High | external composition, legal source & error fallback |
| R-07 | Gift streak double count | High | transaction/streak-aware settlement + tests |
| R-08 | Quá nhiều particles gây lag | Medium | pool, aggregate, dynamic quality |
| R-09 | Nội dung chat độc hại | Medium | sanitize, filter, mute, hide |
| R-10 | Asset/film bản quyền | High | original art và chỉ chiếu nội dung có quyền |
| R-11 | Provider unavailable khi streamer chưa LIVE | Medium | Mock Preview, `WAITING_FOR_LIVE`, hướng dẫn rõ |
| R-12 | Port/provider blocked trên Ubuntu/Firewall | Medium | connection diagnostics & alternative provider |

**Decisions đã chốt:**

- D-001: Concept rạp chiếu phim, không phải chùa — **FINAL**.
- D-002: Không xây game combat — **FINAL**.
- D-003: FE-only, local-first — **FINAL**.
- D-004: 12 ghế 2×6, màn chiếu lớn trung tâm — **FINAL**.
- D-005: Không cam kết leave event chính xác — **FINAL**.
- D-006: Đề xuất Single-window Capture cho v1 — **RECOMMENDED**.
- D-007: Multi-provider support TikFinity/TikTools + Mock — **RECOMMENDED**.
- D-008: `!join` fallback; không cần member event để hệ thống hoạt động — **FINAL**.
- D-009: Tab Setup Wizard làm trước VFX nâng cao — **RECOMMENDED**.

---

# 15. Hướng dẫn chạy local / Setup mẫu

Yêu cầu: Node.js LTS, npm, Chrome/Edge desktop; hệ điều hành Ubuntu hoặc Windows.

```bash
npm install
npm run dev
# truy cập http://localhost:5173/setup
```

**Lưu ý:** đây là lệnh *dự kiến* cho repo sau khi triển khai. Tài liệu này là bản đặc tả, **chưa chứa source app hoàn chỉnh**.

### Quy trình cho streamer

1. Mở website → chọn provider Mock để xem demo; hoàn thành setup.
2. Khi muốn nhận dữ liệu thật, chọn TikTools (Ubuntu/đa nền tảng) hoặc TikFinity Desktop (máy Windows có app hỗ trợ).
3. Kiểm tra chat/gift/membership events trong Diagnostics.
4. Chọn media source hoặc sử dụng layer capture game từ OBS/Studio.
5. Vào Live Mode → add Window Capture/Browser Source theo cách phù hợp → xem Preview → tự bấm Go Live trong phần mềm livestream.

### Khuyến nghị nguồn hình

- **Đơn giản nhất:** một tab/cửa sổ web duy nhất phát nội dung, render ghế/chat, Window Capture.
- **Dành cho game capture:** phần mềm livestream ghép 1 layer game window + 1 layer rạp overlay trong suốt; nếu cần sửa cấu hình đồng thời từ UI riêng, phải kiểm thử cơ chế đồng bộ multi-window.

---

# 16. Bộ yêu cầu sẵn để giao cho Claude Code / Codex

## 16.1 Nguyên tắc triển khai

1. Đọc toàn bộ tài liệu trước khi code; chốt cấu trúc kiến trúc.
2. Triển khai từng sprint, nhưng mọi sprint phải chạy demo được.
3. Không tự thêm Backend/Database Server bất kể lý do gì mà không hỏi chủ dự án.
4. Dùng MockProvider để phát triển; không phụ thuộc LIVE thật trong CI.
5. Mọi event schema của TikFinity/TikTools phải căn cứ docs + fixtures thực tế; không bịa field.
6. Luôn giữ màn hình chiếu là trọng tâm, ghế chỉ chiếm khu audience.
7. Không sử dụng art/logo/champions của League of Legends, Arcane hoặc phim làm asset mặc định.
8. Không có combat. Không chuyển concept sang chùa.
9. Tất cả features phải có control setup bằng UI (không yêu cầu owner sửa code).
10. Không tự tuyên bố “production 100%” nếu chưa qua LIVE real-provider test.

## 16.2 Backlog issue starter

- `VP-001` Initialize repo + quality gates
- `VP-002` Main cinema layout at 1920×1080
- `VP-003` Setup Wizard and settings migration
- `VP-004` Mock event generator & Diagnostics
- `VP-005` Provider interface + connection manager
- `VP-006` TikFinity adapter + verified sample payloads
- `VP-007` TikTools adapter + verified sample payloads
- `VP-008` Event normalization + dedupe + streak
- `VP-009` SeatManager reducer 12 slots + queue
- `VP-010` Chat command parser and moderation
- `VP-011` PixiJS characters & animation state machine
- `VP-012` Gift mapping and effect queue
- `VP-013` Stage media/local video/HLS/external overlay
- `VP-014` Live Mode, clean capture, keyboard controls
- `VP-015` Performance soak + live provider QA
- `VP-016` Release docs and usability polish

## 16.3 Tổ chức nghiệm thu theo mốc

**Milestone A — Working Mock Demo:** rạp + 12 ghế + video + chat + gifts giả lập + setup UI chạy được local.

**Milestone B — Actual LIVE Data:** kết nối thành công provider thật, mapping chat/gift/like và join event nếu provider hỗ trợ; danh sách hạn chế rõ ràng.

**Milestone C — Streaming Ready:** capture được qua OBS/LIVE Studio, ổn định trong buổi live thử, không lộ secret, UI gọn và không chặn nội dung chính.

---

# 17. Câu hỏi cần POC (không chặn thiết kế chung)

1. Máy livestream chính sẽ chạy Windows với TikTok LIVE Studio hay Ubuntu với OBS? Điều này chỉ thay đổi **provider và cách capture**, không thay đổi app core.
2. TikTools key/gói hiện tại hỗ trợ browser WebSocket và loại sự kiện nào trên tài khoản streamer thực tế?
3. TikFinity Desktop phát `roomUser` là dạng nào trên máy livestream? Có event join độc lập không? Mặc định **không giả định có**.
4. Muốn màn chiếu phát video từ chính website, hay ghép game/video window từ OBS? Cần hỗ trợ cả hai; ưu tiên mode phổ biến nhất để tối ưu UI.
5. Có dùng Browser Source riêng và Setup đồng thời không? Nếu có, thử nghiệm đồng bộ trước; không thêm BE tự động.
6. Có cần chế độ 9:16 TikTok portrait ngoài 16:9? Đề xuất P2 sau MVP.

---

# 18. Tài liệu nguồn và mức độ xác minh (03/11/2026)

| Nguồn | Nội dung được dùng | Mức tin cậy |
|---|---|---|
| https://tikfinity.zerody.one/tiktok/actionsandevents | Event API WebSocket `ws://localhost:21213/`, danh sách event types | Tài liệu nhà cung cấp, cần test phiên bản app |
| https://tik.tools/docs | Cloud WS endpoint, auth API key/JWT, `member`, `gift`, `chat`, `like`, event shapes | Tài liệu nhà cung cấp, yêu cầu xác minh gói + event thực |
| https://tik.tools/guides/tiktok-live-websocket | Loại event, `roomUserSeq`, `social`, `control`, `member` | Tài liệu nhà cung cấp, có thể thay đổi |
| https://developers.tiktok.com/docs/en/webhooks-events | TikTok official developer webhook event descriptions | Chính thức nhưng không khẳng định cung cấp public realtime LIVE chat/gift API |
| https://developers.tiktok.com/docs/en/webhooks-overview | Official webhooks cần endpoint HTTPS nhận POST; không phù hợp FE-only local | Chính thức |

**Giới hạn kiểm chứng:** Tài liệu này dựa trên tài liệu công khai và thiết kế kỹ thuật, **chưa thử nghiệm TikTok LIVE thực tế trên máy của chủ dự án**. Mọi khả năng phụ thuộc provider, phiên bản phần mềm, tài khoản hoặc region cần đánh dấu POC trước khi tuyên bố hoàn thiện.

---

# 19. Phụ lục — Minh họa concept và cách dùng tài liệu

**Concept artwork (đính kèm trong gói ZIP):** `viewing_party_live_concept.png`. Ảnh chỉ là **moodboard/visual reference**, không phải pixel-perfect UI, không phải nguồn icon/logo chính thức, không phản ánh sự kiện API thực tế. Khi thiết kế final phải giữ bố cục gốc và giảm những nội dung gây phân tán khỏi màn chiếu.

**Đề xuất dùng với agent:** gắn file `.md` này vào repo như `docs/VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md`, yêu cầu agent đọc đầy đủ trước khi tạo branch và triển khai Sprint 0→5. Mỗi pull request cập nhật checklist tương ứng, docs provider fixtures và test results. Đối với UI, lấy ảnh concept để thống nhất phong cách rạp phim chibi RPG; không dựng theme chùa.

**KẾT THÚC TÀI LIỆU — VIEWING PARTY LIVE STUDIO v1.0**

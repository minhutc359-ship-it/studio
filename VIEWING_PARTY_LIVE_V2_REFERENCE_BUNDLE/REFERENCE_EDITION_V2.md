# VIEWING PARTY LIVE STUDIO V2.0 — REFERENCE EDITION (90/10)

**Cập nhật:** 04/11/2026  
**Tài liệu:** Product/UI/Engineering upgrade specification; dùng kèm PRD & Technical Spec v1.0.  
**Tham chiếu:** https://t1win.online/ (tiêu đề được xác nhận khi truy cập: *Viewing Party Online*).  
**Quy ước 90/10:** 90% là **mục tiêu tương đồng trải nghiệm** sau khi kiểm tra bằng hình ảnh/trình duyệt; 10% là phần tạo dấu ấn riêng. Không phải kết quả kiểm định hiện tại.  
**Giới hạn bằng chứng:** Trang tham chiếu tải giao diện động; công cụ duyệt chỉ xác nhận trang và tiêu đề, **chưa trích xuất được cấu trúc DOM, CSS, screenshots hay chức năng chi tiết**. Vì thế tài liệu dưới đây phân biệt *yêu cầu định hướng* với *chức năng đã đối chiếu*, và không khẳng định một tính năng cụ thể có trên website tham chiếu khi chưa kiểm chứng.

> **Product lock:** Viewing Party LIVE dạng **rạp chiếu phim**, tuyệt đối không phải concept chùa, không có combat. Màn hình live/video/game nằm giữa; **12 ghế chibi (2 × 6)** phía dưới; hai sidebar là hành động/quà và chat. **Chạy local, FE-only** và nhận sự kiện TikTok qua provider bên thứ ba khi nhà cung cấp cho phép.

---

## A. Những gì thay đổi so với phiên bản 1.0

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

## B. Reference fidelity — hiểu đúng mục tiêu “90% giống”

### B.1 Bản đồ tương đồng mục tiêu

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

### B.2 Acceptance cho yêu cầu 90/10

- Có **reference audit sheet** liệt kê màn hình, kích thước viewport, widget, interaction, screenshot source, nhận xét khác biệt.
- Có **side-by-side visual regression** ở 1920×1080 và 1080×1920; ảnh nền/quyền sở hữu của site tham chiếu không được đóng gói vào sản phẩm.
- Trước khi tuyên bố **đạt 90%**, phải đo trên rubric B.1 dựa trên bằng chứng. Không chấp nhận tự gán điểm.
- Không triển khai logic betting/casino, nạp tiền, thanh toán hoặc mô phỏng nội dung không liên quan tới Viewing Party chỉ vì tên domain gây liên tưởng.

---

## C. Thiết kế giao diện chi tiết

### C.1 Cấu trúc màn hình chuẩn (1920 × 1080)

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

### C.2 Color and UI system

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

### C.3 Components và states

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

### C.4 UI State Matrix

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

### C.5 Quy tắc chuyển động

- Avatar idle: 4–8s random blink, nhỏ gọn, không liên tục phát animation toàn thân.
- `join`: 0.5–0.9s chạy tới ghế, 0.2s chào, ngồi xuống.
- `chat`: bubble 2.5–4s, giới hạn 2 dòng, loại bỏ HTML, không render emoji lạ gây layout shift.
- `like`: react 0.5–0.8s với aggregation; không tạo mỗi like một sprite.
- `gift`: small 1.3–1.8s; medium 2–3s; large 3–4.5s, không chặn playback.
- `leave`: 0.6–1s đi ra; chỉ khi người dùng gõ `!leave`, admin remove hoặc rule seat reclaim kích hoạt.
- Reduced motion: disable screen shake, shorten particle count, retain essential state change.

---

## D. Streamer Studio UX — phải dùng được mà không biết code

### D.1 Routes

- `/setup` — wizard + workspace, là route mở đầu mặc định.
- `/preview` — preview fullscreen có toggle `Mock/Real`; không hiển thị key.
- `/live` — presentation canvas để Window Capture hoặc Browser Source.
- `/diagnostics` — realtime log và provider health (ẩn khỏi stream).
- `/assets` — quản lý avatar/background/effects (dữ liệu được lưu local).

### D.2 Wizard 5 bước

| Bước | Người dùng nhập/chọn | Kiểm tra | Kết quả |
|---|---|---|---|
| 1. Nguồn sự kiện | Mock / TikFinity / TikTools, username | Schema, khả năng dùng trên browser, kết nối | Status + capabilities |
| 2. Nguồn hình | Local file / stream URL / Transparent / Poster | CORS, HLS, autoplay, kích thước | Preview với fallback |
| 3. Khán giả | 12 ghế, join mode, waitlist, inactive policy | Không trùng seat ID, không tự suy ra leave | Seat simulator |
| 4. Giao diện | Theme, 16:9/9:16, font, effect quality | Contrast, safe-zone, fps estimate | Fullscreen preview |
| 5. Kiểm thử & Go Live | Mock event pack, kiểm tra checklist | Health status và quyền phát hình | `Vào Live Mode` |

### D.3 Preview Studio

- Left settings 280–320px; center live 16:9/9:16 frame; right event inspector 280px.
- Click một ghế mở Seat Inspector: avatar, khóa/mở, assign mock viewer, remove, pin, priority.
- Click video screen mở Source Inspector; chỉnh scale, fit/crop, position, mute, background.
- Thử một gift bằng nút `Play effect`; thay đổi cấu hình có thể Undo/Redo trong phiên.
- Có `Save preset`, `Duplicate`, `Restore defaults`, `Export JSON`, `Import JSON` và snapshot trước live.
- Không cho API key vào export; nếu key được nhớ chỉ lưu session-memory bằng mặc định.

### D.4 Pre-Go-Live readiness checklist

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

## E. Data integration: TikTok realtime, chính xác về khả năng

### E.1 Event architecture

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

### E.2 Join / Leave rules

**Cốt lõi:** `member_join` nếu provider có; command `!join` luôn được hỗ trợ. Không được dùng `viewerCount` giảm để kết luận một `userId` cụ thể đã rời.

State machine cho một slot:

`EMPTY → RESERVED → OCCUPIED → INACTIVE_CANDIDATE → (OCCUPIED | RECLAIMED) → EMPTY`

- `RESERVED`: set nickname/avatar và giữ ghế khi animation join đang chạy; 5s timeout nếu animation lỗi.
- `OCCUPIED`: nhận event chat/gift/like -> update `lastSeenActivity`, **không phải lastSeenInRoom**.
- `INACTIVE_CANDIDATE`: chỉ dựa vào chính sách tương tác; vẫn ghi rõ **không xác nhận viewer đã out**.
- `RECLAIMED`: admin hoặc seat policy tự thay thế; log reason và cooldown.
- `LOCKED`: ghế bị khóa, không auto-assign, không auto-reclaim.

Default v2: **`!join` ưu tiên**, cho phép bật Auto Join; **Auto Reclaim tắt mặc định** (hoặc bật theo threshold với disclaimer rõ). `!leave` hoặc admin Remove mới được coi là rời ghế chủ động. Reconnect giữ nguyên state đã có.

### E.3 Gift semantics

- Mapping theo `giftId` của provider, không theo chuỗi tên quà nhập thủ công khi thiếu ID.
- Gift combo/streak có thể là cumulative -> adapter phải chọn cách tính delta và dedup theo `(provider,eventId/streakId,userId)`.
- Nếu không phân biệt được, hiển thị **notification** nhưng không cộng điểm/lượt phát trùng.
- Không thêm nạp tiền/ví/coin nội bộ; gifts là sự kiện nhận từ TikTok.

### E.4 Error/reconnect

- Backoff 1s, 2s, 4s, 8s... giới hạn 30s với jitter; có nút reconnect manual.
- Cùng lúc tối đa 1 socket active/provider instance. Cleanup on unmount, split-brain prevention.
- Buffer 500 events / TTL 15s; drop/aggregate likes trước, không block chat/gift.
- Display `CONNECTED`, `CONNECTING`, `LIVE_WAITING`, `DISCONNECTED`, `AUTH_ERROR`, `UNSUPPORTED` riêng.
- Browser mixed-content / TLS / CORS WebSocket / WebSocket handshake issues phải có diagnostics dễ hiểu.

### E.5 Frontend-only limits

- **Không có backend riêng**, nhưng phụ thuộc nhà cung cấp TikTok event: desktop agent hoặc cloud relay.
- API key của provider trong browser không thể bảo mật tuyệt đối; nhập khi setup, không đưa vào Git hay URL.
- OBS/TikTok LIVE Studio browser source có thể **không chia sẻ IndexedDB/sessionStorage** với trình duyệt config. Trong bản v2, **Window Capture một runtime** được khuyến nghị. Nếu dùng 2 runtime, cần cách đồng bộ được kiểm chứng; không giả định BroadcastChannel hoạt động xuyên browser profile.
- Web app không thể tự phát hiện đầy đủ danh sách viewer rời phòng nếu provider không cấp sự kiện có định danh.

---

## F. 12 seats + viewer engagement

### F.1 Seat reservation priorities

1. Pinned VIP seat / moderator reserved seat (được người điều khiển cho phép).
2. Viewer gõ `!seat N` đến seat trống, nếu enabled.
3. Viewer `!join` → ghế trống thấp nhất hoặc seat ngẫu nhiên tùy config.
4. `member_join` auto assignment nếu Auto Join enabled và không bị spam-filter.
5. Room full → waitlist FIFO, optionally weighted by tenure **nhưng không ưu tiên nạp tiền trong web**.

Seat ID cố định 1–12, `userId` stable; mọi event phải idempotent. Một viewer không chiếm 2 ghế. Khi người ngồi chat/gift, effect phải định tuyến tới đúng ghế của họ.

### F.2 Chibi avatar library

- 6 avatar base gốc cho MVP, 12 model variants hoặc 6 avatar + skin/color/preset vẫn tạo cảm giác đa dạng.
- Tối thiểu 6 states: `idle`, `enter`, `sit`, `chat`, `cheer`, `leave`; optionally `sleep`, `gift`, `react`.
- Tên, avatar profile của người xem chỉ hiển thị theo event provider + policy privacy; có fallback `Khán giả #N`.
- Animation spritesheet/WebP/atlas (không dùng video cho mỗi avatar), animation pool và cache, preload trước stream.

### F.3 Quality tiers

| Tier | Target | Effects |
|---|---|---|
| Low | 30 FPS | 2D sprites, tối đa 200 particle, shadow giản lược |
| Balanced | 60 FPS kỳ vọng trên desktop phù hợp | 2.5D + effect batching, 600 particle |
| High | 60 FPS kỳ vọng trên máy mạnh | Lighting/bloom có giới hạn, 1.200 particle |

Luôn đo thực tế và tự giảm chất lượng khi FPS liên tục dưới ngưỡng, tránh làm ảnh hưởng video stream.

---

## G. Chat, quà, phản ứng và khả năng tương tác

### G.1 Chat commands mặc định

| Command | Action | Guard |
|---|---|---|
| `!join` | Join ghế trống / vào hàng đợi | cooldown 10s / user |
| `!leave` | Rời ghế và/hoặc hàng đợi | immediate |
| `!seat 1..12` | Xin ghế chỉ định | chỉ khi trống / không khóa |
| `!wave` | Nhân vật vẫy tay | 10s cooldown |
| `!heart` | Reaction trái tim | aggregate |
| `!help` | Hiện hướng dẫn ngắn | không spam chat overlay |

Các command được parse theo Unicode trim, case-insensitive, check boundary tránh bắt nhầm substring. `!join` hoạt động trong Mock Mode và khi Chat Event thật có data hợp lệ.

### G.2 Chat appearance

- Browser stream view hiển thị 8–14 messages + virtualized history; adjustable on Setup.
- Tin nhắn người đang ngồi hiển thị bubble trên avatar; người chưa ngồi chỉ ở chat panel.
- Gift/system message khác style chat thường và được rate-limit; không show raw provider payload.
- Nút Hide bad words, hide command spam, ban/mute local (chỉ ẩn trong web, không tự moderation TikTok nếu API không hỗ trợ).

### G.3 Visual Gift Tiers

| Tier | Rules | Animation | Max |
|---|---|---|---|
| Micro | like/low gift | chớp/heart ở ghế | aggregate 5s |
| Small | quà thường | sparkle quanh người gửi | 1.5s |
| Medium | mapped premium | seat aura + toast | 2.7s |
| Large | mapped major | cinema-light sweep + mini-stage | 4s |
| Showcase | chủ phòng chủ động chọn | cinematic tối đa 5s | 1 at a time |

Cài `maxConcurrentVFX` (mặc định 3), không làm tối nội dung video quá mức, không tắt audio nguồn chính, cho phép streamer mute SFX.

---

## H. Source manager — xem chung chứ không phải game riêng

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

## I. Performance, privacy & stream reliability

**Rendering budgets / mục tiêu đề xuất:** 1920×1080 và 1080×1920, video FPS không bị ảnh hưởng bởi avatar rendering; no frequent React rerender per every like. Chunk/lazy load tài nguyên; scene có max effect queue; sau 2h stress test bộ nhớ không tăng tuyến tính. Bundle JS được code-split; file asset cache sử dụng local runtime.

**Privacy:** không in event token/key vào console; không persist raw chat lâu dài mặc định; allow purge logs; tránh lưu avatar ảnh người xem không cần thiết; export preset không có username/key/TikTok auth; clear session dễ dùng.

**Safety:** nhận dữ liệu chat như untrusted input, escape HTML, không dùng `dangerouslySetInnerHTML`, không thực thi eval từ gift mappings, không tải script động từ provider không tin cậy. Không tạo chức năng thanh toán nội bộ hoặc nạp coin.

---

## J. Backlog triển khai V2.0 — ưu tiên

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

### J.1 Rollout plan

**Milestone 0 — Proof of Concept:** mock 12 seats, video/transparent, 16:9 + 9:16, live capture, no provider.  
**Milestone 1 — Studio & Event:** setup, mock testing, provider adapters, realtime chat/seat.  
**Milestone 2 — Polished Theater:** avatars, gift VFX, effects, audio, camera transitions.  
**Milestone 3 — Hardening & Ref Audit:** soak tests, real TikTok LIVE verification, reference screenshot audit, updated parity score.

---

## K. Test scenarios / Definition of Done

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

## L. Hướng dẫn cho AI coding agent (CLAUDE CODE / CODEX)

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

### L.1 Tài nguyên cần để đối chiếu đúng UI tham chiếu

Nếu cần kiểm định gần 90% thực tế, hãy bổ sung **ảnh full desktop**, **ảnh 9:16/phone**, **ảnh khi có người vào ghế**, **ảnh gift animation**, và **clip thao tác Setup → Live** của trang tham chiếu (chỉ để đối chiếu UI/behavior, không để chép asset). Khi đó lập bảng difference và chấm fidelity rubric B.1.

---

## M. Reference & evidence log

1. URL: https://t1win.online/ — xác nhận trả về trang có tiêu đề “Viewing Party Online” tại thời điểm tra cứu. HTML/JS UI không được trình truy xuất văn bản hiển thị đầy đủ; **chưa có ảnh DOM để xác minh feature parity**.
2. PRD hiện hành: `VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md` (v1.0, 03/11/2026) — base scope, event pipeline, seat manager, privacy.
3. Original owner sketch — 3 cột + 2 hàng × 6 ghế; đây là **user-supplied requirement**, không phải thiết kế của site tham chiếu.
4. Concept rạp chiếu chibi v1 — visual direction do dự án tự tạo, không lấy từ site tham chiếu.

**Ghi chú pháp lý thiết kế:** “Tham khảo 90%” ở đây áp dụng cho kiến trúc thông tin và tương tác chức năng. Không nên sao chép sát những chi tiết nhận diện có bản quyền/bảo hộ như logo, nhân vật, tranh minh họa, font độc quyền, nhãn hiệu, âm thanh hoặc source code của bên thứ ba.

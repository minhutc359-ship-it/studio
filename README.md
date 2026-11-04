# Viewing Party LIVE Studio

Ứng dụng frontend-only, local-first cho rạp xem chung 12 ghế. Bản MVP gồm Setup Studio, Preview/Live Canvas và Mock Provider để thử lệnh ghế, chat, quà, lượt thích và trạng thái reconnect.

## Chạy local

Yêu cầu Node.js LTS và npm.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal, thường là `http://localhost:5173/setup`.

```bash
npm test
npm run build
```

## Dùng thử

1. Vào Studio, chọn `Demo · Mock provider`.
2. Dùng nút thử sự kiện hoặc mở `Xem thử` / `Live canvas`.
3. Thử `join`, `leave`, `seat N`, quà, lượt thích và disconnect/reconnect từ Mock Event Deck.
4. Chọn ghế trống để khóa/mở khóa; ghế không bị thu hồi tự động. Hàng chờ tối đa 100 người và hết hạn sau 10 phút.
5. Dùng tab `Màn chiếu` để chọn placeholder, video trong phiên, URL trực tiếp (MP4/HLS hoặc YouTube), chia sẻ màn hình/cửa sổ hoặc composition từ OBS; chỉnh kích thước bằng thanh `Kích thước màn chiếu`.

Chia sẻ màn hình cần trình duyệt hiện đại và quyền chia sẻ do người dùng cấp. Trong Live canvas, chọn riêng **màn 1 ưu tiên** và **màn 2 dự phòng**; trình duyệt yêu cầu xác nhận quyền cho từng nguồn. Khi track màn chính báo mất tín hiệu hoặc kết thúc, canvas tự chuyển sang màn dự phòng; nếu màn chính hoạt động lại sẽ ưu tiên quay về màn 1. Dừng chia sẻ trên canvas hoặc từ thanh điều khiển của trình duyệt.

Với YouTube, dán link watch, `youtu.be`, Shorts hoặc LIVE vào trường URL video. Video phải cho phép nhúng; nội dung bị giới hạn tuổi hoặc chủ video tắt embedding có thể không phát.

Trong chế độ `Video URL`, dán mỗi URL vào một dòng để tạo playlist. Video MP4/HLS tự chuyển tiếp khi kết thúc; YouTube cần cho phép nhúng. Có thể dùng nút trước/sau để đổi video thủ công.

## Kết nối phòng thật

- **TikFinity:** mở ứng dụng TikFinity trên máy livestream, kết nối TikTok LIVE, rồi chọn TikFinity Local và bấm **Kết nối**. Studio mặc định mở WebSocket localhost cổng 21213. Nếu dùng bridge riêng, dán link WebSocket thay thế. Địa chỉ ngoài loopback cần dùng `wss://`.
- **TikTools:** tạo JWT ngắn hạn giới hạn cho kênh theo [tài liệu TikTools](https://tik.tools/docs), nhập tên kênh hoặc link TikTok rồi dán JWT hoặc API key. Bạn cũng có thể dán một link WebSocket đầy đủ trên `wss://api.tik.tools/` có sẵn `uniqueId` và `jwtKey` hoặc `apiKey`. Bấm **Kết nối**. Khi JWT hết hạn, tạo JWT mới và kết nối lại.
- Giữ Setup và Live canvas trong cùng tab, dùng Window Capture để lấy trạng thái phiên. Mở socket thành công mới xác nhận đường truyền. Hãy thử chat `join`, quà và lượt thích từ phòng thật trước khi đưa lên sóng.

## Giới hạn đã biết

- Adapter TikFinity và TikTools cần xác nhận payload và hành vi reconnect trong buổi LIVE thật.
- Auto seat và rời ghế cần event có định danh viewer từ provider. Adapter hiện chuẩn hóa các tên `leave`, `memberLeave`, `viewerLeft`, `memberDisconnect`, `viewerDisconnect`; nếu provider dùng tên event khác cần bổ sung theo payload thực tế. Khi chưa có leave event, ghế được giữ nguyên; chat `!leave` chỉ dành cho mock testing.
- Ghế và vị trí queue được giữ nguyên khi viewer im lặng hoặc mất WebSocket. Chỉ event `leave`/`disconnect` có định danh viewer từ provider mới gỡ họ khỏi ghế/queue; khi ghế trống, viewer đầu queue được chuyển vào.
- Không có backend, đồng bộ cửa sổ, tài khoản hoặc API phát sóng.
- URL video có thể bị chặn bởi CORS, DRM hoặc chính sách trình duyệt. Chỉ phát nội dung có quyền sử dụng.
- Settings lưu trong localStorage; preset JSON không chứa token/key. Chat và trạng thái ghế chỉ giữ trong RAM.
- Art trong bản demo dùng CSS và emoji; không dùng nhân vật/logo thương mại.

Xem đặc tả sản phẩm tại [VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md](./VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md).
### Tương tác giữa các ghế

Các từ khóa chat `t1`, `geng`, `oxi`, `silent`, `clap` và `wave` sẽ kích hoạt reaction trực tiếp. Không cần thêm tiền tố lệnh. Trong Mock Event Deck, thêm hai khán giả để thử.

### Image attribution

The T1, Gen.G, silent, and oxygen images in `public/assets/emotes` were supplied by the project owner. Confirm permission to use and redistribute them before publishing the app.

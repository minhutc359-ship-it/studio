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
3. Thử `!join`, `!leave`, `!seat N`, quà, lượt thích và disconnect/reconnect từ Mock Event Deck.
4. Chọn ghế trống để khóa/mở khóa; ghế không bị thu hồi tự động.
5. Dùng tab `Màn chiếu` để chọn placeholder, video trong phiên, URL trực tiếp hoặc composition từ OBS.

## Giới hạn đã biết

- TikFinity và TikTools hiện chỉ có mặt trong phần cấu hình; adapter chưa kết nối thật. Cần xác minh giao thức, payload và môi trường livestream trước khi triển khai.
- Không có backend, đồng bộ cửa sổ, tài khoản hoặc API phát sóng.
- URL video có thể bị chặn bởi CORS, DRM hoặc chính sách trình duyệt. Chỉ phát nội dung có quyền sử dụng.
- Settings lưu trong localStorage; preset JSON không chứa token/key. Chat và trạng thái ghế chỉ giữ trong RAM.
- Art trong bản demo dùng CSS và emoji; không dùng nhân vật/logo thương mại.

Xem đặc tả sản phẩm tại [VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md](./VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md).
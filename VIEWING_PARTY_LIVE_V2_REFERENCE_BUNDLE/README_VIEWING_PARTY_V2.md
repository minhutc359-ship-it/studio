# Viewing Party LIVE Studio — V2 Reference Edition

**Release docs:** 04/11/2026.

## Thư mục có gì?

- `VIEWING_PARTY_LIVE_PRD_TECH_SPEC_V2.md` — đặc tả đầy đủ: nền tảng v1 + yêu cầu mở rộng v2 (dành cho AI agent/coder).
- `VIEWING_PARTY_LIVE_PRD_TECH_SPEC_V2.docx` — Word được dàn trang, có ảnh minh họa concept và bảng biểu.
- `REFERENCE_EDITION_V2.md` — phụ lục nâng cấp 90/10: design, studio UX, realtime, 12 ghế, tiêu chí kiểm thử.
- `VIEWING_PARTY_V2_UI_PREVIEW.html` — trang demo Frontend tự chứa, có mock join/leave/chat/gift, seat UI, preview video local; **chưa tích hợp TikTok thật**.
- `viewing_party_live_concept.png` — concept tạo trước đó, chỉ tham khảo phong cách chibi/theater; demo HTML sử dụng art riêng.
- `VIEWING_PARTY_LIVE_PRD_TECH_SPEC.md` — đặc tả nền tảng v1 nguyên bản.

## Cách mở bản xem trước

Mở `VIEWING_PARTY_V2_UI_PREVIEW.html` bằng Chrome/Edge. Không cần npm, server hay Backend. Bấm `+ Người vào` để thấy 12 ghế hoạt động, thử chat `!join`, `!leave` hoặc nút gửi quà. Bấm `⚙ Cấu hình` chỉnh layout rồi bấm `▶ Trình chiếu` để mô phỏng Presentation Mode. Nút chọn video cho phép chọn file trên máy trong phiên hiện tại.

**Bản preview không giả vờ kết nối TikTok**, không có các tính năng tương tác thực qua websocket. Chức năng thật phải triển khai theo PRD.

## Về mức tương đồng 90%

Reference: https://t1win.online/ — trang có tiêu đề **Viewing Party Online**. Tuy nhiên quá trình tra cứu không truy xuất được giao diện JS/hình ảnh chi tiết. Do đó **không thể xác nhận bản thiết kế v2 trùng khớp 90% với website**. Mức 90% ở tài liệu là chỉ tiêu kiểm định giao diện sau khi có ảnh/screen recording tham chiếu thực tế. Không sao chép logo, asset, source code hoặc dữ liệu thương hiệu bên thứ ba.

## Product lock

- Rạp chiếu phim chibi, không chùa, không combat.
- Màn hình live/game/video giữa, 12 ghế ở dưới, sidebar actions và chat.
- FE-only local; TikTok LIVE events nếu muốn phải đi qua provider hỗ trợ và test API thực tế.
- Không đảm bảo sự kiện viewer leave có định danh; không xóa ghế theo biến động viewer count.

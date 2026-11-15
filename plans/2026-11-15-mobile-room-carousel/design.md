# Mobile: vuốt ngang giữa các phòng — Thiết kế

## Mục đích
Khách được gửi link, mở trên điện thoại và lướt để so sánh giá các phòng của một cơ sở.
Hiện tại các thẻ phòng xếp dọc 1 cột (mỗi thẻ ~550–600px), nên khách phải kéo hết xuống
để xem giá, rồi kéo ngược lên tìm lại phòng ưng ý để xem ảnh. Mục tiêu: chuyển qua lại
giữa các phòng nhanh, không phải kéo dọc dài.

## Mục tiêu / Ngoài phạm vi
- Mục tiêu: trên mobile, các phòng xếp thành một hàng ngang; vuốt trái/phải để chuyển phòng.
- Ngoài phạm vi: tablet/desktop (giữ lưới 2–3 cột như cũ); nội dung thẻ phòng không đổi.
- Không được: vuốt trên ảnh lại chuyển phòng (ảnh vẫn phải vuốt để đổi ảnh như hiện tại).

## Các phương án đã cân nhắc
- **A. Thanh tên phòng dính trên đầu** — luôn thấy, nhưng thêm thanh dính thứ 3, chật màn hình, không giúp so sánh.
- **B. Nút nổi mở danh sách phòng** — gọn, so sánh giá tốt, nhưng thêm 1 lần bấm.
- **C. Chế độ xem gọn dạng danh sách** — so sánh tốt nhất nhưng thay đổi lớn, ảnh bị thu nhỏ.
- **Đã chọn: carousel phòng vuốt ngang** (người dùng chọn). Xung đột với carousel ảnh được giải
  quyết bằng quy tắc: vuốt trên **ảnh** = đổi ảnh; vuốt trên **phần còn lại của thẻ** (tên, tiện ích, giá) = đổi phòng.

## Thiết kế
- Dưới breakpoint `sm` (<640px), lưới phòng trong `src/App.tsx` thành hàng ngang cuộn được,
  có snap theo từng thẻ. Từ `sm` trở lên giữ nguyên lưới.
- Mỗi thẻ rộng ~88% màn hình, lộ một phần thẻ kế bên để khách biết còn phòng.
- Có chỉ báo vị trí "2 / 8" để khách biết đang ở phòng nào trong bao nhiêu phòng.
- Vùng ảnh trong `RoomCard` chặn cuộn ngang của hàng phòng (chỉ cho cuộn dọc trang), nên vuốt
  trên ảnh chỉ đổi ảnh như hiện tại.
- Đổi cơ sở (tab) → hàng phòng quay về phòng đầu tiên.

## Quyết định của Claude (có thể sửa)
- Dùng cuộn ngang gốc của trình duyệt + scroll-snap (mượt, có quán tính) thay vì tự viết JS kéo thả.
- Chỉ báo vị trí dùng số "2 / 8" thay vì chấm (chấm không đủ chỗ khi cơ sở có 10+ phòng).
- Ảnh vẫn tải lười: thẻ nào lộ ra (kể cả phần lộ của thẻ kế bên) mới tải ảnh.

## Để người làm tự quyết
- Kích thước/kiểu chỉ báo vị trí, khoảng cách giữa thẻ, chiều cao thẻ khi nội dung khác nhau.

# Siris Residences 🏡

Ứng dụng xem thông tin phòng nghỉ tại Siris Residences — hệ thống căn hộ dịch vụ cho thuê chuyên nghiệp. Giao diện hiện đại, tối giản, tối ưu hiệu năng.

---

## Tính năng nổi bật

- **Điều hướng tức thì** — Chuyển đổi giữa Trang chủ và Chính sách chung bằng React State, không load lại trang.
- **Thanh lọc cơ sở** — Sticky filter bar với underlined tabs, hỗ trợ cuộc ngang trên mobile.
- **Bảng giá đa dạng** — Hiển thị giá ngày thường, cuối tuần, tháng ngắn/dài hạn.
- **Carousel ảnh** — Điều hướng nhiều ảnh trên cả mobile & desktop, preload ảnh thông minh.
- **Chính sách chung** — Trang riêng với loading skeleton, hiển thị dạng bài viết có số thứ tự.
- **Phụ thu/thông báo** — Banner thông minh hiển thị surcharge theo tháng.
- **Đa ngôn ngữ** — Hỗ trợ Tiếng Việt & Tiếng Anh, lưu lựa chọn vào localStorage.
- **Responsive 100%** — Tối ưu cho mọi thiết bị.
- **Cảnh báo phòng (Warning)** — Badge "CHÚ Ý" kế bên tên phòng, popup dùng React Portal.
- **Tối ưu hiệu năng** — Gộp các yêu cầu dữ liệu đồng thời, tách bundle React/Lucide, CSS animation và inline SVG giảm bundle size.

---

## Cấu trúc dự án

```
src/
├── App.tsx                       # Logic chính, điều hướng, data fetching
├── main.tsx                      # Entry point
├── index.css                     # Tailwind CSS 4 theme & custom utilities
├── types.ts                      # TypeScript interfaces
├── translations.ts               # Song ngữ vi/en
├── vite-env.d.ts                 # Vite env types
├── services/
│   └── dataService.ts            # Fetch & transform dữ liệu trực tiếp từ Base
├── hooks/
│   └── useCloudinaryImages.ts    # Lấy ảnh từ Cloudinary theo tag
└── components/
    ├── RoomCard.tsx              # Thẻ phòng + carousel ảnh
    ├── AmenityList.tsx           # Danh sách tiện ích (CheckCircle / XCircle)
    ├── GeneralPolicies.tsx       # Nội dung chính sách chung
    ├── SurchargeBanner.tsx       # Banner phụ thu/giảm giá
    ├── LanguageSelector.tsx      # Dropdown chọn ngôn ngữ
    └── Footer.tsx                # Footer responsive (mobile/desktop)
```

---

## Cài đặt và Chạy

### Yêu cầu
- Node.js >= 18
- npm

### Các bước

```bash
# Clone repository
git clone <repo-url>
cd siris-residences-v2

# Cài đặt dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env
# Điền VITE_CLOUDINARY_CLOUD_NAME và LARK_APP_ID / LARK_APP_SECRET phía server

# Chạy dev server
npm run dev       # http://localhost:3000

# Build production
npm run build     # Output vào /dist

# Kiểm tra TypeScript
npm run lint
```

### Biến môi trường

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary | ✅ (nếu dùng ảnh Cloudinary) |

---

## Thử dữ liệu short-term từ Lark Base trên local

Cấu hình `LARK_APP_ID` và `LARK_APP_SECRET` cho ứng dụng có quyền đọc **Siris Web**, rồi chạy:

```bash
npm run dev
```

Dev server gọi API Lark trực tiếp bằng `fetch`, không khởi chạy `lark-cli` khi tải trang.
Chỉ phiên xác thực được giữ tới gần thời điểm hết hạn; các bảng luôn được đọc mới.
Thông tin đăng nhập đặt phía server, không dùng tiền tố `VITE_`.
Trên máy có sẵn cấu hình ứng dụng Siris, có thể đặt `LARK_CONFIG_DIRECTORY`
trong `.env.local` để tái sử dụng cấu hình đó mà không sao chép khoá.
Endpoint `/api/short-term` chỉ đọc các bảng `branches`, `room_types`, `settings`,
`stay_discounts`, `date_adjustments`; không đọc các bảng `longterm_*`.
Mỗi yêu cầu mới đọc trực tiếp Base, không dùng cache để bỏ qua lần đọc dữ liệu mới.
Các bảng được đọc song song, hỗ trợ phân trang đầy đủ; giá trị ô (giá, tên,
trạng thái ẩn/hiện...) luôn đọc mới ở mỗi yêu cầu.
Trang tự đọc lại sau 10 giây kể từ lần đọc trước hoàn tất và khi quay lại tab.
Thay đổi xuất hiện sau chu kỳ này cộng thời gian Lark phản hồi, không cần F5.
Các yêu cầu đang chạy được gộp để tránh đọc trùng; giữ nguyên tab cơ sở đang chọn.
Khi refresh, trang chờ phản hồi mới từ Base rồi mới hiển thị nội dung, không
đọc dữ liệu cũ từ bộ nhớ trình duyệt. Chỉ tab cơ sở và ngôn ngữ được ghi nhớ.
Nếu đọc lỗi, trang báo lỗi. Không có fallback sang Supabase hoặc nội dung
kinh doanh mẫu khi cột Base trống. Thông tin đăng nhập không gửi tới trình duyệt.

`npm run data:short-term` vẫn có thể xuất bản chụp để đối chiếu trong
`.local/short-term.json` (không đưa vào Git), nhưng giao diện không đọc file này.
Ảnh phòng vẫn dùng Cloudinary và bản đồ vẫn là tài nguyên của dự án.

## Production trên Vercel

`api/short-term.js` là backend production cho cùng endpoint `/api/short-term`.
Thiết lập `LARK_APP_ID` và `LARK_APP_SECRET` dưới dạng Secret trong môi trường
Production của dự án `siris-roomrate`. `LARK_BASE_TOKEN` có thể ghi đè Base mặc định.
Ứng dụng Lark phải có quyền đọc Siris Web. Production không dùng cấu hình từ
thư mục dự án khác, file dữ liệu local hoặc `lark-cli`.
Function chạy tại Singapore, trả dữ liệu mới với `Cache-Control: no-store`.

## Công nghệ

- **Frontend:** React 19, Vite 6, TypeScript
- **Styling:** Tailwind CSS 4
- **Nguồn dữ liệu:** Lark Base — Siris Web / short-term
- **Icons:** Lucide React
- **Images:** Cloudinary

---

## Cập nhật gần nhất

1. **Fix CSS warning:** Thêm `css.lint.unknownAtRules: "ignore"` trong VS Code settings để tắt cảnh báo `@apply` từ Tailwind CSS 4.
2. **Dọn dependencies:** Xóa các package không dùng (`dotenv`, `motion`, `react-lazy-load-image-component`, `@types/express`, `autoprefixer`).
3. **Xóa dead code:** Loại bỏ state `slideOffset` không dùng trong `RoomCard.tsx`.
4. **Tối ưu hiệu năng:** Xóa dead code (`HeroBanner`, `SearchBar`, unused imports), dùng `useMemo` cho hero title & settings, gộp settings lookups.
5. **Fix bug:** `t.lang` trong `GeneralPolicies` → thay bằng prop `lang` chính xác.
6. **Footer responsive:** Layout riêng cho mobile (xếp dọc, căn giữa) và desktop (2 cột brand + contact), link "Chính sách chung" chỉ hiện trên mobile.
7. **CSS nhất quán:** Dùng utility `scrollbar-hide` từ `index.css` thay vì inline style.
8. **Gộp filter bar & facility card:** Thanh tab chọn cơ sở được gộp vào chung một card với thông tin cơ sở, loại bỏ sticky bar riêng lẻ. UI liền mạch hơn trên mọi kích thước màn hình.
9. **Cảnh báo phòng (Warning):** Nếu cột `warning` trong bảng `room_types` có dữ liệu, hiển thị badge CHÚ Ý và popup. Hỗ trợ tiếng Anh qua cột `warning_en`.
10. **Đổi ngôn ngữ không load lại:** Chỉ hiển thị loading skeleton ở lần đầu; các lần cập nhật sau thay nội dung trực tiếp.
11. **Persist ngôn ngữ:** Lưu lựa chọn ngôn ngữ vào `localStorage`, khôi phục khi refresh trang.
12. **Animation mượt khi refresh:** Loading skeleton cho cả trang chủ và trang chính sách, fade-in animation với `@keyframes fadeIn` CSS.
13. **Fix footer hiển thị sai khi loading:** Footer có `loading` prop, khi đang tải dữ liệu sẽ hiển thị skeleton thay vì contact info mặc định.
14. **Import trực tiếp GeneralPolicies:** Bỏ `React.lazy()` để tránh blank page khi refresh trang `?view=policies`.
15. **Tách chunk (code splitting):** Cấu hình Vite `manualChunks` tách `react-vendor` và `lucide` thành các file riêng.
16. **Inline SVG:** Thay thế icon `Waves` từ lucide-react bằng inline SVG để giảm kích thước bundle.
17. **Tối ưu HTML:** Thêm `preconnect` + `crossorigin` cho Cloudinary trong `<head>`.
18. **Gộp useEffect:** Hợp nhất 3 effect preload ảnh trong RoomCard thành 1 effect duy nhất; hợp nhất 2 effect popup warning thành 1.
19. **Xóa React import dư:** App.tsx không còn import `React` (JSX tự động trong React 17+).
20. **Thêm cancelled flag:** Tránh setState sau khi component unmount khi đổi ngôn ngữ.

---

© 2026 Siris Residences. All rights reserved.

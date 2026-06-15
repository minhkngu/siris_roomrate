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
- **Tối ưu hiệu năng** — Cache dữ liệu Supabase, chunk splitting (React/Vendor/Supabase/Lucide riêng), CSS animation thay vì JS state, inline SVG giảm bundle size.

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
├── lib/
│   └── supabase.ts               # Supabase client config
├── services/
│   └── dataService.ts            # Fetch & transform dữ liệu (có cache)
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
# Sau đó điền các biến môi trường: SUPABASE_URL, SUPABASE_ANON_KEY, CLOUDINARY_CLOUD_NAME

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
| `VITE_SUPABASE_URL` | URL Supabase project | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase | ✅ |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary | ✅ (nếu dùng ảnh Cloudinary) |

---

## Công nghệ

- **Frontend:** React 19, Vite 6, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase
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
9. **Cảnh báo phòng (Warning):** Thêm field `warning` trong `RoomType`. Nếu phòng có dữ liệu ở cột `warning` (Supabase table `room_types`), badge **"⚠️ CHÚ Ý"** nhấp nháy sẽ xuất hiện kế bên tên phòng. Hover/click vào badge để xem popup nội dung cảnh báo (dùng React Portal, không bị clipping). Hỗ trợ đa ngôn ngữ qua cột `warning_en`.
10. **Đổi ngôn ngữ không load lại:** Dùng `useRef` để chỉ hiển thị loading skeleton ở lần đầu tiên. Khi đổi ngôn ngữ, dữ liệu được lấy từ cache, không giật/lag.
11. **Persist ngôn ngữ:** Lưu lựa chọn ngôn ngữ vào `localStorage`, khôi phục khi refresh trang.
12. **Animation mượt khi refresh:** Loading skeleton cho cả trang chủ và trang chính sách, fade-in animation với `@keyframes fadeIn` CSS.
13. **Fix footer hiển thị sai khi loading:** Footer có `loading` prop, khi đang tải dữ liệu sẽ hiển thị skeleton thay vì contact info mặc định.
14. **Import trực tiếp GeneralPolicies:** Bỏ `React.lazy()` để tránh blank page khi refresh trang `?view=policies`.
15. **Tách chunk (code splitting):** Cấu hình Vite `manualChunks` tách `react-vendor`, `lucide`, `supabase` thành các file riêng — tận dụng cache trình duyệt, giảm dung lượng tải lại.
16. **Inline SVG:** Thay thế icon `Waves` từ lucide-react bằng inline SVG để giảm kích thước bundle.
17. **Tối ưu HTML:** Thêm `preconnect` + `crossorigin` cho Cloudinary và Supabase trong `<head>` để tăng tốc DNS và TLS handshake.
18. **Gộp useEffect:** Hợp nhất 3 effect preload ảnh trong RoomCard thành 1 effect duy nhất; hợp nhất 2 effect popup warning thành 1.
19. **Xóa React import dư:** App.tsx không còn import `React` (JSX tự động trong React 17+).
20. **Thêm cancelled flag:** Tránh setState sau khi component unmount khi đổi ngôn ngữ.

---

© 2026 Siris Residences. All rights reserved.
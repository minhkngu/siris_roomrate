# Siris Residences 🏡

Ứng dụng xem thông tin phòng nghỉ tại Siris Residences — hệ thống căn hộ dịch vụ cho thuê chuyên nghiệp. Giao diện hiện đại, tối giản, tối ưu hiệu năng.

---

## Tính năng nổi bật

- **Điều hướng tức thì** — Chuyển đổi giữa Trang chủ và Chính sách chung bằng React State, không load lại trang.
- **Thanh lọc cơ sở** — Sticky filter bar với underlined tabs, hỗ trợ cuộc ngang trên mobile.
- **Bảng giá đa dạng** — Hiển thị giá ngày thường, cuối tuần, tháng ngắn/dài hạn.
- **Carousel ảnh** — Điều hướng nhiều ảnh trên cả mobile & desktop.
- **Chính sách chung** — Trang riêng với lazy loading, trình bày dạng bài viết.
- **Phụ thu/thông báo** — Banner thông minh hiển thị surcharge theo tháng.
- **Đa ngôn ngữ** — Hỗ trợ Tiếng Việt & Tiếng Anh.
- **Responsive 100%** — Tối ưu cho mọi thiết bị.

---

## Cấu trúc dự án

```
src/
├── App.tsx                       # Logic chính, điều hướng, data fetching
├── main.tsx                      # Entry point
├── index.css                     # Tailwind config & custom theme
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

```bash
npm install
npm run dev       # http://localhost:5173 (Vite default)
npm run build     # Build production vào /dist
```

---

## Công nghệ

- **Frontend:** React 19, Vite 6, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase
- **Icons:** Lucide React
- **Images:** Cloudinary

---

## Cập nhật gần nhất

1. **Tối ưu hiệu năng:** Xóa dead code (`HeroBanner`, `SearchBar`, unused imports), dùng `useMemo` cho hero title & settings, gộp settings lookups.
2. **Fix bug:** `t.lang` trong `GeneralPolicies` → thay bằng prop `lang` chính xác.
3. **Footer responsive:** Layout riêng cho mobile (xếp dọc, căn giữa) và desktop (2 cột brand + contact), link "Chính sách chung" chỉ hiện trên mobile.
4. **CSS nhất quán:** Dùng utility `scrollbar-hide` từ `index.css` thay vì inline style.

---

© 2026 Siris Residences. All rights reserved.
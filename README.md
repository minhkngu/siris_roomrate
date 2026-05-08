# Siris Residences 🏡

Ứng dụng xem thông tin phòng nghỉ tại Siris Residences — hệ thống căn hộ dịch vụ cho thuê. Hỗ trợ Tiếng Việt & Tiếng Anh.

---

## Tính năng

- **Danh sách cơ sở** — Xem thông tin các cơ sở (địa chỉ, mô tả, hình ảnh)
- **Chi tiết phòng** — Bảng giá ngày thường, cuối tuần, ngắn hạn, dài hạn
- **Tiện ích** — Danh sách tiện ích có/không có theo từng phòng & cơ sở
- **Chính sách & Quy định** — Chính sách chung và riêng từng cơ sở
- **Phụ thu theo ngày** — Banner thông báo surcharge/discount
- **Chuyển đổi ngôn ngữ** — Tiếng Việt / English
- **Responsive** — Tối ưu mobile & desktop
- **Lazy loading** — Ảnh & component tải chậm

---

## Project Structure

```
src/
├── App.tsx                    # Layout chính, data fetching
├── types.ts                   # TypeScript interfaces
├── translations.ts            # Song ngữ vi/en
├── lib/supabase.ts            # Supabase client
├── services/dataService.ts    # Fetch & transform data
├── hooks/useCloudinaryImages.ts
└── components/
    ├── PropertyCard.tsx        # Thông tin cơ sở
    ├── RoomCard.tsx            # Thông tin loại phòng
    ├── AmenityList.tsx         # Danh sách tiện ích
    ├── GeneralPolicies.tsx     # Chính sách chung
    ├── SurchargeBanner.tsx     # Phụ thu theo ngày
    └── LanguageSelector.tsx    # Chuyển đổi ngôn ngữ
```

## Run Locally

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
npm run lint      # TypeScript check
```

## Tech Stack

**React 19** · **Vite 6** · **TypeScript** · **Tailwind CSS 4** · **Supabase** · **Lucide React** · **Cloudinary**

## Data Source (Supabase)

`branches` · `room_types` · `amenities` · `settings` · `date_adjustments` · `stay_discounts`

## Future Updates

Xem thư mục [`updates/`](./updates/) để theo dõi các tính năng dự kiến.
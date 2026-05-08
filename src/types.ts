export interface DateAdjustment {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  type: 'surcharge' | 'discount';
  amount: number;
  ispercentage: boolean;
  note?: string;
  created_at?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Policy {
  title: string;
  content: string;
}

export interface Pricing {
  weekday: number;
  weekend: number;
  monthlyUnder3: number;
  monthlyOver3: number;
  fees?: string; // e.g., "Điện 4k, Nước 100k"
}

export interface RoomType {
  id: string;
  name: string;
  sqm?: number;
  images: string[]; // Changed from image: string
  storageFolder?: string; // Supabase storage folder path
  amenities: string[];
  excludedAmenities?: string[];
  pricing: Pricing;
  tag?: string;
  isHidden?: boolean;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  description: string;
  images: string[];
  storageFolder?: string; // Supabase storage folder path
  amenities: string[];
  excludedAmenities?: string[];
  policies: Policy[];
  rooms: RoomType[];
  promotion?: string;
  tag?: string;
}

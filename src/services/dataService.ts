import { supabase } from '../lib/supabase';
import { Property, RoomType, Policy, DateAdjustment } from '../types';
import { Language } from '../translations';

// Cache - only cache raw Supabase data, not transformed
let cachedData: {
  branches: any[];
  rooms: any[];
  discounts: any[];
  amenities: any[];
  branchAmenities: any[];
  roomAmenities: any[];
  settings: any[];
  dateAdjustments: any[];
} | null = null;

const parseArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];

    try {
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // Fall through to manual splitting
    }

    if (trimmed.includes(';')) {
      return trimmed.split(';').map(s => s.trim()).filter(Boolean);
    }

    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export const fetchAllData = async () => {
  if (cachedData) return cachedData;

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Supabase credentials missing.');
    return { branches: [], rooms: [], discounts: [], amenities: [], branchAmenities: [], roomAmenities: [], settings: [], dateAdjustments: [] };
  }

  try {
    const fetchTable = async (table: string, isOptional = false) => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        const isTableNotFound = error.message.includes('Could not find the table') || error.code === 'PGRST116';
        if (!isOptional || !isTableNotFound) {
          console.warn(`Error fetching table ${table}:`, error.message);
        }
        return [];
      }
      return data || [];
    };

    const [
      branches,
      rooms,
      discounts,
      amenities,
      branchAmenities,
      roomAmenities,
      settings,
      dateAdjustments
    ] = await Promise.all([
      fetchTable('branches'),
      fetchTable('room_types'),
      fetchTable('stay_discounts', true),
      fetchTable('amenities', true),
      fetchTable('branch_amenities', true),
      fetchTable('room_amenities', true),
      fetchTable('settings', true),
      fetchTable('date_adjustments', true)
    ]);

    let roomsData = rooms;
    if (roomsData.length === 0) roomsData = await fetchTable('rooms');

    cachedData = { branches, rooms: roomsData, discounts, amenities, branchAmenities, roomAmenities, settings, dateAdjustments };
    return cachedData;
  } catch (error) {
    console.error('Unexpected error in fetchAllData:', error);
    return { branches: [], rooms: [], discounts: [], amenities: [], branchAmenities: [], roomAmenities: [], settings: [], dateAdjustments: [] };
  }
};

export const fetchProperties = async (lang: Language = 'vi'): Promise<{
  properties: Property[],
  masterPropertyAmenities: string[],
  masterRoomAmenities: string[],
  generalPolicies: Policy[],
  dateAdjustments: DateAdjustment[]
}> => {
  const { branches, rooms, discounts, amenities, branchAmenities, roomAmenities, settings, dateAdjustments } = await fetchAllData();

  const getTranslatedValue = (item: any, field: string, currentLang: Language, defaultValue: any = '') => {
    if (currentLang === 'en') {
      const enField = `${field}_en`;
      const val = item[enField];
      if (val !== undefined && val !== null && val !== '' && (Array.isArray(val) ? val.length > 0 : true)) {
        return val;
      }
    }
    return item[field] || defaultValue;
  };

  // Get general policies from settings table if available
  let generalPolicies: Policy[] = [];
  const policySetting = settings.find((s: any) =>
    s.key === 'general_policies' || s.name === 'general_policies' ||
    s.key === 'general_policy' || s.name === 'general_policy'
  );

  if (policySetting) {
    try {
      const rawValue = lang === 'en' && policySetting.value_en
        ? policySetting.value_en
        : policySetting.value;

      const parsedValue = typeof rawValue === 'string'
        ? JSON.parse(rawValue)
        : rawValue;
      if (Array.isArray(parsedValue)) generalPolicies = parsedValue;
    } catch (e) {
      console.error('Error parsing policies:', e);
    }
  }

  if (generalPolicies.length === 0) {
    generalPolicies = lang === 'en' ? [
      { title: 'Time', content: 'Free access 24/7, no curfew.' },
      { title: 'Security', content: 'Security camera system and modern fingerprint locks.' },
      { title: 'Cleaning', content: 'Weekly cleaning service for common areas.' },
      { title: 'Payment', content: 'Room payment from the 1st to the 5th of every month.' }
    ] : [
      { title: 'Giờ giấc', content: 'Giờ giấc tự do 24/7, không chung chủ.' },
      { title: 'An ninh', content: 'Hệ thống camera an ninh và khóa vân tay hiện đại.' },
      { title: 'Vệ sinh', content: 'Dịch vụ dọn dẹp khu vực chung hàng tuần.' },
      { title: 'Thanh toán', content: 'Thanh toán tiền phòng từ ngày 1 đến ngày 5 hàng tháng.' }
    ];
  }

  const masterPropertyAmenities = amenities
    .filter(a => a.category === 'property' || a.category === 'general')
    .map(a => getTranslatedValue(a, 'name', lang));

  const masterRoomAmenities = amenities
    .filter(a => a.category === 'room' || a.category === 'general')
    .map(a => getTranslatedValue(a, 'name', lang));

  // Map data to our frontend types
  const properties = branches.map(branch => {
    // Try to match branch ID with room's branch reference in various formats
    const branchRooms: RoomType[] = rooms
      .filter(room => {
        const rBranchId = room.branch_id || room.branchId || room.branchid || room.branch_ID;
        const bId = branch.id;

        if (!rBranchId || !bId) return false;
        return String(rBranchId).trim().toLowerCase() === String(bId).trim().toLowerCase();
      })
      .map(room => {
        // Robust mapping for amenities
        let roomAmenitiesList = parseArray(getTranslatedValue(room, 'amenities', lang));

        if (roomAmenitiesList.length === 0 && roomAmenities?.length > 0 && amenities?.length > 0) {
          roomAmenitiesList = roomAmenities
            .filter((ra: any) => String(ra.room_type_id) === String(room.id))
            .map((ra: any) => {
              const amenity = amenities.find((a: any) => a.id === ra.amenity_id);
              return amenity ? getTranslatedValue(amenity, 'name', lang) : null;
            })
            .filter(Boolean) as string[];
        }

        if (roomAmenitiesList.length === 0) {
          roomAmenitiesList = lang === 'en' ? ['Air conditioning', 'Wifi', 'Fridge'] : ['Máy lạnh', 'Wifi', 'Tủ lạnh'];
        }

        const branchStorageFolderRaw = branch.storage_folder || branch.storageFolder || branch.storagefolder;
        const roomStorageFolderPartRaw = room.storage_folder || room.storageFolder || room.storagefolder;

        const branchStorageFolder = typeof branchStorageFolderRaw === 'string' ? branchStorageFolderRaw.trim() : undefined;
        const roomStorageFolderPart = typeof roomStorageFolderPartRaw === 'string' ? roomStorageFolderPartRaw.trim() : undefined;

        let roomStorageFolder = roomStorageFolderPart;
        if (branchStorageFolder && roomStorageFolderPart) {
          const cleanBranch = branchStorageFolder.replace(/^\/+|\/+$/g, '');
          const cleanRoom = roomStorageFolderPart.replace(/^\/+|\/+$/g, '');
          roomStorageFolder = cleanRoom.startsWith(cleanBranch) ? cleanRoom : `${cleanBranch}/${cleanRoom}`;
        } else if (branchStorageFolder) {
          roomStorageFolder = branchStorageFolder.replace(/^\/+|\/+$/g, '');
        } else if (roomStorageFolderPart) {
          roomStorageFolder = roomStorageFolderPart.replace(/^\/+|\/+$/g, '');
        }

        return {
          id: String(room.id),
          name: getTranslatedValue(room, 'name', lang, lang === 'en' ? 'Room Type' : 'Loại phòng'),
          sqm: Number(room.sqm ?? room.area ?? 0),
          storageFolder: roomStorageFolder,
          images: parseArray(room.images).length > 0 ? parseArray(room.images) : [
            'https://picsum.photos/seed/room1/300/225',
            'https://picsum.photos/seed/room2/300/225'
          ],
          amenities: roomAmenitiesList,
          excludedAmenities: parseArray(getTranslatedValue(room, 'excluded_amenities', lang)),
          pricing: {
            weekday: Number(room.weekday_price ?? room.weekdayPrice ?? room.weekdayprice ?? 0),
            weekend: Number(room.weekend_price ?? room.weekendPrice ?? room.weekendprice ?? 0),
            monthlyUnder3: Number(room.monthly_under_3 ?? room.monthlyUnder3 ?? room.monthlyunder3 ?? 0),
            monthlyOver3: Number(room.monthly_over_3 ?? room.monthlyOver3 ?? room.monthlyover3 ?? 0),
            fees: getTranslatedValue(room, 'fees', lang, lang === 'en' ? 'Electricity 4k, Water 100k/person' : 'Điện 4k, Nước 100k/ng')
          },
          tag: room.tag || '',
          isHidden: !!(room.is_hidden ?? room.isHidden ?? room.ishidden ?? false)
        };
      })
      .sort((a, b) => a.pricing.weekday - b.pricing.weekday);

    const promotion = getTranslatedValue(branch, 'promotion', lang, discounts.length > 0 ? getTranslatedValue(discounts[0], 'name', lang) : '');

    let branchAmenitiesList = parseArray(getTranslatedValue(branch, 'amenities', lang));
    if (branchAmenitiesList.length === 0 && branchAmenities?.length > 0 && amenities?.length > 0) {
      branchAmenitiesList = branchAmenities
        .filter((ba: any) => String(ba.branch_id) === String(branch.id))
        .map((ba: any) => {
          const amenity = amenities.find((a: any) => a.id === ba.amenity_id);
          return amenity ? getTranslatedValue(amenity, 'name', lang) : null;
        })
        .filter(Boolean) as string[];
    }

    if (branchAmenitiesList.length === 0) {
      branchAmenitiesList = lang === 'en' ? ['Wifi', '24/7 Security', 'Elevator'] : ['Wifi', 'Bảo vệ 24/7', 'Thang máy'];
    }

    const bStorageFolderRaw = branch.storage_folder || branch.storageFolder || branch.storagefolder;
    const bStorageFolder = typeof bStorageFolderRaw === 'string' ? bStorageFolderRaw.trim() : undefined;

    const branchPolicies = getTranslatedValue(branch, 'policies', lang);

    return {
      id: String(branch.id),
      name: getTranslatedValue(branch, 'name', lang, lang === 'en' ? 'Branch' : 'Cơ sở'),
      address: getTranslatedValue(branch, 'address', lang, lang === 'en' ? 'Address updating' : 'Địa chỉ đang cập nhật'),
      description: getTranslatedValue(branch, 'description', lang, lang === 'en' ? 'Modern living space, fully equipped.' : 'Không gian sống hiện đại, tiện nghi.'),
      storageFolder: bStorageFolder,
      images: parseArray(branch.images).length > 0 ? parseArray(branch.images) : ['https://picsum.photos/seed/branch/400/300'],
      amenities: branchAmenitiesList,
      excludedAmenities: parseArray(getTranslatedValue(branch, 'excluded_amenities', lang)),
      policies: Array.isArray(branchPolicies) ? branchPolicies : [
        { title: lang === 'en' ? 'General Policy' : 'Chính sách chung', content: lang === 'en' ? 'Free access, no curfew.' : 'Giờ giấc tự do, không chung chủ.' }
      ],
      promotion,
      tag: branch.tag || '',
      rooms: branchRooms
    };
  });

  return {
    properties,
    masterPropertyAmenities: masterPropertyAmenities.length > 0 ? masterPropertyAmenities : (lang === 'en' ? ['Wifi', 'Cleaning', 'Elevator'] : ['Wifi', 'Dọn phòng', 'Thang máy']),
    masterRoomAmenities: masterRoomAmenities.length > 0 ? masterRoomAmenities : (lang === 'en' ? ['Air conditioning', 'Wifi', 'Balcony'] : ['Máy lạnh', 'Wifi', 'Ban công']),
    generalPolicies,
    dateAdjustments
  };
};

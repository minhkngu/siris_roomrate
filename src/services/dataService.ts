import { Property, RoomType, Policy, DateAdjustment } from '../types';
import { Language } from '../translations';

interface BaseData {
  branches: any[];
  rooms: any[];
  discounts: any[];
  amenities: any[];
  branchAmenities: any[];
  roomAmenities: any[];
  settings: any[];
  dateAdjustments: any[];
}
let pendingData: Promise<BaseData> | null = null;

interface PropertyData {
  properties: Property[];
  masterPropertyAmenities: string[];
  masterRoomAmenities: string[];
  generalPolicies: Policy[];
  dateAdjustments: DateAdjustment[];
  settings: any[];
}

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
  if (pendingData) return pendingData;
  pendingData = (async () => {
    const response = await fetch('/api/short-term', { cache: 'no-store' });
    if (!response.ok) throw new Error('Cannot load short-term data from Lark Base');
    const data = await response.json();
    for (const key of ['branches', 'rooms', 'discounts', 'amenities', 'branchAmenities', 'roomAmenities', 'settings', 'dateAdjustments']) {
      if (!Array.isArray(data[key])) throw new Error(`Invalid Lark Base response: ${key}`);
    }
    return data as BaseData;
  })();
  try { return await pendingData; }
  finally { pendingData = null; }
};

export const fetchProperties = async (lang: Language = 'vi'): Promise<PropertyData> => {
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

  const masterPropertyAmenities = amenities
    .filter(a => a.category === 'property' || a.category === 'general')
    .map(a => getTranslatedValue(a, 'name', lang));

  const masterRoomAmenities = amenities
    .filter(a => a.category === 'room' || a.category === 'general')
    .map(a => getTranslatedValue(a, 'name', lang));

  // Map data to our frontend types (filtering out hidden branches)
  const properties = branches
    .filter(branch => branch.is_hidden !== true && branch.is_hidden !== 'true' && String(branch.is_hidden) !== 'true')
    .map(branch => {
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
          name: getTranslatedValue(room, 'name', lang),
          sqm: Number(room.sqm ?? room.area ?? 0),
          storageFolder: roomStorageFolder,
          images: parseArray(room.images),
          amenities: roomAmenitiesList,
          excludedAmenities: parseArray(getTranslatedValue(room, 'excluded_amenities', lang)),
          pricing: {
            weekday: Number(room.weekday_price ?? room.weekdayPrice ?? room.weekdayprice ?? 0),
            weekend: Number(room.weekend_price ?? room.weekendPrice ?? room.weekendprice ?? 0),
            monthlyUnder3: Number(room.monthly_under_3 ?? room.monthlyUnder3 ?? room.monthlyunder3 ?? 0),
            monthlyOver3: Number(room.monthly_over_3 ?? room.monthlyOver3 ?? room.monthlyover3 ?? 0),
            fees: getTranslatedValue(room, 'fees', lang)
          },
          tag: room.tag || '',
          isHidden: !!(room.is_hidden ?? room.isHidden ?? room.ishidden ?? false),
          warning: getTranslatedValue(room, 'warning', lang) || undefined
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

    const bStorageFolderRaw = branch.storage_folder || branch.storageFolder || branch.storagefolder;
    const bStorageFolder = typeof bStorageFolderRaw === 'string' ? bStorageFolderRaw.trim() : undefined;

    const branchPolicies = getTranslatedValue(branch, 'policies', lang);

    return {
      id: String(branch.id),
      name: getTranslatedValue(branch, 'name', lang),
      address: getTranslatedValue(branch, 'address', lang),
      description: getTranslatedValue(branch, 'description', lang),
      storageFolder: bStorageFolder,
      images: parseArray(branch.images),
      amenities: branchAmenitiesList,
      excludedAmenities: parseArray(getTranslatedValue(branch, 'excluded_amenities', lang)),
      policies: Array.isArray(branchPolicies) ? branchPolicies : [],
      promotion,
      tag: branch.tag || '',
      rooms: branchRooms
    };
  });

  const result = {
    properties,
    masterPropertyAmenities,
    masterRoomAmenities,
    generalPolicies,
    dateAdjustments,
    settings
  };
  return result;
};

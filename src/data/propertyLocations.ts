export interface MapPoint {
  name: string;
  nameEn?: string;
  lat: number;
  lon: number;
  distance?: string;
  labelSide?: 'left' | 'right';
  primary?: boolean;
}

export interface PropertyLocationData {
  mapImage: string;
  center: { lat: number; lon: number };
  points: MapPoint[];
}

export const propertyLocations: Record<string, PropertyLocationData> = {
  mia: {
    mapImage: '/maps/siris-mia-street-map.png',
    center: { lat: 10.7339474, lon: 106.7072669 },
    points: [
      { name: 'Siris Mia', lat: 10.7339474, lon: 106.7072669, primary: true },
      { name: 'SC VivoCity', lat: 10.7302089, lon: 106.7033641, distance: '1,3 km' },
      { name: 'ĐH Tôn Đức Thắng', nameEn: 'Ton Duc Thang University', lat: 10.7319314, lon: 106.6993418, distance: '2,1 km' },
      { name: 'Lotte Mart Quận 7', nameEn: 'Lotte Mart District 7', lat: 10.7409449, lon: 106.7018086, distance: '3,1 km' },
      { name: 'Crescent Mall', lat: 10.7285028, lon: 106.7187707, distance: '2,3 km', labelSide: 'left' },
      { name: 'Cầu Ánh Sao', nameEn: 'Starlight Bridge', lat: 10.7265469, lon: 106.7186725, distance: '2,6 km', labelSide: 'left' },
    ],
  },
  lune: {
    mapImage: '/maps/siris-lune-street-map.png',
    center: { lat: 10.7339006, lon: 106.7079854 },
    points: [
      { name: 'Siris Lune', lat: 10.7339006, lon: 106.7079854, primary: true },
      { name: 'SC VivoCity', lat: 10.7302089, lon: 106.7033641, distance: '1,5 km' },
      { name: 'ĐH Tôn Đức Thắng', nameEn: 'Ton Duc Thang University', lat: 10.7319314, lon: 106.6993418, distance: '2,2 km' },
      { name: 'Lotte Mart Quận 7', nameEn: 'Lotte Mart District 7', lat: 10.7409449, lon: 106.7018086, distance: '3,3 km' },
      { name: 'Crescent Mall', lat: 10.7285028, lon: 106.7187707, distance: '2,2 km', labelSide: 'left' },
      { name: 'Cầu Ánh Sao', nameEn: 'Starlight Bridge', lat: 10.7265469, lon: 106.7186725, distance: '2,6 km', labelSide: 'left' },
    ],
  },
};

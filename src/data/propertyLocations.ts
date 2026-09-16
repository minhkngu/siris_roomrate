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
  roadLabels: Array<{ name: string; lat: number; lon: number; rotation: number }>;
}

const nearbyRoadLabels = [
  // Anchors projected onto actual OSM road segments; angles follow the segment.
  { name: 'Nguyễn Thị Thập', lat: 10.7387621, lon: 106.7113764, rotation: 7.6 },
  { name: 'Nguyễn Hữu Thọ', lat: 10.7366196, lon: 106.7003162, rotation: -80.2 },
  { name: 'Nguyễn Văn Linh', lat: 10.7282522, lon: 106.7075012, rotation: -1.5 },
  { name: 'Nguyễn Đổng Chi', lat: 10.7350608, lon: 106.7095898, rotation: 43.6 },
  { name: 'Bùi Bằng Đoàn', lat: 10.7320106, lon: 106.7085163, rotation: 88.8 },
];

export const propertyLocations: Record<string, PropertyLocationData> = {
  mia: {
    mapImage: '/maps/siris-mia-street-map.png?v=4',
    center: { lat: 10.7339474, lon: 106.7072669 },
    roadLabels: nearbyRoadLabels,
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
    mapImage: '/maps/siris-lune-street-map.png?v=4',
    center: { lat: 10.7339006, lon: 106.7079854 },
    roadLabels: nearbyRoadLabels,
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

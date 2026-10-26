const asBoolean = value => (Array.isArray(value) ? value : [value]).some(item => item === true || String(item).trim().toLowerCase() === 'true');
const parsePolicies = value => {
  if (!value) return [];
  const policies = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(policies)) throw new Error('Policies must be an array');
  return policies;
};
const parseList = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value.trim().startsWith('[')) return JSON.parse(value);
  const items = [];
  let depth = 0;
  let current = '';
  for (const character of value) {
    if (character === '(') depth++;
    if (character === ')') depth = Math.max(0, depth - 1);
    if ((character === ',' || character === ';') && depth === 0) {
      if (current.trim()) items.push(current.trim());
      current = '';
    } else current += character;
  }
  if (current.trim()) items.push(current.trim());
  return items;
};
const normalizeAmenities = row => Object.fromEntries(
  ['amenities', 'amenities_en', 'excluded_amenities', 'excluded_amenities_en'].map(field => [field, parseList(row[field])]),
);
const parseSetting = value => {
  if (!value || typeof value !== 'string') return value;
  try {
    const decoded = JSON.parse(value);
    return decoded && typeof decoded === 'object' && !Array.isArray(decoded) && 'value' in decoded ? decoded.value : decoded;
  } catch { return value; }
};

export function normalizeShortTermData(raw) {
  const data = structuredClone(raw);
  data.branches = data.branches.filter(row => row.name?.trim()).map(row => ({
    ...row, ...normalizeAmenities(row), is_hidden: asBoolean(row.is_hidden),
    policies: parsePolicies(row.policies), policies_en: parsePolicies(row.policies_en),
  }));
  const branchIds = new Set(data.branches.map(row => row.id));
  data.rooms = data.rooms.filter(row => row.name?.trim()).map(row => {
    const branchId = row.braches?.[0]?.id;
    if (!branchIds.has(branchId)) throw new Error(`Room ${row.name} has no valid branch`);
    for (const field of ['weekdayprice', 'weekendprice', 'monthly_under_3']) {
      if (typeof row[field] !== 'number' || row[field] < 0) throw new Error(`Invalid ${field}: ${row.name}`);
    }
    return { ...row, ...normalizeAmenities(row), branch_id: branchId, is_hidden: asBoolean(row.is_hidden) };
  });
  data.settings = data.settings.map(row => ({ ...row, value: parseSetting(row.value), value_en: parseSetting(row.value_en) }));
  data.dateAdjustments = data.dateAdjustments.filter(row => row.date && row.type && row.amount != null).map(row => ({
    ...row, date: typeof row.date === 'number' ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(row.date)) : row.date.slice(0, 10),
    ispercentage: asBoolean(row.ispercentage),
  }));
  return Object.assign(data, { amenities: [], branchAmenities: [], roomAmenities: [] });
}

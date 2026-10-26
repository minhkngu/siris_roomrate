import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, '.local');
const baseToken = 'KUKTbQ9cJao9oJsOuxIlDQtVgih';
const tables = {
  branches: 'tblnBd25IKxmXWUP',
  rooms: 'tbltQk4cUAgQh2jC',
  settings: 'tblQzS1E4Ihwg40W',
  discounts: 'tbl25YrJ22bB7b7k',
  dateAdjustments: 'tblqrz52mKLrds4m',
};
const run = promisify(execFile);
const cli = async (...args) => {
  const { stdout } = await run('lark-cli', ['base', ...args, '--as', 'user'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30_000 });
  return JSON.parse(stdout);
};
// Reuse column definitions only. Cell values are read fresh on every request.
const columnDefinitions = new Map();
async function getColumns(tableId) {
  const saved = columnDefinitions.get(tableId);
  if (saved && saved.expiresAt > Date.now()) return saved.fields;
  const schema = await cli('+field-list', '--base-token', baseToken, '--table-id', tableId);
  if (!schema.ok) throw new Error(JSON.stringify(schema.error));
  const fields = schema.data.fields.flatMap(field => ['--field-id', field.id]);
  columnDefinitions.set(tableId, { fields, expiresAt: Date.now() + 5 * 60_000 });
  return fields;
}
const asBoolean = value => (Array.isArray(value) ? value : [value]).some(item => item === true || String(item).trim().toLowerCase() === 'true');
const parsePolicies = value => {
  if (!value) return [];
  const policies = JSON.parse(value);
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
  if (!value) return value;
  try {
    const decoded = JSON.parse(value);
    return decoded && typeof decoded === 'object' && !Array.isArray(decoded) && 'value' in decoded ? decoded.value : decoded;
  } catch { return value; }
};

export async function readShortTermFromBase() {
  const data = { source: 'Siris Web / short-term', syncedAt: new Date().toISOString() };
  // Read each table directly into memory without export files or statistics.
  const results = await Promise.allSettled(Object.entries(tables).map(async ([name, tableId]) => {
    const fields = await getColumns(tableId);
    const rows = [];
    let offset = 0;
    let hasMore;
    do {
      const result = await cli('+record-list', '--base-token', baseToken, '--table-id', tableId, ...fields, '--format', 'json', '--limit', '200', '--offset', String(offset));
      if (!result.ok) throw new Error(`Cannot read ${name}`);
      rows.push(...decodeRecords(result.data));
      hasMore = result.data.has_more;
      if (typeof hasMore !== 'boolean' || (hasMore && !result.data.data.length)) throw new Error(`Incomplete response: ${name}`);
      offset += result.data.data.length;
    } while (hasMore);
    return [name, rows];
  }));
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason;
    const [name, rows] = result.value;
    data[name] = rows;
  }
  return normalizeShortTermData(data);
}

export function decodeRecords(page) {
  if (!Array.isArray(page.data) || !Array.isArray(page.fields) || !Array.isArray(page.record_id_list) || page.record_id_list.length !== page.data.length) {
    throw new Error('Invalid Lark record matrix');
  }
  return page.data.map((values, index) => {
    if (!Array.isArray(values) || values.length !== page.fields.length) throw new Error('Invalid Lark record columns');
    const record = Object.fromEntries(page.fields.map((field, column) => [field, values[column]]));
    return { ...record, record_id: page.record_id_list[index], id: record.id || page.record_id_list[index] };
  });
}

export function normalizeShortTermData(raw) {
const data = structuredClone(raw);
// Empty Base rows are placeholders, not published properties or rooms.
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
Object.assign(data, { amenities: [], branchAmenities: [], roomAmenities: [] });
return data;
}

let pending;
export function getShortTermData() {
  if (pending) return pending;
  pending = readShortTermFromBase().finally(() => { pending = undefined; });
  return pending;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const data = await getShortTermData();
  mkdirSync(directory, { recursive: true });
  const target = path.join(directory, 'short-term.json');
  writeFileSync(`${target}.tmp`, JSON.stringify(data, null, 2));
  renameSync(`${target}.tmp`, target);
  console.log(`Read from Lark Base: ${data.branches.length} properties, ${data.rooms.length} rooms`);
}

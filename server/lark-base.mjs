import { normalizeShortTermData } from './normalize-short-term.mjs';

const API = 'https://open.larksuite.com/open-apis';
const TABLES = {
  branches: 'tblnBd25IKxmXWUP',
  rooms: 'tbltQk4cUAgQh2jC',
  settings: 'tblQzS1E4Ihwg40W',
  discounts: 'tbl25YrJ22bB7b7k',
  dateAdjustments: 'tblqrz52mKLrds4m',
};
const NUMBERS = new Set(['weekdayprice', 'weekendprice', 'monthly_under_3', 'monthly_over_3', 'sqm', 'area', 'amount', 'minnights', 'discountamount']);

export function decodeApiRecord(item) {
  if (!item?.record_id || !item.fields || typeof item.fields !== 'object') throw new Error('Invalid Lark record');
  const fields = {};
  for (const [name, value] of Object.entries(item.fields)) {
    if (Array.isArray(value) && value.some(part => Array.isArray(part?.record_ids))) {
      fields[name] = value.flatMap(part => (part.record_ids || []).map(id => ({ id })));
    } else if (Array.isArray(value) && value.length && value.every(part => typeof part?.text === 'string')) {
      fields[name] = value.map(part => part.text).join('');
    } else if (NUMBERS.has(name) && typeof value === 'string' && value.trim()) {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`Invalid number in Lark field: ${name}`);
      fields[name] = number;
    } else if (name === 'date' && typeof value === 'string' && /^\d{13}$/.test(value)) {
      fields[name] = Number(value);
    } else {
      fields[name] = value;
    }
  }
  return { ...fields, id: fields.id || item.record_id, record_id: item.record_id };
}

export function createLarkReader({ appId, appSecret, baseToken = 'KUKTbQ9cJao9oJsOuxIlDQtVgih', fetcher = fetch }) {
  let token;
  let tokenExpiresAt = 0;
  let authenticating;
  let pending;

  async function request(path, options = {}) {
    const response = await fetcher(`${API}${path}`, { ...options, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    const body = await response.json();
    if (!response.ok || body.code !== 0) {
      const error = new Error(`Lark API request failed (${response.status}/${body.code ?? 'unknown'})`);
      error.expiredToken = response.status === 401 || [99991663, 99991664, 99991668].includes(body.code);
      throw error;
    }
    return body;
  }

  async function getToken() {
    if (!appId || !appSecret) throw new Error('Missing server-side LARK_APP_ID or LARK_APP_SECRET');
    if (token && Date.now() < tokenExpiresAt) return token;
    if (authenticating) return authenticating;
    authenticating = (async () => {
      const auth = await request('/auth/v3/tenant_access_token/internal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      });
      if (!auth.tenant_access_token || !Number.isFinite(auth.expire)) throw new Error('Invalid Lark authentication response');
      token = auth.tenant_access_token;
      tokenExpiresAt = Date.now() + Math.max(0, auth.expire - 60) * 1000;
      return token;
    })().finally(() => { authenticating = undefined; });
    return authenticating;
  }

  async function readTable(tableId, accessToken) {
    const rows = [];
    let pageToken;
    const seenTokens = new Set();
    do {
      const query = new URLSearchParams({ page_size: '500' });
      if (pageToken) query.set('page_token', pageToken);
      const { data } = await request(`/bitable/v1/apps/${baseToken}/tables/${tableId}/records?${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!Array.isArray(data?.items) || typeof data.has_more !== 'boolean') throw new Error('Invalid Lark records response');
      rows.push(...data.items.map(decodeApiRecord));
      pageToken = data.has_more ? data.page_token : undefined;
      if (data.has_more && (!pageToken || seenTokens.has(pageToken))) throw new Error('Incomplete Lark pagination');
      if (pageToken) seenTokens.add(pageToken);
    } while (pageToken);
    return rows;
  }

  async function read(retry = true) {
    const accessToken = await getToken();
    try {
      const entries = await Promise.all(Object.entries(TABLES).map(async ([name, tableId]) => [name, await readTable(tableId, accessToken)]));
      return normalizeShortTermData({ source: 'Siris Web / short-term', syncedAt: new Date().toISOString(), ...Object.fromEntries(entries) });
    } catch (error) {
      if (!retry || !error.expiredToken) throw error;
      token = undefined;
      return read(false);
    }
  }

  // Only authentication is retained; table values are always read fresh.
  return () => {
    if (pending) return pending;
    pending = read().finally(() => { pending = undefined; });
    return pending;
  };
}

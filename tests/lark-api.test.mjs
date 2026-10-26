import test from 'node:test';
import assert from 'node:assert/strict';
import { createLarkReader, decodeApiRecord } from '../server/lark-base.mjs';

test('API values preserve links and convert string prices without changing Cloudinary tags', () => {
  const row = decodeApiRecord({ record_id: 'room', fields: {
    name: [{ text: 'Studio' }], braches: [{ record_ids: ['mia'], text: 'Mia' }],
    weekdayprice: '440000', is_hidden: 'false', date: '1772902800000', tag: 'deluxe_ 1br_apartment',
  } });
  assert.equal(row.name, 'Studio');
  assert.deepEqual(row.braches, [{ id: 'mia' }]);
  assert.equal(row.weekdayprice, 440000);
  assert.equal(row.tag, 'deluxe_ 1br_apartment');
  assert.equal(row.date, 1772902800000);
  assert.throws(() => decodeApiRecord({ fields: {} }), /Invalid Lark record/);
});

test('direct reader reuses authentication, reads new cells and traverses all pages', async () => {
  let authCalls = 0;
  let roomReads = 0;
  let dataCalls = 0;
  const reader = createLarkReader({ appId: 'test-app', appSecret: 'test-secret', fetcher: async (url, options) => {
    assert.equal(options.cache, 'no-store');
    if (url.includes('/auth/')) {
      authCalls++;
      return Response.json({ code: 0, tenant_access_token: 'test-token', expire: 7200 });
    }
    dataCalls++;
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    const rooms = url.includes('tbltQk4cUAgQh2jC');
    const branches = url.includes('tblnBd25IKxmXWUP');
    const secondPage = url.includes('page_token=next');
    if (rooms && !secondPage) roomReads++;
    const items = branches ? [{ record_id: 'mia', fields: { name: 'Mia', is_hidden: 'false' } }]
      : rooms && !secondPage ? [{ record_id: 'room', fields: { name: 'Studio', braches: [{ record_ids: ['mia'], text: 'Mia' }], weekdayprice: String(roomReads === 1 ? 440000 : 460000), weekendprice: '480000', monthly_under_3: '10200000' } }] : [];
    return Response.json({ code: 0, data: { items, has_more: rooms && !secondPage, page_token: rooms && !secondPage ? 'next' : undefined } });
  } });
  const [first, concurrent] = await Promise.all([reader(), reader()]);
  assert.strictEqual(first, concurrent);
  assert.equal(dataCalls, 6);
  assert.equal(first.rooms[0].weekdayprice, 440000);
  assert.equal(first.rooms[0].branch_id, 'mia');
  const second = await reader();
  assert.equal(second.rooms[0].weekdayprice, 460000);
  assert.equal(authCalls, 1);
  assert.equal(dataCalls, 12);
});

test('a failed upstream read never returns cached table data and can recover', async () => {
  let fail = true;
  const reader = createLarkReader({ appId: 'app', appSecret: 'secret', fetcher: async url => {
    if (url.includes('/auth/')) return Response.json({ code: 0, tenant_access_token: 'token', expire: 7200 });
    return fail ? Response.json({ code: 123 }, { status: 503 }) : Response.json({ code: 0, data: { items: [], has_more: false } });
  } });
  await assert.rejects(reader(), /Lark API request failed/);
  fail = false;
  assert.equal((await reader()).rooms.length, 0);
});

test('missing credentials fail before any network request', async () => {
  let requested = false;
  const reader = createLarkReader({ appId: '', appSecret: '', fetcher: async () => { requested = true; } });
  await assert.rejects(reader(), /Missing server-side/);
  assert.equal(requested, false);
});

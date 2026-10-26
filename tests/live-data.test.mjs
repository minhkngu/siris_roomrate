import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllData, fetchProperties } from '../src/services/dataService.ts';

const emptyBase = () => ({ branches: [], rooms: [], discounts: [], amenities: [], branchAmenities: [], roomAmenities: [], settings: [], dateAdjustments: [] });

test('successive reads reflect changed prices and visibility without a page reload', async t => {
  let reads = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/short-term');
    assert.equal(options.cache, 'no-store');
    reads++;
    return Response.json({ ...emptyBase(), branches: [{ id: 'lune', name: 'Lune', is_hidden: reads === 3 }], rooms: [{ id: 'room', branch_id: 'lune', name: 'Studio', weekdayprice: reads === 1 ? 400000 : 450000 }] });
  });
  assert.equal((await fetchProperties()).properties[0].rooms[0].pricing.weekday, 400000);
  assert.equal((await fetchProperties()).properties[0].rooms[0].pricing.weekday, 450000);
  assert.equal((await fetchProperties()).properties.length, 0);
  assert.equal(reads, 3);
});

test('cleared Base cells stay empty instead of reviving sample amenities and policies', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...emptyBase(), branches: [{ id: 'lune', name: 'Lune' }], rooms: [{ id: 'room', branch_id: 'lune', name: 'Studio' }] }));
  const data = await fetchProperties();
  assert.deepEqual(data.generalPolicies, []);
  assert.deepEqual(data.properties[0].policies, []);
  assert.deepEqual(data.properties[0].amenities, []);
  assert.deepEqual(data.properties[0].rooms[0].amenities, []);
  assert.deepEqual(data.properties[0].rooms[0].images, []);
  assert.equal(data.properties[0].rooms[0].pricing.fees, '');
});

test('upstream errors are reported, then a later request can recover', async t => {
  let fail = true;
  t.mock.method(globalThis, 'fetch', async () => fail ? new Response('', { status: 502 }) : Response.json(emptyBase()));
  await assert.rejects(fetchAllData(), /Cannot load/);
  fail = false;
  assert.deepEqual(await fetchAllData(), emptyBase());
});


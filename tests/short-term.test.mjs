import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeRecords } from '../scripts/sync-short-term.mjs';
import { normalizeShortTermData } from '../server/normalize-short-term.mjs';

test('decodes the direct Base matrix using response column order and stable record IDs', () => {
  const rows = decodeRecords({ fields: ['name', 'branch', 'weekdayprice'], record_id_list: ['rec-room'], data: [['Studio', [{ id: 'rec-branch' }], 460000]] });
  assert.deepEqual(rows, [{ name: 'Studio', branch: [{ id: 'rec-branch' }], weekdayprice: 460000, record_id: 'rec-room', id: 'rec-room' }]);
  assert.throws(() => decodeRecords({ fields: ['name'], record_id_list: [], data: [['Studio']] }), /Invalid Lark/);
  assert.throws(() => decodeRecords({ fields: ['name', 'price'], record_id_list: ['room'], data: [['Studio']] }), /Invalid Lark/);
});

const fixture = () => ({
  source: 'Siris Web / short-term',
  branches: [{ id: 'mia', name: 'Mia', is_hidden: ['false'], policies: '[{"content":"Policy"}]' }, { id: 'blank', name: null }],
  rooms: [{ id: 'room', name: 'Studio', branch: [{ id: 'mia' }], weekdayprice: 460000, weekendprice: 550000, monthly_under_3: 12000000, is_hidden: 'false', tag: 'deluxe_ 1br_apartment', amenities: 'wifi,bếp (không có gia vị,lò vi sóng)', amenities_en: 'Wi-Fi,kitchen (no condiments,no microwave)' }],
  settings: [{ key: 'email', value: '{"value":"info@siris.vn"}' }, { key: 'general_policies', value: '[{"title":"Check-in","content":"14:00"}]' }],
  discounts: [], dateAdjustments: [{ id: 'adjustment', date: 1772902800000, type: 'surcharge', amount: 200000, ispercentage: 'false' }, { date: null }],
});

test('preserves branch links, prices, Cloudinary tags and bilingual grouped amenities', () => {
  const raw = fixture();
  const data = normalizeShortTermData(raw);
  assert.equal(data.branches.length, 1);
  assert.equal(data.rooms[0].branch_id, 'mia');
  assert.equal(data.rooms[0].weekendprice, 550000);
  assert.equal(data.rooms[0].tag, 'deluxe_ 1br_apartment');
  assert.deepEqual(data.rooms[0].amenities, ['wifi', 'bếp (không có gia vị,lò vi sóng)']);
  assert.deepEqual(data.rooms[0].amenities_en, ['Wi-Fi', 'kitchen (no condiments,no microwave)']);
  assert.equal(typeof raw.rooms[0].amenities, 'string');
});

test('normalizes visibility, settings and Vietnam dates without losing policies', () => {
  const data = normalizeShortTermData(fixture());
  assert.equal(data.branches[0].is_hidden, false);
  assert.equal(data.rooms[0].is_hidden, false);
  assert.equal(data.settings[0].value, 'info@siris.vn');
  assert.equal(data.settings[1].value[0].title, 'Check-in');
  assert.deepEqual(data.branches[0].policies, [{ content: 'Policy' }]);
  assert.equal(data.dateAdjustments.length, 1);
  assert.equal(data.dateAdjustments[0].ispercentage, false);
  assert.equal(data.dateAdjustments[0].date, '2026-03-08');
});

test('rejects orphan rooms rather than silently showing incorrect properties', () => {
  const raw = fixture();
  raw.rooms[0].branch = [{ id: 'missing' }];
  assert.throws(() => normalizeShortTermData(raw), /no valid branch/);
});

test('rejects invalid prices and preserves true visibility flags', () => {
  const raw = fixture();
  raw.rooms[0].is_hidden = 'true';
  assert.equal(normalizeShortTermData(raw).rooms[0].is_hidden, true);
  raw.rooms[0].weekdayprice = null;
  assert.throws(() => normalizeShortTermData(raw), /Invalid weekdayprice/);
});

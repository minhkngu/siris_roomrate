import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/short-term.js';

test('production endpoint rejects mutations and disables response caching', async () => {
  const headers = new Map();
  let body;
  const response = { statusCode: 0, setHeader: (name, value) => headers.set(name, value), end: value => { body = JSON.parse(value); } };
  await handler({ method: 'POST' }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(headers.get('Allow'), 'GET');
  assert.equal(headers.get('Cache-Control'), 'no-store, max-age=0');
  assert.equal(body.error, 'Method not allowed');
});

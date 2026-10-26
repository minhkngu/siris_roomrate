import { createLarkReader } from '../server/lark-base.mjs';

const read = createLarkReader({
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  baseToken: process.env.LARK_BASE_TOKEN,
});

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.statusCode = 405;
    response.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  try {
    response.statusCode = 200;
    response.end(JSON.stringify(await read()));
  } catch (error) {
    console.error('Lark Base read failed:', error.message);
    response.statusCode = 502;
    response.end(JSON.stringify({ error: 'Unable to read property data from Lark Base' }));
  }
}

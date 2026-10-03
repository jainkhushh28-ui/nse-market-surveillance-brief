import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const port = process.env.PORT || 3000;
const MCP_URL = 'https://mcp.nseindia.in/bhavcopy/cm/mcp';

function sseJson(text) {
  const line = text.split('\n').find((value) => value.startsWith('data:'));
  return JSON.parse((line ? line.slice(5) : text).trim());
}

async function nseMcp(method, params) {
  const init = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'disclosure-triage-prototype', version: '0.1.0' }
    }})
  });
  if (!init.ok) throw new Error(`NSE MCP initialization failed (${init.status})`);
  const session = init.headers.get('mcp-session-id');
  if (!session) throw new Error('NSE MCP did not issue a session ID');
  await fetch(MCP_URL, { method: 'POST', headers: { 'Mcp-Session-Id': session, 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) });
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Mcp-Session-Id': session, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method, params })
  });
  if (!response.ok) throw new Error(`NSE MCP request failed (${response.status})`);
  return sseJson(await response.text());
}

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    if (req.url?.startsWith('/api/brief')) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const symbol = (url.searchParams.get('symbol') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!symbol) throw new Error('A valid NSE symbol is required.');
      const [volume, range, actions] = await Promise.all([
        nseMcp('tools/call', { name: 'get_volume_analysis', arguments: { symbol, days: 30 } }),
        nseMcp('tools/call', { name: 'get_52_week_high_low', arguments: { symbol } }),
        nseMcp('tools/call', { name: 'get_corporate_actions', arguments: { symbol, fromDate: '2025-01-01', toDate: 'today' } })
      ]);
      const text = (rpc) => rpc.result?.content?.map((item) => item.text || '').join('\n') || '';
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ symbol, volume: text(volume), range: text(range), corporateActions: text(actions), fetchedAt: new Date().toISOString(), source: 'NSE Bhavcopy MCP' }));
    }
    const requested = req.url === '/' ? 'public/index.html' : `public${req.url}`;
    const safe = requested.replaceAll('..', '');
    const file = join(root, safe);
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (error) {
    res.writeHead(req.url?.startsWith('/api/') ? 502 : 404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message || 'Not found' }));
  }
});
server.listen(port, () => console.log(`Market Surveillance Brief: http://localhost:${port}`));

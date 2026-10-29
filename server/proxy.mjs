// 极简 OpenAI 兼容转发：给不支持浏览器跨域的厂商用。
// 用法：node server/proxy.mjs
// 可选环境变量：PORT（默认 8787）、ALLOW_ORIGIN（默认 *）、PROXY_TOKEN（默认空）、ALLOW_EXTRA_HOSTS
// Base URL 示例：http://127.0.0.1:8787/https://open.bigmodel.cn/api/paas/v4
import http from 'node:http';
import { Readable } from 'node:stream';

const ALLOW_HOSTS = new Set([
  'api.deepseek.com',
  'api.moonshot.cn',
  'open.bigmodel.cn',
  'dashscope.aliyuncs.com',
  'ark.cn-beijing.volces.com',
  'api.hunyuan.cloud.tencent.com',
  'qianfan.baidubce.com',
  'spark-api-open.xf-yun.com',
  'api.siliconflow.cn',
  'api.minimaxi.com',
  'api.baichuan-ai.com',
  'api.stepfun.com',
  'api.openai.com',
  ...String(process.env.ALLOW_EXTRA_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
]);

const PORT = Number(process.env.PORT || 8787);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
const TOKEN = String(process.env.PROXY_TOKEN || '').trim();
const TIMEOUT = 180_000;

function cors(res, req) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'authorization, content-type'
  );
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
}

function fail(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: { message: '转发失败：' + message, type: 'proxy_error' } }));
}

const server = http.createServer(async (req, res) => {
  cors(res, req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== 'POST') {
    fail(res, 405, '只接受 POST');
    return;
  }

  if (TOKEN && req.headers['x-proxy-token'] !== TOKEN) {
    fail(res, 401, '缺少或填错了 x-proxy-token');
    return;
  }

  let target;
  try {
    target = new URL(decodeURIComponent(String(req.url || '').replace(/^\//, '')));
  } catch {
    fail(res, 400, '路径应为 /https://host/path');
    return;
  }

  if (target.protocol !== 'https:' || (target.port && target.port !== '443')) {
    fail(res, 403, '只转发 https 的 443 端口');
    return;
  }
  if (!ALLOW_HOSTS.has(target.hostname)) {
    fail(res, 403, '目标域名不在白名单内');
    return;
  }

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (
      ['host', 'origin', 'referer', 'content-length', 'connection', 'x-proxy-token'].includes(
        name.toLowerCase()
      ) ||
      value == null
    ) {
      continue;
    }
    headers[name] = value;
  }

  let body;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 2_000_000) {
        fail(res, 413, '请求体超过 2MB');
        return;
      }
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  } catch {
    fail(res, 400, '读取请求体失败');
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  res.on('close', () => controller.abort());

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body,
      redirect: 'manual',
      signal: controller.signal,
    });

    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    });

    if (upstream.body) Readable.fromWeb(upstream.body).pipe(res);
    else res.end();
  } catch (err) {
    console.error('上游请求失败：', err?.message || err, err?.cause || '');
    if (!res.headersSent) fail(res, 502, err?.name === 'AbortError' ? '上游超时' : '连不上上游');
    else res.end();
  } finally {
    clearTimeout(timer);
  }
});

server.listen(PORT, () => {
  console.log(`转发已启动：http://127.0.0.1:${PORT}`);
  console.log(`Base URL 示例：http://127.0.0.1:${PORT}/https://open.bigmodel.cn/api/paas/v4`);
});

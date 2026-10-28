import { pathToFileURL } from 'node:url';

const sites = {
  home: 'https://cinkr.com', richauto: 'https://richauto.cinkr.com',
  kinco: 'https://kinco.cinkr.com', hqd: 'https://hqd.cinkr.com', mpg: 'https://mpg.cinkr.com'
};

export async function audit({ origin, base, paths = ['/'], preview = false, fetcher = fetch }) {
  const started = Date.now();
  const failures = [];
  const counts = { pages: 0, assets: 0, notFound: 0 };
  const assets = new Set();
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const get = async (path, readBody = true) => {
    const url = new URL(path, base);
    if (url.origin !== new URL(base).origin) throw new Error(`Unexpected host: ${url.origin}`);
    try {
      const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(12000) });
      const text = readBody ? await response.text() : '';
      if (!readBody && response.body) await response.body.cancel();
      return { response, text };
    } catch (error) {
      failures.push(`${url.pathname}: request failed: ${error.message}`);
      return null;
    }
  };
  const pending = [...new Set(['/', ...paths])];
  for (const path of pending) {
    if (!path.startsWith('/') || path.startsWith('//') || new URL(path, base).origin !== new URL(base).origin) throw new Error(`Invalid page path: ${path}`);
  }
  await Promise.all(pending.map(async path => {
    const result = await get(path); counts.pages++;
    if (!result) return;
    const {response, text} = result;
    check(response.status === 200, `${path}: expected 200, got ${response.status}`);
    check(/text\/html/i.test(response.headers.get('content-type') || ''), `${path}: expected HTML`);
    const canonical = [...text.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)].map(m => m[0].match(/href=["']([^"']+)/i)?.[1]);
    check(canonical.length === 1 && canonical[0] === new URL(path, origin).href, `${path}: wrong or missing canonical`);
    check(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(text), `${path}: unexpected noindex meta`);
    const robots = response.headers.get('x-robots-tag') || '';
    check(preview ? /noindex/i.test(robots) : !/noindex/i.test(robots), `${path}: unexpected X-Robots-Tag ${robots}`);
    for (const h of ['content-security-policy','strict-transport-security','x-content-type-options','x-frame-options','referrer-policy','permissions-policy']) check(response.headers.has(h), `${path}: missing ${h}`);
    for (const m of text.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
      try {
        const url = new URL(m[1].replaceAll('&amp;', '&'), new URL(path, origin));
        if (url.origin === origin && /\.(?:css|m?js|png|jpe?g|webp|avif|svg|ico|woff2?)(?:$)/i.test(url.pathname)) assets.add(`${url.pathname}${url.search}`);
      } catch { /* Non-URL attributes are not assets. */ }
    }
  }));
  const missing = await get('/acceptance-path-that-does-not-exist/'); counts.notFound++;
  if (missing) check(missing.response.status === 404, `unknown path: expected 404, got ${missing.response.status}`);
  const queue = [...assets];
  await Promise.all(Array.from({length: Math.min(6, queue.length)}, async () => {
    while (queue.length) {
      const path = queue.shift(); const result = await get(path, false); counts.assets++;
      if (!result) continue;
      check(result.response.status === 200, `${path}: asset expected 200, got ${result.response.status}`);
      check(!/text\/html/i.test(result.response.headers.get('content-type') || ''), `${path}: asset returned HTML`);
    }
  }));
  check(counts.assets > 0, 'No assets discovered on selected pages');
  return { base, preview, checked: counts, elapsedMs: Date.now() - started, failures };
}

async function main() {
  const args = process.argv.slice(2);
  const option = name => args.find(x => x.startsWith(`--${name}=`))?.slice(name.length + 3);
  const site = option('site');
  if (!sites[site]) throw new Error('Use --site=home|richauto|kinco|hqd|mpg');
  const preview = args.includes('--preview');
  const origin = sites[site];
  const base = option('base') || `${origin}/`;
  const parsed = new URL(base);
  const projects = {home:'cinkr-home',richauto:'cinkr-richauto',kinco:'cinkr-hmi',hqd:'cinkr-hqd',mpg:'cinkr-mpg'};
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash || (preview ? !new RegExp(`^[a-z0-9]+\\.${projects[site]}\\.pages\\.dev$`).test(parsed.hostname) : parsed.origin !== origin)) throw new Error('Expected a fixed Pages preview URL or the selected production origin');
  const paths = args.filter(x => x.startsWith('--path=')).map(x => x.slice(7));
  if (site === 'home' && !paths.includes('/privacy-policy/')) paths.push('/privacy-policy/');
  const result = await audit({origin, base: parsed.href, paths, preview});
  console.log(JSON.stringify({site,...result}));
  if (result.failures.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });

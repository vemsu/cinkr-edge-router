import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audit } from '../scripts/acceptance-quick.mjs';

const origin = 'https://cinkr.com';
const headers = {'content-type':'text/html','content-security-policy':'default-src self','strict-transport-security':'max-age=1','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','permissions-policy':'camera=()'};
const html = '<link rel="canonical" href="https://cinkr.com/"><script src="/app.js"></script>';
const mock = ({assetStatus=200, pageStatus=200, robot='', assetType='text/javascript'}={}) => async url => {
  if (url.pathname.includes('acceptance-path')) return new Response('missing', {status:404});
  if (url.pathname === '/app.js') return new Response('asset', {status:assetStatus, headers:{'content-type':assetType}});
  return new Response(html,{status:pageStatus,headers:{...headers,...(robot ? {'x-robots-tag':robot} : {})}});
};
test('passes a production page and its real asset', async () => {
  const result = await audit({origin,base:origin+'/',fetcher:mock()});
  assert.deepEqual(result.failures, []);
  assert.equal(result.checked.assets,1);
});
test('rejects missing assets and an HTML fallback', async () => {
  const missing = await audit({origin,base:origin+'/',fetcher:mock({assetStatus:404})});
  assert.ok(missing.failures.some(x => x.includes('asset expected 200')));
  const fallback = await audit({origin,base:origin+'/',fetcher:mock({assetType:'text/html'})});
  assert.ok(fallback.failures.some(x => x.includes('asset returned HTML')));
});
test('rejects redirected pages and production noindex', async () => {
  const redirected = await audit({origin,base:origin+'/',fetcher:mock({pageStatus:301})});
  assert.ok(redirected.failures.some(x => x.includes('expected 200')));
  const noindex = await audit({origin,base:origin+'/',fetcher:mock({robot:'noindex'})});
  assert.ok(noindex.failures.some(x => x.includes('X-Robots-Tag')));
});
test('requires noindex on preview and forbids cross-origin paths', async () => {
  const preview = await audit({origin,base:'https://abcdef.cinkr-home.pages.dev/',preview:true,fetcher:mock({robot:'noindex'})});
  assert.deepEqual(preview.failures, []);
  await assert.rejects(() => audit({origin,base:origin+'/',paths:['//outside.example/'],fetcher:mock()}),/Invalid page path/);
});

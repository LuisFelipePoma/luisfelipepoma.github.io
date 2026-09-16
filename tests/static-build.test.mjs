import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const pages = [{path:'dist/index.html',lang:'es',heading:'Ingeniero de',cv:'PDF · Español'}, {path:'dist/en/index.html',lang:'en',heading:'Software',cv:'PDF · Spanish'}];
for (const page of pages) {
  test(page.lang + ': static routes, translations, links and complete fallback content', async () => {
    const html = await readFile(page.path, 'utf8');
    assert.match(html, new RegExp('<html lang="' + page.lang + '"'));
    assert.ok(html.includes(page.heading));
    assert.ok(html.includes(page.cv));
    assert.ok(html.includes('lfpasep9@gmail.com'));
    assert.equal((html.match(/<article /g) || []).length, 4);
    assert.equal((html.match(/\bdata-scene=/g) || []).length, 7);
    assert.equal((html.match(/\bdata-cloud-zone/g) || []).length, 7,
      'hero, four projects, about and contact need visible cloud space');
    assert.equal((html.match(/\bdata-matter-fallback/g) || []).length, 7,
      'every scene needs a static SVG fallback');
    for (const id of ['inicio','trabajo','monitoreo','documentos','uribe','catmap','sobre-mi','contacto']) assert.ok(html.includes('id="' + id + '"'), id);
    for (const lang of ['es','en','x-default']) assert.ok(html.includes('hreflang="' + lang + '"'));
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const [,href] of html.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.has(href), 'Missing anchor ' + href);
    for (const [,url] of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
      if (url.includes('?')) continue;
      await access(resolve('dist', '.' + url + (url.endsWith('/') ? 'index.html' : '')));
    }
    assert.doesNotMatch(html, /impeccable|Direction contract|5c931385|placeholder|Lorem ipsum/);
    assert.match(html, /mailto:lfpasep9@gmail.com/);
    assert.match(html, /role="status"/);
  });
}
test('the downloadable CV is identical to the supplied Spanish source', async () => {
  const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
  assert.equal(await hash('dist/cv/Luis-Felipe-Poma-CV-ES.pdf'), await hash('mockup/CV_ES_20260807_091331_0000.pdf'));
});

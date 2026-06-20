import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, industries, services } from '../src/services.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = ['/', '/dienstleistungen/', ...categories.map(item => `/dienstleistungen/${item.key}/`), '/dienstleistungen/branchen/', ...services.map(item => item.path), ...industries.map(item => item.path), '/ueber-uns/', '/jobs/'];
const errors = [];
const wordCounts = [];
const targetFile = pathname => pathname === '/' ? path.join(root, 'index.html') : path.join(root, pathname.replace(/^\//, ''), 'index.html');
const serviceKeys = new Set(services.map(service => service.key));
for (const service of services) {
  for (const related of service.related) if (!serviceKeys.has(related)) errors.push(`${service.key}: verwandte Leistung fehlt (${related})`);
}
if (new Set(services.map(service => service.path)).size !== services.length) errors.push('Leistungs-URLs sind nicht eindeutig');

for (const pathname of generated) {
  const file = targetFile(pathname);
  let html;
  try { html = await readFile(file, 'utf8'); } catch { errors.push(`${pathname}: Datei fehlt`); continue; }
  const count = pattern => (html.match(pattern) || []).length;
  const headHtml = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || '';
  if (count(/<h1\b/gi) !== 1) errors.push(`${pathname}: erwartet genau eine H1`);
  if ((headHtml.match(/<title>/gi) || []).length !== 1) errors.push(`${pathname}: Title fehlt oder doppelt`);
  const titleText = headHtml.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  if (titleText.length > 65) errors.push(`${pathname}: Title zu lang (${titleText.length})`);
  if (!/<meta name="description" content="[^"]+">/i.test(html)) errors.push(`${pathname}: Meta Description fehlt`);
  const descriptionText = html.match(/<meta name="description" content="([^"]+)">/i)?.[1] || '';
  if (descriptionText.length > 165) errors.push(`${pathname}: Meta Description zu lang (${descriptionText.length})`);
  if (!/<link rel="canonical" href="https:\/\/reinigungsprofi-leipzig\.de\//i.test(html)) errors.push(`${pathname}: Canonical fehlt`);
  if (!/<meta property="og:title"/i.test(html)) errors.push(`${pathname}: OpenGraph fehlt`);
  if (!/<main id="main">/i.test(html)) errors.push(`${pathname}: semantisches main fehlt`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${pathname}: ungültiges JSON-LD (${error.message})`); }
  }
  const main = html.match(/<main id="main">([\s\S]*?)<\/main>/i)?.[1] || '';
  const text = main.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  wordCounts.push({ pathname, words: text ? text.split(' ').length : 0 });

  for (const link of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = link[1];
    if (/\.(css|js|png|webp|svg|ico|xml|json|webmanifest|woff2?)$/i.test(href)) continue;
    const normalized = href.endsWith('/') ? href : `${href}/`;
    try { await access(targetFile(normalized)); } catch { errors.push(`${pathname}: interner Link ohne Ziel ${href}`); }
  }
  for (const asset of html.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:css|js|png|webp|svg|ico|webmanifest|woff2?))"/gi)) {
    try { await access(path.join(root, asset[1].replace(/^\//, ''))); } catch { errors.push(`${pathname}: Asset fehlt ${asset[1]}`); }
  }
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
if (/C:\\|C:\//i.test(sitemap)) errors.push('sitemap.xml enthält lokalen Windows-Pfad');
for (const pathname of [...generated, ...industries.map(item => item.path)]) {
  if (!sitemap.includes(`https://reinigungsprofi-leipzig.de${pathname}`)) errors.push(`Sitemap: ${pathname} fehlt`);
}

const lowServicePages = wordCounts.filter(item => services.some(service => service.path === item.pathname) && item.words < 700);
if (lowServicePages.length) errors.push(`Leistungsseiten unter 700 Wörtern: ${lowServicePages.map(item => `${item.pathname} (${item.words})`).join(', ')}`);
const lowIndustryPages = wordCounts.filter(item => industries.some(industry => industry.path === item.pathname) && item.words < 700);
if (lowIndustryPages.length) errors.push(`Branchenseiten unter 700 Wörtern: ${lowIndustryPages.map(item => `${item.pathname} (${item.words})`).join(', ')}`);

console.log(`Geprüft: ${generated.length} generierte Seiten, ${services.length} Leistungsseiten.`);
console.log(`Wortumfang Leistungsseiten: ${Math.min(...wordCounts.filter(item => services.some(service => service.path === item.pathname)).map(item => item.words))}–${Math.max(...wordCounts.filter(item => services.some(service => service.path === item.pathname)).map(item => item.words))} Wörter.`);
if (errors.length) {
  console.error(`\n${errors.length} Fehler:\n- ${[...new Set(errors)].join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Alle technischen Inhalts- und Linkprüfungen bestanden.');
}

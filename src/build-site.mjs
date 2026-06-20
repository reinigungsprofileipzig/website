import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, districts, industries, services, site } from './services.mjs';
import { leipzigMap } from './leipzig-map-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = value => String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const absolute = pathname => `${site.baseUrl}${pathname}`;
const byKey = key => services.find(service => service.key === key);
const categoryByKey = key => categories.find(category => category.key === key);
const compactMeta = text => text.length <= 155 ? text : `${text.slice(0, 151).replace(/\s+\S*$/, '')} …`;
const writePage = async (pathname, html) => {
  const directory = pathname === '/' ? root : path.join(root, pathname.replace(/^\//, '').replace(/\/$/, ''));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html, 'utf8');
};
const titleFor = service => service.key === 'messie-wohnung-reinigung'
  ? 'Messie-Wohnung reinigen Leipzig | ReinigungsProfi'
  : `${service.title} Leipzig | ReinigungsProfi`;
const descriptionFor = service => {
  const base = `${service.title} in Leipzig: ${service.short} Persönlich beraten lassen und kostenloses Angebot anfordern.`;
  return base.length <= 155 ? base : `${base.slice(0, 151).replace(/\s+\S*$/, '')} …`;
};
const jsonLd = value => `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;

function head({ title, description, pathname, schema, image = '/images/reinigungsfirma-leipzig-professionell.webp', robots = 'index,follow' }) {
  const url = absolute(pathname);
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/webfonts/raleway-v36-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/modern.css">
  <meta property="og:locale" content="de_DE">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ReinigungsProfi Leipzig">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${absolute(image)}">
  <meta property="og:image:alt" content="ReinigungsProfi Leipzig – professionelle Reinigung vor Ort">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${absolute(image)}">
  ${jsonLd(schema)}
</head>`;
}

function header() {
  const serviceLinks = categories.map(category => {
    const items = services.filter(service => service.category === category.key);
    return `<div class="mega-group"><a class="mega-heading" href="/dienstleistungen/${category.key}/">${esc(category.label)}</a>${items.map(service => `<a href="${service.path}">${esc(service.title)}</a>`).join('')}</div>`;
  }).join('');
  const mobileServices = categories.map(category => `<div class="mobile-service-group"><a class="mobile-service-heading" href="/dienstleistungen/${category.key}/">${esc(category.label)}</a>${services.filter(service => service.category === category.key).map(service => `<a href="${service.path}">${esc(service.title)}</a>`).join('')}</div>`).join('');
  const industryLinks = industries.map(industry => `<a href="${industry.path}">${esc(industry.title)}</a>`).join('');
  return `<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site-header" id="page-header">
  <div class="container header-inner">
    <a class="logo" href="/" aria-label="ReinigungsProfi Leipzig Startseite"><img src="/images/logo-reinigungsprofi-leipzig.png" width="184" height="56" alt="ReinigungsProfi Leipzig"></a>
    <nav class="desktop-nav" aria-label="Hauptnavigation">
      <details><summary>Dienstleistungen ▾</summary><div class="mega"><a class="mega-overview" href="/dienstleistungen/">Leistungsübersicht</a>${serviceLinks}</div></details>
      <details><summary>Branchen ▾</summary><div class="industry-mega"><a class="industry-overview" href="/dienstleistungen/branchen/">Alle Branchenlösungen</a>${industryLinks}</div></details>
      <a href="/ueber-uns/">Über uns</a>
      <a href="/jobs/">Jobs</a>
      <a href="tel:${site.phone}">${site.phoneDisplay}</a>
      <a class="nav-cta" href="#kontakt">Angebot anfordern</a>
    </nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menü öffnen"><span aria-hidden="true">☰</span></button>
  </div>
</header>
<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile Navigation">
  <details><summary>Dienstleistungen</summary><div><a href="/dienstleistungen/">Leistungsübersicht</a>${mobileServices}</div></details>
  <details><summary>Branchen</summary><div><a href="/dienstleistungen/branchen/">Branchenübersicht</a>${industryLinks}</div></details>
  <a href="/ueber-uns/">Über uns</a><a href="/jobs/">Jobs</a>
  <a href="tel:${site.phone}">Anrufen: ${site.phoneDisplay}</a>
  <a href="#kontakt">Kostenloses Angebot anfordern</a>
</nav>`;
}

function trustStrip() {
  return `<aside class="trust-strip" aria-label="Ihre Vorteile"><ul class="container trust-list"><li>Antwort in 24 Stunden</li><li>Lokal in Leipzig</li><li>Transparente Angebote</li><li>Fester Ansprechpartner</li></ul></aside>`;
}

function breadcrumb() {
  return '';
}

function serviceCard(service) {
  return `<article class="card service-card" data-category="${service.category}">
    <img class="service-card-image" src="${service.image || '/images/reinigungsfirma-leipzig-professionell.webp'}" width="480" height="320" loading="lazy" alt="${esc(service.title)} in Leipzig">
    <h3>${esc(service.title)} Leipzig</h3><p>${esc(service.short)}</p>
    <ul class="tag-list">${service.audiences.slice(0, 3).map(item => `<li>${esc(item)}</li>`).join('')}</ul>
    <a class="card-link" href="${service.path}" aria-label="Mehr über ${esc(service.title)} in Leipzig">Leistung ansehen</a>
  </article>`;
}

const districtDescriptions = {
  'Mitte': 'dicht genutzten Büro-, Praxis-, Hotel-, Laden- und Wohnflächen rund um das Leipziger Zentrum',
  'Nordost': 'Wohnquartieren, Gewerbeflächen und Einrichtungen zwischen Schönefeld, Mockau, Thekla und Plaußig-Portitz',
  'Ost': 'der vielfältigen Mischung aus Wohnhäusern, Unternehmen, Handel und öffentlichen Einrichtungen im Leipziger Osten',
  'Südost': 'Wohn-, Praxis-, Bildungs- und Gewerbeobjekten von Reudnitz-Thonberg bis Holzhausen',
  'Süd': 'stark genutzten Wohn-, Gastronomie-, Büro- und Praxisflächen von der Südvorstadt bis Dölitz-Dösen',
  'Südwest': 'der Mischung aus urbanen Gewerbeflächen, Büros und Wohnobjekten rund um Plagwitz, Schleußig und Großzschocher',
  'West': 'Wohnanlagen, Unternehmen, Handel und verwalteten Immobilien in Grünau und den westlichen Ortsteilen',
  'Alt-West': 'dicht bebauten Wohn- und Gewerbequartieren von Lindenau über Leutzsch bis Böhlitz-Ehrenberg',
  'Nordwest': 'Wohn-, Logistik-, Gewerbe- und Verwaltungsobjekten zwischen Möckern, Wahren, Lützschena-Stahmeln und Lindenthal',
  'Nord': 'Büros, Praxen, Wohnanlagen und Gewerbeobjekten in Gohlis, Eutritzsch, Seehausen und Wiederitzsch'
};

function mapSection(service = null) {
  const names = Object.keys(districts);
  const localCopy = name => service
    ? `${service.title} im Leipziger Stadtbezirk ${name} planen wir passend zu ${districtDescriptions[name]}.`
    : `In Leipzig-${name} betreuen wir Objekte in ${districtDescriptions[name]}.`;
  const mapPaths = leipzigMap.features.map(feature => {
    const districtIndex = names.indexOf(feature.district);
    return `<path class="map-neighborhood district-${districtIndex}${feature.name === 'Zentrum' ? ' active' : ''}" tabindex="0" role="button" aria-label="${esc(feature.name)}, Stadtbezirk ${esc(feature.district)} anzeigen" data-district="${esc(feature.district)}" data-place="${esc(feature.name)}" data-places="${esc(districts[feature.district].join('|'))}" data-context="${esc(localCopy(feature.district))}" d="${feature.path}"><title>${esc(feature.name)} · ${esc(feature.district)}</title></path>`;
  }).join('');
  const legend = names.map((name, index) => `<button class="map-legend-item" type="button" data-district="${esc(name)}" data-places="${esc(districts[name].join('|'))}" data-context="${esc(localCopy(name))}"><span class="legend-color district-${index}" aria-hidden="true"></span>${esc(name)}</button>`).join('');
  const accordions = names.map(name => `<details class="accordion district-accordion"><summary>${esc(name)}</summary><div class="district-accordion-content"><p><strong>${service ? `${esc(service.title)} in Leipzig-${esc(name)}` : `Reinigungsservice in Leipzig-${esc(name)}`}:</strong> ${esc(localCopy(name))}</p><ul>${districts[name].map(place => `<li>${esc(place)}</li>`).join('')}</ul></div></details>`).join('');
  const heading = service ? `${service.title} in allen Leipziger Stadtbezirken` : 'In ganz Leipzig im Einsatz';
  return `<section class="section section--soft" id="einsatzgebiet"><div class="container">
    <div class="section-head"><span class="eyebrow">Einsatzgebiet</span><h2>${esc(heading)}</h2><p>Die Karte zeigt die echten Grenzen aller 63 Leipziger Ortsteile. Wählen Sie eine Fläche, um Ortsteil und zugehörigen Stadtbezirk anzuzeigen. Die lokalen Texte darunter ordnen den Bedarf natürlich ein, ohne separate Stadtteil-Doorway-Pages zu erzeugen.</p></div>
    <div class="map-layout">
      <div><svg class="leipzig-map" viewBox="${leipzigMap.viewBox}" role="img" aria-labelledby="map-title map-desc"><title id="map-title">Interaktive Karte der Leipziger Ortsteile</title><desc id="map-desc">Alle 63 Ortsteile Leipzigs mit ihren echten Grenzen; jeder Ortsteil ist auswählbar.</desc>${mapPaths}</svg><div class="map-legend" aria-label="Legende der Stadtbezirke">${legend}</div><p class="map-source">Geodaten: <a href="https://opendata.leipzig.de/dataset/74b342a9-7db7-45a3-8404-944442a24d51" target="_blank" rel="noopener">Stadt Leipzig, Open Data – Ortsteile</a></p></div>
      <div class="district-detail" aria-live="polite"><span class="eyebrow">Ausgewählter Ortsteil</span><h3 id="district-detail-title">Zentrum</h3><p id="district-detail-district">Stadtbezirk Mitte</p><p id="district-detail-copy">${esc(localCopy('Mitte'))}</p><ul id="district-detail-list">${districts.Mitte.map(place => `<li${place === 'Zentrum' ? ' class="selected"' : ''}>${esc(place)}</li>`).join('')}</ul></div>
    </div>
    <div class="district-accordions" aria-label="Alle Leipziger Ortsteile">${accordions}</div>
  </div></section>`;
}

function contactSection(service = null) {
  const selected = service ? service.title : '';
  return `<section class="section section--dark" id="kontakt"><div class="container contact-wrap">
    <div><span class="eyebrow" style="color:#9fd0d7">Unverbindlich anfragen</span><h2>${service ? `Jetzt kostenloses Angebot für ${esc(service.title)} in Leipzig anfordern` : 'Lassen Sie uns über Ihr Objekt sprechen'}</h2><p>Beschreiben Sie kurz Objekt, Fläche und gewünschten Turnus. Wir melden uns in der Regel innerhalb von 24 Stunden mit den nächsten sinnvollen Schritten.</p><p><strong>Telefon:</strong> <a href="tel:${site.phone}">${site.phoneDisplay}</a><br><strong>E-Mail:</strong> <a href="mailto:${site.email}">${site.email}</a></p></div>
    <div class="contact-panel"><h3>Ihre Anfrage</h3>
      <form action="${site.formAction}" method="post" class="js-contact-form">
        <input type="hidden" name="recipient" value="${site.email}"><input type="hidden" name="redirect" value="${site.baseUrl}/danke/"><input type="hidden" name="subject" value="Neue Anfrage über reinigungsprofi-leipzig.de">
        <div class="form-grid two"><div class="form-field"><label for="name">Name *</label><input id="name" name="name" autocomplete="name" required></div><div class="form-field"><label for="phone">Telefon *</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div></div>
        <div class="form-grid two"><div class="form-field"><label for="email">E-Mail *</label><input id="email" name="email" type="email" autocomplete="email" required></div><div class="form-field"><label for="service">Leistung</label><select id="service" name="service"><option value="">Bitte wählen</option>${services.map(item => `<option${item.title === selected ? ' selected' : ''}>${esc(item.title)}</option>`).join('')}</select></div></div>
        <div class="form-field"><label for="message">Nachricht</label><textarea id="message" name="message" rows="5" placeholder="z. B. Büro, ca. 200 m², Reinigung zweimal pro Woche"></textarea></div>
        <label class="privacy"><input type="checkbox" required> <span>Ich habe die <a href="/datenschutz/" style="text-decoration:underline">Datenschutzhinweise</a> gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung der Anfrage zu. *</span></label>
        <button class="btn btn-brand" type="submit">Kostenloses Angebot anfordern</button><p class="form-status" role="status" hidden></p>
      </form>
    </div>
  </div></section>`;
}

function footer() {
  const topServices = ['bueroreinigung','unterhaltsreinigung','praxisreinigung','fensterreinigung','baureinigung','winterdienst'].map(byKey).filter(Boolean);
  return `<footer class="site-footer"><div class="container"><div class="footer-grid">
    <div><a class="logo" href="/"><img src="/images/logo-reinigungsprofi-leipzig-weiss.png" width="184" height="56" loading="lazy" alt="ReinigungsProfi Leipzig"></a><p>Persönliche Gebäudereinigung und Objektbetreuung für Leipzig und Umgebung.</p></div>
    <div><h2>Leistungen</h2><ul class="footer-links">${topServices.map(service => `<li><a href="${service.path}">${esc(service.title)}</a></li>`).join('')}<li><a href="/dienstleistungen/">Alle Leistungen</a></li></ul></div>
    <div><h2>Unternehmen</h2><ul class="footer-links"><li><a href="/ueber-uns/">Über uns</a></li><li><a href="/jobs/">Jobs</a></li><li><a href="/dienstleistungen/branchen/">Branchen</a></li><li><a href="/impressum/">Impressum</a></li><li><a href="/datenschutz/">Datenschutz</a></li></ul></div>
    <div><h2>Kontakt</h2><ul class="footer-links"><li>${site.address}</li><li>${site.postalCode} ${site.city}</li><li><a href="tel:${site.phone}">${site.phoneDisplay}</a></li><li><a href="mailto:${site.email}">${site.email}</a></li></ul></div>
  </div><div class="footer-bottom">© ${new Date().getFullYear()} ReinigungsProfi Leipzig. Alle Rechte vorbehalten.</div></div></footer>
  <div class="sticky-cta" aria-label="Schnellkontakt"><a class="btn btn-brand" href="tel:${site.phone}">Anrufen</a><a class="btn btn-primary" href="#kontakt">Angebot</a></div>
  <script src="/script.js" defer></script>`;
}

function baseSchema(pathname) {
  return {
    '@context': 'https://schema.org', '@type': ['LocalBusiness', 'ProfessionalService'], '@id': `${site.baseUrl}/#business`,
    name: site.name, url: site.baseUrl, image: absolute('/images/reinigungsfirma-leipzig-professionell.webp'),
    telephone: site.phone, email: site.email, priceRange: '€€',
    address: { '@type': 'PostalAddress', streetAddress: site.address, postalCode: site.postalCode, addressLocality: site.city, addressCountry: 'DE' },
    areaServed: { '@type': 'City', name: 'Leipzig' },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '17:00' }],
    mainEntityOfPage: absolute(pathname)
  };
}

function breadcrumbSchema(items) {
  return { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Startseite', item: `${site.baseUrl}/` }, ...items.map((item, index) => ({ '@type': 'ListItem', position: index + 2, name: item.label, item: absolute(item.path) }))] };
}

function faqFor(service) {
  return [
    { q: `Was kostet ${service.title} in Leipzig?`, a: `Die Kosten hängen vor allem von Fläche, Zustand, Zugänglichkeit, Leistungsumfang und Turnus ab. Nach einer kurzen Bedarfsklärung – bei größeren oder besonderen Objekten nach einer Besichtigung – erhalten Sie ein nachvollziehbares, unverbindliches Angebot ohne pauschale Lockpreise.` },
    { q: 'Wie schnell ist ein Termin möglich?', a: `Das hängt von Umfang und gewünschtem Zeitfenster ab. Kleine einmalige Einsätze lassen sich oft kurzfristiger einplanen, regelmäßige Aufträge werden sauber vorbereitet. Senden Sie uns Ihren Wunschtermin; wir antworten in der Regel innerhalb von 24 Stunden.` },
    { q: 'Reinigen Sie einmalig oder regelmäßig?', a: `${service.title} bieten wir passend zum Bedarf an: ${service.intervals.join(', ')}. Gemeinsam wählen wir den Turnus, der Nutzung, Verschmutzung und Budget sinnvoll zusammenbringt.` },
    { q: 'Muss ich Reinigungsmaterial bereitstellen?', a: 'In der Regel bringen wir die vereinbarten Reinigungsmittel und Geräte mit. Besondere objektspezifische Produkte, Verbrauchsmaterial oder vorhandene Dosiersysteme stimmen wir vor Beginn ab.' },
    { q: `Für wen eignet sich die ${service.title}?`, a: `Die Leistung richtet sich insbesondere an ${service.audiences.join(', ')}. Ob Ihr Objekt dazugehört, klären wir gern in einem kurzen Gespräch anhand von Fläche, Nutzung und gewünschtem Ergebnis.` },
    { q: 'Gibt es eine Besichtigung vor Ort?', a: `Bei größeren, regelmäßig zu reinigenden oder schwer einzuschätzenden Flächen ist eine Besichtigung sinnvoll. Sie schafft Klarheit über Aufwand, Zugang, Materialien und Leistungsgrenzen. Für überschaubare Anfragen reichen häufig aussagekräftige Angaben und Fotos.` }
  ];
}

function servicePage(service) {
  const category = categoryByKey(service.category);
  const faq = faqFor(service);
  const crumbs = [{ label: 'Dienstleistungen', path: '/dienstleistungen/' }, { label: service.title, path: service.path }];
  const related = service.related.map(byKey).filter(Boolean);
  const image = service.image || '/images/reinigungsfirma-leipzig-professionell.webp';
  const schema = { '@context': 'https://schema.org', '@graph': [
    baseSchema(service.path),
    { '@type': 'Service', '@id': `${absolute(service.path)}#service`, name: `${service.title} Leipzig`, serviceType: service.title, description: service.short, url: absolute(service.path), provider: { '@id': `${site.baseUrl}/#business` }, areaServed: { '@type': 'City', name: 'Leipzig' }, offers: { '@type': 'Offer', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: absolute(service.path) } },
    breadcrumbSchema(crumbs),
    { '@type': 'FAQPage', mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) }
  ]};
  return `${head({ title: titleFor(service), description: descriptionFor(service), pathname: service.path, schema, image })}<body>
${header()}${breadcrumb(crumbs)}
<main id="main">
  <section class="hero"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">${esc(category.label)} in Leipzig</span><h1>${esc(service.title)} Leipzig – ${esc(service.claim)}</h1><p>${esc(service.short)} Als lokal erreichbares Reinigungsunternehmen planen wir den Einsatz passend zu Ihrem Objekt, Ihren Abläufen und dem gewünschten Ergebnis.</p><div class="actions"><a class="btn btn-primary" href="#kontakt">Kostenloses Angebot anfordern</a><a class="btn btn-secondary" href="tel:${site.phone}">Jetzt anrufen</a></div></div><div class="hero-media"><img src="${image}" width="720" height="540" ${service.image ? 'fetchpriority="high"' : 'loading="eager" fetchpriority="high"'} alt="${esc(service.title)} durch ReinigungsProfi in Leipzig"></div></div></section>
  ${trustStrip()}
  <section class="section"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Leistungsübersicht</span><h2>Professionelle ${esc(service.title)} in Leipzig</h2><p>Sauberkeit funktioniert dann gut, wenn nicht nur einzelne Handgriffe, sondern das gesamte Objekt betrachtet wird. Bei der ${esc(service.title)} in Leipzig beginnen wir deshalb mit Ihren Anforderungen: Welche Flächen sind betroffen, wie werden sie genutzt, wann ist ein ungestörter Zugang möglich und welches Ergebnis erwarten Sie?</p><p>${esc(service.approach)} Daraus entsteht ein verständliches Leistungsverzeichnis. Es sorgt dafür, dass beide Seiten denselben Umfang meinen und regelmäßige wie einmalige Arbeiten nachvollziehbar bleiben.</p><h3>Was wir bei der ${esc(service.title)} übernehmen</h3><ul class="check-list">${service.tasks.map(task => `<li>${esc(task)}</li>`).join('')}</ul><p>Der genaue Umfang wird nicht pauschal festgelegt. Wir berücksichtigen Materialien, Möblierung, Nutzerfrequenz und sensible Bereiche. So erhalten Sie eine Lösung, die zum Alltag des Objekts passt, statt ein überladenes Standardpaket zu bezahlen.</p></div><aside class="aside-box"><h3>Geeignet für</h3><ul class="check-list">${service.audiences.map(audience => `<li>${esc(audience)}</li>`).join('')}</ul><h3>Mögliche Intervalle</h3><p>${esc(service.intervals.join(', '))}</p><a class="btn btn-brand" href="#kontakt">Bedarf besprechen</a></aside></div></section>
  <section class="section section--soft"><div class="container"><div class="section-head"><span class="eyebrow">Bedarf & Lösung</span><h2>Typische Herausforderungen sauber lösen</h2><p>Jedes Objekt bringt andere Abläufe mit. Besonders häufig geht es bei dieser Leistung um die folgenden Punkte:</p></div><div class="feature-grid">${service.issues.map((issue, index) => `<article class="feature"><h3>${index + 1}. ${esc(issue.charAt(0).toUpperCase() + issue.slice(1))}</h3><p>Wir nehmen diesen Punkt in die Planung auf, klären die erreichbaren Ergebnisse und halten die passende Vorgehensweise im Angebot fest.</p></article>`).join('')}</div><div class="content-copy" style="margin-top:2rem"><p>Für wiederkehrende Aufträge unterscheiden wir häufig genutzte Bereiche von Zonen mit geringerem Pflegebedarf. Das schafft einen wirtschaftlichen Turnus, ohne sichtbare Qualität dem Zufall zu überlassen. Bei einmaligen Einsätzen legen wir besonderen Wert auf eine realistische Einschätzung des Ausgangszustands.</p><p>Ändert sich die Nutzung, kann der Plan angepasst werden. Ein fester Ansprechpartner bündelt Rückfragen, nimmt Hinweise auf und sorgt dafür, dass wichtige Informationen nicht zwischen wechselnden Kontakten verloren gehen.</p></div></div></section>
  <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">So funktioniert es</span><h2>In fünf klaren Schritten zur sauberen Lösung</h2><p>Von der ersten Anfrage bis zur Qualitätskontrolle wissen Sie, was als Nächstes passiert.</p></div><div class="process"><article><h3>Anfrage senden</h3><p>Objekt, Fläche, Leistung und Wunschtermin kurz beschreiben.</p></article><article><h3>Bedarf klären</h3><p>Wir besprechen Zugang, Nutzung, Material und besondere Anforderungen.</p></article><article><h3>Angebot erhalten</h3><p>Sie bekommen einen transparent beschriebenen Leistungsumfang.</p></article><article><h3>Reinigung starten</h3><p>Das Team arbeitet zum vereinbarten Termin und nach Objektplan.</p></article><article><h3>Qualität prüfen</h3><p>Rückmeldungen werden direkt aufgenommen und Abläufe bei Bedarf angepasst.</p></article></div></div></section>
  <section class="section section--soft"><div class="container"><div class="section-head"><span class="eyebrow">Ihre Vorteile</span><h2>Verlässlich organisiert, persönlich betreut</h2><p>Gute Gebäudereinigung zeigt sich nicht nur am Ergebnis, sondern auch an Kommunikation, Pünktlichkeit und einem passenden Einsatzplan.</p></div><div class="feature-grid"><article class="feature"><h3>Persönliche Beratung</h3><p>Ein fester Kontakt kennt Ihr Objekt und bündelt Absprachen.</p></article><article class="feature"><h3>Transparente Angebote</h3><p>Leistungen und Turnus werden verständlich beschrieben.</p></article><article class="feature"><h3>Flexible Einsätze</h3><p>Termine orientieren sich nach Möglichkeit an Ihren Betriebsabläufen.</p></article><article class="feature"><h3>Geschultes Personal</h3><p>Das Team wird in Objektablauf, Materialien und sensible Zonen eingewiesen.</p></article><article class="feature"><h3>Bewusster Mitteleinsatz</h3><p>Reinigungsmittel werden materialgerecht und so sparsam wie sinnvoll eingesetzt.</p></article><article class="feature"><h3>Nachvollziehbare Qualität</h3><p>Klare Prüfpunkte erleichtern Rückmeldung und kontinuierliche Verbesserung.</p></article></div></div></section>
  ${mapSection(service)}
  <section class="section"><div class="container"><div class="section-head"><span class="eyebrow">Passende Leistungen</span><h2>Sinnvoll kombinieren</h2><p>Je nach Objekt lässt sich die ${esc(service.title)} mit ergänzenden Leistungen bündeln. Das reduziert Abstimmungsaufwand und hilft, periodische Aufgaben rechtzeitig einzuplanen.</p></div><div class="related">${related.map(item => `<a href="${item.path}">${esc(item.title)} Leipzig</a>`).join('')}<a href="/dienstleistungen/">Alle Dienstleistungen</a><a href="/dienstleistungen/branchen/">Passende Branchenlösungen</a></div></div></section>
  <section class="section section--soft"><div class="narrow"><div class="section-head"><span class="eyebrow">Häufige Fragen</span><h2>FAQ zur ${esc(service.title)} in Leipzig</h2></div><div class="faq-list">${faq.map((item, index) => `<details class="accordion"${index === 0 ? ' open' : ''}><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('')}</div></div></section>
  ${contactSection(service)}
</main>${footer()}</body></html>`;
}

const categoryCopy = {
  gebaeudereinigung: { headline: 'Saubere Gebäude, passend zu Nutzung und Alltag', lead: 'Von der laufenden Unterhaltsreinigung bis zur intensiven Bau- oder Grundreinigung: Wir verbinden klare Leistungsverzeichnisse mit persönlicher Betreuung in Leipzig.', details: ['Im gewerblichen Alltag müssen Reinigungsarbeiten zuverlässig in bestehende Abläufe passen. Deshalb betrachten wir Nutzerfrequenz, Materialien, Öffnungszeiten und sensible Zonen gemeinsam.', 'Regelmäßige Aufgaben werden von periodischen Arbeiten getrennt. Das macht Angebote vergleichbar und verhindert, dass selten notwendige Leistungen im Alltag untergehen.', 'Für größere oder komplexe Flächen empfehlen wir eine Besichtigung. Sie schafft eine belastbare Grundlage für Aufwand, Turnus und erreichbares Ergebnis.'] },
  hotelreinigung: { headline: 'Sauberkeit im Rhythmus von Gästen und Betrieb', lead: 'Reinigung für Hotels, Apartments und Gastronomie braucht flexible Zeitfenster, verständliche Standards und eine verlässliche Übergabe.', details: ['Belegung, Check-in und Servicezeiten bestimmen den Tagesablauf. Darum planen wir Leistungen nicht losgelöst, sondern entlang Ihrer operativen Prozesse.', 'Checklisten, Statusmeldungen und feste Ansprechpartner helfen, dass Zimmer und öffentliche Bereiche nach einem einheitlichen Hausstandard vorbereitet werden.', 'Bei Küchen- und Spülbereichen werden betriebliche Hygienevorgaben, Gerätesicherheit und die Abgrenzung technischer Arbeiten vorab geklärt.'] },
  aussenanlagen: { headline: 'Gepflegte und sichere Außenflächen durch jede Saison', lead: 'Außenreinigung, Grünpflege, Winterdienst und Solaranlagenreinigung werden nach Fläche, Wetter, Zugang und Objektbedarf geplant.', details: ['Außenanlagen prägen den ersten Eindruck und reagieren unmittelbar auf Jahreszeit und Witterung. Ein realistischer Pflegeplan berücksichtigt diese Schwankungen.', 'Für Winterdienst sind Flächen, Einsatzzeiten und örtliche Pflichten eindeutig zu vereinbaren. Bei Arbeiten in der Höhe steht eine sichere Zugangsprüfung vor dem Angebot.', 'Wir dokumentieren auffällige Schäden, ersetzen jedoch keine Fachplanung, zulassungspflichtigen Handwerksarbeiten oder kommunale Aufgaben.'] },
  spezialreinigung: { headline: 'Besondere Reinigung mit klaren Grenzen', lead: 'Spezialfälle benötigen eine gründliche Einschätzung, realistische Aussagen und gegebenenfalls die Zusammenarbeit mit geeigneten Fachstellen.', details: ['Vor besonderen Einsätzen klären wir Verschmutzungsart, mögliche Gefahren, Schutzmaßnahmen und Entsorgungswege. Eine Ferndiagnose reicht dafür häufig nicht aus.', 'Bei Gefahrstoffen, biologischer Kontamination oder rechtlich geregelten Maßnahmen sagen wir offen, wenn spezialisierte oder behördlich anerkannte Partner erforderlich sind.', 'So entsteht ein seriöser Ablauf ohne riskante Pauschalversprechen – diskret, nachvollziehbar und passend zur tatsächlichen Situation.'] },
  instandhaltung: { headline: 'Objektbetreuung mit einem verlässlichen Blick fürs Ganze', lead: 'Wiederkehrende Kontrollen, saisonale Aufgaben und abgestimmte Dienstleisterwege entlasten Verwaltungen und Eigentümer.', details: ['Ein klarer Objektplan definiert Kontrollpunkte, Häufigkeiten und Rückmeldewege. So werden kleine Auffälligkeiten sichtbar, bevor Zuständigkeiten unklar werden.', 'Unser Schwerpunkt liegt auf Betreuung, Reinigung und koordinierbaren Routinen. Zulassungspflichtige Handwerksleistungen werden nicht als Hausmeisterarbeit ausgegeben.', 'Die Leistung lässt sich sinnvoll mit Treppenhausreinigung, Außenpflege und Winterdienst verbinden.'] }
};

function categoryPage(category) {
  const current = services.filter(service => service.category === category.key);
  const copy = categoryCopy[category.key];
  const pathname = `/dienstleistungen/${category.key}/`;
  const crumbs = [{ label: 'Dienstleistungen', path: '/dienstleistungen/' }, { label: category.label, path: pathname }];
  const title = `${category.label} Leipzig | ReinigungsProfi`;
  const description = compactMeta(`${category.label} in Leipzig: ${category.intro} Leistungen vergleichen und kostenloses Angebot anfordern.`);
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), breadcrumbSchema(crumbs), { '@type': 'ItemList', name: `${category.label} Leipzig`, itemListElement: current.map((service, index) => ({ '@type': 'ListItem', position: index + 1, url: absolute(service.path), name: service.title })) }] };
  return `${head({ title, description, pathname, schema })}<body>${header()}${breadcrumb(crumbs)}<main id="main">
  <section class="hero hero--simple"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">Leistungen in Leipzig</span><h1>${esc(category.label)} Leipzig – ${esc(copy.headline)}</h1><p>${esc(copy.lead)}</p><div class="actions"><a class="btn btn-primary" href="#leistungen">Leistungen ansehen</a><a class="btn btn-secondary" href="#kontakt">Angebot anfordern</a></div></div></div></section>${trustStrip()}
  <section class="section" id="leistungen"><div class="container"><div class="section-head"><span class="eyebrow">Unser Angebot</span><h2>${esc(category.label)} im Überblick</h2><p>${esc(category.intro)} Jede Leistung wird anhand Ihres Objekts kalkuliert und vor Beginn klar beschrieben.</p></div><div class="card-grid three">${current.map(serviceCard).join('')}</div></div></section>
  <section class="section section--soft"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Gut geplant</span><h2>Eine Lösung, die zu Ihrem Objekt passt</h2>${copy.details.map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}<p>Eine Anfrage beginnt mit wenigen Eckdaten: Art und Lage des Objekts, ungefähre Fläche, gewünschte Aufgaben und mögliche Zeitfenster. Anschließend klären wir, ob Fotos genügen oder eine Besichtigung sinnvoll ist.</p><p>Das Angebot beschreibt Leistungen, Turnus und erkennbare Grenzen. Dadurch wissen Sie, was enthalten ist, und können Ergänzungen wie Fenster-, Grund- oder Außenreinigung bewusst einplanen.</p></div><aside class="aside-box"><h3>Was Sie erwarten können</h3><ul class="check-list"><li>Persönlicher Ansprechpartner</li><li>Objektbezogenes Leistungsverzeichnis</li><li>Abstimmung mit Ihren Betriebszeiten</li><li>Transparente Angebotsgrundlage</li><li>Leistungen in ganz Leipzig</li></ul><a class="btn btn-brand" href="#kontakt">Bedarf besprechen</a></aside></div></section>
  <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">Ablauf</span><h2>Vom Bedarf zum passenden Reinigungsplan</h2></div><div class="process"><article><h3>Anfragen</h3><p>Objekt und Wunschleistung beschreiben.</p></article><article><h3>Prüfen</h3><p>Flächen, Material und Zugang klären.</p></article><article><h3>Planen</h3><p>Turnus und Aufgaben sinnvoll festlegen.</p></article><article><h3>Umsetzen</h3><p>Zum vereinbarten Zeitpunkt starten.</p></article><article><h3>Verbessern</h3><p>Qualität prüfen und Plan bei Bedarf anpassen.</p></article></div></div></section>
  ${mapSection()}${contactSection()}
</main>${footer()}</body></html>`;
}

function overviewPage() {
  const pathname = '/dienstleistungen/';
  const crumbs = [{ label: 'Dienstleistungen', path: pathname }];
  const title = 'Reinigungsleistungen Leipzig | ReinigungsProfi';
  const description = 'Alle Reinigungsleistungen in Leipzig: Gebäude, Hotels, Außenanlagen und Spezialreinigung. Passende Leistung finden und kostenlos anfragen.';
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), breadcrumbSchema(crumbs), { '@type': 'ItemList', name: 'Reinigungsleistungen Leipzig', numberOfItems: services.length, itemListElement: services.map((service, index) => ({ '@type': 'ListItem', position: index + 1, url: absolute(service.path), name: service.title })) }] };
  const groupedServices = categories.map(category => `<section class="service-category-group" id="${category.key}"><div class="section-head"><span class="eyebrow">${esc(category.label)}</span><h2>${esc(category.label)} in Leipzig</h2><p>${esc(category.intro)}</p><a class="card-link" href="/dienstleistungen/${category.key}/">Kategorie ausführlich ansehen</a></div><div class="card-grid three">${services.filter(service => service.category === category.key).map(serviceCard).join('')}</div></section>`).join('');
  return `${head({ title, description, pathname, schema })}<body>${header()}${breadcrumb(crumbs)}<main id="main">
  <section class="hero hero--simple"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">${services.length} Leistungen in Leipzig</span><h1>Reinigungsleistungen in Leipzig – jede Leistung einzeln erklärt</h1><p>Hier finden Sie unser vollständiges Angebot. Jede Leistung ist separat aufgeführt und führt direkt zu einer eigenen Seite mit Umfang, Ablauf, FAQ und Anfrage.</p><div class="actions"><a class="btn btn-primary" href="#leistungsverzeichnis">Leistungen ansehen</a><a class="btn btn-secondary" href="#kontakt">Kostenlos anfragen</a></div></div></div></section>${trustStrip()}
  <section class="section" id="leistungsverzeichnis"><div class="container"><div class="section-head center"><span class="eyebrow">Vollständiges Leistungsverzeichnis</span><h2>Direkt zur passenden Kategorie</h2><p>Alle Leistungen sind weiter unten einzeln in Karten aufgeführt. Die Anfrage verwendet genau dieselbe Auswahl.</p></div><nav class="service-index" aria-label="Leistungskategorien">${categories.map(category => `<a href="#${category.key}">${esc(category.label)} <span>${services.filter(service => service.category === category.key).length}</span></a>`).join('')}</nav>${groupedServices}</div></section>
  <section class="section"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Beratung statt Paketdenken</span><h2>So finden wir den richtigen Leistungsumfang</h2><p>Nicht jede Fläche braucht denselben Turnus. Ein Eingangsbereich wird anders beansprucht als ein Besprechungsraum, eine Hotelküche anders als ein Gästezimmer. Deshalb fragen wir nach Nutzung, Material, Zeiten und gewünschtem Ergebnis.</p><p>Bei regelmäßig betreuten Objekten trennen wir laufende Aufgaben von periodischen Leistungen. Fenster, Grundreinigung oder Außenpflege lassen sich so rechtzeitig einplanen, ohne die tägliche Kalkulation unnötig aufzublähen.</p><p>Für besondere Verschmutzungen gilt: Erst prüfen, dann versprechen. Wenn Gefahrstoffe, technische Arbeiten oder behördlich geregelte Maßnahmen betroffen sind, benennen wir die Grenzen offen und empfehlen gegebenenfalls einen geeigneten Fachbetrieb.</p></div><aside class="aside-box"><h3>Schnell zur Anfrage</h3><p>Teilen Sie uns Objektart, ungefähre Fläche, gewünschten Turnus und Stadtteil mit. Fotos helfen bei kleineren einmaligen Einsätzen.</p><a class="btn btn-brand" href="#kontakt">Kostenloses Angebot anfordern</a></aside></div></section>
  ${mapSection()}${contactSection()}
</main>${footer()}</body></html>`;
}

function industryNavigation(activeKey = '') {
  const heading = activeKey ? 'Weitere Branchenlösungen in Leipzig' : 'Branchenreinigung nach Ihrem Bedarf';
  return `<section class="industry-navigation-section" id="branchen"><div class="container"><div class="section-head center"><span class="eyebrow">Branchen-Navigation</span><h2>${heading}</h2><p>Wählen Sie Ihre Branche. Jede Lösung verbindet passende Reinigungsleistungen, Intervalle und Abläufe für den jeweiligen Objektalltag.</p></div><nav class="industry-nav-grid" aria-label="Branchenlösungen">${industries.map(item => `<a class="industry-nav-card${item.key === activeKey ? ' active' : ''}" href="${item.path}"${item.key === activeKey ? ' aria-current="page"' : ''}><strong>${esc(item.title)}</strong><span>${esc(item.short)}</span></a>`).join('')}</nav></div></section>`;
}

function industriesPage() {
  const pathname = '/dienstleistungen/branchen/';
  const crumbs = [{ label: 'Dienstleistungen', path: '/dienstleistungen/' }, { label: 'Branchen', path: pathname }];
  const title = 'Branchenlösungen Reinigung Leipzig | ReinigungsProfi';
  const description = 'Reinigung für Büros, Praxen, Hotels, Handel, Fitness, Bildung und Hausverwaltungen in Leipzig. Branchenlösung kostenlos anfragen.';
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), breadcrumbSchema(crumbs), { '@type': 'ItemList', name: 'Branchenlösungen Reinigung Leipzig', itemListElement: industries.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: absolute(item.path) })) }] };
  return `${head({ title, description, pathname, schema })}<body>${header()}${breadcrumb(crumbs)}<main id="main">
  <section class="hero hero--simple"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">Branchenlösungen Leipzig</span><h1>Professionelle Reinigung für Leipziger Unternehmen und Immobilien</h1><p>Arbeitsabläufe, Hygieneanforderungen und Nutzungszeiten unterscheiden sich je nach Branche. Unsere Lösungen verbinden passende Einzelleistungen zu einem verständlichen Objektplan.</p><div class="actions"><a class="btn btn-primary" href="#branchen">Branche auswählen</a><a class="btn btn-secondary" href="#kontakt">Beratung anfragen</a></div></div></div></section>
  ${trustStrip()}
  ${industryNavigation()}
  <section class="section section--soft"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Branchenreinigung Leipzig</span><h2>Reinigungskonzepte, die zum täglichen Betrieb passen</h2><p>Eine professionelle Reinigung in Leipzig muss zum Objekt, zur Nutzung und zu den Menschen passen, die sich darin bewegen. In einem Büro stehen gepflegte Arbeitsplätze, Küchen und Besprechungsräume im Mittelpunkt. Eine Praxis benötigt klar getrennte Hygienezonen und sorgfältig abgestimmte Arbeitsmittel. Hotels und Gastronomie arbeiten mit kurzen Zeitfenstern, wechselnder Auslastung und Bereichen, die Gäste unmittelbar wahrnehmen.</p><p>Deshalb beginnt unsere Branchenreinigung nicht mit einem starren Paket. Wir klären Flächen, Besucherfrequenz, Öffnungs- und Arbeitszeiten, sensible Materialien sowie vorhandene Hygiene- oder Objektpläne. Bei größeren oder regelmäßig betreuten Immobilien ist eine Besichtigung vor Ort die verlässlichste Grundlage. So entsteht ein Angebot, das tägliche, wöchentliche und periodische Aufgaben klar voneinander trennt.</p><p>ReinigungsProfi Leipzig verbindet je nach Bedarf Unterhaltsreinigung, Büro- oder Praxisreinigung, Sanitärpflege, Fenster- und Glasreinigung, Grundreinigung und geeignete Außenleistungen. Hausverwaltungen können beispielsweise Treppenhausreinigung, Objektbetreuung, Grünanlagenpflege und Winterdienst koordinieren. Für Handel, Bildung und Fitness werden stark frequentierte Eingänge, Kontaktflächen, Umkleiden und Sanitärbereiche passend zur Nutzung gewichtet.</p><h3>Persönlich erreichbar in ganz Leipzig</h3><p>Wir betreuen Branchenobjekte in allen zehn Leipziger Stadtbezirken. Ein fester Ansprechpartner kennt den vereinbarten Umfang, nimmt Rückmeldungen auf und passt den Plan an, wenn sich Belegung, Öffnungszeiten oder Flächennutzung verändern. Die interaktive Ortsteilkarte weiter unten zeigt unser Einsatzgebiet ohne künstliche Stadtteil-Unterseiten.</p></div><aside class="aside-box"><h3>Das klären wir vor dem Angebot</h3><ul class="check-list"><li>Objektart, Fläche und Nutzung</li><li>Öffnungs- und Einsatzzeiten</li><li>Hygienezonen und sensible Materialien</li><li>Regelmäßige und periodische Aufgaben</li><li>Zutritt, Schlüssel und Ansprechpartner</li><li>Qualitätskontrolle und Rückmeldung</li></ul><a class="btn btn-brand" href="#kontakt">Branchenangebot anfordern</a></aside></div></section>
  <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">So entsteht die Lösung</span><h2>Von der Objektanalyse zum verlässlichen Reinigungsplan</h2></div><div class="feature-grid"><article class="feature"><h3>Bedarf aufnehmen</h3><p>Wir erfassen Flächen, Nutzung, Materialien und die besonders wichtigen Bereiche Ihres Betriebs.</p></article><article class="feature"><h3>Prioritäten setzen</h3><p>Stark genutzte Zonen erhalten einen passenden Turnus, Nebenflächen werden wirtschaftlich eingeplant.</p></article><article class="feature"><h3>Zeiten abstimmen</h3><p>Die Reinigung wird nach Möglichkeit vor, nach oder passend zum laufenden Betrieb organisiert.</p></article><article class="feature"><h3>Leistungen verbinden</h3><p>Laufende Pflege und periodische Aufgaben werden übersichtlich in einem Plan zusammengeführt.</p></article><article class="feature"><h3>Qualität besprechen</h3><p>Klare Prüfpunkte und direkte Rückmeldungen schaffen eine nachvollziehbare Zusammenarbeit.</p></article><article class="feature"><h3>Plan anpassen</h3><p>Ändert sich Ihr Betrieb, kann der Leistungsumfang ohne unnötige Umwege weiterentwickelt werden.</p></article></div></div></section>
  ${mapSection()}${contactSection()}
  </main>${footer()}</body></html>`;
}

function industryPage(industry) {
  const pathname = industry.path;
  const crumbs = [{ label: 'Dienstleistungen', path: '/dienstleistungen/' }, { label: 'Branchen', path: '/dienstleistungen/branchen/' }, { label: industry.title, path: pathname }];
  const related = industry.related.map(byKey).filter(Boolean);
  const industryTitles = {
    arztpraxen: 'Praxisreinigung Leipzig | ReinigungsProfi',
    bildung: 'Reinigung Bildungseinrichtungen Leipzig | ReinigungsProfi',
    bueros: 'Büroreinigung & Kanzleien Leipzig | ReinigungsProfi',
    einzelhandel: 'Ladenreinigung Leipzig | ReinigungsProfi',
    fitness: 'Fitnessstudio-Reinigung Leipzig | ReinigungsProfi',
    'gastronomie-hotels': 'Hotel- & Gastronomiereinigung Leipzig | ReinigungsProfi',
    hausverwaltungen: 'Reinigung Hausverwaltungen Leipzig | ReinigungsProfi'
  };
  const title = industryTitles[industry.key];
  const description = compactMeta(`${industry.short} Persönlich beraten lassen und ein transparentes Angebot für Ihr Objekt in Leipzig anfordern.`);
  const faq = [
    { q: `Was kostet die Reinigung für ${industry.title} in Leipzig?`, a: 'Der Preis richtet sich nach Fläche, Nutzung, Aufgaben, gewünschtem Turnus und möglichen Zeitfenstern. Nach einer Bedarfsklärung oder Besichtigung erhalten Sie ein transparent beschriebenes Angebot.' },
    { q: 'Welche Reinigungsintervalle sind möglich?', a: 'Je nach Nutzung planen wir tägliche, mehrmals wöchentliche, wöchentliche oder periodische Leistungen. Stark frequentierte Zonen können häufiger berücksichtigt werden als Nebenflächen.' },
    { q: 'Kann die Reinigung außerhalb der Betriebszeiten stattfinden?', a: 'Ja, soweit Zugang, Lärmschutz und Einsatzplanung es zulassen. Schlüssel, Alarmanlage, Ansprechpartner und Abschlusskontrolle werden vor Beginn eindeutig abgestimmt.' },
    { q: 'Bringen Sie Material und Geräte mit?', a: 'Üblicherweise bringen wir die vereinbarten Reinigungsmittel und Geräte mit. Vorhandene Dosiersysteme, besondere Materialvorgaben und Verbrauchsartikel werden objektspezifisch geklärt.' },
    { q: 'Ist eine Besichtigung notwendig?', a: 'Für größere, regelmäßig betreute oder sensible Objekte ist eine Besichtigung meist die beste Angebotsgrundlage. Bei kleinen, überschaubaren Einsätzen können zunächst genaue Angaben und Fotos genügen.' }
  ];
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), breadcrumbSchema(crumbs), { '@type': 'Service', name: `Reinigung für ${industry.title} in Leipzig`, description: industry.short, url: absolute(pathname), provider: { '@id': `${site.baseUrl}/#business` }, areaServed: { '@type': 'City', name: 'Leipzig' } }, { '@type': 'FAQPage', mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) }] };
  return `${head({ title, description, pathname, schema })}<body>${header()}${breadcrumb(crumbs)}<main id="main">
    <section class="hero"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">Branchenreinigung Leipzig</span><h1>Reinigung für ${esc(industry.title)} in Leipzig – ${esc(industry.claim)}</h1><p>${esc(industry.short)} Wir stimmen Aufgaben, Zeiten und Qualitätskontrolle mit Ihrem Betriebsalltag ab.</p><div class="actions"><a class="btn btn-primary" href="#kontakt">Kostenloses Angebot anfordern</a><a class="btn btn-secondary" href="tel:${site.phone}">Jetzt anrufen</a></div></div><div class="hero-media"><img src="/images/reinigungsfirma-leipzig-professionell.webp" width="720" height="540" fetchpriority="high" alt="Professionelle Reinigung für ${esc(industry.title)} in Leipzig"></div></div></section>${trustStrip()}
    ${industryNavigation(industry.key)}
    <section class="section"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Branchenlösung</span><h2>Reinigung, die zu Ihren Abläufen passt</h2><p>Ein gutes Reinigungskonzept berücksichtigt mehr als die Quadratmeterzahl. Entscheidend sind Nutzung, Besucherfrequenz, sensible Zonen, Materialien und die Zeiten, in denen das Team ungestört arbeiten kann. Für ${esc(industry.title)} in Leipzig entwickeln wir deshalb einen Objektplan, der den tatsächlichen Alltag abbildet.</p><p>Vor dem Start klären wir Zuständigkeiten, Zutritt und Rückmeldewege. Tägliche Aufgaben werden von wöchentlichen oder periodischen Leistungen getrennt. So lässt sich nachvollziehen, was bei jedem Einsatz erledigt wird und wann etwa Fenster-, Grund- oder Intensivreinigungen vorgesehen sind.</p><h3>Worauf es in Ihrer Branche besonders ankommt</h3><ul class="check-list">${industry.needs.map(item => `<li>${esc(item)}</li>`).join('')}</ul><p>Die Punkte werden nicht als starres Paket verkauft. Gemeinsam legen wir fest, welche Flächen Priorität haben, welche Vorgaben bereits bestehen und wo eine Besichtigung notwendig ist. Dadurch bleibt das Angebot verständlich und auf Ihr Objekt zugeschnitten.</p></div><aside class="aside-box"><h3>Passende Leistungen</h3><ul class="check-list">${related.map(service => `<li><a href="${service.path}">${esc(service.title)} Leipzig</a></li>`).join('')}</ul><a class="btn btn-brand" href="#kontakt">Objekt besprechen</a></aside></div></section>
    <section class="section section--soft"><div class="container"><div class="section-head"><span class="eyebrow">Objektbezogener Plan</span><h2>Von häufig genutzten Zonen bis zu periodischen Aufgaben</h2><p>Innerhalb eines Objekts unterscheiden sich die Anforderungen deutlich. Eingänge, Sanitärbereiche und Kontaktflächen werden meist stärker beansprucht als Lager- oder Nebenräume.</p></div><div class="feature-grid"><article class="feature"><h3>Laufende Reinigung</h3><p>Böden, freie Oberflächen, Sanitärbereiche und Abfall werden in einem geeigneten Turnus gepflegt.</p></article><article class="feature"><h3>Hygiene & Kontaktpunkte</h3><p>Sensible und häufig berührte Bereiche werden klar benannt und mit passenden Materialien bearbeitet.</p></article><article class="feature"><h3>Periodische Leistungen</h3><p>Fenster, textile Böden, Grund- oder Außenreinigung werden separat geplant, statt im Alltag unterzugehen.</p></article></div><div class="content-copy" style="margin-top:2rem"><p>Ein fester Ansprechpartner nimmt Hinweise auf und stimmt Änderungen ab. Wenn sich Belegung, Öffnungszeiten oder Flächennutzung ändern, kann der Plan angepasst werden. Das ist oft wirtschaftlicher als ein überdimensioniertes Standardpaket.</p><p>Bei rechtlich oder technisch besonders geregelten Aufgaben prüfen wir vor einer Zusage, welche Qualifikation und Schutzmaßnahmen erforderlich sind. Medizinische Aufbereitung, zulassungspflichtige Handwerksarbeiten oder behördliche Spezialmaßnahmen werden nicht als gewöhnliche Unterhaltsreinigung ausgegeben.</p></div></div></section>
    <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">Ablauf</span><h2>In fünf Schritten zur verlässlichen Betreuung</h2></div><div class="process"><article><h3>Anfragen</h3><p>Objekt, Nutzung und Wunschleistungen nennen.</p></article><article><h3>Besichtigen</h3><p>Flächen, Materialien und Zugänge prüfen.</p></article><article><h3>Definieren</h3><p>Aufgaben und Intervalle verständlich festhalten.</p></article><article><h3>Starten</h3><p>Team einweisen und Reinigung planmäßig beginnen.</p></article><article><h3>Prüfen</h3><p>Ergebnisse und Rückmeldungen kontinuierlich auswerten.</p></article></div></div></section>
    ${mapSection()}
    <section class="section"><div class="narrow"><div class="section-head"><span class="eyebrow">Häufige Fragen</span><h2>FAQ zur Reinigung für ${esc(industry.title)}</h2></div><div class="faq-list">${faq.map((item, index) => `<details class="accordion"${index === 0 ? ' open' : ''}><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('')}</div></div></section>
    ${contactSection()}
  </main>${footer()}</body></html>`;
}

function aboutPage() {
  const pathname = '/ueber-uns/';
  const crumbs = [{ label: 'Über uns', path: pathname }];
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), breadcrumbSchema(crumbs), { '@type': 'AboutPage', name: 'Über ReinigungsProfi Leipzig', url: absolute(pathname), mainEntity: { '@id': `${site.baseUrl}/#business` } }] };
  return `${head({ title: 'Über uns | ReinigungsProfi Leipzig', description: 'ReinigungsProfi Leipzig: inhabergeführt, lokal verwurzelt und persönlich erreichbar. Lernen Sie unsere Arbeitsweise und Werte kennen.', pathname, schema, image: '/images/reinigungsfirma-leipzig-ueber-uns-team.webp' })}<body>${header()}${breadcrumb(crumbs)}<main id="main"><section class="hero"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">Seit 2020 in Leipzig</span><h1>Über uns – Ihr inhabergeführter Reinigungspartner in Leipzig</h1><p>ReinigungsProfi Leipzig steht für persönliche Betreuung, klare Absprachen und sorgfältige Arbeit. Wir sind lokal erreichbar und möchten, dass Kunden wie Mitarbeitende wissen, mit wem sie es zu tun haben.</p><div class="actions"><a class="btn btn-primary" href="#arbeitsweise">Unsere Arbeitsweise</a><a class="btn btn-secondary" href="#kontakt">Kontakt aufnehmen</a></div></div><div class="hero-media"><img src="/images/reinigungsfirma-leipzig-ueber-uns-team.webp" width="720" height="540" fetchpriority="high" alt="Team und Arbeitsweise von ReinigungsProfi Leipzig"></div></div></section>${trustStrip()}<section class="section" id="arbeitsweise"><div class="container"><div class="section-head center"><span class="eyebrow">Was uns wichtig ist</span><h2>Persönlich arbeiten, verlässlich handeln</h2><p>Sauberkeit ist sichtbar. Die Qualität dahinter entsteht durch gute Vorbereitung, respektvollen Umgang und verlässliche Kommunikation.</p></div><div class="feature-grid"><article class="feature"><h3>In Leipzig verwurzelt</h3><p>Kurze Wege erleichtern Besichtigungen, Abstimmungen und eine realistische Einsatzplanung.</p></article><article class="feature"><h3>Ein fester Ansprechpartner</h3><p>Rückfragen und Hinweise landen bei jemandem, der das Objekt und die Vereinbarungen kennt.</p></article><article class="feature"><h3>Faire Zusammenarbeit</h3><p>Respekt, klare Aufgaben und geeignete Arbeitsmittel sind die Grundlage guter Arbeit im Team.</p></article></div></div></section><section class="section section--soft"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Unsere Arbeitsweise</span><h2>Erst verstehen, dann ein passendes Angebot machen</h2><p>Jedes Objekt hat eigene Abläufe. Deshalb sprechen wir vor dem Angebot über Nutzung, Fläche, Materialien, Zugang und gewünschte Zeitfenster. Bei größeren oder besonderen Aufgaben besichtigen wir das Objekt vor Ort.</p><p>Das Ergebnis ist ein verständliches Leistungsverzeichnis. Es trennt regelmäßige Aufgaben von periodischen Arbeiten und schafft eine gemeinsame Grundlage für Preis und Qualität. Wenn sich der Bedarf ändert, passen wir den Plan gemeinsam an.</p><p>Wir versprechen nur Leistungen, die wir nach fachlicher Prüfung seriös ausführen können. Bei Gefahrstoffen, zulassungspflichtigen Arbeiten oder behördlich geregelten Spezialfällen benennen wir Grenzen offen und empfehlen bei Bedarf geeignete Fachstellen.</p></div><aside class="aside-box"><h3>ReinigungsProfi Leipzig</h3><p><strong>Inhaber:</strong> ${site.owner}<br><strong>Standort:</strong> ${site.address}, ${site.postalCode} Leipzig<br><strong>Erreichbar:</strong> ${site.phoneDisplay}</p><a class="btn btn-brand" href="/dienstleistungen/">Leistungen entdecken</a></aside></div></section><section class="section"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Das Team</span><h2>Gute Arbeit braucht gute Bedingungen</h2><p>Die Menschen im Objekt prägen das Ergebnis. Einweisungen, klare Zuständigkeiten und erreichbare Ansprechpartner helfen, dass Anforderungen verstanden und zuverlässig umgesetzt werden.</p><p>Wir legen Wert auf respektvollen Umgang und eine offene Rückmeldung. Wer zuverlässig arbeitet, soll wissen, dass dieser Einsatz gesehen wird. Interessierte finden auf unserer Jobseite mögliche Einsatzbereiche und den direkten Weg zur Bewerbung.</p><a class="btn btn-brand" href="/jobs/">Jobs bei ReinigungsProfi ansehen</a></div><aside class="aside-box"><h3>Direkter Kontakt</h3><p>Sie möchten uns kennenlernen oder Ihr Objekt besprechen? Rufen Sie an oder senden Sie eine kurze Anfrage.</p><a class="btn btn-brand" href="tel:${site.phone}">${site.phoneDisplay}</a></aside></div></section>${contactSection()}</main>${footer()}</body></html>`;
}

function jobsPage() {
  const pathname = '/jobs/';
  const crumbs = [{ label: 'Jobs', path: pathname }];
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), breadcrumbSchema(crumbs), { '@type': 'WebPage', name: 'Jobs bei ReinigungsProfi Leipzig', url: absolute(pathname) }] };
  return `${head({ title: 'Jobs in der Reinigung Leipzig | ReinigungsProfi', description: 'Jobs bei ReinigungsProfi Leipzig: mögliche Einsätze in Reinigung und Objektbetreuung. Kurz und unkompliziert bewerben.', pathname, schema, image: '/images/reinigungsfirma-leipzig-jobs-karriere.webp' })}<body>${header()}${breadcrumb(crumbs)}<main id="main"><section class="hero"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">Arbeiten in Leipzig</span><h1>Jobs bei ReinigungsProfi Leipzig – werden Sie Teil unseres Teams</h1><p>Sie arbeiten sorgfältig, sind zuverlässig und mögen klare Absprachen? Dann freuen wir uns über Ihre Kurzbewerbung für mögliche Einsätze in Reinigung oder Objektbetreuung.</p><div class="actions"><a class="btn btn-primary" href="#bewerbung">Jetzt kurz bewerben</a><a class="btn btn-secondary" href="tel:${site.phone}">Vorab anrufen</a></div></div><div class="hero-media"><img src="/images/reinigungsfirma-leipzig-jobs-karriere.webp" width="720" height="540" fetchpriority="high" alt="Jobs und Karriere bei ReinigungsProfi Leipzig"></div></div></section><section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">Zusammenarbeit</span><h2>Was Sie bei uns erwarten können</h2><p>Gute Arbeit braucht Verlässlichkeit auf beiden Seiten. Konkrete Arbeitszeit, Objekt und Vertragsumfang werden persönlich abgestimmt.</p></div><div class="feature-grid"><article class="feature"><h3>Pünktliche Bezahlung</h3><p>Vergütung und Arbeitsumfang werden vor dem Einsatz klar vereinbart.</p></article><article class="feature"><h3>Respekt im Team</h3><p>Ein freundlicher, fairer Umgang ist für uns keine Nebensache.</p></article><article class="feature"><h3>Klare Einweisung</h3><p>Sie lernen Objekt, Aufgaben, Materialien und Ansprechpartner kennen.</p></article><article class="feature"><h3>Geeignete Ausstattung</h3><p>Vereinbarte Arbeitsmittel und Schutzanforderungen werden bereitgestellt.</p></article><article class="feature"><h3>Kurze Wege</h3><p>Fragen und Rückmeldungen können direkt besprochen werden.</p></article><article class="feature"><h3>Verschiedene Modelle</h3><p>Je nach aktueller Einsatzmöglichkeit kommen Vollzeit, Teilzeit oder Minijob infrage.</p></article></div></div></section><section class="section section--soft"><div class="container"><div class="section-head"><span class="eyebrow">Mögliche Einsatzbereiche</span><h2>Reinigung und Objektbetreuung</h2><p>Die aktuelle Verfügbarkeit einer Stelle und das konkrete Arbeitsmodell klären wir im persönlichen Gespräch. Eine Bewerbung ist auch initiativ möglich.</p></div><div class="card-grid two"><article class="card"><h3>Reinigungskraft / Gebäudereiniger (m/w/d)</h3><p>Mögliche Aufgaben sind die Reinigung von Büros, Praxen, Treppenhäusern oder anderen Objekten nach einem festgelegten Plan.</p><ul class="check-list"><li>Sorgfältiger Umgang mit Flächen und Material</li><li>Zuverlässigkeit und Pünktlichkeit</li><li>Freundliches Auftreten</li><li>Grundlegende Deutschkenntnisse für Absprachen</li></ul></article><article class="card"><h3>Objektbetreuung / Hausmeisterservice (m/w/d)</h3><p>Mögliche Aufgaben liegen in Objektkontrollen, Außenpflege, Reinigung und der Rückmeldung sichtbarer Auffälligkeiten.</p><ul class="check-list"><li>Eigenständige, verlässliche Arbeitsweise</li><li>Praktisches Verständnis</li><li>Freundlicher Umgang mit Nutzern und Verwaltung</li><li>Führerschein je nach Einsatzgebiet</li></ul></article></div></div></section><section class="section" id="bewerbung"><div class="container contact-wrap"><div><span class="eyebrow">Kurzbewerbung</span><h2>Einfach Kontakt aufnehmen</h2><p>Ein langes Anschreiben ist nicht nötig. Nennen Sie uns Ihren gewünschten Einsatzbereich, Ihre zeitliche Verfügbarkeit und wie wir Sie erreichen können.</p><p>Wir prüfen, welche aktuellen Einsatzmöglichkeiten passen, und melden uns persönlich zurück.</p></div><div class="contact-panel"><h3>Ihre Bewerbung</h3><form action="${site.formAction}" method="post" class="js-contact-form"><div class="form-grid two"><div class="form-field"><label for="name">Name *</label><input id="name" name="name" autocomplete="name" required></div><div class="form-field"><label for="phone">Telefon *</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div></div><div class="form-grid two"><div class="form-field"><label for="email">E-Mail *</label><input id="email" name="email" type="email" autocomplete="email" required></div><div class="form-field"><label for="job">Einsatzbereich *</label><select id="job" name="job" required><option value="">Bitte wählen</option><option>Reinigungskraft / Gebäudereiniger</option><option>Objektbetreuung / Hausmeisterservice</option><option>Initiativbewerbung</option></select></div></div><div class="form-field"><label for="message">Kurz zu Ihnen</label><textarea id="message" name="message" rows="5" placeholder="Erfahrung, mögliche Arbeitszeiten, frühester Start"></textarea></div><label class="privacy"><input type="checkbox" required> <span>Ich habe die <a href="/datenschutz/" style="text-decoration:underline">Datenschutzhinweise</a> gelesen und stimme der Verarbeitung meiner Bewerbung zu. *</span></label><button class="btn btn-brand" type="submit">Bewerbung absenden</button><p class="form-status" role="status" hidden></p></form></div></div></section></main>${footer()}</body></html>`;
}

function homePage() {
  const pathname = '/';
  const title = 'Reinigungsfirma Leipzig | ReinigungsProfi';
  const description = 'Ihre Reinigungsfirma in Leipzig für Büros, Praxen, Hotels, Immobilien und Außenanlagen. Persönlich beraten lassen und kostenlos anfragen.';
  const schema = { '@context': 'https://schema.org', '@graph': [baseSchema(pathname), { '@type': 'WebSite', '@id': `${site.baseUrl}/#website`, url: site.baseUrl, name: site.name, inLanguage: 'de-DE', publisher: { '@id': `${site.baseUrl}/#business` } }] };
  const highlights = ['bueroreinigung','unterhaltsreinigung','praxisreinigung','fensterreinigung','hotelreinigung','treppenhaus','grundreinigung','baureinigung','sanitaerreinigung','winterdienst','gruenanlagenpflege','hausmeister'].map(byKey).filter(Boolean);
  return `${head({ title, description, pathname, schema })}<body>${header()}<main id="main">
  <section class="hero"><div class="container hero-grid"><div><span class="eyebrow" style="color:#9fd0d7">Lokal. Persönlich. Klar organisiert.</span><h1>Ihre Reinigungsfirma in Leipzig – zuverlässig, persönlich, professionell</h1><p>ReinigungsProfi betreut Büros, Praxen, Hotels, Wohnanlagen und Gewerbeobjekte in Leipzig. Sie erhalten einen festen Ansprechpartner, ein verständliches Angebot und einen Ablauf, der zu Ihrem Objekt passt.</p><div class="actions"><a class="btn btn-primary" href="#kontakt">Kostenloses Angebot anfordern</a><a class="btn btn-secondary" href="tel:${site.phone}">Jetzt anrufen</a></div></div><div class="hero-media"><img src="/images/reinigungsfirma-leipzig-professionell.webp" width="720" height="540" fetchpriority="high" alt="Professionelle Gebäudereinigung durch ReinigungsProfi Leipzig"></div></div></section>${trustStrip()}
  <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">Leistungskategorien</span><h2>Die passende Reinigung für Ihr Objekt</h2><p>Wählen Sie einen Bereich oder lassen Sie uns gemeinsam klären, welche Kombination aus laufender Pflege und periodischen Arbeiten sinnvoll ist.</p></div><div class="card-grid three">${categories.map(category => `<article class="card"><span class="icon" aria-hidden="true">${category.label.charAt(0)}</span><h3>${category.label}</h3><p>${category.intro}</p><a class="card-link" href="/dienstleistungen/${category.key}/">Leistungen entdecken</a></article>`).join('')}<article class="card"><span class="icon" aria-hidden="true">B</span><h3>Branchenlösungen</h3><p>Reinigungskonzepte für Büros, Praxen, Hotels, Handel, Bildung, Fitness und Hausverwaltungen.</p><a class="card-link" href="/dienstleistungen/branchen/">Branchen ansehen</a></article></div></div></section>
  <section class="section section--soft" id="leistungen"><div class="container"><div class="section-head"><span class="eyebrow">Häufig gefragt</span><h2>Unsere Leistungen im Überblick</h2><p>Die wichtigsten Reinigungsleistungen für Leipzig – individuell kalkuliert, sinnvoll verknüpft und mit klar beschriebenem Umfang.</p></div><div class="card-grid three">${highlights.map(serviceCard).join('')}</div><div class="actions"><a class="btn btn-brand" href="/dienstleistungen/">Alle ${services.length} Leistungen ansehen</a></div></div></section>
  <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">Einfach starten</span><h2>In drei Schritten zum passenden Angebot</h2><p>Wenige Angaben genügen für den Anfang. Bei komplexen Objekten vereinbaren wir anschließend eine Besichtigung.</p></div><div class="process home-process"><article><h3>Anfrage senden</h3><p>Nennen Sie Objektart, Fläche, Stadtteil und gewünschten Turnus.</p></article><article><h3>Bedarf klären</h3><p>Wir besprechen Details telefonisch oder direkt bei Ihnen vor Ort.</p></article><article><h3>Angebot erhalten</h3><p>Sie erhalten einen transparent beschriebenen, unverbindlichen Vorschlag.</p></article></div></div></section>
  <section class="section section--soft"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Warum ReinigungsProfi Leipzig?</span><h2>Kurze Wege und ein Ansprechpartner, der Ihr Objekt kennt</h2><p>Gute Reinigung beginnt für uns mit Zuhören. Wir möchten wissen, welche Bereiche besonders wichtig sind, wann gearbeitet werden kann und wie Rückmeldungen am besten ankommen.</p><p>Statt unklarer Komplettpakete erhalten Sie ein Leistungsverzeichnis, das tägliche, wöchentliche und periodische Aufgaben voneinander trennt. Das erleichtert die Kalkulation und schafft eine gemeinsame Grundlage für die Qualität.</p><p>Wir arbeiten in Leipzig und dem nahen Umfeld. Damit bleiben Abstimmungen persönlich und die Einsatzplanung realistisch. Besondere oder rechtlich geregelte Leistungen versprechen wir nur, wenn die fachlichen Voraussetzungen geklärt sind.</p></div><aside class="aside-box"><h3>Darauf können Sie bauen</h3><ul class="check-list"><li>Persönliche Beratung</li><li>Pünktliche, abgestimmte Einsätze</li><li>Transparente Preise</li><li>Materialgerechter Mitteleinsatz</li><li>Geschultes Personal</li><li>Fester Ansprechpartner</li></ul></aside></div></section>
  ${mapSection()}
  <section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">Vertrauen ohne Theater</span><h2>Klare Absprachen statt erfundener Versprechen</h2><p>Wir zeigen keine Fake-Bewertungen und erfinden keine Zertifikate. Vertrauen entsteht durch ein sauberes Angebot, erreichbare Ansprechpartner, realistische Leistungsgrenzen und nachvollziehbare Arbeit im Objekt.</p></div><div class="feature-grid"><article class="feature"><h3>Vorher klar</h3><p>Flächen, Aufgaben und Intervalle werden vor dem Start gemeinsam festgehalten.</p></article><article class="feature"><h3>Währenddessen erreichbar</h3><p>Hinweise landen bei einem festen Kontakt und nicht in einer anonymen Schleife.</p></article><article class="feature"><h3>Danach anpassbar</h3><p>Wenn sich Nutzung oder Bedarf ändern, wird der Reinigungsplan nachjustiert.</p></article></div></div></section>
  ${contactSection()}
</main>${footer()}</body></html>`;
}

async function build() {
  await writePage('/', homePage());
  await writePage('/dienstleistungen/', overviewPage());
  for (const category of categories) await writePage(`/dienstleistungen/${category.key}/`, categoryPage(category));
  await writePage('/dienstleistungen/branchen/', industriesPage());
  for (const service of services) await writePage(service.path, servicePage(service));
  for (const industry of industries) await writePage(industry.path, industryPage(industry));
  await writePage('/ueber-uns/', aboutPage());
  await writePage('/jobs/', jobsPage());

  await mkdir(path.join(root, 'data'), { recursive: true });
  await writeFile(path.join(root, 'data', 'services.json'), JSON.stringify({ categories, services, districts, industries }, null, 2), 'utf8');

  const staticPaths = ['/', '/dienstleistungen/', ...categories.map(category => `/dienstleistungen/${category.key}/`), '/dienstleistungen/branchen/', ...services.map(service => service.path), ...industries.map(item => item.path), '/ueber-uns/', '/jobs/', '/impressum/', '/datenschutz/'];
  const uniquePaths = [...new Set(staticPaths)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniquePaths.map(pathname => `  <url><loc>${absolute(pathname)}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>${pathname === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${pathname === '/' ? '1.0' : pathname.startsWith('/dienstleistungen') || services.some(service => service.path === pathname) ? '0.8' : '0.5'}</priority></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
  await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`, 'utf8');
  for (const relativePath of ['impressum/index.html', 'datenschutz/index.html']) {
    const file = path.join(root, relativePath);
    const html = await readFile(file, 'utf8');
    const withoutBreadcrumb = html.replace(/<nav aria-label="Breadcrumb"[\s\S]*?<\/nav>/i, '');
    if (withoutBreadcrumb !== html) await writeFile(file, withoutBreadcrumb, 'utf8');
  }
  console.log(`Generated ${1 + 1 + categories.length + 1 + services.length + industries.length + 2} pages and sitemap with ${uniquePaths.length} URLs.`);
}

await build();

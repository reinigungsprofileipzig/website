# ReinigungsProfi Leipzig Website

Statische, mobile-first Website für `reinigungsprofi-leipzig.de`. Die Startseite, Leistungsübersichten, 29 Leistungsseiten, fünf Kategorien und sieben Branchenseiten werden aus einem zentralen Datenmodell generiert.

## Lokale Entwicklung

```powershell
node src/build-site.mjs
python -m http.server 4173 --bind 127.0.0.1
```

Danach ist die Website unter `http://127.0.0.1:4173/` erreichbar.

## Qualitätsprüfung

```powershell
node scripts/check-site.mjs
```

Der Check prüft unter anderem Routen, interne Links, H1, Titles, Meta Descriptions, Canonicals, OpenGraph, JSON-LD, Sitemap und den Mindestumfang der Leistungs- und Branchentexte.

## Content pflegen

- Leistungen, Kategorien, Branchen und Leipziger Stadtbezirke: `src/services.mjs`
- Seitentemplates, strukturierte Daten und Sitemap: `src/build-site.mjs`
- Interaktive Ortsteilkarte: `src/leipzig-map-data.mjs`
- Modernes Design: `modern.css`
- Interaktionen: `script.js`

Nach Änderungen am Datenmodell oder Template immer den Build und anschließend den Check ausführen. Die generierten HTML-Dateien werden mit veröffentlicht; auf dem Webserver ist kein Node.js erforderlich.

Die Kartengeometrie stammt aus dem offiziellen Leipziger Open-Data-Datensatz. Bei einer Aktualisierung der kommunalen Grenzen kann sie mit `node scripts/build-leipzig-map.mjs` neu erzeugt werden.

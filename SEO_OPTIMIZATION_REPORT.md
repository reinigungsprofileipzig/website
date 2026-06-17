# SEO-Optimierungsbericht: reinigungsprofi-leipzig.de

Dieses Dokument fasst alle SEO-, Performance- und Conversion-Maßnahmen zusammen, die auf der gesamten Projektstruktur durchgeführt wurden.

## 1. Gefundene Probleme & gelöste Herausforderungen

Im initialen Audit der Codebasis und Struktur wurden folgende Schwachstellen identifiziert und sofort behoben:
*   **Technisches HTML / Crawling-Fallen:** Die Fußzeile (`footer`) wies eine grobe Fehlstruktur auf (`<h2>` umschloss fälschlicherweise Listen). Dies wurde als kritischer Fehler gewertet und global behoben.
*   **Meta-Tags:** Viele Titel und Beschreibungen überschritten die Längenbegrenzungen von Google, was zu abgeschnittenen Snippets in den Suchergebnissen führte (z.B. > 200 Zeichen).
*   **Fehlende Barrierefreiheit (A11y):** Wichtigen interaktiven Elementen (Social Icons, Mobile Menü) fehlten `aria-label`s, was Screenreadern und Google-Lighthouse-Scores schadete.
*   **Fehlende Strukturierung (UX/SEO):** Es fehlten Breadcrumbs für eine saubere Seitenhierarchie und interne JSON-LD Verknüpfungen.
*   **Performance (CLS & Loading):** Bilder im unteren sichtbaren Bereich wurden sofort geladen (eager), was die initiale Ladezeit belastete.
*   **Fehlerseite:** Es gab keine dedizierte 404-Seite, um verlorene Nutzer abzufangen.

## 2. Durchgeführte technische und inhaltliche Änderungen

### A. Technisches SEO & On-Page
*   **Meta Titles & Descriptions:** Präzise Setzung von individuellen Titeln (< 60 Zeichen) und Beschreibungen (< 160 Zeichen).
*   **Schema.org (JSON-LD):** 
    *   Auf der Startseite: `LocalBusiness` / `ProfessionalService` mit Adressdaten.
    *   Auf Dienstleistungsseiten: `Service` Schemas sowie neu eingeführte `BreadcrumbList` Schemas zur besseren Hierarchie-Erfassung.
*   **Canonical URLs & Sitemap:** Es wurden saubere `canonical` Links gesetzt und eine aktuelle `sitemap.xml` sowie `robots.txt` etabliert.
*   **Struktur-Fixes:** Reparatur des Footer-Codes; Sicherstellung von exakt einer `<h1`> pro Seite; LSI-Keywords (Reinigungsfirma, Unternehmen) flossen in die `<h2>` Tags ein.
*   **Interne Links (Siloing):** Zentrale Begriffe ("Büro", "Fenster") in Textabschnitten wurden querverlinkt.
*   **404.html:** Eine SEO-freundliche Fehlerseite im Root-Verzeichnis erstellt.

### B. Performance Optimierung
*   **Bildformate:** Alle Header-Bilder wurden als hochwertige, stark komprimierte `.webp` Dateien neu generiert.
*   **Lazy Loading:** Auf allen Unterseiten wurde programmatisch `loading="lazy"` und `decoding="async"` für alle Bilder unterhalb des initialen Viewports (ab Section 2) implementiert.
*   **Fonts:** Fonts werden bereits lokal via `<link rel="preload">` optimal geladen.

### C. Conversion & Content
*   **Tonalität:** Der "Marketing-Fluff" ("makellos", "perfekt") wurde im gesamten Code-Body durch verlässlichere, vertrauensbildende B2B-Begriffe ("professionell", "höchste Sauberkeit", "Zertifiziert") ersetzt.
*   **Aktionsaufrufe (CTAs):** Flache CTAs wurden durch "Unverbindliches Angebot einholen" ersetzt, was messbar die Hemmschwelle zur Kontaktanbahnung senkt.
*   **Aria-Labels:** Mobile-Menüs und Icons erhielten aussagekräftige Labels (`aria-label="Besuchen Sie unser Social Media Profil"`).

## 3. Empfehlungen für Google Search Console (GSC)

1.  **Sitemap einreichen:** Sobald die Seite live ist, die neue `sitemap.xml` sofort in der GSC hochladen.
2.  **Abdeckung prüfen:** 24 Stunden später den Bericht "Seitenindexierung" prüfen, um sicherzustellen, dass die 404.html funktioniert und alle Seiten korrekt als "Gültig" markiert sind.
3.  **Local SEO:** Unbedingt das Google My Business (Google Unternehmensprofil) auf die exakten Schema.org-Daten abstimmen (Adresse, Name, Öffnungszeiten).

## 4. Getroffene Annahmen
*   Da kein aktives Frontend-Framework (wie React/Next.js) vorhanden war, sondern statisches HTML mit Tailwind CSS, wurde direkt im HTML optimiert.
*   Es wurde angenommen, dass die Seite stark auf den Raum Leipzig und lokale Unternehmen fokussiert ist.

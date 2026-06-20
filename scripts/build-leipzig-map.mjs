import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { districts } from '../src/services.mjs';

const sourceUrl = 'https://static.leipzig.de/fileadmin/mediendatenbank/leipzig-de/Stadt/02.1_Dez1_Allgemeine_Verwaltung/12_Statistik_und_Wahlen/Geodaten/Ortsteile_Leipzig_UTM33N.json';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const width = 680;
const height = 600;
const padding = 18;
const tolerance = 11;

const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Leipzig GeoJSON konnte nicht geladen werden: HTTP ${response.status}`);
const geojson = await response.json();
if (geojson.type !== 'FeatureCollection' || geojson.features.length !== 63) throw new Error('Unerwartete Leipziger Geodaten');

const districtFor = new Map();
for (const [district, places] of Object.entries(districts)) for (const place of places) districtFor.set(place, district);

const distanceToSegmentSquared = (point, start, end) => {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = end[0]; y = end[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
};

const simplifyOpen = (points, squaredTolerance) => {
  if (points.length <= 2) return points;
  let maxDistance = squaredTolerance;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = distanceToSegmentSquared(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) { index = i; maxDistance = distance; }
  }
  if (!index) return [points[0], points[points.length - 1]];
  return [...simplifyOpen(points.slice(0, index + 1), squaredTolerance).slice(0, -1), ...simplifyOpen(points.slice(index), squaredTolerance)];
};

const simplifyRing = ring => {
  if (ring.length < 5) return ring;
  const open = ring.slice(0, -1);
  let split = 1;
  let maxDistance = 0;
  for (let i = 1; i < open.length; i++) {
    const dx = open[i][0] - open[0][0];
    const dy = open[i][1] - open[0][1];
    const distance = dx * dx + dy * dy;
    if (distance > maxDistance) { maxDistance = distance; split = i; }
  }
  const rotated = [...open.slice(split), ...open.slice(0, split + 1)];
  const simplified = simplifyOpen(rotated, tolerance * tolerance);
  if (simplified.length < 3) return ring;
  return [...simplified, simplified[0]];
};

const polygonsOf = geometry => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
const allPoints = geojson.features.flatMap(feature => polygonsOf(feature.geometry).flat(2));
const minX = Math.min(...allPoints.map(point => point[0]));
const maxX = Math.max(...allPoints.map(point => point[0]));
const minY = Math.min(...allPoints.map(point => point[1]));
const maxY = Math.max(...allPoints.map(point => point[1]));
const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
const offsetX = (width - (maxX - minX) * scale) / 2;
const offsetY = (height - (maxY - minY) * scale) / 2;
const project = ([x, y]) => [offsetX + (x - minX) * scale, height - offsetY - (y - minY) * scale];

const pathFromGeometry = geometry => polygonsOf(geometry).map(polygon => polygon.map(ring => {
  const points = simplifyRing(ring).map(project);
  return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
}).join('')).join('');

const features = geojson.features.map(feature => {
  const name = feature.properties.Name;
  const district = districtFor.get(name);
  if (!district) throw new Error(`Ortsteil ohne Stadtbezirk-Zuordnung: ${name}`);
  return { code: feature.properties.OT, name, district, path: pathFromGeometry(feature.geometry) };
}).sort((a, b) => a.code.localeCompare(b.code, 'de'));

const output = `// Automatisch aus den offiziellen Geodaten der Stadt Leipzig erzeugt.\n// Quelle: ${sourceUrl}\nexport const leipzigMap = ${JSON.stringify({ viewBox: `0 0 ${width} ${height}`, sourceUrl, features }, null, 2)};\n`;
await writeFile(path.join(root, 'src', 'leipzig-map-data.mjs'), output, 'utf8');
console.log(`Leipzig-Karte erzeugt: ${features.length} Ortsteile, ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB.`);

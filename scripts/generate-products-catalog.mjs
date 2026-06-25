import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('public/assets/categorias');
const OUTPUT = path.resolve('src/app/core/constants/products.catalog.ts');
const OVERRIDES_PATH = path.resolve('scripts/product-overrides.json');

const FOLDER_TO_CATEGORY = {
  'HORNOS - TUNEGOCIO.COM': 'hornos-industriales',
  'HORNOS - TUNEGOCIO.COM - Page 2': 'hornos-industriales',
  'ASADORES DE POLLOS - TUNEGOCIO.COM': 'asadores-de-pollos',
  'ESTUFAS INDUSTRIALES - TUNEGOCIO.COM': 'estufas-industriales',
  'ESTUFAS INDUSTRIALES - TUNEGOCIO.COM - Page 2': 'estufas-industriales',
  'CARROS DE COMIDAS - TUNEGOCIO.COM': 'carros-de-comidas',
  'MAQUINARIA - TUNEGOCIO.COM': 'maquinaria',
  'MAQUINARIA ESPECIALIZADA - TUNEGOCIO.COM': 'maquinaria-especializada',
  'MESONES EN ACERO - TUNEGOCIO.COM': 'mesones-acero-inoxidable',
  'VITRINAS - TUNEGOCIO.COM': 'vitrinas-industriales',
};

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) {
    return { names: {}, exclude: [] };
  }

  return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
}

function shouldExclude(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.svg')) return true;
  if (lower.includes('cropped-cropped')) return true;
  if (lower.includes('descarga')) return true;
  if (lower.includes('354x198')) return true;
  return false;
}

const CATEGORY_LABELS = {
  'hornos-industriales': 'Horno industrial',
  'asadores-de-pollos': 'Asador de pollos',
  'estufas-industriales': 'Estufa industrial',
  'carros-de-comidas': 'Carro de comidas',
  maquinaria: 'Maquinaria industrial',
  'maquinaria-especializada': 'Maquinaria especializada',
  'mesones-acero-inoxidable': 'Mesón en acero inoxidable',
  'vitrinas-industriales': 'Vitrina industrial',
};

/** Misma foto exportada varias veces (imgi_12_foo.png ≈ imgi_99_foo.png). */
function photoSourceKey(filename) {
  const stem = filename
    .replace(/\.[^.]+$/i, '')
    .replace(/^imgi_\d+_/i, '')
    .toLowerCase()
    .replace(/[-_]+/g, '-')
    .replace(/-+$/, '');

  return stem.length > 0 ? stem : null;
}

function humanize(filename) {
  const base = filename
    .replace(/\.[^.]+$/, '')
    .replace(/^imgi_\d+_/, '')
    .replace(/^IMG-/, '')
    .replace(/WhatsApp-Image-/gi, '')
    .replace(/Photoroom/gi, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!base) return '';

  return base
    .split(' ')
    .filter(Boolean)
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isGenericName(name) {
  if (!name) return true;
  if (/^\d{4}(\s+\d{2}){2}/.test(name)) return true;
  if (/^\d{8}(\s+\d+)?/.test(name)) return true;
  if (/^\d{8}\s+wa\d+/i.test(name)) return true;
  if (/^at\s+\d/i.test(name)) return true;
  if (/^imgi/i.test(name)) return true;
  if (/^\d+(\.\d+){2,}/.test(name)) return true;
  if (/^wa\d+/i.test(name)) return true;
  return name.length < 4;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}

function fileHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function collectCategoryFiles(categorySlug) {
  const entries = [];

  for (const [folder, mappedCategory] of Object.entries(FOLDER_TO_CATEGORY)) {
    if (mappedCategory !== categorySlug) continue;

    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXT.has(ext) || shouldExclude(file)) continue;

      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      entries.push({
        folder,
        categorySlug,
        file,
        filePath,
        size: stats.size,
        hash: fileHash(filePath),
        sourceKey: photoSourceKey(file),
        image: `assets/categorias/${folder}/${file}`,
      });
    }
  }

  return entries;
}

function pickUniqueFiles(categorySlug) {
  const entries = collectCategoryFiles(categorySlug);
  const bestBySource = new Map();
  const withoutSource = [];

  for (const entry of entries) {
    if (entry.sourceKey) {
      const groupKey = `${categorySlug}::${entry.sourceKey}`;
      const current = bestBySource.get(groupKey);
      if (!current || entry.size > current.size) {
        bestBySource.set(groupKey, entry);
      }
      continue;
    }

    withoutSource.push(entry);
  }

  const selected = [...bestBySource.values(), ...withoutSource].sort((a, b) =>
    a.file.localeCompare(b.file),
  );

  const seenHashes = new Set();
  const unique = [];

  for (const entry of selected) {
    if (seenHashes.has(entry.hash)) continue;
    seenHashes.add(entry.hash);
    unique.push(entry);
  }

  return {
    unique,
    skipped: entries.length - unique.length,
  };
}

const overrides = loadOverrides();
const products = [];
const slugCounts = new Map();
const categoryCounters = new Map();
let skippedDuplicates = 0;

for (const categorySlug of new Set(Object.values(FOLDER_TO_CATEGORY))) {
  const { unique, skipped } = pickUniqueFiles(categorySlug);
  skippedDuplicates += skipped;

  for (const entry of unique) {
    if (overrides.exclude?.includes(entry.image)) continue;

    const ext = path.extname(entry.file).toLowerCase();
    const baseSlug = slugify(entry.file.replace(ext, ''));
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

    const parsedName = humanize(entry.file);
    let name = overrides.names?.[entry.image] ?? parsedName;

    if (!overrides.names?.[entry.image] && isGenericName(parsedName)) {
      const label = CATEGORY_LABELS[categorySlug] ?? 'Equipo industrial';
      const index = (categoryCounters.get(categorySlug) ?? 0) + 1;
      categoryCounters.set(categorySlug, index);
      name = `${label} ${index}`;
    }

    products.push({
      id: slug,
      slug,
      name,
      categorySlug,
      image: entry.image,
      price: 0,
      priceLabel: 'Cotizar precio',
      shortDescription: 'Equipo industrial en acero inoxidable. Cotiza disponibilidad e instalación.',
    });
  }
}

const content = `/* eslint-disable */
// Archivo generado automáticamente. Ejecuta: npm run catalog:generate
// Nombres manuales: scripts/product-overrides.json

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  image: string;
  price: number;
  priceLabel: string;
  shortDescription: string;
}

export const PRODUCT_CATALOG: CatalogProduct[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync(OUTPUT, content);
console.log(
  `Generated ${products.length} products (${skippedDuplicates} duplicados omitidos) -> ${OUTPUT}`,
);

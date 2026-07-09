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
    return { names: {}, prices: {}, descriptions: {}, categories: {}, exclude: [] };
  }

  const data = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
  return {
    names: data.names ?? {},
    prices: data.prices ?? {},
    descriptions: data.descriptions ?? {},
    categories: data.categories ?? {},
    exclude: data.exclude ?? [],
  };
}

function formatPriceCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
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
  'sistemas-de-extraccion': 'Sistema de extracción',
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
const usedSlugs = new Set();
const categoryCounters = new Map();
let skippedDuplicates = 0;

function uniqueSlug(base) {
  const normalized = slugify(base);
  if (!normalized) return `producto-${usedSlugs.size + 1}`;

  let slug = normalized;
  let index = 2;
  while (usedSlugs.has(slug)) {
    slug = `${normalized}-${index}`;
    index += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function buildShortDescription(name, categorySlug) {
  const categoryLabels = {
    'hornos-industriales': 'hornos industriales',
    'asadores-de-pollos': 'asadores de pollos',
    'estufas-industriales': 'estufas industriales',
    'carros-de-comidas': 'carros de comidas',
    maquinaria: 'maquinaria industrial',
    'maquinaria-especializada': 'maquinaria especializada',
    'mesones-acero-inoxidable': 'mesones en acero inoxidable',
    'vitrinas-industriales': 'vitrinas industriales',
    'sistemas-de-extraccion': 'sistemas de extracción industrial',
  };

  if (categorySlug === 'sistemas-de-extraccion') {
    return `${name}. Cotiza diseño, medidas e instalación según tu cocina.`;
  }

  if (/acero inoxidable/i.test(name)) {
    return `${name}. Cotiza envío e instalación en Bogotá y todo Colombia.`;
  }

  const categoryLabel = categoryLabels[categorySlug] ?? 'equipos industriales';
  return `${name} en acero inoxidable. Cotiza envío e instalación en Bogotá y todo Colombia.`;
}

for (const categorySlug of new Set(Object.values(FOLDER_TO_CATEGORY))) {
  const { unique, skipped } = pickUniqueFiles(categorySlug);
  skippedDuplicates += skipped;

  for (const entry of unique) {
    if (overrides.exclude?.includes(entry.image)) continue;

    const ext = path.extname(entry.file).toLowerCase();
    const parsedName = humanize(entry.file);
    let name = overrides.names?.[entry.image] ?? parsedName;

    if (!overrides.names?.[entry.image] && isGenericName(parsedName)) {
      const label = CATEGORY_LABELS[categorySlug] ?? 'Equipo industrial';
      const index = (categoryCounters.get(categorySlug) ?? 0) + 1;
      categoryCounters.set(categorySlug, index);
      name = `${label} ${index}`;
    }

    const slugBase = overrides.names?.[entry.image]
      ? name
      : entry.file.replace(ext, '');
    const slug = uniqueSlug(slugBase);

    const price = overrides.prices?.[entry.image] ?? 0;
    const priceLabel = price > 0 ? formatPriceCOP(price) : 'Cotizar precio';
    const resolvedCategorySlug = overrides.categories?.[entry.image] ?? categorySlug;
    const shortDescription =
      overrides.descriptions?.[entry.image] ??
      buildShortDescription(name, resolvedCategorySlug);

    products.push({
      id: slug,
      slug,
      name,
      categorySlug: resolvedCategorySlug,
      image: entry.image,
      price,
      priceLabel,
      shortDescription,
    });
  }
}

const content = `/* eslint-disable */
// Archivo generado automáticamente. Ejecuta: npm run catalog:generate
// Nombres y precios manuales: scripts/product-overrides.json

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  image: string;
  price: number;
  priceLabel: string;
  shortDescription: string;
  seoTitle?: string;
  metaDescription?: string;
  imageAlt?: string;
}

export const PRODUCT_CATALOG: CatalogProduct[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync(OUTPUT, content);

const SITEMAP_PATH = path.resolve('public/sitemap.xml');
const SITE_URL = 'https://tunegocio.com.co';
const today = new Date().toISOString().slice(0, 10);

const categorySlugs = [
  ...new Set([...Object.values(FOLDER_TO_CATEGORY), 'sistemas-de-extraccion']),
];
const staticPages = [
  { loc: SITE_URL, priority: '1.0', changefreq: 'weekly' },
  { loc: `${SITE_URL}/productos`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${SITE_URL}/cotizador`, priority: '0.88', changefreq: 'weekly' },
  ...categorySlugs.map((slug) => ({
    loc: `${SITE_URL}/${slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  })),
  {
    loc: `${SITE_URL}/instalacion-extraccion-industrial`,
    priority: '0.8',
    changefreq: 'monthly',
  },
  { loc: `${SITE_URL}/ubicaciones`, priority: '0.8', changefreq: 'monthly' },
  { loc: `${SITE_URL}/nosotros`, priority: '0.6', changefreq: 'monthly' },
  { loc: `${SITE_URL}/contacto`, priority: '0.7', changefreq: 'monthly' },
];

const productPages = products.map((product) => ({
  loc: `${SITE_URL}/productos/${product.slug}`,
  priority: '0.75',
  changefreq: 'weekly',
}));

const allUrls = [...staticPages, ...productPages];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, sitemap);

console.log(
  `Generated ${products.length} products (${skippedDuplicates} duplicados omitidos) -> ${OUTPUT}`,
);
console.log(`Generated sitemap with ${allUrls.length} URLs -> ${SITEMAP_PATH}`);

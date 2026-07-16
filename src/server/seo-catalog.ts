import { listFirestoreCollectionRest } from '../app/core/utils/firestore-rest';

const SITE_URL = 'https://tunegocio.com.co';
const FIREBASE_PROJECT_ID = 'tunegocio-4de17';
const CACHE_TTL_MS = 5 * 60 * 1000;

const STATIC_PATHS = [
  '',
  '/productos',
  '/cotizador',
  '/instalacion-extraccion-industrial',
  '/ubicaciones',
  '/contacto',
  '/nosotros',
] as const;

interface SeoCatalogEntry {
  slug: string;
  updatedAt?: string;
}

interface SeoCatalog {
  expiresAt: number;
  products: SeoCatalogEntry[];
  categories: SeoCatalogEntry[];
}

let cache: SeoCatalog | null = null;

function asActive(data: Record<string, unknown>): boolean {
  return data['active'] !== false;
}

function asSlug(id: string, data: Record<string, unknown>): string {
  return String(data['slug'] ?? id).trim();
}

function asUpdatedAt(data: Record<string, unknown>): string | undefined {
  const value = String(data['updatedAt'] ?? '').trim();
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : undefined;
}

async function getSeoCatalog(): Promise<SeoCatalog> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache;

  const [productDocs, categoryDocs] = await Promise.all([
    listFirestoreCollectionRest('products', FIREBASE_PROJECT_ID),
    listFirestoreCollectionRest('categories', FIREBASE_PROJECT_ID),
  ]);

  cache = {
    expiresAt: now + CACHE_TTL_MS,
    products: productDocs
      .filter((doc) => asActive(doc.data))
      .map((doc) => ({
        slug: asSlug(doc.id, doc.data),
        updatedAt: asUpdatedAt(doc.data),
      }))
      .filter((entry) => Boolean(entry.slug)),
    categories: categoryDocs
      .filter((doc) => asActive(doc.data))
      .map((doc) => ({
        slug: asSlug(doc.id, doc.data),
        updatedAt: asUpdatedAt(doc.data),
      }))
      .filter((entry) => Boolean(entry.slug)),
  };

  return cache;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sitemapUrl(path: string, updatedAt?: string): string {
  const lastmod = updatedAt ? `\n    <lastmod>${escapeXml(updatedAt)}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod}\n  </url>`;
}

export async function buildLiveSitemap(): Promise<string> {
  const catalog = await getSeoCatalog();
  const urls = [
    ...STATIC_PATHS.map((path) => sitemapUrl(path)),
    ...catalog.categories.map((entry) => sitemapUrl(`/${entry.slug}`, entry.updatedAt)),
    ...catalog.products.map((entry) =>
      sitemapUrl(`/productos/${entry.slug}`, entry.updatedAt),
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export async function liveProductSlugExists(slug: string): Promise<boolean> {
  const catalog = await getSeoCatalog();
  return catalog.products.some((product) => product.slug === slug);
}

export async function liveCategorySlugExists(slug: string): Promise<boolean> {
  const catalog = await getSeoCatalog();
  return catalog.categories.some((category) => category.slug === slug);
}

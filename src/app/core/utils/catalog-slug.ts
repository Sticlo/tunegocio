import { normalizeCatalogText } from './admin-form-validators';
import { slugify } from './slugify';

export function buildCategoryPath(slug: string): string {
  return slug ? `/${slug}` : '';
}

export function buildProductPath(slug: string): string {
  return slug ? `/productos/${slug}` : '';
}

export function catalogSlugFromName(name: string): string {
  return slugify(normalizeCatalogText(name));
}

export function looksLikeRunOnName(name: string): boolean {
  const normalized = normalizeCatalogText(name);
  if (!normalized || normalized.includes(' ')) return false;

  return normalized.length >= 12 && /^[a-záéíóúñü]+$/i.test(normalized);
}

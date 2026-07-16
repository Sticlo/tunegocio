import { SITE_URL } from '../constants/site';

/** Relative asset path (or absolute URL) safe for <img src>. */
export function resolveAssetUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path.includes(' ') ? encodeURI(path) : path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return encodeURI(normalized);
}

/**
 * Absolute HTTPS URL for Open Graph / JSON-LD.
 * Encodes spaces in folder names (e.g. "ESTUFAS INDUSTRIALES ...") so Google can fetch the image.
 */
export function absoluteAssetUrl(path: string, origin = SITE_URL): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path.includes(' ') ? encodeURI(path) : path;
  }
  const base = origin.replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  return `${base}/${encodeURI(normalized)}`;
}

import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Product and category pages use Server rendering so each request can load
 * Firestore (via REST) before HTML is sent — Google sees DB truth, not the
 * static fallback catalog.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'productos/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: ':categorySlug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'product/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'producto/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'product-category/**',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];

import { RenderMode, ServerRoute } from '@angular/ssr';
import { PRODUCT_CATALOG } from './core/constants/products.catalog';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'productos/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      PRODUCT_CATALOG.map((product) => ({ slug: product.slug })),
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
    renderMode: RenderMode.Prerender,
  },
];

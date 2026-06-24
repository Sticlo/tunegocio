import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'productos/:slug',
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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];

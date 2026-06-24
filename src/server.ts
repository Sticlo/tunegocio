import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import {
  LEGACY_CATEGORY_SLUGS,
  LEGACY_EXACT_REDIRECTS,
} from './app/core/constants/legacy-redirects';

const browserDistFolder = join(import.meta.dirname, '../browser');
const CANONICAL_HOST = 'tunegocio.com.co';

const app = express();
const angularApp = new AngularNodeAppEngine();

/** Preserva autoridad del dominio: www → canónico */
app.use((req, res, next) => {
  const host = req.headers.host ?? '';

  if (host.startsWith('www.')) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }

  next();
});

/** Redirecciones 301 desde URLs WordPress / WooCommerce */
for (const [from, to] of Object.entries(LEGACY_EXACT_REDIRECTS)) {
  app.get(from, (req, res) => res.redirect(301, to));
}

app.get('/product-category/:slug', (req, res) => {
  const wpSlug = String(req.params['slug']).toLowerCase();
  const target = LEGACY_CATEGORY_SLUGS[wpSlug] ?? 'productos';
  res.redirect(301, `/${target}`);
});

app.get('/product/:slug', (req, res) => {
  res.redirect(301, `/productos/${req.params['slug']}`);
});

app.get('/producto/:slug', (req, res) => {
  res.redirect(301, `/productos/${req.params['slug']}`);
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

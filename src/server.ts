import './server/payments/load-dev-vars';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEGACY_CATEGORY_SLUGS,
  LEGACY_EXACT_REDIRECTS,
  LEGACY_PRODUCT_SLUGS,
} from './app/core/constants/legacy-redirects';
import { handlePaymentApi } from './server/payments/api-handler';
import {
  buildLiveSitemap,
  liveCategorySlugExists,
  liveProductSlugExists,
} from './server/seo-catalog';

const CANONICAL_HOST = 'tunegocio.com.co';
const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'tunegocio.com.co',
    'www.tunegocio.com.co',
    'localhost',
    '*.hostingersite.com',
  ],
  // Hostinger va detrás de proxy.
  trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port', 'x-forwarded-for'],
});

function permanentRedirect(target: string): Response {
  return Response.redirect(target, 301);
}

async function tryLegacyRedirect(request: Request): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.hostname.startsWith('www.')) {
    return permanentRedirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`);
  }

  const exactTarget = LEGACY_EXACT_REDIRECTS[url.pathname];
  if (exactTarget) {
    return permanentRedirect(`https://${CANONICAL_HOST}${exactTarget}`);
  }

  const categoryMatch = url.pathname.match(/^\/product-category\/([^/]+)\/?$/);
  if (categoryMatch) {
    const wpSlug = categoryMatch[1].toLowerCase();
    const mapped = LEGACY_CATEGORY_SLUGS[wpSlug];
    if (mapped) {
      return permanentRedirect(`https://${CANONICAL_HOST}/${mapped}`);
    }
    try {
      if (await liveCategorySlugExists(wpSlug)) {
        return permanentRedirect(`https://${CANONICAL_HOST}/${wpSlug}`);
      }
    } catch {
      // Let Angular return a normal 404 if Firestore is temporarily unavailable.
    }
  }

  const productMatch = url.pathname.match(/^\/product(?:o)?\/([^/]+)\/?$/);
  if (productMatch) {
    const wpSlug = decodeURIComponent(productMatch[1]).toLowerCase();
    const mapped = LEGACY_PRODUCT_SLUGS[wpSlug];
    if (mapped) {
      return permanentRedirect(`https://${CANONICAL_HOST}/productos/${mapped}`);
    }
    try {
      if (await liveProductSlugExists(wpSlug)) {
        return permanentRedirect(`https://${CANONICAL_HOST}/productos/${wpSlug}`);
      }
    } catch {
      // Let Angular return a normal 404 if Firestore is temporarily unavailable.
    }
  }

  // Old product slug opened under /productos/... (ghost/noindex pages after WP migration)
  const productosMatch = url.pathname.match(/^\/productos\/([^/]+)\/?$/);
  if (productosMatch) {
    const wpSlug = decodeURIComponent(productosMatch[1]).toLowerCase();
    const mapped = LEGACY_PRODUCT_SLUGS[wpSlug];
    if (mapped && mapped !== wpSlug) {
      return permanentRedirect(`https://${CANONICAL_HOST}/productos/${mapped}`);
    }
  }

  return null;
}

async function toWebRequest(req: express.Request): Promise<Request> {
  const protocol = req.protocol;
  const host = req.get('host') ?? 'localhost';
  const url = `${protocol}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);
    if (body.length > 0) {
      init.body = body;
      // @ts-expect-error Node fetch duplex for streaming bodies
      init.duplex = 'half';
    }
  }

  return new Request(url, init);
}

/**
 * Archivos estáticos del build (JS, CSS, imágenes).
 */
app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const sitemap = await buildLiveSitemap();
    res
      .status(200)
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
      .send(sitemap);
  } catch (error) {
    // If Firestore is temporarily unavailable, preserve the last static sitemap.
    next();
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * API de pagos + redirects legacy + SSR Angular.
 */
app.use(async (req, res, next) => {
  try {
    const request = await toWebRequest(req);

    const paymentResponse = await handlePaymentApi(request);
    if (paymentResponse) {
      await writeResponseToNodeResponse(paymentResponse, res);
      return;
    }

    const legacyRedirect = await tryLegacyRedirect(request);
    if (legacyRedirect) {
      await writeResponseToNodeResponse(legacyRedirect, res);
      return;
    }

    const response = await angularApp.handle(request);
    if (response) {
      await writeResponseToNodeResponse(response, res);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Handler usado por Angular CLI (dev-server y build).
 */
export const reqHandler = createNodeRequestHandler(app);

/**
 * Arranque explícito (Hostinger llama esto desde server.js en la raíz).
 */
export function startTunegocioServer(): void {
  const port = Number(process.env['PORT'] ?? 4000);
  app.listen(port, () => {
    console.log(`TUNEGOCIO escuchando en http://localhost:${port}`);
  });
}

if (isMainModule(import.meta.url)) {
  startTunegocioServer();
}

import './server/payments/load-dev-vars';
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import {
  LEGACY_CATEGORY_SLUGS,
  LEGACY_EXACT_REDIRECTS,
} from './app/core/constants/legacy-redirects';
import { handlePaymentApi } from './server/payments/api-handler';
import { setPaymentServerEnv } from './server/payments/secrets';
import type { PaymentServerEnv } from './server/payments/types';

const CANONICAL_HOST = 'tunegocio.com.co';

const angularApp = new AngularAppEngine({
  allowedHosts: ['localhost', '127.0.0.1', CANONICAL_HOST, '.workers.dev'],
});

function permanentRedirect(target: string): Response {
  return Response.redirect(target, 301);
}

function tryLegacyRedirect(request: Request): Response | null {
  const url = new URL(request.url);

  if (url.hostname.startsWith('www.')) {
    return permanentRedirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`);
  }

  const exactTarget = LEGACY_EXACT_REDIRECTS[url.pathname];
  if (exactTarget) {
    return permanentRedirect(new URL(exactTarget, url.origin).toString());
  }

  const categoryMatch = url.pathname.match(/^\/product-category\/([^/]+)\/?$/);
  if (categoryMatch) {
    const wpSlug = categoryMatch[1].toLowerCase();
    const target = LEGACY_CATEGORY_SLUGS[wpSlug] ?? 'productos';
    return permanentRedirect(new URL(`/${target}`, url.origin).toString());
  }

  const productMatch = url.pathname.match(/^\/product(?:o)?\/([^/]+)\/?$/);
  if (productMatch) {
    return permanentRedirect(new URL(`/productos/${productMatch[1]}`, url.origin).toString());
  }

  return null;
}

async function handleRequest(request: Request): Promise<Response> {
  const paymentResponse = await handlePaymentApi(request);
  if (paymentResponse) {
    return paymentResponse;
  }

  const legacyRedirect = tryLegacyRedirect(request);
  if (legacyRedirect) {
    return legacyRedirect;
  }

  const response = await angularApp.handle(request);
  return response ?? new Response('Page not found.', { status: 404 });
}

/**
 * Handler usado por Angular CLI (dev-server y build).
 */
export const reqHandler = createRequestHandler(handleRequest);

/**
 * Entry point de Cloudflare Workers.
 */
export default {
  fetch(request: Request, env: PaymentServerEnv = {}) {
    setPaymentServerEnv(env);
    return reqHandler(request);
  },
};

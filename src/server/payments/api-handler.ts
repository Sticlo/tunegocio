import { handleAddiCallback } from './addi-callback';
import { createAddiCheckoutUrl } from './addi-checkout';
import { clientIp, isRateLimited } from './rate-limit';
import { isPaymentVerified } from './payment-records';
import { getPaymentServerEnv } from './secrets';
import type { AddiCheckoutRequest, PaymentServerEnv, WompiCheckoutRequest } from './types';
import { createWompiCheckoutConfig } from './wompi-checkout';
import { confirmWompiTransaction } from './wompi-verify';
import { handleWompiWebhook } from './wompi-webhook';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function paymentStatus(env: PaymentServerEnv) {
  return {
    wompi: Boolean(env.WOMPI_PUBLIC_KEY?.trim() && env.WOMPI_INTEGRITY_SECRET?.trim()),
    addi: Boolean(env.ADDI_CLIENT_ID?.trim() && env.ADDI_CLIENT_SECRET?.trim()),
    addiAllySlug: env.ADDI_ALLY_SLUG?.trim() ?? '',
    wompiWebhook: Boolean(env.WOMPI_EVENTS_SECRET?.trim()),
  };
}

function rejectIfRateLimited(request: Request): Response | null {
  const ip = clientIp(request);
  if (isRateLimited(`payments:${ip}`, 40, 60_000)) {
    return jsonResponse({ message: 'Demasiadas solicitudes. Intenta en un minuto.' }, 429);
  }
  return null;
}

export async function handlePaymentApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/payments/')) {
    return null;
  }

  const env = getPaymentServerEnv();

  if (request.method === 'GET' && url.pathname === '/api/payments/status') {
    return jsonResponse(paymentStatus(env));
  }

  if (request.method === 'GET' && url.pathname === '/api/payments/verify') {
    const reference = url.searchParams.get('ref')?.trim() ?? '';
    const provider = url.searchParams.get('provider')?.trim().toLowerCase();

    if (!reference || (provider !== 'wompi' && provider !== 'addi')) {
      return jsonResponse({ message: 'Parámetros de verificación inválidos.' }, 400);
    }

    const verified = isPaymentVerified(provider, reference);
    return jsonResponse({
      verified,
      provider,
      reference,
      status: verified ? 'approved' : 'pending',
    });
  }

  const limited = rejectIfRateLimited(request);
  if (limited) return limited;

  if (request.method === 'POST' && url.pathname === '/api/payments/wompi/checkout') {
    try {
      const payload = (await request.json()) as WompiCheckoutRequest;
      const config = await createWompiCheckoutConfig(request, env, payload);
      return jsonResponse(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al preparar pago con Wompi.';
      return jsonResponse({ message }, 503);
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/payments/wompi/confirm') {
    try {
      const body = (await request.json()) as { reference?: string; transactionId?: string };
      const reference = body.reference?.trim() ?? '';
      const transactionId = body.transactionId?.trim() ?? '';

      if (!reference || !transactionId) {
        return jsonResponse({ message: 'Referencia o transacción inválida.' }, 400);
      }

      const verified = await confirmWompiTransaction(env, reference, transactionId);
      return jsonResponse({ verified });
    } catch {
      return jsonResponse({ verified: false }, 503);
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/payments/addi/checkout') {
    try {
      const payload = (await request.json()) as AddiCheckoutRequest;
      const checkoutUrl = await createAddiCheckoutUrl(request, env, payload);
      return jsonResponse({ checkoutUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar checkout Addi.';
      return jsonResponse({ message }, 503);
    }
  }

  if (url.pathname === '/api/payments/wompi/webhook') {
    if (request.method !== 'POST') {
      return jsonResponse({ message: 'Método no permitido.' }, 405);
    }
    return handleWompiWebhook(request, env);
  }

  if (url.pathname === '/api/payments/addi/callback') {
    if (request.method !== 'POST' && request.method !== 'GET') {
      return jsonResponse({ message: 'Método no permitido.' }, 405);
    }
    return handleAddiCallback(request);
  }

  return jsonResponse({ message: 'Ruta de pagos no encontrada.' }, 404);
}

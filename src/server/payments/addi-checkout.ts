import type { AddiCheckoutRequest, PaymentServerEnv } from './types';
import { validateCheckoutTotals } from './catalog-pricing';
import { createPendingPayment } from './payment-records';
import { siteOrigin } from './secrets';

const ADDI_AUTH_PRODUCTION = 'https://auth.addi.com';
const ADDI_AUTH_STAGING = 'https://auth.addi-staging.com';
const ADDI_API_PRODUCTION = 'https://api.addi.com';
const ADDI_API_STAGING = 'https://api-staging.addi.com';

function isSandbox(env: PaymentServerEnv): boolean {
  return env.ADDI_SANDBOX === 'true' || env.ADDI_SANDBOX === '1';
}

function addiAudience(env: PaymentServerEnv): string {
  if (isSandbox(env)) return 'https://api.staging.addi.com';
  return 'https://api.addi.com';
}

async function getAddiToken(env: PaymentServerEnv): Promise<string> {
  const clientId = env.ADDI_CLIENT_ID?.trim();
  const clientSecret = env.ADDI_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('ADDI_CLIENT_ID y ADDI_CLIENT_SECRET no configurados en el servidor.');
  }

  const authBase = isSandbox(env) ? ADDI_AUTH_STAGING : ADDI_AUTH_PRODUCTION;
  const audience = addiAudience(env);

  const response = await fetch(`${authBase}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      audience,
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    message?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    const detail =
      data.error_description ?? data.message ?? data.error ?? 'No se pudo autenticar con Addi.';
    throw new Error(detail);
  }

  return data.access_token;
}

export async function createAddiCheckoutUrl(
  request: Request,
  env: PaymentServerEnv,
  payload: AddiCheckoutRequest,
): Promise<string> {
  const token = await getAddiToken(env);
  const apiBase = isSandbox(env) ? ADDI_API_STAGING : ADDI_API_PRODUCTION;
  const origin = siteOrigin(request, env);

  const validated = await validateCheckoutTotals(
    payload.items,
    payload.subtotal,
    payload.iva,
    payload.total,
  );

  if (validated.total < 100_000 || validated.total > 2_000_000) {
    throw new Error('El monto está fuera del rango permitido por Addi ($100.000 – $2.000.000).');
  }

  createPendingPayment('addi', payload.reference, validated.total);

  const body = {
    description: 'Compra TUNEGOCIO.COM',
    orderId: payload.reference,
    totalAmount: validated.total,
    shippingAmount: 0,
    totalTaxesAmount: validated.iva,
    currency: 'COP',
    items: validated.items.map((item) => ({
      sku: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: Math.round(item.unitPrice * item.quantity * 0.19),
      pictureUrl: `${origin}/favicon.ico`,
      category: 'Equipos industriales',
    })),
    client: {
      idType: 'CC',
      idNumber: payload.customer.idNumber,
      firstName: payload.customer.firstName,
      lastName: payload.customer.lastName,
      email: payload.customer.email,
      cellphone: payload.customer.phone.replace(/\D/g, ''),
      cellphoneCountryCode: '+57',
      address: {
        lineOne: 'Por confirmar en visita',
        city: 'Bogotá',
        country: 'CO',
      },
    },
    shippingAddress: {
      lineOne: 'Por confirmar en visita',
      city: 'Bogotá',
      country: 'CO',
    },
    billingAddress: {
      lineOne: 'Por confirmar en visita',
      city: 'Bogotá',
      country: 'CO',
    },
    allyUrlRedirection: {
      logoUrl: `${origin}/favicon.ico`,
      callbackUrl: `${origin}/api/payments/addi/callback`,
      redirectionUrl: `${origin}/pago-exitoso?origen=addi&ref=${encodeURIComponent(payload.reference)}`,
    },
  };

  const response = await fetch(`${apiBase}/v1/online-applications`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 301 || response.status === 302 || response.status === 303) {
    const location = response.headers.get('Location');
    if (location) return location;
  }

  const data = (await response.json()) as { redirectUrl?: string; message?: string; payUrl?: string };

  if (data.redirectUrl) return data.redirectUrl;
  if (data.payUrl) return data.payUrl;

  throw new Error(data.message ?? 'Addi no devolvió URL de checkout.');
}

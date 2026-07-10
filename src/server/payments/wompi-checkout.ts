import type { PaymentServerEnv, WompiCheckoutRequest } from './types';
import { validateCheckoutTotals } from './catalog-pricing';
import { createPendingPayment } from './payment-records';
import { siteOrigin } from './secrets';
import { sha256Hex } from './sha256-hex';

export interface WompiCheckoutConfig {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: 'COP';
  signature: string;
  redirectUrl?: string;
  taxInCents: { vat: number };
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function createIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): Promise<string> {
  const payload = `${reference}${amountInCents}${currency}${integritySecret}`;
  return sha256Hex(payload);
}

export async function createWompiCheckoutConfig(
  request: Request,
  env: PaymentServerEnv,
  payload: WompiCheckoutRequest,
): Promise<WompiCheckoutConfig> {
  const publicKey = env.WOMPI_PUBLIC_KEY?.trim();
  const integritySecret = env.WOMPI_INTEGRITY_SECRET?.trim();

  if (!publicKey || !integritySecret) {
    throw new Error('WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET no configurados en el servidor.');
  }

  const validated = await validateCheckoutTotals(
    payload.items,
    payload.subtotal,
    payload.iva,
    payload.total,
  );

  const origin = siteOrigin(request, env);
  const amountInCents = Math.round(validated.total) * 100;
  const vatInCents = Math.round(validated.iva) * 100;
  const reference = payload.reference.trim();

  if (!reference || amountInCents < 100) {
    throw new Error('Monto o referencia de pago inválidos.');
  }

  createPendingPayment('wompi', reference, validated.total);

  const signature = await createIntegritySignature(reference, amountInCents, 'COP', integritySecret);

  const config: WompiCheckoutConfig = {
    publicKey,
    reference,
    amountInCents,
    currency: 'COP',
    signature,
    taxInCents: { vat: vatInCents },
  };

  // Wompi devuelve 403 si redirect-url apunta a localhost, incluso en sandbox.
  if (!isLocalOrigin(origin)) {
    const ref = encodeURIComponent(reference);
    config.redirectUrl = `${origin}/pago-exitoso?origen=wompi&ref=${ref}`;
  }

  return config;
}

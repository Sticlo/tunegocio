import { markPaymentApproved } from './payment-records';
import { sha256Hex } from './sha256-hex';
import type { PaymentServerEnv } from './types';

interface WompiEvent {
  event?: string;
  timestamp?: number;
  signature?: {
    properties?: string[];
    checksum?: string;
  };
  data?: {
    transaction?: {
      id?: string;
      reference?: string;
      status?: string;
      amount_in_cents?: number;
    };
  };
}

function readPathValue(data: unknown, path: string): string {
  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[part];
  }
  return current === undefined || current === null ? '' : String(current);
}

export async function verifyWompiEventChecksum(
  event: WompiEvent,
  eventsSecret: string,
  headerChecksum?: string | null,
): Promise<boolean> {
  const properties = event.signature?.properties ?? [];
  const timestamp = event.timestamp;
  const expected =
    (headerChecksum ?? event.signature?.checksum ?? '').trim().toUpperCase();

  if (!properties.length || timestamp === undefined || !expected || !eventsSecret.trim()) {
    return false;
  }

  const values = properties.map((property) => readPathValue(event.data, property)).join('');
  const payload = `${values}${timestamp}${eventsSecret.trim()}`;
  const calculated = (await sha256Hex(payload)).toUpperCase();
  return calculated === expected;
}

export async function handleWompiWebhook(
  request: Request,
  env: PaymentServerEnv,
): Promise<Response> {
  const eventsSecret = env.WOMPI_EVENTS_SECRET?.trim();
  if (!eventsSecret) {
    return new Response(null, { status: 503 });
  }

  let event: WompiEvent;
  try {
    event = (await request.json()) as WompiEvent;
  } catch {
    return new Response(null, { status: 400 });
  }

  const checksumHeader = request.headers.get('X-Event-Checksum');
  const valid = await verifyWompiEventChecksum(event, eventsSecret, checksumHeader);
  if (!valid) {
    return new Response(null, { status: 401 });
  }

  if (event.event === 'transaction.updated') {
    const transaction = event.data?.transaction;
    const reference = transaction?.reference?.trim();
    const status = transaction?.status?.toUpperCase();

    if (reference && status === 'APPROVED') {
      const amountCop = Math.round((transaction?.amount_in_cents ?? 0) / 100);
      markPaymentApproved('wompi', reference, {
        transactionId: transaction?.id,
        providerStatus: status,
        amountCop,
      });
    }
  }

  return new Response(null, { status: 200 });
}

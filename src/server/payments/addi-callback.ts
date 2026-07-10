import { getPaymentRecord, markPaymentApproved } from './payment-records';

const APPROVED_STATUSES = new Set(['APPROVED', 'PAID', 'COMPLETED', 'SUCCESS']);

function isApprovedStatus(status: string): boolean {
  return APPROVED_STATUSES.has(status.trim().toUpperCase());
}

async function readCallbackPayload(request: Request): Promise<Record<string, unknown>> {
  if (request.method === 'GET') {
    return Object.fromEntries(new URL(request.url).searchParams.entries());
  }

  const contentType = request.headers.get('content-type') ?? '';
  const raw = await request.text();
  if (!raw.trim()) return {};

  if (contentType.includes('application/json')) {
    return JSON.parse(raw) as Record<string, unknown>;
  }

  return Object.fromEntries(new URLSearchParams(raw).entries());
}

function pickOrderId(payload: Record<string, unknown>): string {
  const candidates = [
    payload['orderId'],
    payload['order_id'],
    payload['reference'],
    payload['merchantReference'],
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return '';
}

function pickStatus(payload: Record<string, unknown>): string {
  const candidates = [
    payload['status'],
    payload['applicationStatus'],
    payload['state'],
    payload['decision'],
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim().toUpperCase();
    }
  }

  return '';
}

export async function handleAddiCallback(request: Request): Promise<Response> {
  try {
    const payload = await readCallbackPayload(request);
    const orderId = pickOrderId(payload);
    const status = pickStatus(payload);

    if (orderId && isApprovedStatus(status)) {
      const pending = getPaymentRecord('addi', orderId);
      markPaymentApproved('addi', orderId, {
        providerStatus: status,
        amountCop: pending?.totalCop,
      });
    }
  } catch {
    return new Response(null, { status: 400 });
  }

  return new Response(null, { status: 200 });
}

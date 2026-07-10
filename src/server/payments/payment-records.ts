export type PaymentProvider = 'wompi' | 'addi';
export type PaymentRecordStatus = 'pending' | 'approved' | 'declined';

export interface PaymentRecord {
  reference: string;
  provider: PaymentProvider;
  status: PaymentRecordStatus;
  totalCop: number;
  createdAt: number;
  updatedAt: number;
  transactionId?: string;
  providerStatus?: string;
}

const records = new Map<string, PaymentRecord>();

function recordKey(provider: PaymentProvider, reference: string): string {
  return `${provider}:${reference.trim()}`;
}

export function createPendingPayment(
  provider: PaymentProvider,
  reference: string,
  totalCop: number,
): PaymentRecord {
  const key = recordKey(provider, reference);
  const now = Date.now();
  const record: PaymentRecord = {
    reference: reference.trim(),
    provider,
    status: 'pending',
    totalCop,
    createdAt: now,
    updatedAt: now,
  };
  records.set(key, record);
  void persistRecords();
  return record;
}

export function markPaymentApproved(
  provider: PaymentProvider,
  reference: string,
  details: { transactionId?: string; providerStatus?: string; amountCop?: number } = {},
): PaymentRecord | null {
  const key = recordKey(provider, reference);
  const existing = records.get(key);
  if (!existing) return null;

  if (
    details.amountCop !== undefined &&
    Math.round(details.amountCop) !== Math.round(existing.totalCop)
  ) {
    return null;
  }

  const updated: PaymentRecord = {
    ...existing,
    status: 'approved',
    updatedAt: Date.now(),
    transactionId: details.transactionId ?? existing.transactionId,
    providerStatus: details.providerStatus ?? existing.providerStatus,
  };
  records.set(key, updated);
  void persistRecords();
  return updated;
}

export function getPaymentRecord(
  provider: PaymentProvider,
  reference: string,
): PaymentRecord | null {
  return records.get(recordKey(provider, reference)) ?? null;
}

export function isPaymentVerified(provider: PaymentProvider, reference: string): boolean {
  return getPaymentRecord(provider, reference)?.status === 'approved';
}

async function persistRecords(): Promise<void> {
  if (typeof process === 'undefined' || !process.env) return;

  try {
    const nodeRequire = (0, eval)('require') as NodeRequire;
    const { mkdirSync, writeFileSync } = nodeRequire('node:fs');
    const { join } = nodeRequire('node:path');

    const dir = join(process.cwd(), '.data');
    mkdirSync(dir, { recursive: true });

    const payload = Object.fromEntries(records.entries());
    writeFileSync(join(dir, 'payment-records.json'), JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // Edge / entornos sin filesystem.
  }
}

function loadPersistedRecords(): void {
  if (typeof process === 'undefined' || !process.env) return;

  try {
    const nodeRequire = (0, eval)('require') as NodeRequire;
    const { existsSync, readFileSync } = nodeRequire('node:fs');
    const { join } = nodeRequire('node:path');

    const filePath = join(process.cwd(), '.data', 'payment-records.json');
    if (!existsSync(filePath)) return;

    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, PaymentRecord>;
    for (const [key, value] of Object.entries(parsed)) {
      records.set(key, value);
    }
  } catch {
    // Ignorar errores de lectura en arranque.
  }
}

loadPersistedRecords();

export function resetPaymentRecordsForTests(): void {
  records.clear();
}

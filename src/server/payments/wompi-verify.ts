import { getPaymentRecord, markPaymentApproved } from './payment-records';
import type { PaymentServerEnv } from './types';

function wompiApiBase(publicKey: string): string {
  return publicKey.includes('_test_') ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
}

interface WompiTransactionResponse {
  data?: {
    id?: string;
    reference?: string;
    status?: string;
    amount_in_cents?: number;
    currency?: string;
  };
}

export async function confirmWompiTransaction(
  env: PaymentServerEnv,
  reference: string,
  transactionId: string,
): Promise<boolean> {
  const publicKey = env.WOMPI_PUBLIC_KEY?.trim();
  if (!publicKey) return false;

  const trimmedReference = reference.trim();
  const trimmedTransactionId = transactionId.trim();
  if (!trimmedReference || !trimmedTransactionId) return false;

  if (!getPaymentRecord('wompi', trimmedReference)) {
    return false;
  }

  const response = await fetch(
    `${wompiApiBase(publicKey)}/transactions/${encodeURIComponent(trimmedTransactionId)}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${publicKey}`,
      },
    },
  );

  if (!response.ok) return false;

  const payload = (await response.json()) as WompiTransactionResponse;
  const transaction = payload.data;
  if (!transaction) return false;

  if (transaction.reference?.trim() !== trimmedReference) return false;
  if (transaction.status?.toUpperCase() !== 'APPROVED') return false;

  const pending = getPaymentRecord('wompi', trimmedReference);
  const amountCop = Math.round((transaction.amount_in_cents ?? 0) / 100);

  if (pending && pending.totalCop > 0 && amountCop !== pending.totalCop) {
    return false;
  }

  markPaymentApproved('wompi', trimmedReference, {
    transactionId: transaction.id,
    providerStatus: transaction.status,
    amountCop,
  });

  return true;
}

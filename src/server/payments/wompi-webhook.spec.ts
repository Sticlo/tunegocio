import { describe, expect, it } from 'vitest';
import { sha256Hex } from './sha256-hex';
import { verifyWompiEventChecksum } from './wompi-webhook';

describe('verifyWompiEventChecksum', () => {
  it('accepts events signed with the same algorithm', async () => {
    const secret = 'prod_events_test_secret';
    const event = {
      event: 'transaction.updated',
      data: {
        transaction: {
          id: 'TN-123',
          status: 'APPROVED',
          amount_in_cents: 76000000,
        },
      },
      timestamp: 1700000000,
      signature: {
        properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
        checksum: '',
      },
    };

    const base = 'TN-123APPROVED760000001700000000';
    event.signature.checksum = (await sha256Hex(`${base}${secret}`)).toUpperCase();

    const valid = await verifyWompiEventChecksum(event, secret, event.signature.checksum);
    expect(valid).toBe(true);
  });
});

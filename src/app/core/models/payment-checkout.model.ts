export interface CartCheckoutPayload {
  reference: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  iva: number;
  total: number;
}

export interface PaymentProviderStatus {
  wompi: boolean;
  addi: boolean;
  addiAllySlug: string;
  wompiWebhook?: boolean;
}

export interface PaymentVerifyResponse {
  verified: boolean;
  provider: 'wompi' | 'addi';
  reference: string;
  status: 'approved' | 'pending';
}

export interface WompiCheckoutConfig {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: 'COP';
  signature: string;
  /** Omitido en localhost: Wompi rechaza redirect-url local con 403. */
  redirectUrl?: string;
  taxInCents: { vat: number };
}

export interface AddiCustomerForm {
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymentServerEnv {
  WOMPI_PUBLIC_KEY?: string;
  WOMPI_INTEGRITY_SECRET?: string;
  WOMPI_EVENTS_SECRET?: string;
  ADDI_CLIENT_ID?: string;
  ADDI_CLIENT_SECRET?: string;
  ADDI_SANDBOX?: string;
  ADDI_ALLY_SLUG?: string;
  SITE_URL?: string;
}

export interface CheckoutLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface WompiCheckoutRequest {
  items: CheckoutLineItem[];
  subtotal: number;
  iva: number;
  total: number;
  reference: string;
}

export interface AddiCheckoutRequest {
  items: CheckoutLineItem[];
  subtotal: number;
  iva: number;
  total: number;
  reference: string;
  customer: {
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

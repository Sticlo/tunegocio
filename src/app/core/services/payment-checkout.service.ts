import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AddiCustomerForm,
  CartCheckoutPayload,
  PaymentProviderStatus,
  PaymentVerifyResponse,
  WompiCheckoutConfig,
} from '../models/payment-checkout.model';
import { CartService } from './cart.service';

const WOMPI_SCRIPT = 'https://checkout.wompi.co/widget.js';

interface WompiWidgetCheckout {
  open: (callback: (result: { transaction: { id?: string; status?: string } }) => void) => void;
}

declare const WidgetCheckout: new (config: {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: { integrity: string };
  redirectUrl?: string;
  taxInCents?: { vat: number };
}) => WompiWidgetCheckout;

@Injectable({ providedIn: 'root' })
export class PaymentCheckoutService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private wompiScriptPromise: Promise<void> | null = null;

  getStatus(): Promise<PaymentProviderStatus> {
    return firstValueFrom(this.http.get<PaymentProviderStatus>('/api/payments/status'));
  }

  verifyPayment(
    provider: 'wompi' | 'addi',
    reference: string,
    options: { retries?: number; delayMs?: number } = {},
  ): Promise<boolean> {
    const retries = options.retries ?? 1;
    const delayMs = options.delayMs ?? 1200;

    return this.pollVerification(provider, reference, retries, delayMs);
  }

  private async pollVerification(
    provider: 'wompi' | 'addi',
    reference: string,
    retries: number,
    delayMs: number,
  ): Promise<boolean> {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      const result = await firstValueFrom(
        this.http.get<PaymentVerifyResponse>('/api/payments/verify', {
          params: { provider, ref: reference },
        }),
      );

      if (result.verified) return true;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return false;
  }

  async startWompi(payload: CartCheckoutPayload): Promise<void> {
    const config = await firstValueFrom(
      this.http.post<WompiCheckoutConfig>('/api/payments/wompi/checkout', payload),
    );

    await this.loadWompiScript();

    const checkout = new WidgetCheckout({
      currency: config.currency,
      amountInCents: config.amountInCents,
      reference: config.reference,
      publicKey: config.publicKey,
      signature: { integrity: config.signature },
      ...(config.redirectUrl ? { redirectUrl: config.redirectUrl } : {}),
      taxInCents: config.taxInCents,
    });

    checkout.open((result) => {
      void this.handleWompiWidgetResult(config, result);
    });
  }

  private async handleWompiWidgetResult(
    config: WompiCheckoutConfig,
    result: { transaction?: { id?: string; status?: string } },
  ): Promise<void> {
    const status = result?.transaction?.status?.toUpperCase();
    if (status !== 'APPROVED') return;

    const transactionId = result?.transaction?.id?.trim();
    if (transactionId) {
      await firstValueFrom(
        this.http.post<{ verified: boolean }>('/api/payments/wompi/confirm', {
          reference: config.reference,
          transactionId,
        }),
      );
    }

    if (!config.redirectUrl) {
      this.cart.close();
      void this.router.navigate(['/pago-exitoso'], {
        queryParams: { origen: 'wompi', ref: config.reference },
      });
    }
  }

  async startAddi(payload: CartCheckoutPayload, customer: AddiCustomerForm): Promise<void> {
    const result = await firstValueFrom(
      this.http.post<{ checkoutUrl: string }>('/api/payments/addi/checkout', {
        ...payload,
        customer,
      }),
    );
    window.location.href = result.checkoutUrl;
  }

  private loadWompiScript(): Promise<void> {
    if (this.wompiScriptPromise) return this.wompiScriptPromise;

    this.wompiScriptPromise = new Promise<void>((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(`script[src="${WOMPI_SCRIPT}"]`);
      if (existing?.dataset['loaded'] === 'true') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = WOMPI_SCRIPT;
      script.async = true;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('No se pudo cargar el checkout de Wompi.'));
      document.head.appendChild(script);
    });

    return this.wompiScriptPromise;
  }
}

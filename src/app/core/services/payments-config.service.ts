import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  ADDI_MAX_AMOUNT_COP,
  ADDI_MIN_AMOUNT_COP,
  ADDI_PORTAL_URL,
} from '../constants/payment-limits';

export interface AddiPaymentConfig {
  enabled: boolean;
  allySlug: string;
}

export interface WompiPaymentConfig {
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentsConfigService {
  readonly addi: AddiPaymentConfig = environment.payments.addi;
  readonly wompi: WompiPaymentConfig = environment.payments.wompi;
  readonly addiPortalUrl = ADDI_PORTAL_URL;

  isAddiConfigured(): boolean {
    return this.addi.enabled && this.addi.allySlug.trim().length > 0;
  }

  isWompiConfigured(): boolean {
    return this.wompi.enabled;
  }

  isAddiEligible(amountCop: number): boolean {
    return (
      amountCop >= ADDI_MIN_AMOUNT_COP &&
      amountCop <= ADDI_MAX_AMOUNT_COP
    );
  }
}

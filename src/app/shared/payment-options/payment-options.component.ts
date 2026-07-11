import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ADDI_MAX_AMOUNT_COP, ADDI_MIN_AMOUNT_COP } from '../../core/constants/payment-limits';
import {
  AddiCustomerForm,
  CartCheckoutPayload,
} from '../../core/models/payment-checkout.model';
import { PaymentCheckoutService } from '../../core/services/payment-checkout.service';
import { PaymentsConfigService } from '../../core/services/payments-config.service';
import { loadExternalScript } from '../../core/utils/load-external-script';
import { isLocalDevHost } from '../../core/utils/is-local-dev-host';

const ADDI_SCRIPT = 'https://s3.amazonaws.com/widgets.addi.com/bundle.min.js';

export type CheckoutPaymentMethod = 'wompi-card' | 'wompi-pse' | 'addi';

@Component({
  selector: 'app-payment-options',
  imports: [ReactiveFormsModule],
  templateUrl: './payment-options.component.html',
  styleUrl: './payment-options.component.scss',
})
export class PaymentOptionsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  private readonly checkout = inject(PaymentCheckoutService);
  protected readonly payments = inject(PaymentsConfigService);

  @Input({ required: true }) amountCop = 0;
  @Input() productId = 'checkout';
  @Input() compact = false;
  @Input() showInCart = false;
  @Input() checkoutPayload: CartCheckoutPayload | null = null;

  @ViewChild('addiHostCart') private addiHostCart?: ElementRef<HTMLDivElement>;
  @ViewChild('addiHostCompact') private addiHostCompact?: ElementRef<HTMLDivElement>;

  protected readonly addiMin = ADDI_MIN_AMOUNT_COP;
  protected readonly addiMax = ADDI_MAX_AMOUNT_COP;
  protected readonly paying = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly selectedMethod = signal<CheckoutPaymentMethod>('wompi-card');
  protected readonly serverAddiReady = signal(false);
  protected readonly serverWompiReady = signal(false);
  protected readonly addiWidgetLoading = signal(false);
  protected readonly addiWidgetError = signal(false);

  protected readonly addiAllySlug = signal('');

  protected readonly addiForm = this.fb.nonNullable.group({
    idNumber: ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  private viewReady = false;
  private renderVersion = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.loadProviderStatus();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.renderAddiWidget();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) return;
    if (changes['amountCop'] || changes['productId']) {
      void this.renderAddiWidget();
    }
  }

  ngOnDestroy(): void {
    this.renderVersion += 1;
  }

  protected showSection(): boolean {
    if (this.amountCop <= 0) return false;
    if (this.showInCart) return true;
    return (this.useAddiWidget() || this.useAddiApi()) && this.addiEligible();
  }

  protected addiEligible(): boolean {
    return this.amountCop >= ADDI_MIN_AMOUNT_COP && this.amountCop <= ADDI_MAX_AMOUNT_COP;
  }

  protected resolveAllySlug(): string {
    return this.addiAllySlug().trim() || this.payments.addi.allySlug.trim();
  }

  /** Widget Addi: solo si no hay API de servidor (fallback visual). Addi CDN suele bloquear dominios no registrados. */
  protected useAddiWidget(): boolean {
    if (isLocalDevHost() || this.addiWidgetError()) return false;
    if (!this.addiEligible() || !this.resolveAllySlug()) return false;
    // Con API lista preferimos formulario + redirect (funciona aunque el CDN bloquee el widget).
    if (this.serverAddiReady()) return false;
    return true;
  }

  /** API Addi (formulario + redirección): preferida en local y producción cuando hay credenciales. */
  protected useAddiApi(): boolean {
    return this.serverAddiReady() && this.addiEligible();
  }

  protected showAddiLocalNote(): boolean {
    return isLocalDevHost() && this.useAddiApi();
  }

  protected showAddiApiNote(): boolean {
    return !isLocalDevHost() && this.useAddiApi();
  }

  protected addiConfigured(): boolean {
    if (isLocalDevHost()) {
      return this.serverAddiReady() || Boolean(this.resolveAllySlug());
    }
    return Boolean(this.resolveAllySlug()) || this.serverAddiReady();
  }

  protected addiNeedsLocalServer(): boolean {
    return isLocalDevHost() && !this.serverAddiReady();
  }

  protected selectMethod(method: CheckoutPaymentMethod): void {
    if (method === 'addi' && (!this.addiEligible() || !this.addiConfigured())) return;
    this.selectedMethod.set(method);
    this.errorMessage.set(null);
    if (method === 'addi' && this.useAddiWidget()) {
      this.addiWidgetError.set(false);
      setTimeout(() => void this.renderAddiWidget(0), 50);
    }
  }

  protected isWompiSelected(): boolean {
    const method = this.selectedMethod();
    return method === 'wompi-card' || method === 'wompi-pse';
  }

  protected async payWithWompi(): Promise<void> {
    if (!this.checkoutPayload || this.paying()) return;

    this.paying.set(true);
    this.errorMessage.set(null);

    try {
      await this.checkout.startWompi(this.checkoutPayload);
    } catch (error) {
      this.errorMessage.set(this.readError(error));
    } finally {
      this.paying.set(false);
    }
  }

  protected async payWithAddi(): Promise<void> {
    if (!this.checkoutPayload || this.paying() || !this.useAddiApi()) return;

    if (this.addiForm.invalid) {
      this.addiForm.markAllAsTouched();
      this.errorMessage.set('Completa tus datos para financiar con Addi.');
      return;
    }

    this.paying.set(true);
    this.errorMessage.set(null);

    try {
      const customer = this.addiForm.getRawValue() as AddiCustomerForm;
      await this.checkout.startAddi(this.checkoutPayload, customer);
    } catch (error) {
      this.errorMessage.set(this.readError(error));
      this.paying.set(false);
    }
  }

  private async loadProviderStatus(): Promise<void> {
    try {
      const status = await this.checkout.getStatus();
      this.serverWompiReady.set(status.wompi);
      this.serverAddiReady.set(status.addi);
      this.addiAllySlug.set(status.addiAllySlug ?? '');
      if (this.viewReady) {
        void this.renderAddiWidget();
      }
    } catch {
      this.serverWompiReady.set(false);
      this.serverAddiReady.set(false);
      this.addiAllySlug.set('');
    }
  }

  private shouldRenderAddiWidget(): boolean {
    if (!this.useAddiWidget() || !this.addiEligible()) return false;
    if (!this.showInCart) return true;
    return this.selectedMethod() === 'addi';
  }

  private getAddiHost(): HTMLDivElement | null {
    const ref = this.showInCart ? this.addiHostCart : this.addiHostCompact;
    return ref?.nativeElement ?? null;
  }

  private async renderAddiWidget(retry = 0): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.shouldRenderAddiWidget()) {
      return;
    }

    const host = this.getAddiHost();
    if (!host) {
      if (retry < 8) {
        setTimeout(() => void this.renderAddiWidget(retry + 1), 60);
      }
      return;
    }

    const version = ++this.renderVersion;
    host.innerHTML = '';
    this.addiWidgetLoading.set(true);
    this.addiWidgetError.set(false);

    const allySlug = this.resolveAllySlug();
    if (!allySlug) {
      this.addiWidgetLoading.set(false);
      return;
    }

    const price = Math.round(this.amountCop);

    try {
      const wrapper = document.createElement('addi-widget');
      wrapper.setAttribute('ally-slug', allySlug);
      wrapper.setAttribute('price', String(price));

      const inner = document.createElement('addi-product-widget');
      inner.setAttribute('ally-slug', allySlug);
      inner.setAttribute('price', String(price));
      inner.setAttribute('country', 'co');
      inner.setAttribute('id', this.productId);
      inner.className = 'hydrated';
      wrapper.appendChild(inner);
      host.appendChild(wrapper);

      await loadExternalScript(ADDI_SCRIPT);
      if (version !== this.renderVersion) return;

      if (typeof customElements !== 'undefined') {
        await Promise.all([
          customElements.whenDefined('addi-widget').catch(() => undefined),
          customElements.whenDefined('addi-product-widget').catch(() => undefined),
        ]);
      }

      if (version !== this.renderVersion) return;
      if (!host.querySelector('addi-widget')) {
        throw new Error('Widget Addi no se montó.');
      }
    } catch {
      if (version === this.renderVersion) {
        host.innerHTML = '';
        this.addiWidgetError.set(true);
      }
    } finally {
      if (version === this.renderVersion) {
        this.addiWidgetLoading.set(false);
      }
    }
  }

  private readError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = (error.error as { message?: string } | null)?.message;
      if (message) return message;
      return error.message;
    }
    if (error instanceof Error) return error.message;
    return 'No se pudo iniciar el pago. Intenta de nuevo.';
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PHONE_DISPLAY } from '../../core/constants/navigation';
import { CartService } from '../../core/services/cart.service';
import { PaymentCheckoutService } from '../../core/services/payment-checkout.service';
import { SeoService } from '../../core/services/seo.service';
import { paymentReceiptWhatsappUrl } from '../../core/utils/payment-receipt-whatsapp';

@Component({
  selector: 'app-payment-success',
  imports: [RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss',
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly cart = inject(CartService);
  private readonly checkout = inject(PaymentCheckoutService);

  protected readonly phoneDisplay = PHONE_DISPLAY;
  protected readonly loading = signal(true);
  protected readonly verified = signal(false);
  protected readonly pendingVerification = signal(false);
  protected reference = '';
  protected whatsappUrl = paymentReceiptWhatsappUrl();

  ngOnInit(): void {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const origen = params.get('origen') ?? params.get('payment');

    this.reference =
      params.get('ref') ??
      params.get('reference') ??
      params.get('orderId') ??
      '';

    this.whatsappUrl = paymentReceiptWhatsappUrl(this.reference);

    const provider =
      origen === 'addi' ? 'addi' : origen === 'wompi' || params.get('payment') === 'wompi' ? 'wompi' : null;

    if (provider && this.reference) {
      this.pendingVerification.set(true);
      const ok = await this.checkout.verifyPayment(provider, this.reference, {
        retries: provider === 'addi' ? 6 : 3,
        delayMs: 1500,
      });
      this.verified.set(ok);
      this.pendingVerification.set(false);

      if (ok) {
        this.cart.clear();
        this.cart.close();
      }
    }

    this.loading.set(false);

    this.seo.updatePageMeta({
      title: this.verified()
        ? 'Pago recibido | TUNEGOCIO.COM'
        : 'Estado del pago | TUNEGOCIO.COM',
      description: this.verified()
        ? 'Gracias por su compra. Envíe el comprobante por WhatsApp para validar su pedido.'
        : 'Consulte el estado de su pago o contáctenos por WhatsApp.',
      canonicalPath: '/pago-exitoso',
      noIndex: true,
    });
  }
}

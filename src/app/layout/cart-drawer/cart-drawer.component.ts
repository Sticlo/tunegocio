import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { PaymentOptionsComponent } from '../../shared/payment-options/payment-options.component';

@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, PaymentOptionsComponent],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  protected readonly cart = inject(CartService);

  close(): void {
    this.cart.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}

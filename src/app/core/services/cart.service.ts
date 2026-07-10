import { computed, Injectable, signal } from '@angular/core';
import { CartCheckoutPayload } from '../models/payment-checkout.model';
import { CartItem, Product } from '../models/cart-item.model';
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../constants/navigation';

const IVA_RATE = 0.19;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartItem[]>([]);
  readonly isOpen = signal(false);

  readonly cartItems = this.items.asReadonly();

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0),
  );

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.price * item.quantity, 0),
  );

  readonly iva = computed(() => Math.round(this.subtotal() * IVA_RATE));

  readonly total = computed(() => this.subtotal() + this.iva());

  readonly isEmpty = computed(() => this.items().length === 0);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  addProduct(product: Product, quantity = 1): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.id === product.id);

      if (existing) {
        return items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...items, { ...product, quantity }];
    });

    this.open();
  }

  removeItem(productId: string): void {
    this.items.update((items) => items.filter((item) => item.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(productId);
      return;
    }

    this.items.update((items) =>
      items.map((item) => (item.id === productId ? { ...item, quantity } : item)),
    );
  }

  clear(): void {
    this.items.set([]);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getWhatsAppUrl(): string {
    const items = this.items();

    if (items.length === 0) {
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    }

    const lines = items.map(
      (item) =>
        `• ${item.name} x${item.quantity} - ${this.formatPrice(item.price * item.quantity)}`,
    );

    const message = [
      'Hola, quiero cotizar los siguientes equipos:',
      '',
      ...lines,
      '',
      `Subtotal: ${this.formatPrice(this.subtotal())}`,
      `IVA (19%): ${this.formatPrice(this.iva())}`,
      `Total estimado: ${this.formatPrice(this.total())}`,
    ].join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  getCheckoutPayload(): CartCheckoutPayload {
    const items = this.items();

    return {
      reference: `TN-${Date.now()}`,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal: this.subtotal(),
      iva: this.iva(),
      total: this.total(),
    };
  }
}

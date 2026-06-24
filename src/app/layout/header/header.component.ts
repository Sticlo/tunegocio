import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HEADER_NAV } from '../../core/constants/navigation';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly cart = inject(CartService);

  protected readonly navItems = HEADER_NAV;
  protected readonly cartCount = this.cart.itemCount;
  protected readonly cartOpen = this.cart.isOpen;
  protected readonly menuOpen = signal(false);

  openCart(): void {
    this.cart.open();
    this.closeMenu();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}

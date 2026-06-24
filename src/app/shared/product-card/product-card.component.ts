import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogProduct } from '../../core/constants/products.catalog';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<CatalogProduct>();
  readonly addToCart = output<CatalogProduct>();

  protected assetUrl(path: string): string {
    return encodeURI(path);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product());
  }
}

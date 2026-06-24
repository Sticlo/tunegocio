import { Injectable } from '@angular/core';
import { CatalogProduct, PRODUCT_CATALOG } from '../constants/products.catalog';

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly catalog = PRODUCT_CATALOG;

  getAll(): CatalogProduct[] {
    return this.catalog;
  }

  getBySlug(slug: string): CatalogProduct | undefined {
    return this.catalog.find((product) => product.slug === slug);
  }

  getByCategory(categorySlug: string): CatalogProduct[] {
    return this.catalog.filter((product) => product.categorySlug === categorySlug);
  }
}

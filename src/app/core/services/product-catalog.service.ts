import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CatalogProduct, PRODUCT_CATALOG } from '../constants/products.catalog';
import { FirestoreProduct } from '../models/firestore-catalog.model';
import { formatCop } from '../utils/format-price';
import { CatalogFirestoreService } from './catalog-firestore.service';

function toCatalogProduct(product: FirestoreProduct): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categorySlug: product.categorySlug,
    image: product.imageUrl,
    price: product.price,
    priceLabel: formatCop(product.price),
    shortDescription: product.shortDescription,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    imageAlt: product.imageAlt,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly firestoreCatalog = inject(CatalogFirestoreService);

  private readonly productsSignal = signal<CatalogProduct[]>(PRODUCT_CATALOG);
  readonly loadedFromFirestore = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.syncFromFirestore();
    }
  }

  getAll(): CatalogProduct[] {
    return this.productsSignal();
  }

  getBySlug(slug: string): CatalogProduct | undefined {
    return this.productsSignal().find((product) => product.slug === slug);
  }

  getByCategory(categorySlug: string): CatalogProduct[] {
    return this.productsSignal().filter((product) => product.categorySlug === categorySlug);
  }

  private async syncFromFirestore(): Promise<void> {
    if (!this.firestoreCatalog.isAvailable()) return;

    try {
      const remote = await this.firestoreCatalog.listProducts();
      if (remote.length > 0) {
        this.productsSignal.set(remote.map(toCatalogProduct));
        this.loadedFromFirestore.set(true);
      }
    } catch {
      // Mantiene catálogo estático si Firestore falla
    }
  }

  async refresh(): Promise<void> {
    await this.syncFromFirestore();
  }
}

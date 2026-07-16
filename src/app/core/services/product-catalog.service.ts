import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { CatalogProduct, PRODUCT_CATALOG } from '../constants/products.catalog';
import { toCatalogProduct } from '../utils/firestore-catalog-mappers';
import { CatalogFirestoreService } from './catalog-firestore.service';

const PRODUCTS_STATE_KEY = makeStateKey<CatalogProduct[]>('catalog.products');

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly firestoreCatalog = inject(CatalogFirestoreService);

  private readonly productsSignal = signal<CatalogProduct[]>(PRODUCT_CATALOG);
  private readonly readyPromise: Promise<void>;
  private resolveReady!: () => void;

  readonly loadedFromFirestore = signal(false);

  constructor() {
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });

    const transferred = this.transferState.get(PRODUCTS_STATE_KEY, null);
    if (transferred && transferred.length > 0) {
      this.productsSignal.set(transferred);
      this.loadedFromFirestore.set(true);
      this.transferState.remove(PRODUCTS_STATE_KEY);
      this.resolveReady();
      return;
    }

    void this.syncFromFirestore().finally(() => this.resolveReady());
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
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
    if (!this.firestoreCatalog.canReadCatalog()) return;

    try {
      const remote = await this.firestoreCatalog.listProducts();
      if (remote.length > 0) {
        const products = remote.map(toCatalogProduct);
        this.productsSignal.set(products);
        this.loadedFromFirestore.set(true);
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(PRODUCTS_STATE_KEY, products);
        }
      }
    } catch {
      // Mantiene catálogo estático si Firestore falla
    }
  }

  async refresh(): Promise<void> {
    // Admin / explicit refresh: prefer live SDK when available in the browser.
    if (isPlatformBrowser(this.platformId) && this.firestoreCatalog.isAvailable()) {
      try {
        const remote = await this.firestoreCatalog.listProducts();
        if (remote.length > 0) {
          this.productsSignal.set(remote.map(toCatalogProduct));
          this.loadedFromFirestore.set(true);
        }
      } catch {
        // keep current
      }
      return;
    }
    await this.syncFromFirestore();
  }
}

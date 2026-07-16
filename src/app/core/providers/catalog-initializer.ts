import { inject, provideAppInitializer } from '@angular/core';
import { CategoryCatalogService } from '../services/category-catalog.service';
import { ProductCatalogService } from '../services/product-catalog.service';

/**
 * Blocks bootstrap (SSR + browser) until catalog signals are ready.
 * On SSR this waits for Firestore REST so the first HTML is DB truth.
 * On browser after SSR, TransferState resolves immediately (no flash).
 */
export function provideCatalogInitializer() {
  return provideAppInitializer(() => {
    const products = inject(ProductCatalogService);
    const categories = inject(CategoryCatalogService);
    return Promise.all([products.whenReady(), categories.whenReady()]);
  });
}

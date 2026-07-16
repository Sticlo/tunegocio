import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { CATEGORY_LIST } from '../constants/categories';
import { CategoryPageData } from '../models/nav-item.model';
import { toCategoryPageData } from '../utils/firestore-catalog-mappers';
import { sortCategories } from '../utils/sort-categories';
import { CatalogFirestoreService } from './catalog-firestore.service';

const CATEGORIES_STATE_KEY = makeStateKey<CategoryPageData[]>('catalog.categories');

@Injectable({ providedIn: 'root' })
export class CategoryCatalogService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly firestoreCatalog = inject(CatalogFirestoreService);

  private readonly categoriesSignal = signal<CategoryPageData[]>(CATEGORY_LIST);
  private readonly readyPromise: Promise<void>;
  private resolveReady!: () => void;

  readonly categories = this.categoriesSignal.asReadonly();
  readonly loadedFromFirestore = signal(false);

  constructor() {
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });

    const transferred = this.transferState.get(CATEGORIES_STATE_KEY, null);
    if (transferred && transferred.length > 0) {
      this.categoriesSignal.set(transferred);
      this.loadedFromFirestore.set(true);
      this.transferState.remove(CATEGORIES_STATE_KEY);
      this.resolveReady();
      return;
    }

    void this.syncFromFirestore().finally(() => this.resolveReady());
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  getAll(): CategoryPageData[] {
    return this.categoriesSignal();
  }

  getBySlug(slug: string): CategoryPageData | undefined {
    return this.categoriesSignal().find((category) => category.slug === slug);
  }

  private async syncFromFirestore(): Promise<void> {
    if (!this.firestoreCatalog.canReadCatalog()) return;

    try {
      const remote = await this.firestoreCatalog.listCategories();
      if (remote.length > 0) {
        const categories = sortCategories(remote).map(toCategoryPageData);
        this.categoriesSignal.set(categories);
        this.loadedFromFirestore.set(true);
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(CATEGORIES_STATE_KEY, categories);
        }
      }
    } catch {
      // Mantiene categorías estáticas si Firestore falla
    }
  }

  async refresh(): Promise<void> {
    if (isPlatformBrowser(this.platformId) && this.firestoreCatalog.isAvailable()) {
      try {
        const remote = await this.firestoreCatalog.listCategories();
        if (remote.length > 0) {
          this.categoriesSignal.set(sortCategories(remote).map(toCategoryPageData));
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

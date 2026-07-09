import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CATEGORY_LIST } from '../constants/categories';
import { CategoryPageData } from '../models/nav-item.model';
import { FirestoreCategory } from '../models/firestore-catalog.model';
import { CatalogFirestoreService } from './catalog-firestore.service';
import { sortCategories } from '../utils/sort-categories';

function toCategoryPageData(category: FirestoreCategory): CategoryPageData {
  const image = category.imageUrl;
  return {
    slug: category.slug,
    title: `${category.heading} en Colombia`,
    description: category.description,
    heading: category.heading,
    intro: category.intro,
    image:
      image.startsWith('http') || image.startsWith('/')
        ? image
        : `/${image}`,
  };
}

@Injectable({ providedIn: 'root' })
export class CategoryCatalogService {
  private readonly platformId = inject(PLATFORM_ID);
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

    if (isPlatformBrowser(this.platformId)) {
      void this.syncFromFirestore().finally(() => this.resolveReady());
    } else {
      this.resolveReady();
    }
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
    if (!this.firestoreCatalog.isAvailable()) return;

    try {
      const remote = await this.firestoreCatalog.listCategories();
      if (remote.length > 0) {
        this.categoriesSignal.set(sortCategories(remote).map(toCategoryPageData));
        this.loadedFromFirestore.set(true);
      }
    } catch {
      // Mantiene categorías estáticas si Firestore falla
    }
  }

  async refresh(): Promise<void> {
    await this.syncFromFirestore();
  }
}

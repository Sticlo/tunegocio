import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FirestoreCategory, FirestoreProduct } from '../../../core/models/firestore-catalog.model';
import { CatalogFirestoreService } from '../../../core/services/catalog-firestore.service';
import { formatCop } from '../../../core/utils/format-price';

@Component({
  selector: 'app-admin-products',
  imports: [RouterLink],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly catalog = inject(CatalogFirestoreService);

  protected readonly products = signal<FirestoreProduct[]>([]);
  protected readonly categories = signal<FirestoreCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly formatCop = formatCop;

  protected readonly categoryNames = computed(() => {
    const map = new Map<string, string>();
    for (const category of this.categories()) {
      map.set(category.slug, category.heading);
    }
    return map;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected categoryLabel(slug: string): string {
    return this.categoryNames().get(slug) ?? slug;
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [products, categories] = await Promise.all([
        this.catalog.listProducts(true),
        this.catalog.listCategories(true),
      ]);
      this.products.set(products);
      this.categories.set(categories);
    } catch {
      this.error.set('No se pudieron cargar los productos.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async remove(product: FirestoreProduct): Promise<void> {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    await this.catalog.deleteProduct(product.id);
    await this.load();
  }
}

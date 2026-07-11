import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FirestoreCategory } from '../../../core/models/firestore-catalog.model';
import { CatalogFirestoreService } from '../../../core/services/catalog-firestore.service';
import { CategoryCatalogService } from '../../../core/services/category-catalog.service';
import { ProductCatalogService } from '../../../core/services/product-catalog.service';

@Component({
  selector: 'app-admin-categories',
  imports: [RouterLink],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly catalog = inject(CatalogFirestoreService);
  private readonly categoryCatalog = inject(CategoryCatalogService);
  private readonly productCatalog = inject(ProductCatalogService);

  protected readonly categories = signal<FirestoreCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15_000),
      );
      this.categories.set(
        await Promise.race([this.catalog.listCategories(true), timeout]),
      );
    } catch {
      this.error.set(
        'No se pudieron cargar las categorías. Revisa la conexión e intenta de nuevo.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected isDeleting(categoryId: string): boolean {
    return this.deletingId() === categoryId;
  }

  protected async remove(category: FirestoreCategory): Promise<void> {
    if (this.deletingId()) return;

    let productCount = 0;
    try {
      productCount = await this.catalog.countProductsInCategory(category.slug);
    } catch {
      this.error.set('No se pudo verificar los productos de esta categoría.');
      return;
    }

    const firstMessage = productCount > 0
      ? [
          `Vas a eliminar la categoría "${category.heading}".`,
          '',
          `También se borrarán ${productCount} producto(s) asociado(s).`,
          '',
          'Esta acción no se puede deshacer.',
        ].join('\n')
      : [
          `Vas a eliminar la categoría "${category.heading}".`,
          '',
          'No tiene productos asociados.',
          '',
          'Esta acción no se puede deshacer.',
        ].join('\n');

    if (!confirm(firstMessage)) return;

    if (productCount > 0) {
      const finalMessage = [
        'Última confirmación.',
        '',
        `¿Borrar "${category.heading}" y sus ${productCount} producto(s) para siempre?`,
      ].join('\n');

      if (!confirm(finalMessage)) return;
    }

    this.deletingId.set(category.id);
    this.error.set(null);

    try {
      const deletedProducts = await this.catalog.deleteCategoryCascade(category);
      await this.categoryCatalog.refresh();
      await this.productCatalog.refresh();
      await this.load();

      if (deletedProducts > 0) {
        alert(
          `Categoría eliminada. También se borraron ${deletedProducts} producto(s) asociado(s).`,
        );
      }
    } catch {
      this.error.set('No se pudo eliminar la categoría. Intenta de nuevo.');
    } finally {
      this.deletingId.set(null);
    }
  }
}

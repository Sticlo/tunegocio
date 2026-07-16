import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategoryPageData } from '../../core/models/nav-item.model';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { CatalogProduct } from '../../core/constants/products.catalog';
import {
  buildBreadcrumbJsonLd,
  buildCategoryJsonLd,
  buildCategoryProductsJsonLd,
  combineJsonLd,
} from '../../core/constants/seo-schemas';
import { CartService } from '../../core/services/cart.service';
import { ProductCatalogService } from '../../core/services/product-catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';

@Component({
  selector: 'app-category',
  imports: [BreadcrumbComponent, ProductCardComponent, RouterLink],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly cart = inject(CartService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly route = inject(ActivatedRoute);

  readonly category = input<CategoryPageData | null>(null);

  protected breadcrumbs: BreadcrumbItem[] = [];
  protected readonly products = computed(() => {
    const category = this.category();
    return category ? this.catalog.getByCategory(category.slug) : [];
  });

  ngOnInit(): void {
    const data = this.category();
    if (!data) {
      const slug = this.route.snapshot.paramMap.get('categorySlug') ?? '';
      this.seo.updatePageMeta({
        title: 'Página no encontrada',
        description: 'La categoría que buscas no existe o fue movida.',
        canonicalPath: slug ? `/${slug}` : '/',
        noIndex: true,
      });
      return;
    }

    this.breadcrumbs = [
      { label: 'Inicio', path: '/' },
      { label: 'Categorías', path: '/productos' },
      { label: data.heading, path: `/${data.slug}` },
    ];

    this.seo.updatePageMeta({
      title: data.title,
      description: data.description,
      keywords: `${data.heading}, equipos industriales, acero inoxidable, Bogotá, Colombia`,
      canonicalPath: `/${data.slug}`,
      jsonLd: combineJsonLd(
        buildBreadcrumbJsonLd(this.breadcrumbs),
        buildCategoryJsonLd(data),
        buildCategoryProductsJsonLd(data, this.products()),
      ),
    });
  }

  addToCart(product: CatalogProduct): void {
    this.cart.addProduct({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.image,
    });
  }
}

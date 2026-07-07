import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CATEGORY_LIST } from '../../core/constants/categories';
import { CatalogProduct } from '../../core/constants/products.catalog';
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { SITE_URL } from '../../core/constants/site';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  combineJsonLd,
} from '../../core/constants/seo-schemas';
import { CartService } from '../../core/services/cart.service';
import { ProductCatalogService } from '../../core/services/product-catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-product-detail',
  imports: [BreadcrumbComponent, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly cart = inject(CartService);
  private readonly catalog = inject(ProductCatalogService);

  protected product: CatalogProduct | undefined;
  protected title = 'Producto';
  protected breadcrumbs: BreadcrumbItem[] = [];
  protected whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? 'producto';
    this.product = this.catalog.getBySlug(slug);
    this.title = this.product?.name ?? this.formatTitle(slug);

    const category = CATEGORY_LIST.find((item) => item.slug === this.product?.categorySlug);
    this.breadcrumbs = [
      { label: 'Inicio', path: '/' },
      { label: 'Categorías', path: '/productos' },
      ...(category
        ? [{ label: category.heading, path: `/${category.slug}` }]
        : []),
      { label: this.title, path: `/productos/${slug}` },
    ];

    const whatsappText = `Hola, me interesa cotizar: ${this.title}. ${WHATSAPP_MESSAGE}`;
    this.whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    this.seo.updatePageMeta({
      title: `${this.title} | Cotiza en Colombia`,
      description:
        this.product?.shortDescription ??
        `Cotiza ${this.title} con fabricación en acero inoxidable, envío nacional e instalación.`,
      keywords: `${this.title}, equipos industriales, acero inoxidable, Bogotá, Colombia`,
      canonicalPath: `/productos/${slug}`,
      ogType: 'product',
      ogImage: this.product ? `${SITE_URL}/${this.product.image}` : undefined,
      noIndex: !this.product,
      jsonLd: combineJsonLd(
        buildBreadcrumbJsonLd(this.breadcrumbs),
        this.product ? buildProductJsonLd(this.product, this.title) : undefined,
      ),
    });
  }

  addToCart(): void {
    if (!this.product) return;

    this.cart.addProduct({
      id: this.product.id,
      slug: this.product.slug,
      name: this.product.name,
      price: this.product.price,
      imageUrl: this.product.image,
    });
  }

  assetUrl(path: string): string {
    return encodeURI(path);
  }

  private formatTitle(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

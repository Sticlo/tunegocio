import { Component, effect, inject, OnInit, RESPONSE_INIT, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryCatalogService } from '../../core/services/category-catalog.service';
import { CatalogProduct, productGalleryImages, productImageAltAt, productPageDescription } from '../../core/constants/products.catalog';
import { LEGACY_PRODUCT_SLUGS } from '../../core/constants/legacy-redirects';
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  combineJsonLd,
} from '../../core/constants/seo-schemas';
import { resolveAssetUrl, absoluteAssetUrl } from '../../core/utils/resolve-asset-url';
import { priceWithIva } from '../../core/utils/price-with-iva';
import { CartService } from '../../core/services/cart.service';
import { ProductCatalogService } from '../../core/services/product-catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { PaymentOptionsComponent } from '../../shared/payment-options/payment-options.component';

@Component({
  selector: 'app-product-detail',
  imports: [BreadcrumbComponent, RouterLink, PaymentOptionsComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly cart = inject(CartService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly categoryCatalog = inject(CategoryCatalogService);
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  protected product: CatalogProduct | undefined;
  protected title = 'Producto';
  protected breadcrumbs: BreadcrumbItem[] = [];
  protected whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  protected readonly galleryImages = signal<string[]>([]);
  protected readonly activeImageIndex = signal(0);

  constructor() {
    effect(() => {
      this.catalog.getAll();
      const slug = this.route.snapshot.paramMap.get('slug') ?? 'producto';
      this.applyProduct(slug);
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? 'producto';
    this.applyProduct(slug);
  }

  private applyProduct(slug: string): void {
    const legacyTarget = LEGACY_PRODUCT_SLUGS[slug.toLowerCase()];
    if (legacyTarget && legacyTarget !== slug) {
      void this.router.navigate(['/productos', legacyTarget], { replaceUrl: true });
      return;
    }

    this.product = this.catalog.getBySlug(slug);

    if (!this.product && this.catalog.getAll().length > 0) {
      if (this.responseInit) {
        this.responseInit.status = 404;
        this.responseInit.statusText = 'Not Found';
      }
    }

    this.title = this.product?.name ?? this.formatTitle(slug);

    const images = this.product ? productGalleryImages(this.product) : [];
    this.galleryImages.set(images);
    this.activeImageIndex.set(0);

    const category = this.categoryCatalog.getBySlug(this.product?.categorySlug ?? '');
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

    const cover = images[0] ?? this.product?.image;

    this.seo.updatePageMeta({
      title: this.product?.seoTitle?.trim() || `${this.title} | Cotiza en Colombia`,
      description:
        this.product?.metaDescription?.trim() ||
        this.product?.shortDescription ||
        `Cotiza ${this.title} con fabricación en acero inoxidable, envío nacional e instalación.`,
      keywords: `${this.title}, equipos industriales, acero inoxidable, Bogotá, Colombia`,
      canonicalPath: `/productos/${slug}`,
      ogType: 'product',
      ogImage: cover ? absoluteAssetUrl(cover) : undefined,
      noIndex: !this.product,
      jsonLd: combineJsonLd(
        buildBreadcrumbJsonLd(this.breadcrumbs),
        this.product ? buildProductJsonLd(this.product, this.title) : undefined,
      ),
    });
  }

  protected selectImage(index: number): void {
    if (index < 0 || index >= this.galleryImages().length) return;
    this.activeImageIndex.set(index);
  }

  protected activeImage(): string {
    return this.galleryImages()[this.activeImageIndex()] ?? '';
  }

  protected galleryImageAlt(index: number): string {
    if (!this.product) return this.title;
    return productImageAltAt(this.product, index, this.title);
  }

  protected activeImageAlt(): string {
    return this.galleryImageAlt(this.activeImageIndex());
  }

  protected pageDescription(): string {
    return this.product ? productPageDescription(this.product) : '';
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

  payableAmount(): number {
    if (!this.product || this.product.price <= 0) return 0;
    return priceWithIva(this.product.price);
  }

  assetUrl(path: string): string {
    return resolveAssetUrl(path);
  }

  private formatTitle(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

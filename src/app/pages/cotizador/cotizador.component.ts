import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryCatalogService } from '../../core/services/category-catalog.service';
import {
  ADDI_MONTHS,
  ConfigField,
  COTIZADOR_PRESETS,
  CotizadorPreset,
  defaultConfigValues,
  formatConfigSummary,
  getProductConfigFields,
} from '../../core/constants/cotizador';
import { CatalogProduct } from '../../core/constants/products.catalog';
import { WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { ProductCatalogService } from '../../core/services/product-catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

export interface CotizadorLineItem {
  key: string;
  product: CatalogProduct;
  quantity: number;
  config: Record<string, string>;
  notes: string;
  configFields: ConfigField[];
}

@Component({
  selector: 'app-cotizador',
  imports: [BreadcrumbComponent, RouterLink],
  templateUrl: './cotizador.component.html',
  styleUrl: './cotizador.component.scss',
})
export class CotizadorComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly categoryCatalog = inject(CategoryCatalogService);
  private itemCounter = 0;

  protected readonly presets = COTIZADOR_PRESETS;
  protected readonly categories = this.categoryCatalog.categories;
  protected readonly addiMonths = ADDI_MONTHS;
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Cotizador', path: '/cotizador' },
  ];

  protected readonly activePreset = signal<CotizadorPreset>(COTIZADOR_PRESETS[3]);
  protected readonly activeCategory = signal<string>('all');
  protected readonly configuringProduct = signal<CatalogProduct | null>(null);
  protected readonly draftConfig = signal<Record<string, string>>({});
  protected readonly draftNotes = signal('');
  protected readonly draftQuantity = signal(1);
  protected readonly businessName = signal('');
  protected readonly city = signal('');
  protected readonly lineItems = signal<CotizadorLineItem[]>([]);
  protected readonly lastAddedKey = signal<string | null>(null);
  protected readonly toastMessage = signal<string | null>(null);
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private highlightTimeout?: ReturnType<typeof setTimeout>;

  protected readonly configFields = computed(() => {
    const product = this.configuringProduct();
    return product ? getProductConfigFields(product) : [];
  });

  protected readonly filteredProducts = computed(() => {
    const preset = this.activePreset();
    const category = this.activeCategory();
    let products = this.catalog.getAll();

    if (preset.categories.length > 0) {
      products = products.filter((product) => preset.categories.includes(product.categorySlug));
    }

    if (category !== 'all') {
      products = products.filter((product) => product.categorySlug === category);
    }

    return products;
  });

  protected readonly visibleCategories = computed(() => {
    const preset = this.activePreset();
    if (preset.categories.length === 0) return this.categories();
    return this.categories().filter((category) => preset.categories.includes(category.slug));
  });

  protected readonly pricedSubtotal = computed(() =>
    this.lineItems().reduce(
      (sum, item) => sum + (item.product.price > 0 ? item.product.price * item.quantity : 0),
      0,
    ),
  );

  protected readonly cotizarItems = computed(() =>
    this.lineItems().filter((item) => item.product.price <= 0),
  );

  protected readonly monthlyEstimate = computed(() => {
    const subtotal = this.pricedSubtotal();
    if (subtotal <= 0) return 0;
    return Math.ceil(subtotal / ADDI_MONTHS);
  });

  protected readonly totalUnits = computed(() =>
    this.lineItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  protected readonly draftPreviewChips = computed(() => {
    const fields = this.configFields();
    const config = this.draftConfig();
    const chips: { label: string; value: string }[] = [];

    for (const field of fields) {
      const raw = config[field.id]?.trim();
      if (!raw) continue;
      const value =
        field.type === 'select'
          ? (field.options?.find((option) => option.value === raw)?.label ?? raw)
          : raw;
      chips.push({ label: field.label, value });
    }

    const notes = this.draftNotes().trim();
    if (notes) {
      chips.push({ label: 'Notas', value: notes });
    }

    const qty = this.draftQuantity();
    if (qty > 1) {
      chips.push({ label: 'Cantidad', value: `${qty} unidades` });
    }

    return chips;
  });

  protected readonly quoteProgress = computed(() => {
    const hasItems = this.lineItems().length > 0;
    const hasZone = this.city().trim().length > 0;
    const steps = [hasItems, hasZone, hasItems && hasZone];
    const completed = steps.filter(Boolean).length;
    return {
      percent: Math.round((completed / 3) * 100),
      hasItems,
      hasZone,
      ready: hasItems && hasZone,
    };
  });

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Cotizador de maquinaria industrial a medida',
      description:
        'Configura hornos, freidoras, estufas y equipos del catálogo TUNEGOCIO: elige cámaras, túneles, medidas y envía tu cotización por WhatsApp.',
      keywords:
        'cotizador equipos industriales, freidora 4 tuneles, horno industrial a medida, cotización maquinaria Bogotá',
      canonicalPath: '/cotizador',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }

  protected selectPreset(preset: CotizadorPreset): void {
    this.activePreset.set(preset);
    this.activeCategory.set('all');
    this.closeConfigurator();
  }

  protected selectCategory(slug: string): void {
    this.activeCategory.set(slug);
    this.closeConfigurator();
  }

  protected openConfigurator(product: CatalogProduct): void {
    const fields = getProductConfigFields(product);
    this.configuringProduct.set(product);
    this.draftConfig.set(defaultConfigValues(fields));
    this.draftNotes.set('');
    this.draftQuantity.set(1);
  }

  protected closeConfigurator(): void {
    this.configuringProduct.set(null);
  }

  protected updateDraftConfig(fieldId: string, value: string): void {
    this.draftConfig.update((config) => ({ ...config, [fieldId]: value }));
  }

  protected updateDraftQuantity(delta: number): void {
    this.draftQuantity.update((qty) => Math.max(1, qty + delta));
  }

  protected confirmConfiguration(): void {
    const product = this.configuringProduct();
    if (!product) return;

    const fields = getProductConfigFields(product);
    this.itemCounter += 1;
    const key = `${product.slug}-${this.itemCounter}`;

    this.lineItems.update((items) => [
      ...items,
      {
        key,
        product,
        quantity: this.draftQuantity(),
        config: { ...this.draftConfig() },
        notes: this.draftNotes().trim(),
        configFields: fields,
      },
    ]);

    this.lastAddedKey.set(key);
    this.showToast(`${product.name} agregado a tu cotización`);
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
    this.highlightTimeout = setTimeout(() => this.lastAddedKey.set(null), 1500);
    this.closeConfigurator();
  }

  protected unitsInQuote(productSlug: string): number {
    return this.lineItems()
      .filter((item) => item.product.slug === productSlug)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  protected isJustAdded(key: string): boolean {
    return this.lastAddedKey() === key;
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 2800);
  }

  protected changeQuantity(key: string, delta: number): void {
    this.lineItems.update((items) =>
      items
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  protected removeItem(key: string): void {
    this.lineItems.update((items) => items.filter((item) => item.key !== key));
  }

  protected configSummary(item: CotizadorLineItem): string {
    const parts = [formatConfigSummary(item.configFields, item.config)];
    if (item.notes) parts.push(item.notes);
    return parts.filter(Boolean).join(' · ');
  }

  protected categoryLabel(categorySlug: string): string {
    return this.categories().find((category) => category.slug === categorySlug)?.heading ?? categorySlug;
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected assetUrl(path: string): string {
    return encodeURI(path);
  }

  protected whatsappUrl(): string {
    const items = this.lineItems();
    const name = this.businessName().trim();
    const city = this.city().trim();
    const preset = this.activePreset();

    const lines = [
      'Hola, configuré equipos en el cotizador de TUNEGOCIO.COM.',
      name ? `Negocio: ${name}` : '',
      preset.id !== 'todas' ? `Rubro: ${preset.name}` : '',
      city ? `Ciudad/zona: ${city}` : '',
      '',
      'Equipos configurados:',
      ...items.map((item) => {
        const summary = this.configSummary(item);
        const qty = item.quantity > 1 ? `${item.quantity}× ` : '';
        const price = item.product.priceLabel;
        return `• ${qty}${item.product.name}\n  ${summary}\n  Precio ref.: ${price}`;
      }),
      '',
      this.pricedSubtotal() > 0
        ? `Subtotal equipos (ref.): ${this.formatPrice(this.pricedSubtotal())}`
        : '',
      'Quisiera cotización final con envío e instalación.',
    ].filter(Boolean);

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }
}

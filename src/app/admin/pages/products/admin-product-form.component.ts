import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SITE_URL } from '../../../core/constants/site';
import { SEO_LIMITS, countWords } from '../../../core/constants/seo-limits';
import {
  adminFieldError,
  catalogNameValidators,
  collapseCatalogSpaces,
  FORM_VALIDATION_ERROR,
  normalizeCatalogText,
  productDescriptionValidators,
  productImageAltValidators,
  productMetaDescriptionValidators,
  productSeoTitleValidators,
  productShortDescriptionValidators,
  relaxProductValidatorsForEdit,
  scrollToFirstInvalidField,
} from '../../../core/utils/admin-form-validators';
import {
  buildProductPath,
  catalogSlugFromName,
  looksLikeRunOnName,
} from '../../../core/utils/catalog-slug';
import {
  FirestoreCategory,
  MAX_PRODUCT_IMAGES,
  normalizeProductImageAlts,
  normalizeProductImages,
} from '../../../core/models/firestore-catalog.model';
import { CatalogFirestoreService } from '../../../core/services/catalog-firestore.service';
import { ProductCatalogService } from '../../../core/services/product-catalog.service';
import { slugify } from '../../../core/utils/slugify';
import { validateImageFile } from '../../../core/utils/firebase-upload-error';
import { SeoFieldMeterComponent } from '../../shared/seo-field-meter.component';

interface ProductImageSlot {
  url: string;
  preview: string | null;
  file: File | null;
  fileName: string | null;
  alt: string;
}

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink, SeoFieldMeterComponent],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
})
export class AdminProductFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogFirestoreService);
  private readonly productCatalog = inject(ProductCatalogService);

  protected readonly seoLimits = SEO_LIMITS;
  protected readonly maxImages = MAX_PRODUCT_IMAGES;
  protected readonly categories = signal<FirestoreCategory[]>([]);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEdit = signal(false);
  protected readonly productId = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', catalogNameValidators],
    slug: [''],
    categorySlug: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    compareAtPrice: [0, [Validators.min(0)]],
    onSale: [false],
    shortDescription: ['', productShortDescriptionValidators],
    description: ['', productDescriptionValidators],
    seoTitle: ['', productSeoTitleValidators],
    metaDescription: ['', productMetaDescriptionValidators],
    imageAlt: ['', productImageAltValidators],
    imageUrl: [''],
    active: [true],
  });

  protected readonly previewSlug = signal('');
  protected readonly previewUrl = signal('');
  protected readonly previewDisplayName = signal('');
  protected readonly previewUrlLocked = signal(false);
  protected readonly showRunOnNameHint = signal(false);

  protected readonly imageSlots = signal<ProductImageSlot[]>([]);
  protected readonly imagePreviewError = signal<string | null>(null);
  protected readonly pendingSlotIndex = signal<number | null>(null);

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('adminForm') private adminForm?: ElementRef<HTMLFormElement>;

  async ngOnInit(): Promise<void> {
    const categories = await this.catalog.listCategories(true);
    this.categories.set(categories);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'nuevo') {
      this.imageSlots.set([]);
      return;
    }

    this.isEdit.set(true);
    this.productId.set(id);
    const product = await this.catalog.getProduct(id);
    if (!product) {
      await this.router.navigate(['/admin/productos']);
      return;
    }

    this.form.patchValue(product);
    const images = normalizeProductImages(product.images, product.imageUrl);
    const alts = normalizeProductImageAlts(product.imageAlts, product.imageAlt, images.length);
    this.setSlotsFromUrls(images, alts);
    this.form.controls.imageAlt.setValue(alts[0] || product.imageAlt || '');
    relaxProductValidatorsForEdit(this.form);
    this.updateUrlPreview();
  }

  protected fieldLen(field: keyof typeof this.form.controls): number {
    const value = this.form.controls[field].value;
    return typeof value === 'string' ? value.trim().length : 0;
  }

  protected fieldError(
    field:
      | 'name'
      | 'shortDescription'
      | 'description'
      | 'seoTitle'
      | 'metaDescription'
      | 'imageAlt'
      | 'categorySlug'
      | 'price',
  ): string | null {
    return adminFieldError(this.form.controls[field]);
  }

  protected descriptionWordCount(): number {
    return countWords(this.form.controls.description.value);
  }

  private updateUrlPreview(): void {
    const name = normalizeCatalogText(this.form.controls.name.value);
    const typingName = collapseCatalogSpaces(this.form.controls.name.value);

    this.previewDisplayName.set(typingName.trim() || name);

    if (this.isEdit()) {
      const slug = this.form.controls.slug.value || this.productId();
      this.previewSlug.set(slug);
      this.previewUrl.set(slug ? `${SITE_URL}${buildProductPath(slug)}` : '');
      this.previewUrlLocked.set(true);
    } else {
      const slug = catalogSlugFromName(name || typingName);
      this.previewSlug.set(slug);
      this.previewUrl.set(slug ? `${SITE_URL}${buildProductPath(slug)}` : '');
      this.previewUrlLocked.set(false);
    }

    this.showRunOnNameHint.set(looksLikeRunOnName(name || typingName));
  }

  protected onNameChange(): void {
    const raw = this.form.controls.name.value;
    const collapsed = collapseCatalogSpaces(raw);
    if (raw !== collapsed) {
      this.form.controls.name.setValue(collapsed, { emitEvent: false });
    }

    const name = normalizeCatalogText(collapsed);
    if (!name) {
      this.updateUrlPreview();
      return;
    }

    if (!this.isEdit()) {
      this.form.controls.slug.setValue(catalogSlugFromName(name));
    }

    if (!this.form.controls.seoTitle.dirty) {
      this.form.controls.seoTitle.setValue(
        `${name} | Cotiza en Colombia`.slice(0, SEO_LIMITS.title.max),
      );
    }

    if (!this.form.controls.imageAlt.dirty) {
      const alt = `${name} en acero inoxidable`.slice(0, SEO_LIMITS.imageAlt.max);
      this.form.controls.imageAlt.setValue(alt);
      this.syncCoverAltToSlot(alt);
    }

    this.updateUrlPreview();
  }

  protected onNameBlur(): void {
    const name = normalizeCatalogText(this.form.controls.name.value);
    this.form.controls.name.setValue(name);
    this.form.controls.name.markAsTouched();
    this.onNameChange();
  }

  protected onShortDescriptionChange(): void {
    const raw = this.form.controls.shortDescription.value;
    const collapsed = collapseCatalogSpaces(raw);
    if (raw !== collapsed) {
      this.form.controls.shortDescription.setValue(collapsed, { emitEvent: false });
    }

    const text = normalizeCatalogText(collapsed);
    if (!text || this.form.controls.metaDescription.dirty) return;

    this.form.controls.metaDescription.setValue(text.slice(0, SEO_LIMITS.metaDescription.max));
  }

  protected onShortDescriptionBlur(): void {
    const text = normalizeCatalogText(this.form.controls.shortDescription.value);
    this.form.controls.shortDescription.setValue(text);
    this.form.controls.shortDescription.markAsTouched();
  }

  protected onDescriptionChange(): void {
    // Preserve paragraph breaks; only collapse runs of spaces/tabs.
    const raw = this.form.controls.description.value;
    const cleaned = raw.replace(/[^\S\n]{2,}/g, ' ');
    if (raw !== cleaned) {
      this.form.controls.description.setValue(cleaned, { emitEvent: false });
    }
  }

  protected onDescriptionBlur(): void {
    const text = this.form.controls.description.value
      .replace(/[^\S\n]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    this.form.controls.description.setValue(text);
    this.form.controls.description.markAsTouched();
  }

  ngOnDestroy(): void {
    this.imageSlots.set([]);
  }

  protected openFilePicker(slotIndex?: number): void {
    this.imagePreviewError.set(null);

    if (slotIndex === undefined) {
      if (this.imageSlots().length >= MAX_PRODUCT_IMAGES) {
        this.imagePreviewError.set(`Máximo ${MAX_PRODUCT_IMAGES} fotos por producto.`);
        return;
      }
      this.pendingSlotIndex.set(this.imageSlots().length);
    } else {
      this.pendingSlotIndex.set(slotIndex);
    }

    this.fileInput?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const slotIndex = this.pendingSlotIndex();
    input.value = '';
    this.pendingSlotIndex.set(null);

    if (!file || slotIndex === null) return;
    this.assignFileToSlot(slotIndex, file);
  }

  protected removeImageSlot(index: number): void {
    const next = this.imageSlots().filter((_, i) => i !== index);
    this.imageSlots.set(next);
    this.form.controls.imageUrl.setValue(next[0]?.url || next[0]?.preview || '');
    this.form.controls.imageAlt.setValue(next[0]?.alt || this.form.controls.imageAlt.value);
    this.imagePreviewError.set(null);
  }

  protected moveImageSlot(index: number, direction: -1 | 1): void {
    const next = [...this.imageSlots()];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    this.imageSlots.set(next);
    this.form.controls.imageUrl.setValue(next[0]?.url || '');
    this.form.controls.imageAlt.setValue(next[0]?.alt || '');
  }

  protected onImageAltInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const next = [...this.imageSlots()];
    if (!next[index]) return;
    next[index] = { ...next[index], alt: value };
    this.imageSlots.set(next);
    if (index === 0) {
      this.form.controls.imageAlt.setValue(value);
      this.form.controls.imageAlt.markAsDirty();
    }
  }

  protected onImageAltBlur(index: number): void {
    const next = [...this.imageSlots()];
    const slot = next[index];
    if (!slot) return;
    const alt = normalizeCatalogText(slot.alt);
    next[index] = { ...slot, alt };
    this.imageSlots.set(next);
    if (index === 0) {
      this.form.controls.imageAlt.setValue(alt);
      this.form.controls.imageAlt.markAsTouched();
    }
  }

  protected imageAltLen(index: number): number {
    return this.imageSlots()[index]?.alt.trim().length ?? 0;
  }

  private syncCoverAltToSlot(alt: string): void {
    const slots = this.imageSlots();
    if (slots.length === 0) return;
    const next = [...slots];
    next[0] = { ...next[0], alt };
    this.imageSlots.set(next);
  }

  private setSlotsFromUrls(urls: string[], alts: string[] = []): void {
    this.imageSlots.set(
      urls.map((url, i) => ({
        url,
        preview: null,
        file: null,
        fileName: null,
        alt: alts[i] ?? '',
      })),
    );
    this.form.controls.imageUrl.setValue(urls[0] ?? '');
  }

  private assignFileToSlot(slotIndex: number, file: File): void {
    this.imagePreviewError.set(null);

    if (!file.type.startsWith('image/')) {
      this.imagePreviewError.set('El archivo debe ser una imagen (JPG, PNG o WEBP).');
      return;
    }

    const sizeError = validateImageFile(file);
    if (sizeError) {
      this.imagePreviewError.set(sizeError);
      return;
    }

    const name = this.form.controls.name.value.trim();
    let suggestedAlt = '';
    if (name) {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
      suggestedAlt =
        baseName.length >= SEO_LIMITS.imageAlt.min
          ? baseName.slice(0, SEO_LIMITS.imageAlt.max)
          : `${name} en acero inoxidable`.slice(0, SEO_LIMITS.imageAlt.max);
    }

    if (slotIndex === 0 && name && !this.form.controls.imageAlt.dirty) {
      this.form.controls.imageAlt.setValue(suggestedAlt);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = typeof reader.result === 'string' ? reader.result : null;
      const slots = [...this.imageSlots()];
      const existingAlt = slots[slotIndex]?.alt?.trim() ?? '';
      const alt =
        existingAlt ||
        (slotIndex === 0 ? this.form.controls.imageAlt.value.trim() : '') ||
        suggestedAlt;
      const slot: ProductImageSlot = {
        url: slots[slotIndex]?.url ?? '',
        preview,
        file,
        fileName: file.name,
        alt,
      };

      if (slotIndex >= slots.length) {
        slots.push(slot);
      } else {
        slots[slotIndex] = slot;
      }

      this.imageSlots.set(slots.slice(0, MAX_PRODUCT_IMAGES));
      if (slotIndex === 0 && preview) {
        this.form.controls.imageUrl.setValue(preview);
        this.form.controls.imageAlt.setValue(alt);
      }
    };
    reader.onerror = () => {
      this.imagePreviewError.set('No se pudo leer la imagen. Prueba con JPG o PNG.');
    };
    reader.readAsDataURL(file);
  }

  protected async submit(): Promise<void> {
    this.onNameChange();
    this.onShortDescriptionChange();

    const coverSlot = this.imageSlots()[0];
    if (coverSlot) {
      const coverAlt = normalizeCatalogText(coverSlot.alt);
      this.form.controls.imageAlt.setValue(coverAlt);
      this.syncCoverAltToSlot(coverAlt);
    }

    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.error.set(FORM_VALIDATION_ERROR);
      scrollToFirstInvalidField(this.adminForm?.nativeElement);
      return;
    }

    const name = normalizeCatalogText(this.form.controls.name.value);
    const slug = this.isEdit()
      ? slugify(this.form.controls.slug.value) || this.productId()
      : catalogSlugFromName(name) || crypto.randomUUID();
    const id = this.isEdit() ? this.productId() : slug;

    if (!this.isEdit()) {
      const existing = await this.catalog.listProducts(true);
      const duplicate = existing.find((item) => item.slug === slug || item.id === id);
      if (duplicate) {
        this.form.controls.name.setErrors({ duplicateSlug: true });
        this.form.controls.name.markAsTouched();
        this.error.set('Ya existe un producto con ese enlace. Cambia el nombre.');
        return;
      }
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const slots = this.imageSlots();
      const images: string[] = [];

      if (slots.some((slot) => slot.file)) {
        this.uploading.set(true);
      }

      for (const slot of slots) {
        if (slot.file) {
          images.push(await this.catalog.uploadImage('products', id, slot.file));
        } else if (slot.url) {
          images.push(slot.url);
        }
      }

      const normalizedImages = normalizeProductImages(images, images[0] ?? '');
      const imageUrl = normalizedImages[0] ?? '';
      const raw = this.form.getRawValue();
      const coverAltFromSlots = normalizeCatalogText(slots[0]?.alt ?? '');
      const coverAlt = coverAltFromSlots || normalizeCatalogText(raw.imageAlt);
      this.form.controls.imageAlt.setValue(coverAlt);
      const imageAlts = normalizeProductImageAlts(
        slots.map((slot) => normalizeCatalogText(slot.alt)),
        coverAlt,
        normalizedImages.length,
      );
      const imageAlt = imageAlts[0] || coverAlt;

      const price = Number(raw.price) || 0;
      const onSale = Boolean(raw.onSale);
      let compareAtPrice = onSale ? Number(raw.compareAtPrice) || 0 : 0;
      if (onSale && compareAtPrice > 0 && price > 0 && compareAtPrice <= price) {
        this.error.set(
          'El precio anterior debe ser mayor que el precio de oferta (ej. 5.000.000 y 4.800.000).',
        );
        this.saving.set(false);
        this.uploading.set(false);
        return;
      }
      if (!onSale) {
        compareAtPrice = 0;
      }

      await this.catalog.saveProduct(id, {
        ...raw,
        name,
        price,
        compareAtPrice,
        onSale,
        imageUrl,
        images: normalizedImages,
        slug,
        shortDescription: normalizeCatalogText(raw.shortDescription),
        description: this.form.controls.description.value
          .replace(/[^\S\n]{2,}/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim(),
        seoTitle: normalizeCatalogText(raw.seoTitle),
        metaDescription: normalizeCatalogText(raw.metaDescription),
        imageAlt,
        imageAlts,
      });

      await this.productCatalog.refresh();
      await this.router.navigate(['/admin/productos']);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      this.error.set(message || 'No se pudo guardar el producto.');
    } finally {
      this.saving.set(false);
      this.uploading.set(false);
    }
  }
}

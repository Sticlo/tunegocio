import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SITE_URL } from '../../../core/constants/site';
import { SEO_LIMITS } from '../../../core/constants/seo-limits';
import {
  adminFieldError,
  catalogNameValidators,
  collapseCatalogSpaces,
  FORM_VALIDATION_ERROR,
  normalizeCatalogText,
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
import { FirestoreCategory } from '../../../core/models/firestore-catalog.model';
import { CatalogFirestoreService } from '../../../core/services/catalog-firestore.service';
import { ProductCatalogService } from '../../../core/services/product-catalog.service';
import { slugify } from '../../../core/utils/slugify';
import { validateImageFile } from '../../../core/utils/firebase-upload-error';
import { SeoFieldMeterComponent } from '../../shared/seo-field-meter.component';

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
    shortDescription: ['', productShortDescriptionValidators],
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

  protected readonly imagePreview = signal<string | null>(null);
  protected readonly selectedFileName = signal<string | null>(null);
  protected readonly imagePreviewError = signal<string | null>(null);

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('adminForm') private adminForm?: ElementRef<HTMLFormElement>;

  private selectedFile: File | null = null;

  async ngOnInit(): Promise<void> {
    const categories = await this.catalog.listCategories(true);
    this.categories.set(categories);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'nuevo') return;

    this.isEdit.set(true);
    this.productId.set(id);
    const product = await this.catalog.getProduct(id);
    if (!product) {
      await this.router.navigate(['/admin/productos']);
      return;
    }

    this.form.patchValue(product);
    relaxProductValidatorsForEdit(this.form);
    this.updateUrlPreview();
  }

  protected fieldLen(field: keyof typeof this.form.controls): number {
    const value = this.form.controls[field].value;
    return typeof value === 'string' ? value.trim().length : 0;
  }

  protected fieldError(
    field: 'name' | 'shortDescription' | 'seoTitle' | 'metaDescription' | 'imageAlt' | 'categorySlug' | 'price',
  ): string | null {
    return adminFieldError(this.form.controls[field]);
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
      this.form.controls.imageAlt.setValue(
        `${name} en acero inoxidable`.slice(0, SEO_LIMITS.imageAlt.max),
      );
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

  ngOnDestroy(): void {
    this.imagePreview.set(null);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setSelectedFile(file);
  }

  protected openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  protected removeSelectedPhoto(): void {
    this.selectedFile = null;
    this.selectedFileName.set(null);
    this.imagePreview.set(null);
    this.imagePreviewError.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private setSelectedFile(file: File | null): void {
    this.selectedFile = file;
    this.imagePreview.set(null);
    this.imagePreviewError.set(null);
    this.selectedFileName.set(null);

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.imagePreviewError.set('El archivo debe ser una imagen (JPG, PNG o WEBP).');
      return;
    }

    const sizeError = validateImageFile(file);
    if (sizeError) {
      this.imagePreviewError.set(sizeError);
      return;
    }

    this.selectedFileName.set(file.name);

    const name = this.form.controls.name.value.trim();
    if (name && !this.form.controls.imageAlt.dirty) {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      const alt = baseName.length >= SEO_LIMITS.imageAlt.min
        ? baseName.slice(0, SEO_LIMITS.imageAlt.max)
        : `${name} en acero inoxidable`.slice(0, SEO_LIMITS.imageAlt.max);
      this.form.controls.imageAlt.setValue(alt);
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => {
      this.imagePreviewError.set('No se pudo leer la imagen. Prueba con JPG o PNG.');
    };
    reader.readAsDataURL(file);
  }

  protected async submit(): Promise<void> {
    this.onNameChange();
    this.onShortDescriptionChange();

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
      let imageUrl = this.form.controls.imageUrl.value;

      if (this.selectedFile) {
        this.uploading.set(true);
        imageUrl = await this.catalog.uploadImage('products', id, this.selectedFile);
        this.uploading.set(false);
      }

      const raw = this.form.getRawValue();
      await this.catalog.saveProduct(id, {
        ...raw,
        name,
        imageUrl,
        slug,
        shortDescription: normalizeCatalogText(raw.shortDescription),
        seoTitle: normalizeCatalogText(raw.seoTitle),
        metaDescription: normalizeCatalogText(raw.metaDescription),
        imageAlt: normalizeCatalogText(raw.imageAlt),
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

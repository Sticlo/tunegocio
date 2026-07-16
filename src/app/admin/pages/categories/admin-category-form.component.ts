import { Component, inject, OnDestroy, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SITE_URL } from '../../../core/constants/site';
import { SEO_LIMITS } from '../../../core/constants/seo-limits';
import {
  adminFieldError,
  catalogNameValidators,
  categoryIntroValidators,
  categorySeoDescriptionValidators,
  collapseCatalogSpaces,
  FORM_VALIDATION_ERROR,
  normalizeCatalogText,
  productImageAltValidators,
  relaxCategoryValidatorsForEdit,
  scrollToFirstInvalidField,
} from '../../../core/utils/admin-form-validators';
import {
  buildCategoryPath,
  catalogSlugFromName,
  looksLikeRunOnName,
} from '../../../core/utils/catalog-slug';
import { validateImageFile } from '../../../core/utils/firebase-upload-error';
import { CatalogFirestoreService } from '../../../core/services/catalog-firestore.service';
import { CategoryCatalogService } from '../../../core/services/category-catalog.service';
import { nextCategoryOrder } from '../../../core/utils/sort-categories';
import { SeoFieldMeterComponent } from '../../shared/seo-field-meter.component';

@Component({
  selector: 'app-admin-category-form',
  imports: [ReactiveFormsModule, RouterLink, SeoFieldMeterComponent],
  templateUrl: './admin-category-form.component.html',
  styleUrl: './admin-category-form.component.scss',
})
export class AdminCategoryFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogFirestoreService);
  private readonly categoryCatalog = inject(CategoryCatalogService);

  protected readonly seoLimits = SEO_LIMITS;
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEdit = signal(false);
  protected readonly categoryId = signal('');

  protected readonly form = this.fb.nonNullable.group({
    heading: ['', catalogNameValidators],
    intro: ['', categoryIntroValidators],
    description: ['', categorySeoDescriptionValidators],
    imageUrl: [''],
    imageAlt: ['', productImageAltValidators],
    order: [0, [Validators.min(0)]],
    active: [true],
    slug: [''],
    name: [''],
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
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'nueva') {
      const existing = await this.catalog.listCategories(true);
      this.form.controls.order.setValue(nextCategoryOrder(existing));
      return;
    }

    this.isEdit.set(true);
    this.categoryId.set(id);
    const category = await this.catalog.getCategory(id);
    if (!category) {
      await this.router.navigate(['/admin/categorias']);
      return;
    }

    this.form.patchValue({
      heading: category.heading,
      intro: category.intro,
      description: category.description,
      imageUrl: category.imageUrl,
      imageAlt: category.imageAlt || category.heading,
      order: category.order,
      active: category.active,
      slug: category.slug,
      name: category.name,
    });
    relaxCategoryValidatorsForEdit(this.form);
    this.updateUrlPreview();
  }

  private updateUrlPreview(): void {
    const heading = normalizeCatalogText(this.form.controls.heading.value);
    const typingHeading = collapseCatalogSpaces(this.form.controls.heading.value);

    this.previewDisplayName.set(typingHeading.trim() || heading);

    if (this.isEdit()) {
      const slug = this.form.controls.slug.value || this.categoryId();
      this.previewSlug.set(slug);
      this.previewUrl.set(slug ? `${SITE_URL}${buildCategoryPath(slug)}` : '');
      this.previewUrlLocked.set(true);
    } else {
      const slug = catalogSlugFromName(heading || typingHeading);
      this.previewSlug.set(slug);
      this.previewUrl.set(slug ? `${SITE_URL}${buildCategoryPath(slug)}` : '');
      this.previewUrlLocked.set(false);
    }

    this.showRunOnNameHint.set(looksLikeRunOnName(heading || typingHeading));
  }

  protected fieldLen(field: 'intro' | 'description' | 'imageAlt'): number {
    return this.form.controls[field].value.trim().length;
  }

  protected fieldError(field: 'heading' | 'intro' | 'description' | 'imageAlt'): string | null {
    return adminFieldError(this.form.controls[field]);
  }

  protected onHeadingChange(): void {
    const raw = this.form.controls.heading.value;
    const collapsed = collapseCatalogSpaces(raw);
    if (raw !== collapsed) {
      this.form.controls.heading.setValue(collapsed, { emitEvent: false });
    }

    const heading = normalizeCatalogText(collapsed);
    this.form.controls.name.setValue(heading);
    if (!this.isEdit()) {
      this.form.controls.slug.setValue(catalogSlugFromName(heading));
    }
    if (heading && !this.form.controls.imageAlt.dirty) {
      this.form.controls.imageAlt.setValue(
        `${heading} en acero inoxidable`.slice(0, SEO_LIMITS.imageAlt.max),
      );
    }
    this.updateUrlPreview();
  }

  protected onHeadingBlur(): void {
    const heading = normalizeCatalogText(this.form.controls.heading.value);
    this.form.controls.heading.setValue(heading);
    this.form.controls.heading.markAsTouched();
    this.onHeadingChange();
  }

  protected onIntroChange(): void {
    const raw = this.form.controls.intro.value;
    const collapsed = collapseCatalogSpaces(raw);
    if (raw !== collapsed) {
      this.form.controls.intro.setValue(collapsed, { emitEvent: false });
    }

    const intro = normalizeCatalogText(collapsed);
    if (!intro || this.form.controls.description.dirty) return;
    this.form.controls.description.setValue(intro.slice(0, SEO_LIMITS.metaDescription.max));
  }

  protected onIntroBlur(): void {
    const intro = normalizeCatalogText(this.form.controls.intro.value);
    this.form.controls.intro.setValue(intro);
    this.form.controls.intro.markAsTouched();
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
    this.onHeadingChange();
    this.onIntroChange();

    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.error.set(FORM_VALIDATION_ERROR);
      scrollToFirstInvalidField(this.adminForm?.nativeElement);
      return;
    }

    const heading = normalizeCatalogText(this.form.controls.heading.value);
    const slug = this.isEdit()
      ? this.form.controls.slug.value || this.categoryId()
      : catalogSlugFromName(heading) || crypto.randomUUID();
    const id = this.isEdit() ? this.categoryId() : slug;

    if (!this.isEdit()) {
      const existing = await this.catalog.listCategories(true);
      const duplicate = existing.find((item) => item.slug === slug || item.id === id);
      if (duplicate) {
        this.form.controls.heading.setErrors({ duplicateSlug: true });
        this.form.controls.heading.markAsTouched();
        this.error.set('Ya existe una categoría con ese enlace. Cambia el nombre.');
        return;
      }
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      let imageUrl = this.form.controls.imageUrl.value;
      if (this.selectedFile) {
        this.uploading.set(true);
        imageUrl = await this.catalog.uploadImage('categories', id, this.selectedFile);
        this.uploading.set(false);
      }

      await this.catalog.saveCategory(id, {
        name: heading,
        heading,
        slug,
        description: normalizeCatalogText(this.form.controls.description.value),
        intro: normalizeCatalogText(this.form.controls.intro.value),
        imageUrl,
        imageAlt: normalizeCatalogText(this.form.controls.imageAlt.value),
        order: this.form.controls.order.value,
        active: this.form.controls.active.value,
      });

      await this.categoryCatalog.refresh();

      await this.router.navigate(['/admin/categorias']);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      this.error.set(message || 'No se pudo guardar la categoría.');
    } finally {
      this.saving.set(false);
      this.uploading.set(false);
    }
  }
}

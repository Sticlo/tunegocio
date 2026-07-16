import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { SEO_LIMITS } from '../constants/seo-limits';

export function normalizeCatalogText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Mientras escribe: solo colapsa espacios dobles, sin quitar el espacio al final. */
export function collapseCatalogSpaces(value: string): string {
  return value.replace(/\s{2,}/g, ' ');
}

export function noEdgeWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || !value) return null;

  if (/\s{2,}/.test(value)) {
    return { multipleSpaces: true };
  }

  return null;
}

export function validSlugValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || !value) return null;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return { invalidSlug: true };
  }

  return null;
}

export function seoMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'string' || !value.trim()) return null;

    if (value.trim().length < min) {
      return { seoTooShort: { min, actual: value.trim().length } };
    }

    return null;
  };
}

export const catalogNameValidators = [
  Validators.required,
  Validators.minLength(3),
  Validators.maxLength(80),
  noEdgeWhitespaceValidator,
];

export const categoryIntroValidators = [
  Validators.required,
  Validators.minLength(20),
  Validators.maxLength(200),
  noEdgeWhitespaceValidator,
];

export const categorySeoDescriptionValidators = [
  Validators.required,
  seoMinLength(SEO_LIMITS.metaDescription.min),
  Validators.maxLength(SEO_LIMITS.metaDescription.max),
  noEdgeWhitespaceValidator,
];

export const productShortDescriptionValidators = [
  Validators.required,
  seoMinLength(SEO_LIMITS.shortDescription.min),
  Validators.maxLength(SEO_LIMITS.shortDescription.max),
  noEdgeWhitespaceValidator,
];

export const productDescriptionValidators = [
  Validators.maxLength(SEO_LIMITS.description.maxChars),
];

export const productSeoTitleValidators = [
  Validators.required,
  seoMinLength(SEO_LIMITS.title.min),
  Validators.maxLength(SEO_LIMITS.title.max),
  noEdgeWhitespaceValidator,
];

export const productMetaDescriptionValidators = [
  Validators.required,
  seoMinLength(SEO_LIMITS.metaDescription.min),
  Validators.maxLength(SEO_LIMITS.metaDescription.max),
  noEdgeWhitespaceValidator,
];

export const productImageAltValidators = [
  Validators.required,
  seoMinLength(SEO_LIMITS.imageAlt.min),
  Validators.maxLength(SEO_LIMITS.imageAlt.max),
  noEdgeWhitespaceValidator,
];

export function relaxProductValidatorsForEdit(form: FormGroup): void {
  const fields: Array<{ key: string; validators: ValidatorFn[] }> = [
    {
      key: 'shortDescription',
      validators: [
        Validators.required,
        Validators.maxLength(SEO_LIMITS.shortDescription.max),
        noEdgeWhitespaceValidator,
      ],
    },
    {
      key: 'description',
      validators: [Validators.maxLength(SEO_LIMITS.description.maxChars)],
    },
    {
      key: 'seoTitle',
      validators: [
        Validators.required,
        Validators.maxLength(SEO_LIMITS.title.max),
        noEdgeWhitespaceValidator,
      ],
    },
    {
      key: 'metaDescription',
      validators: [
        Validators.required,
        Validators.maxLength(SEO_LIMITS.metaDescription.max),
        noEdgeWhitespaceValidator,
      ],
    },
    {
      key: 'imageAlt',
      validators: [
        Validators.required,
        Validators.maxLength(SEO_LIMITS.imageAlt.max),
        noEdgeWhitespaceValidator,
      ],
    },
  ];

  for (const { key, validators } of fields) {
    const control = form.get(key);
    if (!control) continue;
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }
}

export function relaxCategoryValidatorsForEdit(form: FormGroup): void {
  const fields: Array<{ key: string; validators: ValidatorFn[] }> = [
    {
      key: 'intro',
      validators: [
        Validators.required,
        Validators.maxLength(200),
        noEdgeWhitespaceValidator,
      ],
    },
    {
      key: 'description',
      validators: [
        Validators.required,
        Validators.maxLength(SEO_LIMITS.metaDescription.max),
        noEdgeWhitespaceValidator,
      ],
    },
    {
      key: 'imageAlt',
      validators: [
        Validators.required,
        Validators.maxLength(SEO_LIMITS.imageAlt.max),
        noEdgeWhitespaceValidator,
      ],
    },
  ];

  for (const { key, validators } of fields) {
    const control = form.get(key);
    if (!control) continue;
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }
}

export function scrollToFirstInvalidField(container?: HTMLElement | null): void {
  const root = container ?? document;
  const invalid = root.querySelector<HTMLElement>(
    'input.ng-invalid, textarea.ng-invalid, select.ng-invalid',
  );
  invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  invalid?.focus();
}

export const FORM_VALIDATION_ERROR =
  'No se pudo guardar. Revisa los campos marcados en rojo (baja si hace falta).';

const FIELD_ERROR_MESSAGES: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  minlength: 'Muy corto. Escribe un poco más.',
  maxlength: 'Muy largo. Acorta el texto.',
  min: 'El valor no puede ser negativo.',
  edgeWhitespace: 'Quita los espacios al inicio o al final.',
  multipleSpaces: 'Usa un solo espacio entre palabras.',
  invalidSlug: 'El enlace solo puede tener letras minúsculas, números y guiones.',
  seoTooShort: 'Muy corto para Google. Completa el texto hasta la barra verde.',
  duplicateSlug: 'Ya existe otra entrada con ese enlace. Cambia el nombre.',
  invalidName: 'Escribe un nombre claro con palabras separadas por espacio.',
};

export function adminFieldError(
  control: AbstractControl | null | undefined,
  options?: { showWhenPristine?: boolean },
): string | null {
  if (!control?.errors) return null;
  if (!options?.showWhenPristine && !control.touched && !control.dirty) return null;

  const errors = control.errors;

  if (errors['duplicateSlug']) return FIELD_ERROR_MESSAGES['duplicateSlug'];
  if (errors['invalidName']) return FIELD_ERROR_MESSAGES['invalidName'];
  if (errors['edgeWhitespace']) return FIELD_ERROR_MESSAGES['edgeWhitespace'];
  if (errors['multipleSpaces']) return FIELD_ERROR_MESSAGES['multipleSpaces'];
  if (errors['invalidSlug']) return FIELD_ERROR_MESSAGES['invalidSlug'];
  if (errors['seoTooShort']) return FIELD_ERROR_MESSAGES['seoTooShort'];
  if (errors['minlength']) return FIELD_ERROR_MESSAGES['minlength'];
  if (errors['maxlength']) return FIELD_ERROR_MESSAGES['maxlength'];
  if (errors['min']) return FIELD_ERROR_MESSAGES['min'];
  if (errors['required']) return FIELD_ERROR_MESSAGES['required'];

  return 'Revisa este campo.';
}

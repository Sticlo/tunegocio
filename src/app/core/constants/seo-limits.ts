export const SEO_LIMITS = {
  title: { min: 30, max: 60, label: 'Título SEO' },
  metaDescription: { min: 120, max: 160, label: 'Meta descripción' },
  imageAlt: { min: 10, max: 125, label: 'Texto alternativo de imagen' },
  shortDescription: { min: 80, max: 300, label: 'Descripción visible' },
} as const;

export type SeoMeterStatus = 'empty' | 'short' | 'ok' | 'long';

export function seoMeterStatus(length: number, min: number, max: number): SeoMeterStatus {
  if (length === 0) return 'empty';
  if (length > max) return 'long';
  if (length < min) return 'short';
  return 'ok';
}

export function seoMeterMessage(status: SeoMeterStatus, min: number, max: number): string {
  switch (status) {
    case 'empty':
      return 'Escribe algo aquí para que Google entienda mejor la página.';
    case 'short':
      return `Un poco corto. Intenta usar entre ${min} y ${max} letras.`;
    case 'long':
      return `Muy largo. Google corta el texto después de ${max} letras.`;
    case 'ok':
      return 'Perfecto. Este texto está en el rango ideal.';
  }
}

export const SEO_LIMITS = {
  title: { min: 30, max: 60, label: 'Título SEO' },
  /** Snippet bajo el título en Google (~20–30 palabras). */
  metaDescription: { min: 120, max: 160, label: 'Meta descripción' },
  imageAlt: { min: 10, max: 125, label: 'Texto alternativo de imagen' },
  /** Resumen corto para tarjetas del catálogo. */
  shortDescription: { min: 80, max: 300, label: 'Resumen corto' },
  /**
   * Descripción larga de la ficha (SEO e-commerce).
   * Ideal: 300–400 palabras. Contamos en palabras, no en letras.
   */
  description: { minWords: 300, maxWords: 400, maxChars: 5000, label: 'Descripción del producto' },
} as const;

export type SeoMeterStatus = 'empty' | 'short' | 'ok' | 'long';

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

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

export function productDescriptionMeterStatus(wordCount: number): SeoMeterStatus {
  if (wordCount === 0) return 'empty';
  if (wordCount > SEO_LIMITS.description.maxWords) return 'long';
  if (wordCount < SEO_LIMITS.description.minWords) return 'short';
  return 'ok';
}

export function productDescriptionMeterMessage(status: SeoMeterStatus): string {
  const { minWords, maxWords } = SEO_LIMITS.description;
  switch (status) {
    case 'empty':
      return `Recomendado: escribe entre ${minWords} y ${maxWords} palabras (beneficios, usos y características).`;
    case 'short':
      return `Vas bien, pero aún falta. Ideal: ${minWords}–${maxWords} palabras para la ficha del producto.`;
    case 'long':
      return `Un poco largo. Trata de quedarte cerca de ${maxWords} palabras para no aburrir al cliente.`;
    case 'ok':
      return `Perfecto. Estás en el rango ideal de ${minWords}–${maxWords} palabras.`;
  }
}

export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string;
  intro: string;
  imageUrl: string;
  /** Alt text for the category image (SEO / accessibility). */
  imageAlt: string;
  order: number;
  active: boolean;
}

export interface FirestoreProduct {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  /**
   * Optional “before” price shown struck through when higher than `price`
   * (same idea as WooCommerce regular vs sale price).
   */
  compareAtPrice: number;
  /** Explicit admin toggle: show sale UI only when true. */
  onSale: boolean;
  shortDescription: string;
  /** Long product-page body (~300–400 words). Optional for legacy products. */
  description: string;
  seoTitle: string;
  metaDescription: string;
  /** Cover image alt (same as `imageAlts[0]` when present). */
  imageAlt: string;
  /** Alt text per gallery image (same order as `images`). */
  imageAlts: string[];
  /** Cover / primary image (first of `images`). */
  imageUrl: string;
  /** Gallery images (2–3). Always includes cover as first entry when present. */
  images: string[];
  active: boolean;
}

export interface FirestoreCategoryInput {
  name: string;
  slug: string;
  heading: string;
  description: string;
  intro: string;
  imageUrl: string;
  imageAlt: string;
  order: number;
  active: boolean;
}

export interface FirestoreProductInput {
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  /**
   * Optional “before” price shown struck through when higher than `price`
   * (same idea as WooCommerce regular vs sale price).
   */
  compareAtPrice: number;
  /** Explicit admin toggle: show sale UI only when true. */
  onSale: boolean;
  shortDescription: string;
  /** Long product-page body (~300–400 words). Optional for legacy products. */
  description: string;
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
  imageAlts: string[];
  imageUrl: string;
  images: string[];
  active: boolean;
}

/** Max gallery photos shown in admin + product detail. */
export const MAX_PRODUCT_IMAGES = 3;

export function normalizeProductImages(
  images: unknown,
  imageUrl: string,
): string[] {
  const fromArray = Array.isArray(images)
    ? images.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return [...new Set(fromArray)].slice(0, MAX_PRODUCT_IMAGES);
  }
  const cover = String(imageUrl ?? '').trim();
  return cover ? [cover] : [];
}

/** Align alt texts with gallery length; cover falls back to `imageAlt`. */
export function normalizeProductImageAlts(
  imageAlts: unknown,
  imageAlt: string,
  imageCount: number,
): string[] {
  const fromArray = Array.isArray(imageAlts)
    ? imageAlts.map((item) => String(item ?? '').trim())
    : [];
  const cover = String(imageAlt ?? '').trim();
  if (imageCount <= 0) {
    return cover ? [cover] : [];
  }
  return Array.from({ length: imageCount }, (_, i) => {
    const fromSlot = fromArray[i]?.trim() ?? '';
    if (fromSlot) return fromSlot;
    return i === 0 ? cover : '';
  });
}

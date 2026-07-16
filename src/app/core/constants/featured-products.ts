import { CatalogProduct } from './products.catalog';

export interface FeaturedProduct {
  name: string;
  slug: string;
  categorySlug: string;
  image: string;
  priceLabel: string;
  compareAtPriceLabel?: string;
  shortDescription: string;
}

const FEATURED_CATEGORY_SLUGS = [
  'hornos-industriales',
  'asadores-de-pollos',
  'estufas-industriales',
  'vitrinas-industriales',
] as const;

function toFeatured(product: CatalogProduct): FeaturedProduct {
  return {
    name: product.name,
    slug: product.slug,
    categorySlug: product.categorySlug,
    image: product.image,
    priceLabel: product.priceLabel,
    compareAtPriceLabel: product.compareAtPriceLabel,
    shortDescription: product.shortDescription,
  };
}

/** Picks one product per featured category from the live catalog (Firestore when ready). */
export function pickFeaturedProducts(products: CatalogProduct[]): FeaturedProduct[] {
  return FEATURED_CATEGORY_SLUGS.map((categorySlug) =>
    products.find((product) => product.categorySlug === categorySlug),
  )
    .filter((product): product is CatalogProduct => Boolean(product))
    .map(toFeatured);
}

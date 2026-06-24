import { CatalogProduct, PRODUCT_CATALOG } from './products.catalog';

export interface FeaturedProduct {
  name: string;
  slug: string;
  categorySlug: string;
  image: string;
  priceLabel: string;
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
    shortDescription: product.shortDescription,
  };
}

export const FEATURED_PRODUCTS: FeaturedProduct[] = FEATURED_CATEGORY_SLUGS.map((categorySlug) =>
  PRODUCT_CATALOG.find((product) => product.categorySlug === categorySlug),
)
  .filter((product): product is CatalogProduct => Boolean(product))
  .map(toFeatured);

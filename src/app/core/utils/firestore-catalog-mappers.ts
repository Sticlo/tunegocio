import {
  FirestoreCategory,
  FirestoreProduct,
  normalizeProductImageAlts,
  normalizeProductImages,
} from '../models/firestore-catalog.model';
import { CatalogProduct } from '../constants/products.catalog';
import { CategoryPageData } from '../models/nav-item.model';
import { formatCop, productHasDiscount } from './format-price';
import { sortCategories } from './sort-categories';

export function mapFirestoreCategory(
  id: string,
  data: Record<string, unknown>,
): FirestoreCategory {
  const heading = String(data['heading'] ?? data['name'] ?? '');
  return {
    id,
    name: String(data['name'] ?? ''),
    slug: String(data['slug'] ?? ''),
    heading,
    description: String(data['description'] ?? ''),
    intro: String(data['intro'] ?? ''),
    imageUrl: String(data['imageUrl'] ?? ''),
    imageAlt: String(data['imageAlt'] ?? heading),
    order: Number(data['order'] ?? 0),
    active: data['active'] !== false,
  };
}

export function mapFirestoreProduct(
  id: string,
  data: Record<string, unknown>,
): FirestoreProduct {
  const name = String(data['name'] ?? '');
  const shortDescription = String(data['shortDescription'] ?? '');
  const imageUrl = String(data['imageUrl'] ?? '');
  const images = normalizeProductImages(data['images'], imageUrl);
  const imageAlt = String(data['imageAlt'] ?? name);
  const imageAlts = normalizeProductImageAlts(data['imageAlts'], imageAlt, images.length);
  return {
    id,
    name,
    slug: String(data['slug'] ?? ''),
    categorySlug: String(data['categorySlug'] ?? ''),
    price: Number(data['price'] ?? 0),
    compareAtPrice: Number(data['compareAtPrice'] ?? 0),
    onSale: data['onSale'] === true,
    shortDescription,
    description: String(data['description'] ?? ''),
    seoTitle: String(data['seoTitle'] ?? name),
    metaDescription: String(data['metaDescription'] ?? shortDescription),
    imageAlt: imageAlts[0] || imageAlt,
    imageAlts,
    imageUrl: images[0] ?? imageUrl,
    images,
    active: data['active'] !== false,
  };
}

export function toCatalogProduct(product: FirestoreProduct): CatalogProduct {
  const images =
    product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const imageAlts = normalizeProductImageAlts(
    product.imageAlts,
    product.imageAlt,
    images.length,
  );
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const onSale = product.onSale === true && productHasDiscount(product.price, compareAtPrice, true);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categorySlug: product.categorySlug,
    image: images[0] ?? product.imageUrl,
    images,
    price: product.price,
    compareAtPrice: onSale ? compareAtPrice : undefined,
    onSale,
    priceLabel: formatCop(product.price),
    compareAtPriceLabel: onSale ? formatCop(compareAtPrice) : undefined,
    shortDescription: product.shortDescription,
    description: product.description || undefined,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    imageAlt: imageAlts[0] || product.imageAlt,
    imageAlts,
  };
}

export function toCategoryPageData(category: FirestoreCategory): CategoryPageData {
  const image = category.imageUrl;
  return {
    slug: category.slug,
    title: `${category.heading} en Colombia`,
    description: category.description,
    heading: category.heading,
    intro: category.intro,
    image:
      image.startsWith('http') || image.startsWith('/')
        ? image
        : `/${image}`,
    imageAlt: category.imageAlt || category.heading,
  };
}

export function mapActiveCategories(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
  includeInactive = false,
): FirestoreCategory[] {
  const items = sortCategories(docs.map((doc) => mapFirestoreCategory(doc.id, doc.data)));
  return includeInactive ? items : items.filter((c) => c.active);
}

export function mapActiveProducts(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
  includeInactive = false,
): FirestoreProduct[] {
  const items = docs.map((doc) => mapFirestoreProduct(doc.id, doc.data));
  return includeInactive ? items : items.filter((p) => p.active);
}

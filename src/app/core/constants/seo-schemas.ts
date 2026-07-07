import { CategoryPageData } from '../models/nav-item.model';
import { BreadcrumbItem } from '../models/breadcrumb.model';
import { CATEGORY_LIST } from './categories';
import { FeaturedProduct, FEATURED_PRODUCTS } from './featured-products';
import { CatalogProduct } from './products.catalog';
import {
  PHONE_NUMBER,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from './navigation';
import { GOOGLE_MAPS_URL, GOOGLE_REVIEWS_SUMMARY } from './reviews';
import { BUSINESS_INFO, SITE_OG_IMAGE, SITE_URL } from './site';

export function combineJsonLd(
  ...schemas: Array<Record<string, unknown> | undefined>
): Record<string, unknown>[] {
  return schemas.filter((schema): schema is Record<string, unknown> => Boolean(schema));
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.path === '/' ? SITE_URL : `${SITE_URL}${item.path}`,
    })),
  };
}

export function buildCategoryJsonLd(category: CategoryPageData): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.title,
    description: category.description,
    url: `${SITE_URL}/${category.slug}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'Thing',
      name: category.heading,
    },
  };
}

export function buildProductJsonLd(
  product: CatalogProduct,
  title: string,
): Record<string, unknown> {
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url: `${SITE_URL}/productos/${product.slug}`,
    priceCurrency: 'COP',
    availability: 'https://schema.org/InStock',
    seller: {
      '@id': `${SITE_URL}/#localbusiness`,
    },
  };

  if (product.price > 0) {
    offer['price'] = product.price;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: product.shortDescription,
    image: `${SITE_URL}/${product.image}`,
    category: product.categorySlug,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: offer,
  };
}

export function buildCategoryProductsJsonLd(
  category: CategoryPageData,
  products: CatalogProduct[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Catálogo de ${category.heading}`,
    url: `${SITE_URL}/${category.slug}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${SITE_URL}/productos/${product.slug}`,
    })),
  };
}

export function buildHomeJsonLd(): Record<string, unknown>[] {
  const telephone = `+${PHONE_NUMBER}`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#localbusiness`,
      name: BUSINESS_INFO.legalName,
      alternateName: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      image: SITE_OG_IMAGE,
      logo: `${SITE_URL}/assets/logo.png`,
      telephone,
      email: BUSINESS_INFO.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: BUSINESS_INFO.city,
        addressCountry: BUSINESS_INFO.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: BUSINESS_INFO.latitude,
        longitude: BUSINESS_INFO.longitude,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Colombia',
      },
      priceRange: BUSINESS_INFO.priceRange,
      sameAs: [GOOGLE_MAPS_URL],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: GOOGLE_REVIEWS_SUMMARY.rating,
        reviewCount: GOOGLE_REVIEWS_SUMMARY.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: SITE_TAGLINE,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: {
        '@id': `${SITE_URL}/#localbusiness`,
      },
      inLanguage: 'es-CO',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Categorías de equipos industriales',
      itemListElement: CATEGORY_LIST.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: category.heading,
        url: `${SITE_URL}/${category.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Equipos industriales destacados',
      itemListElement: FEATURED_PRODUCTS.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.name,
        url: `${SITE_URL}/productos/${product.slug}`,
      })),
    },
  ];
}

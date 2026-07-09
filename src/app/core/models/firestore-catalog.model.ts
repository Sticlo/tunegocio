export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string;
  intro: string;
  imageUrl: string;
  order: number;
  active: boolean;
}

export interface FirestoreProduct {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  shortDescription: string;
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
  imageUrl: string;
  active: boolean;
}

export interface FirestoreCategoryInput {
  name: string;
  slug: string;
  heading: string;
  description: string;
  intro: string;
  imageUrl: string;
  order: number;
  active: boolean;
}

export interface FirestoreProductInput {
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  shortDescription: string;
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
  imageUrl: string;
  active: boolean;
}

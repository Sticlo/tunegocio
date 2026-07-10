import type { CheckoutLineItem } from './types';

const IVA_RATE = 0.19;
const FIREBASE_PROJECT_ID = 'tunegocio-4de17';
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface CatalogProductPrice {
  id: string;
  slug: string;
  name: string;
  price: number;
  active: boolean;
}

interface CatalogCache {
  expiresAt: number;
  byId: Map<string, CatalogProductPrice>;
}

let cache: CatalogCache | null = null;

function parseIntegerField(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseInt(value, 10);
  if (value && typeof value === 'object' && 'integerValue' in value) {
    return Number.parseInt(String((value as { integerValue: string }).integerValue), 10);
  }
  if (value && typeof value === 'object' && 'doubleValue' in value) {
    return Math.round(Number((value as { doubleValue: number }).doubleValue));
  }
  return 0;
}

function parseStringField(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'stringValue' in value) {
    return String((value as { stringValue: string }).stringValue);
  }
  return '';
}

function parseBooleanField(value: unknown, defaultValue = true): boolean {
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object' && 'booleanValue' in value) {
    return Boolean((value as { booleanValue: boolean }).booleanValue);
  }
  return defaultValue;
}

function mapFirestoreDocument(
  name: string,
  fields: Record<string, unknown>,
): CatalogProductPrice | null {
  const id = name.split('/').pop() ?? '';
  if (!id) return null;

  const slug = parseStringField(fields['slug']) || id;
  const productName = parseStringField(fields['name']);
  const price = parseIntegerField(fields['price']);

  return {
    id,
    slug,
    name: productName,
    price,
    active: parseBooleanField(fields['active'], true),
  };
}

async function fetchCatalogFromFirestore(): Promise<Map<string, CatalogProductPrice>> {
  const byId = new Map<string, CatalogProductPrice>();
  let pageToken = '';

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/products`,
    );
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('No se pudo cargar el catálogo para validar el pago.');
    }

    const data = (await response.json()) as {
      documents?: Array<{ name: string; fields: Record<string, unknown> }>;
      nextPageToken?: string;
    };

    for (const doc of data.documents ?? []) {
      const product = mapFirestoreDocument(doc.name, doc.fields);
      if (!product || product.price <= 0) continue;
      byId.set(product.id, product);
      if (product.slug !== product.id) {
        byId.set(product.slug, product);
      }
    }

    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return byId;
}

async function getCatalogMap(): Promise<Map<string, CatalogProductPrice>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.byId;

  const byId = await fetchCatalogFromFirestore();
  cache = { byId, expiresAt: now + CACHE_TTL_MS };
  return byId;
}

export interface ValidatedCheckoutTotals {
  items: CheckoutLineItem[];
  subtotal: number;
  iva: number;
  total: number;
}

export async function validateCheckoutTotals(
  items: CheckoutLineItem[],
  subtotal: number,
  iva: number,
  total: number,
): Promise<ValidatedCheckoutTotals> {
  if (!items.length) {
    throw new Error('El carrito está vacío.');
  }

  const catalog = await getCatalogMap();
  if (catalog.size === 0) {
    throw new Error('Catálogo no disponible para validar el pago.');
  }

  let expectedSubtotal = 0;
  const normalizedItems: CheckoutLineItem[] = [];

  for (const item of items) {
    const product = catalog.get(item.id.trim());
    if (!product || !product.active) {
      throw new Error(`Producto no disponible: ${item.name || item.id}`);
    }

    const quantity = Math.floor(item.quantity);
    if (quantity < 1 || quantity > 50) {
      throw new Error('Cantidad inválida en el carrito.');
    }

    expectedSubtotal += product.price * quantity;
    normalizedItems.push({
      id: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
    });
  }

  const expectedIva = Math.round(expectedSubtotal * IVA_RATE);
  const expectedTotal = expectedSubtotal + expectedIva;

  if (subtotal !== expectedSubtotal || iva !== expectedIva || total !== expectedTotal) {
    throw new Error('Los montos no coinciden con el catálogo. Recarga la página e intenta de nuevo.');
  }

  return {
    items: normalizedItems,
    subtotal: expectedSubtotal,
    iva: expectedIva,
    total: expectedTotal,
  };
}

/** Expone cache para tests. */
export function resetCatalogCacheForTests(): void {
  cache = null;
}

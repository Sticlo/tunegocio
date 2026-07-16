export function formatCop(price: number): string {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Cotizar precio';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
}

/** True when the product is marked on sale and has a higher struck-through price. */
export function productHasDiscount(
  price: number,
  compareAtPrice?: number,
  onSale?: boolean,
): boolean {
  if (onSale === false) return false;
  const compare = Number(compareAtPrice ?? 0);
  return price > 0 && compare > price;
}

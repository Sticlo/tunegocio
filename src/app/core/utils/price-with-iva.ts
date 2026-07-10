const IVA_RATE = 0.19;

export function priceWithIva(basePrice: number): number {
  return basePrice + Math.round(basePrice * IVA_RATE);
}

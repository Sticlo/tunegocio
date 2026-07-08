/** Mapeo de slugs WordPress / WooCommerce → rutas actuales */
export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  hornos: 'hornos-industriales',
  'asadores-de-pollos': 'asadores-de-pollos',
  'estufas-industriales': 'estufas-industriales',
  vitrinas: 'vitrinas-industriales',
  'carros-de-comidas': 'carros-de-comidas',
  maquinaria: 'maquinaria',
  'maquinaria-especializada': 'maquinaria-especializada',
  'mesones-en-acero': 'mesones-acero-inoxidable',
  uncategorized: 'productos',
};

/** Rutas legacy exactas → destino (301) */
export const LEGACY_EXACT_REDIRECTS: Record<string, string> = {
  '/nuestras-categorias': '/productos',
  '/nuestras-categorias/': '/productos',
  '/carrito': '/productos',
  '/carrito/': '/productos',
  '/shop': '/productos',
  '/shop/': '/productos',
  '/tienda': '/productos',
  '/tienda/': '/productos',
  '/catalogo': '/productos',
  '/catalogo/': '/productos',
};

/** Slugs de productos WordPress que cambiaron o ya no existen en el catálogo */
export const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  'carro-para-comidas-rapidas': 'carro-para-comidas-rapidas-en-acero',
  'carro-de-perros-y-comidas-rapidas': 'carro-de-comidas-rapidas',
  'asador-giratorio-para-arepas-boyacences': 'asador-giratorio-para-arepas-boyacenses',
  'horno-lechonero-con-termometro': 'horno-4-camaras-con-termometro-acero',
};

import { catalogSlugFromName, looksLikeRunOnName } from './catalog-slug';
import { normalizeCatalogText } from './admin-form-validators';
import { slugify } from './slugify';

describe('catalog slug helpers', () => {
  it('convierte nombres con espacios a slugs con guiones', () => {
    expect(catalogSlugFromName('Asadero de pollos')).toBe('asadero-de-pollos');
  });

  it('normaliza espacios extra', () => {
    expect(normalizeCatalogText('  Hornos   industriales  ')).toBe('Hornos industriales');
    expect(catalogSlugFromName('  Hornos   industriales  ')).toBe('hornos-industriales');
  });

  it('detecta nombres pegados sin espacio', () => {
    expect(looksLikeRunOnName('categoriaprueba')).toBe(true);
    expect(looksLikeRunOnName('Asadero de pollos')).toBe(false);
  });

  it('genera slugs seguros para URLs', () => {
    expect(slugify('Horno 4 cámaras')).toBe('horno-4-camaras');
    expect(slugify('ejemploproducto')).toBe('ejemploproducto');
  });
});

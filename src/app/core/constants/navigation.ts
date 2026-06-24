import { NavItem } from '../models/nav-item.model';

/** Navegación principal del header — simple y clara */
export const HEADER_NAV: NavItem[] = [
  { label: 'Productos', path: '/productos' },
  { label: 'Instalación', path: '/instalacion-extraccion-industrial' },
  { label: 'Nosotros', path: '/nosotros' },
  { label: 'Ubicaciones', path: '/ubicaciones' },
  { label: 'Contacto', path: '/contacto' },
];

/** Categorías para footer y página de productos */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Hornos', path: '/hornos-industriales' },
  { label: 'Asadores de pollos', path: '/asadores-de-pollos' },
  { label: 'Estufas industriales', path: '/estufas-industriales' },
  { label: 'Vitrinas', path: '/vitrinas-industriales' },
  { label: 'Mesones en acero', path: '/mesones-acero-inoxidable' },
  { label: 'Maquinaria especializada', path: '/maquinaria-especializada' },
  { label: 'Carros de comidas', path: '/carros-de-comidas' },
  { label: 'Maquinaria', path: '/maquinaria' },
];

export const FOOTER_NAV: NavItem[] = [
  { label: 'Productos', path: '/productos' },
  { label: 'Nosotros', path: '/nosotros' },
  { label: 'Ubicaciones', path: '/ubicaciones' },
  { label: 'Contacto', path: '/contacto' },
];

export const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com/', icon: 'facebook' },
  { label: 'X (Twitter)', href: 'https://twitter.com/', icon: 'twitter' },
  { label: 'Instagram', href: 'https://instagram.com/', icon: 'instagram' },
] as const;

export const WHATSAPP_NUMBER = '573001234567';
export const PHONE_NUMBER = '573001234567';
export const WHATSAPP_MESSAGE = 'Hola, me interesa cotizar un equipo industrial.';

export const SITE_NAME = 'TUNEGOCIO.COM';
export const SITE_TAGLINE = 'Equipos Industriales';
export const SITE_DESCRIPTION =
  'Equipos para panadería y restaurantes en acero inoxidable';

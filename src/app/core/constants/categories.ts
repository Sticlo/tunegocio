import { CategoryPageData } from '../models/nav-item.model';

const categoryImage = (filename: string) => `assets/categorias/${filename}`;

export const CATEGORY_LIST: CategoryPageData[] = [
  {
    slug: 'hornos-industriales',
    title: 'Hornos industriales en Colombia',
    description:
      'Fabricación y venta de hornos industriales para panadería y restaurantes en acero inoxidable.',
    heading: 'Hornos',
    intro: 'Hornos para trabajo pesado con respaldo técnico e instalación.',
    image: categoryImage('horno.png'),
  },
  {
    slug: 'asadores-de-pollos',
    title: 'Asadores de pollos industriales',
    description:
      'Asadores de pollos a gas y carbón para rotiserías y restaurantes. Fabricación en acero inoxidable.',
    heading: 'Asadores de pollos',
    intro: 'Modelos estándar y premium para alta producción.',
    image: categoryImage('asadoresdepollo.png'),
  },
  {
    slug: 'estufas-industriales',
    title: 'Estufas industriales para restaurantes',
    description:
      'Estufas industriales en acero inoxidable para cocinas profesionales y restaurantes.',
    heading: 'Estufas industriales',
    intro: 'Equipos robustos para cocinas de alto rendimiento.',
    image: categoryImage('estufasindustriales.png'),
  },
  {
    slug: 'vitrinas-industriales',
    title: 'Vitrinas industriales',
    description:
      'Vitrinas para restaurantes y panaderías. Exhibe tus productos con equipos de calidad industrial.',
    heading: 'Vitrinas',
    intro: 'Exhibición y conservación para tu negocio gastronómico.',
    image: categoryImage('vitrinas.png'),
  },
  {
    slug: 'mesones-acero-inoxidable',
    title: 'Mesones en acero inoxidable',
    description:
      'Mesones a medida en acero inoxidable para cocinas industriales, panaderías y restaurantes.',
    heading: 'Mesones en acero',
    intro: 'Fabricación a medida según tu espacio de producción.',
    image: categoryImage('mesonesenacero.png'),
  },
  {
    slug: 'maquinaria-especializada',
    title: 'Maquinaria especializada industrial',
    description:
      'Equipos especializados para líneas de producción, procesamiento y operación gastronómica.',
    heading: 'Maquinaria especializada',
    intro: 'Soluciones a medida para procesos específicos.',
    image:
      'assets/categorias/MAQUINARIA ESPECIALIZADA - TUNEGOCIO.COM/imgi_45_WhatsApp-Image-2026-05-27-at-3.24.15-PM-1.jpg',
  },
  {
    slug: 'sistemas-de-extraccion',
    title: 'Sistemas de extracción industrial',
    description:
      'Campanas extractoras, ductos y ventilación industrial en acero inoxidable. Cotiza diseño e instalación a tu medida.',
    heading: 'Sistemas de extracción',
    intro: 'Campanas, ductos y extracción para cocinas industriales.',
    image:
      'assets/categorias/HORNOS - TUNEGOCIO.COM/imgi_70_IMG-20260325-WA0075.jpg',
  },
  {
    slug: 'carros-de-comidas',
    title: 'Carros de comidas industriales',
    description:
      'Carros de comidas en acero inoxidable para venta móvil y operación gastronómica.',
    heading: 'Carros de comidas',
    intro: 'Diseños funcionales para venta móvil y eventos.',
    image: categoryImage('carrosdecomida.png'),
  },
  {
    slug: 'maquinaria',
    title: 'Maquinaria industrial para panadería',
    description:
      'Maquinaria especializada para panaderías y restaurantes: amasadoras, equipos y más.',
    heading: 'Maquinaria',
    intro: 'Amasadoras y equipos para optimizar tu producción.',
    image: categoryImage('maquinaria.png'),
  },
];

export const CATEGORIES: Record<string, CategoryPageData> = Object.fromEntries(
  CATEGORY_LIST.map((category) => [category.slug, category]),
);

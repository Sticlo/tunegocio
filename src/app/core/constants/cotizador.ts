import { CatalogProduct } from './products.catalog';

export const ADDI_MONTHS = 3;

export interface ConfigFieldOption {
  value: string;
  label: string;
}

export interface ConfigField {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: ConfigFieldOption[];
  placeholder?: string;
  defaultValue?: string;
}

export interface CotizadorPreset {
  id: string;
  name: string;
  description: string;
  categories: string[];
}

export const COTIZADOR_PRESETS: CotizadorPreset[] = [
  {
    id: 'panaderia',
    name: 'Panadería',
    description: 'Hornos, amasadoras, mesones y vitrinas.',
    categories: ['hornos-industriales', 'maquinaria', 'maquinaria-especializada', 'mesones-acero-inoxidable', 'vitrinas-industriales', 'sistemas-de-extraccion'],
  },
  {
    id: 'rotiseria',
    name: 'Rotisería',
    description: 'Asadores, freidoras, mesones y extracción.',
    categories: ['asadores-de-pollos', 'estufas-industriales', 'mesones-acero-inoxidable', 'sistemas-de-extraccion'],
  },
  {
    id: 'restaurante',
    name: 'Restaurante',
    description: 'Estufas, hornos, mesones y campanas.',
    categories: ['estufas-industriales', 'hornos-industriales', 'mesones-acero-inoxidable', 'vitrinas-industriales', 'sistemas-de-extraccion'],
  },
  {
    id: 'todas',
    name: 'Ver todo el catálogo',
    description: 'Todas las categorías disponibles.',
    categories: [],
  },
];

const BASE_FIELDS: ConfigField[] = [
  {
    id: 'energia',
    label: 'Tipo de energía',
    type: 'select',
    options: [
      { value: 'gas', label: 'Gas' },
      { value: 'electricidad', label: 'Electricidad' },
      { value: 'dual', label: 'Gas y electricidad' },
      { value: 'definir', label: 'Por definir en visita' },
    ],
    defaultValue: 'definir',
  },
  {
    id: 'acabado',
    label: 'Acabado',
    type: 'select',
    options: [
      { value: '304', label: 'Acero inoxidable 304' },
      { value: '430', label: 'Acero inoxidable 430' },
      { value: 'definir', label: 'Por definir' },
    ],
    defaultValue: '304',
  },
];

const RULE_FIELDS: Array<{
  test: (product: CatalogProduct) => boolean;
  fields: ConfigField[];
}> = [
  {
    test: (p) => /freidor|túnel|tunel/i.test(p.name),
    fields: [
      {
        id: 'tuneles',
        label: 'Cantidad de túneles',
        type: 'select',
        options: [
          { value: '1', label: '1 túnel' },
          { value: '2', label: '2 túneles' },
          { value: '3', label: '3 túneles' },
          { value: '4', label: '4 túneles' },
          { value: '5+', label: '5 o más (a medida)' },
        ],
        defaultValue: '3',
      },
      {
        id: 'capacidad',
        label: 'Capacidad',
        type: 'select',
        options: [
          { value: '20l', label: '20 litros' },
          { value: '30l', label: '30 litros' },
          { value: '40l', label: '40 litros' },
          { value: 'amedida', label: 'A medida' },
        ],
        defaultValue: '30l',
      },
    ],
  },
  {
    test: (p) =>
      p.categorySlug === 'hornos-industriales' || /horno/i.test(p.name),
    fields: [
      {
        id: 'camaras',
        label: 'Cantidad de cámaras',
        type: 'select',
        options: [
          { value: '1', label: '1 cámara' },
          { value: '2', label: '2 cámaras' },
          { value: '3', label: '3 cámaras' },
          { value: '4', label: '4 cámaras' },
          { value: '5+', label: '5 o más (a medida)' },
        ],
        defaultValue: '1',
      },
      {
        id: 'medidas',
        label: 'Medidas o capacidad',
        type: 'text',
        placeholder: 'Ej. lata 65 cm, 12 bandejas',
      },
    ],
  },
  {
    test: (p) =>
      p.categorySlug === 'estufas-industriales' || /estufa|puesto/i.test(p.name),
    fields: [
      {
        id: 'puestos',
        label: 'Cantidad de puestos',
        type: 'select',
        options: [
          { value: '2', label: '2 puestos' },
          { value: '4', label: '4 puestos' },
          { value: '6', label: '6 puestos' },
          { value: '8+', label: '8 o más (a medida)' },
        ],
        defaultValue: '4',
      },
      {
        id: 'plancha',
        label: 'Incluye plancha',
        type: 'select',
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
          { value: 'opcional', label: 'Opcional' },
        ],
        defaultValue: 'opcional',
      },
    ],
  },
  {
    test: (p) =>
      p.categorySlug === 'asadores-de-pollos' || /asador|pollo/i.test(p.name),
    fields: [
      {
        id: 'capacidad-pollos',
        label: 'Capacidad en pollos',
        type: 'select',
        options: [
          { value: '12', label: 'Hasta 12 pollos' },
          { value: '24', label: 'Hasta 24 pollos' },
          { value: '36+', label: '36 o más (a medida)' },
        ],
        defaultValue: '24',
      },
      {
        id: 'combustible',
        label: 'Combustible',
        type: 'select',
        options: [
          { value: 'gas', label: 'Gas' },
          { value: 'carbon', label: 'Carbón' },
          { value: 'electrico', label: 'Eléctrico' },
        ],
        defaultValue: 'gas',
      },
    ],
  },
  {
    test: (p) => p.categorySlug === 'mesones-acero-inoxidable' || /mesón|meson|lavatrap/i.test(p.name),
    fields: [
      {
        id: 'largo',
        label: 'Largo (cm)',
        type: 'text',
        placeholder: 'Ej. 150',
      },
      {
        id: 'entrepaños',
        label: 'Entrepaños',
        type: 'select',
        options: [
          { value: '1', label: '1 entrepaño' },
          { value: '2', label: '2 entrepaños' },
          { value: 'amedida', label: 'A medida' },
        ],
        defaultValue: 'amedida',
      },
    ],
  },
  {
    test: (p) => p.categorySlug === 'sistemas-de-extraccion' || /campana|ducto|extrac/i.test(p.name),
    fields: [
      {
        id: 'ancho',
        label: 'Ancho de campana (cm)',
        type: 'text',
        placeholder: 'Ej. 120',
      },
      {
        id: 'instalacion',
        label: 'Incluye instalación de ductos',
        type: 'select',
        options: [
          { value: 'si', label: 'Sí, cotizar instalación' },
          { value: 'solo-equipo', label: 'Solo equipo' },
        ],
        defaultValue: 'si',
      },
    ],
  },
  {
    test: (p) => p.categorySlug === 'carros-de-comidas' || /carro|puesto/i.test(p.name),
    fields: [
      {
        id: 'servicios',
        label: 'Servicios de cocción',
        type: 'select',
        options: [
          { value: '1', label: '1 servicio' },
          { value: '2', label: '2 servicios' },
          { value: '3', label: '3 servicios' },
          { value: '4+', label: '4 o más (a medida)' },
        ],
        defaultValue: '2',
      },
    ],
  },
  {
    test: (p) => /vitrina/i.test(p.name),
    fields: [
      {
        id: 'largo-vitrina',
        label: 'Largo (cm)',
        type: 'select',
        options: [
          { value: '90', label: '90 cm' },
          { value: '120', label: '120 cm' },
          { value: '150', label: '150 cm' },
          { value: 'amedida', label: 'A medida' },
        ],
        defaultValue: '120',
      },
    ],
  },
];

export function getProductConfigFields(product: CatalogProduct): ConfigField[] {
  const specific: ConfigField[] = [];
  const seen = new Set<string>();

  for (const rule of RULE_FIELDS) {
    if (!rule.test(product)) continue;
    for (const field of rule.fields) {
      if (!seen.has(field.id)) {
        seen.add(field.id);
        specific.push(field);
      }
    }
  }

  const base = BASE_FIELDS.filter((field) => !seen.has(field.id));
  return [...specific, ...base];
}

export function defaultConfigValues(fields: ConfigField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.id] = field.defaultValue ?? '';
  }
  return values;
}

export function formatConfigSummary(
  fields: ConfigField[],
  config: Record<string, string>,
): string {
  return fields
    .map((field) => {
      const raw = config[field.id]?.trim();
      if (!raw) return '';
      const label =
        field.type === 'select'
          ? field.options?.find((option) => option.value === raw)?.label ?? raw
          : raw;
      return `${field.label}: ${label}`;
    })
    .filter(Boolean)
    .join(' · ');
}

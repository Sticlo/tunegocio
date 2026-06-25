export type CoverageModality = 'local' | 'nacional';

export interface CoverageZone {
  slug: string;
  nombre: string;
  destacado: string;
  tiempoRespuesta: string;
  servicios: string;
  barrios: string[];
}

export interface CoverageRegion {
  slug: string;
  nombre: string;
  descripcion: string;
  modalidad: CoverageModality;
  zonas: CoverageZone[];
}

export const COVERAGE_REGIONS: CoverageRegion[] = [
  {
    slug: 'bogota',
    nombre: 'Bogotá D.C.',
    descripcion:
      'Estamos aquí. Fabricación, visita a planta, entrega e instalación sin exigir pago total antes del despacho.',
    modalidad: 'local',
    zonas: [
      {
        slug: 'bogota-norte',
        nombre: 'Bogotá Norte',
        destacado: 'Fabricación, venta e instalación de equipos en acero inoxidable.',
        tiempoRespuesta: 'Cotización el mismo día',
        servicios: 'Hornos · Estufas · Instalación',
        barrios: ['Chapinero', 'Usaquén', 'Suba', 'Engativá'],
      },
      {
        slug: 'bogota-centro',
        nombre: 'Bogotá Centro',
        destacado: 'Atención directa desde nuestra planta y showroom.',
        tiempoRespuesta: 'Visita y asesoría rápida',
        servicios: 'Vitrinas · Mesones · Maquinaria',
        barrios: ['Teusaquillo', 'La Candelaria', 'Santa Fe', 'Los Mártires'],
      },
      {
        slug: 'bogota-sur',
        nombre: 'Bogotá Sur y Occidente',
        destacado: 'Entrega e instalación de equipos para cocinas industriales.',
        tiempoRespuesta: '1–3 días hábiles',
        servicios: 'Asadores · Carros · Extracción',
        barrios: ['Kennedy', 'Bosa', 'Fontibón', 'Puente Aranda'],
      },
    ],
  },
  {
    slug: 'cundinamarca',
    nombre: 'Cundinamarca y sabana',
    descripcion: 'Municipios del área metropolitana y sabana con la misma modalidad que Bogotá.',
    modalidad: 'local',
    zonas: [
      {
        slug: 'sabana',
        nombre: 'Sabana de Bogotá',
        destacado: 'Cobertura en municipios del norte y occidente de Cundinamarca.',
        tiempoRespuesta: '2–4 días hábiles',
        servicios: 'Envío · Montaje · Soporte',
        barrios: ['Chía', 'Cajicá', 'Zipaquirá', 'Facatativá'],
      },
      {
        slug: 'soacha-madrid',
        nombre: 'Soacha y Madrid',
        destacado: 'Despacho de hornos, estufas y maquinaria para negocios gastronómicos.',
        tiempoRespuesta: '2–3 días hábiles',
        servicios: 'Hornos · Estufas · Vitrinas',
        barrios: ['Soacha', 'Madrid', 'Funza', 'Mosquera'],
      },
    ],
  },
  {
    slug: 'antioquia',
    nombre: 'Antioquia',
    descripcion: 'Envío nacional desde Bogotá. El despacho se programa una vez confirmado el pago.',
    modalidad: 'nacional',
    zonas: [
      {
        slug: 'medellin',
        nombre: 'Medellín y Área Metropolitana',
        destacado: 'Coordinamos flete, montaje y puesta en marcha en el valle de Aburrá.',
        tiempoRespuesta: '3–7 días hábiles tras pago',
        servicios: 'Envío · Instalación · Asesoría',
        barrios: ['El Poblado', 'Bello', 'Itagüí', 'Envigado'],
      },
    ],
  },
  {
    slug: 'valle',
    nombre: 'Valle del Cauca',
    descripcion: 'Llegamos al Pacífico con logística nacional. Pago anticipado antes del envío.',
    modalidad: 'nacional',
    zonas: [
      {
        slug: 'cali',
        nombre: 'Cali y Valle del Cauca',
        destacado: 'Equipos industriales para panaderías, restaurantes y rotiserías.',
        tiempoRespuesta: '4–8 días hábiles tras pago',
        servicios: 'Hornos · Asadores · Maquinaria',
        barrios: ['Centro', 'Norte', 'Sur', 'Palmira'],
      },
    ],
  },
  {
    slug: 'costa',
    nombre: 'Costa Caribe',
    descripcion: 'Cobertura en ciudades principales de la costa atlántica con envío desde Bogotá.',
    modalidad: 'nacional',
    zonas: [
      {
        slug: 'barranquilla',
        nombre: 'Barranquilla y Costa Caribe',
        destacado: 'Hornos, estufas y vitrinas con flete coordinado a la región.',
        tiempoRespuesta: '5–10 días hábiles tras pago',
        servicios: 'Envío · Cotización · Soporte',
        barrios: ['Norte', 'Riomar', 'Soledad', 'Cartagena'],
      },
    ],
  },
  {
    slug: 'santander',
    nombre: 'Santander',
    descripcion: 'Maquinaria en acero inoxidable con envío al oriente del país.',
    modalidad: 'nacional',
    zonas: [
      {
        slug: 'bucaramanga',
        nombre: 'Bucaramanga y Área Metropolitana',
        destacado: 'Estufas, hornos y mesones con instalación según proyecto.',
        tiempoRespuesta: '4–8 días hábiles tras pago',
        servicios: 'Estufas · Hornos · Mesones',
        barrios: ['Cabecera', 'Floridablanca', 'Piedecuesta', 'Girón'],
      },
    ],
  },
  {
    slug: 'eje-cafetero',
    nombre: 'Eje Cafetero',
    descripcion: 'Soluciones para cocinas industriales en Pereira, Manizales y Armenia.',
    modalidad: 'nacional',
    zonas: [
      {
        slug: 'pereira',
        nombre: 'Pereira y Eje Cafetero',
        destacado: 'Vitrinas, maquinaria e instalación con envío desde nuestra planta.',
        tiempoRespuesta: '4–8 días hábiles tras pago',
        servicios: 'Vitrinas · Maquinaria · Instalación',
        barrios: ['Pereira', 'Manizales', 'Armenia', 'Dosquebradas'],
      },
    ],
  },
];

/** Lista plana de todas las zonas (compatibilidad). */
export const COVERAGE_ZONES: CoverageZone[] = COVERAGE_REGIONS.flatMap((r) => r.zonas);

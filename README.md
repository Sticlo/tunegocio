# TUNEGOCIO.COM — Angular SSR

Sitio web en Angular con Server-Side Rendering para TUNEGOCIO.COM.

## Requisitos

- Node.js 20+
- npm 10+

## Comandos

```bash
# Desarrollo con SSR
npm start

# Build de producción
npm run build

# Servir build de producción
npm run serve:ssr:tunegocio-web
```

## Estructura principal

```text
src/app/
├── core/
│   ├── constants/     # Navegación y categorías
│   ├── models/        # Tipos compartidos
│   └── services/      # SeoService
├── layout/
│   ├── header/        # Cabecera reutilizable
│   ├── footer/        # Pie de página reutilizable
│   └── main-layout/   # Layout con header + outlet + footer
└── pages/
    ├── home/
    ├── category/
    ├── product-detail/
    ├── instalacion/
    ├── contacto/
    ├── nosotros/
    └── not-found/
```

## Rutas

| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/hornos-industriales` | Categoría |
| `/asadores-de-pollos` | Categoría |
| `/estufas-industriales` | Categoría |
| `/vitrinas-industriales` | Categoría |
| `/mesones-acero-inoxidable` | Categoría |
| `/maquinaria` | Categoría |
| `/carros-de-comidas` | Categoría |
| `/instalacion-extraccion-industrial` | Instalación |
| `/productos/:slug` | Detalle de producto |
| `/contacto` | Contacto |
| `/nosotros` | Nosotros |

## Personalización rápida

- Menú y WhatsApp: `src/app/core/constants/navigation.ts`
- Categorías SEO: `src/app/core/constants/categories.ts`
- Estilos globales: `src/styles.scss`

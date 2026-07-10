import { Routes } from '@angular/router';
import { categoryExistsGuard, categoryResolver } from './core/guards/category-page.guard';
import { LEGACY_CATEGORY_SLUGS, LEGACY_EXACT_REDIRECTS } from './core/constants/legacy-redirects';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { CategoryComponent } from './pages/category/category.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { HomeComponent } from './pages/home/home.component';
import { InstalacionComponent } from './pages/instalacion/instalacion.component';
import { NosotrosComponent } from './pages/nosotros/nosotros.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { UbicacionesComponent } from './pages/ubicaciones/ubicaciones.component';
import { CotizadorComponent } from './pages/cotizador/cotizador.component';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';

const stripSlashes = (path: string): string => path.replace(/^\/+|\/+$/g, '');

const legacyExactRoutes: Routes = [
  ...new Set(Object.keys(LEGACY_EXACT_REDIRECTS)).values(),
].map((from) => ({
  path: stripSlashes(from),
  redirectTo: stripSlashes(LEGACY_EXACT_REDIRECTS[from]),
  pathMatch: 'full' as const,
}));

const legacyCategoryRoutes: Routes = Object.entries(LEGACY_CATEGORY_SLUGS).map(
  ([wpSlug, target]) => ({
    path: `product-category/${wpSlug}`,
    redirectTo: target,
    pathMatch: 'full' as const,
  }),
);

const categoryRoute = {
  path: ':categorySlug',
  component: CategoryComponent,
  resolve: { category: categoryResolver },
  canActivate: [categoryExistsGuard],
};

export const routes: Routes = [
  ...legacyExactRoutes,
  ...legacyCategoryRoutes,
  { path: 'product/:slug', redirectTo: 'productos/:slug' },
  { path: 'producto/:slug', redirectTo: 'productos/:slug' },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'instalacion-extraccion-industrial', component: InstalacionComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'cotizador', component: CotizadorComponent },
      { path: 'productos/:slug', component: ProductDetailComponent },
      { path: 'ubicaciones', component: UbicacionesComponent },
      { path: 'contacto', component: ContactoComponent },
      { path: 'pago-exitoso', component: PaymentSuccessComponent },
      { path: 'nosotros', component: NosotrosComponent },
      categoryRoute,
      { path: '**', component: NotFoundComponent },
    ],
  },
];

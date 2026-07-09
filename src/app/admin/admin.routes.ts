import { Routes } from '@angular/router';
import { adminAuthGuard, adminGuestGuard } from '../core/guards/admin-auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/admin-login.component').then((m) => m.AdminLoginComponent),
    canActivate: [adminGuestGuard],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'productos' },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/products/admin-products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./pages/products/admin-product-form.component').then(
            (m) => m.AdminProductFormComponent,
          ),
      },
      {
        path: 'productos/:id',
        loadComponent: () =>
          import('./pages/products/admin-product-form.component').then(
            (m) => m.AdminProductFormComponent,
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./pages/categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent,
          ),
      },
      {
        path: 'categorias/nueva',
        loadComponent: () =>
          import('./pages/categories/admin-category-form.component').then(
            (m) => m.AdminCategoryFormComponent,
          ),
      },
      {
        path: 'categorias/:id',
        loadComponent: () =>
          import('./pages/categories/admin-category-form.component').then(
            (m) => m.AdminCategoryFormComponent,
          ),
      },
    ],
  },
];

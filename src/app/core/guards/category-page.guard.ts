import { inject } from '@angular/core';
import { CanActivateFn, ResolveFn, Router } from '@angular/router';
import { CategoryPageData } from '../models/nav-item.model';
import { CategoryCatalogService } from '../services/category-catalog.service';

export const categoryResolver: ResolveFn<CategoryPageData | null> = async (route) => {
  const catalog = inject(CategoryCatalogService);
  const slug = route.paramMap.get('categorySlug');
  if (!slug) return null;

  await catalog.whenReady();
  return catalog.getBySlug(slug) ?? null;
};

export const categoryExistsGuard: CanActivateFn = async (route) => {
  const catalog = inject(CategoryCatalogService);
  const router = inject(Router);
  const slug = route.paramMap.get('categorySlug');
  if (!slug) return router.parseUrl('/productos');

  await catalog.whenReady();
  return catalog.getBySlug(slug) ? true : router.parseUrl('/productos');
};

import { inject, RESPONSE_INIT } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CategoryPageData } from '../models/nav-item.model';
import { CategoryCatalogService } from '../services/category-catalog.service';

export const categoryResolver: ResolveFn<CategoryPageData | null> = async (route) => {
  const catalog = inject(CategoryCatalogService);
  const responseInit = inject(RESPONSE_INIT, { optional: true });
  const slug = route.paramMap.get('categorySlug');
  if (!slug) return null;

  await catalog.whenReady();
  const category = catalog.getBySlug(slug) ?? null;
  if (!category) {
    if (responseInit) {
      responseInit.status = 404;
      responseInit.statusText = 'Not Found';
    }
  }
  return category;
};

import { Component, inject, OnInit } from '@angular/core';
import { SITE_DESCRIPTION } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { CategoryCatalogService } from '../../core/services/category-catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { CategoryCardComponent } from '../../shared/category-card/category-card.component';

@Component({
  selector: 'app-productos',
  imports: [CategoryCardComponent, BreadcrumbComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly categoryCatalog = inject(CategoryCatalogService);

  protected readonly categories = this.categoryCatalog.categories;
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Categorías', path: '/productos' },
  ];

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Categorías de equipos industriales en Colombia',
      description:
        SITE_DESCRIPTION +
        '. Hornos, asadores, estufas, vitrinas, mesones y maquinaria en acero inoxidable con envío nacional.',
      keywords:
        'catálogo equipos industriales, hornos industriales Colombia, asadores pollos, estufas industriales Bogotá',
      canonicalPath: '/productos',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }
}

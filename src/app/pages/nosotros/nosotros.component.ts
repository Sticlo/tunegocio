import { Component, inject, OnInit } from '@angular/core';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-nosotros',
  imports: [BreadcrumbComponent],
  templateUrl: './nosotros.component.html',
  styleUrl: './nosotros.component.scss',
})
export class NosotrosComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Nosotros', path: '/nosotros' },
  ];

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Nosotros | Fabricantes de equipos industriales',
      description:
        'TUNEGOCIO.COM: fabricación de equipos industriales en acero inoxidable para panaderías y restaurantes en Colombia.',
      keywords: 'fabricantes equipos industriales Colombia, acero inoxidable panadería',
      canonicalPath: '/nosotros',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }
}

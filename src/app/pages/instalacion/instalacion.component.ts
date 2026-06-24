import { Component, inject, OnInit } from '@angular/core';
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-instalacion',
  imports: [BreadcrumbComponent],
  templateUrl: './instalacion.component.html',
  styleUrl: './instalacion.component.scss',
})
export class InstalacionComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Instalación industrial', path: '/instalacion-extraccion-industrial' },
  ];

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Instalación de ductos y extracción industrial en Bogotá',
      description:
        'Diseño e instalación de campanas extractoras, ductos y sistemas de extracción para cocinas industriales en Colombia.',
      keywords: 'instalación extractores industriales, ductos cocina industrial, campanas acero inoxidable Bogotá',
      canonicalPath: '/instalacion-extraccion-industrial',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }
}

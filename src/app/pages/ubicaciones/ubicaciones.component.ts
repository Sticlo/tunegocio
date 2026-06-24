import { Component, inject, OnInit } from '@angular/core';
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-ubicaciones',
  imports: [BreadcrumbComponent],
  templateUrl: './ubicaciones.component.html',
  styleUrl: './ubicaciones.component.scss',
})
export class UbicacionesComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Ubicaciones', path: '/ubicaciones' },
  ];

  protected readonly locations = [
    {
      city: 'Bogotá',
      detail: 'Fabricación, venta e instalación de equipos industriales.',
      coverage: 'Cundinamarca y municipios aledaños',
    },
    {
      city: 'Envíos nacionales',
      detail: 'Despachamos equipos a principales ciudades de Colombia.',
      coverage: 'Coordinación de flete según volumen y destino',
    },
    {
      city: 'Instalación en sitio',
      detail: 'Servicio de montaje para extractores, ductos y equipos.',
      coverage: 'Según disponibilidad y tipo de proyecto',
    },
  ];

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Ubicaciones y cobertura en Colombia',
      description:
        'TUNEGOCIO.COM en Bogotá. Envíos nacionales e instalación de equipos industriales para panaderías y restaurantes.',
      keywords: 'equipos industriales Bogotá, envío nacional maquinaria, instalación industrial Colombia',
      canonicalPath: '/ubicaciones',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }
}

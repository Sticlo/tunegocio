import { Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  PHONE_NUMBER,
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '../../core/constants/navigation';
import {
  COVERAGE_REGIONS,
  COVERAGE_ZONES,
  CoverageModality,
  CoverageRegion,
  CoverageZone,
} from '../../core/constants/coverage-zones';
import { GOOGLE_REVIEWS_SUMMARY } from '../../core/constants/reviews';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { BUSINESS_INFO } from '../../core/constants/site';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-ubicaciones',
  imports: [BreadcrumbComponent, RouterLink],
  templateUrl: './ubicaciones.component.html',
  styleUrl: './ubicaciones.component.scss',
})
export class UbicacionesComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);

  protected hoveredSlug: string | null = null;
  protected readonly regiones = COVERAGE_REGIONS;
  protected readonly coverageStats = {
    regiones: COVERAGE_REGIONS.length,
    locales: COVERAGE_REGIONS.filter((r) => r.modalidad === 'local').length,
    nacionales: COVERAGE_REGIONS.filter((r) => r.modalidad === 'nacional').length,
    zonas: COVERAGE_ZONES.length,
  };
  protected readonly googleReviews = GOOGLE_REVIEWS_SUMMARY;
  protected readonly mapEmbedUrl: SafeResourceUrl;

  protected readonly contact = {
    phoneFormatted: `+${PHONE_NUMBER}`,
    phoneDisplay: formatPhoneDisplay(PHONE_NUMBER),
  };

  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Ubicaciones', path: '/ubicaciones' },
  ];

  constructor() {
    const url = `https://maps.google.com/maps?q=${BUSINESS_INFO.latitude},${BUSINESS_INFO.longitude}&hl=es&z=14&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Ubicaciones y cobertura en Colombia',
      description:
        'TUNEGOCIO.COM: sede en Bogotá con entrega local e instalación. Envío nacional a Antioquia, Valle, Costa, Santander y Eje Cafetero con pago confirmado antes del despacho.',
      keywords:
        'equipos industriales Bogotá, envío nacional maquinaria, instalación industrial Colombia, hornos industriales Medellín Cali',
      canonicalPath: '/ubicaciones',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }

  zoneWhatsappUrl(zona: CoverageZone, region: CoverageRegion): string {
    const modalidad =
      region.modalidad === 'nacional'
        ? ' Entiendo que el envío nacional requiere pago confirmado antes del despacho.'
        : '';
    const text = `Hola, me interesa cotizar equipos industriales para ${zona.nombre} (${region.nombre}).${modalidad} ${WHATSAPP_MESSAGE}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  modalityLabel(modalidad: CoverageModality): string {
    return modalidad === 'local' ? 'Entrega en Bogotá' : 'Envío nacional';
  }

  setHovered(slug: string | null): void {
    this.hoveredSlug = slug;
  }
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

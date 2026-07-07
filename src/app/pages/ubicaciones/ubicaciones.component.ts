import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { BUSINESS_INFO } from '../../core/constants/site';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-ubicaciones',
  imports: [BreadcrumbComponent, RouterLink],
  templateUrl: './ubicaciones.component.html',
  styleUrl: './ubicaciones.component.scss',
})
export class UbicacionesComponent implements OnInit, OnDestroy {
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);
  private heroAutoplayId?: ReturnType<typeof setInterval>;

  protected hoveredSlug: string | null = null;
  protected activeHeroSlide = 0;
  protected readonly regiones = COVERAGE_REGIONS;
  protected readonly coverageStats = {
    regiones: COVERAGE_REGIONS.length,
    locales: COVERAGE_REGIONS.filter((r) => r.modalidad === 'local').length,
    nacionales: COVERAGE_REGIONS.filter((r) => r.modalidad === 'nacional').length,
    zonas: COVERAGE_ZONES.length,
  };
  protected readonly mapEmbedUrl: SafeResourceUrl;

  protected readonly heroSlides = [
    {
      src: '/assets/banners/banner-01-equipamiento-profesional.png',
      alt: 'TUNEGOCIO equipamiento profesional — tu solución integral de cocina',
    },
    {
      src: '/assets/banners/banner-02-maquinaria.jpeg',
      alt: 'TUNEGOCIO maquinaria industrial en acero inoxidable',
    },
    {
      src: '/assets/banners/banner-03-asadores.png',
      alt: 'Asadores de pollos industriales TUNEGOCIO en acero inoxidable',
    },
  ];

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

    this.heroAutoplayId = setInterval(() => this.nextHeroSlide(), 5500);
  }

  ngOnDestroy(): void {
    if (this.heroAutoplayId) {
      clearInterval(this.heroAutoplayId);
    }
  }

  protected goToHeroSlide(index: number): void {
    this.activeHeroSlide = index;
  }

  protected prevHeroSlide(): void {
    this.activeHeroSlide =
      (this.activeHeroSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
  }

  protected nextHeroSlide(): void {
    this.activeHeroSlide = (this.activeHeroSlide + 1) % this.heroSlides.length;
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

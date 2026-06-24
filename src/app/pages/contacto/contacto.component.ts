import { Component, inject, OnInit } from '@angular/core';
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-contacto',
  imports: [BreadcrumbComponent],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.scss',
})
export class ContactoComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Contacto', path: '/contacto' },
  ];

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Contacto y cotizaciones de equipos industriales',
      description:
        'Cotiza hornos, asadores, estufas y maquinaria industrial en Bogotá. WhatsApp, correo y asesoría técnica.',
      keywords: 'contacto equipos industriales, cotización hornos Bogotá, WhatsApp maquinaria',
      canonicalPath: '/contacto',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }
}

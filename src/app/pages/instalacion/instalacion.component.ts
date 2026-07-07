import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WHATSAPP_NUMBER } from '../../core/constants/navigation';
import { BreadcrumbItem } from '../../core/models/breadcrumb.model';
import { buildBreadcrumbJsonLd, combineJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

interface InstalacionPillar {
  icon: 'quote' | 'shield' | 'team';
  title: string;
  description: string;
}

interface InstalacionPricingCard {
  tag: string;
  title: string;
  description: string;
  points: string[];
  variant: 'equipment' | 'shipping' | 'install';
}

interface InstalacionStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-instalacion',
  imports: [BreadcrumbComponent, RouterLink],
  templateUrl: './instalacion.component.html',
  styleUrl: './instalacion.component.scss',
})
export class InstalacionComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly heroImage =
    'assets/categorias/ASADORES DE POLLOS - TUNEGOCIO.COM/imgi_69_IMG-20251019-WA0035.jpg';
  protected readonly galleryImage = 'assets/categorias/equipamiento-profesional.png';

  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hola, me interesa cotizar maquinaria industrial con envío e instalación. Quisiera conocer el valor total para mi negocio.',
  )}`;

  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Instalación industrial', path: '/instalacion-extraccion-industrial' },
  ];

  protected readonly pillars: InstalacionPillar[] = [
    {
      icon: 'quote',
      title: 'Cotización clara',
      description: 'Equipo, envío e instalación por separado. Sin letra pequeña.',
    },
    {
      icon: 'shield',
      title: 'Operación segura',
      description: 'Montaje que cumple normas de bioseguridad y reduce riesgos en tu cocina.',
    },
    {
      icon: 'team',
      title: 'Equipo propio',
      description: 'Diseño, montaje y puesta en marcha con técnicos especializados.',
    },
  ];

  protected readonly pricingCards: InstalacionPricingCard[] = [
    {
      tag: 'En el catálogo',
      title: 'Precio del equipo',
      description:
        'El valor publicado corresponde al producto: horno, estufa, asador, vitrina o maquinaria. Incluye garantía de fábrica y asesoría para elegir el modelo correcto.',
      points: [
        'Precio visible en la ficha del producto',
        'Opciones de financiación disponibles',
        'Asesoría antes de comprar',
      ],
      variant: 'equipment',
    },
    {
      tag: 'Bogotá y alrededores',
      title: 'Envío según tu zona',
      description:
        'El flete no viene incluido en el precio del equipo. En Bogotá y la sabana el costo varía según la localidad, el acceso y el tamaño del equipo.',
      points: [
        'Cotizamos el envío antes de confirmar',
        'Tarifa según zona y tipo de máquina',
        'Coordinamos fecha y horario de entrega',
      ],
      variant: 'shipping',
    },
    {
      tag: 'Servicio profesional',
      title: 'Instalación a tu medida',
      description:
        'La instalación es un servicio que cotizamos aparte. Depende del producto, las conexiones (gas, electricidad, extracción) y las condiciones de tu local.',
      points: [
        'Por eso algunos equipos dicen "Cotizar precio"',
        'Visita técnica para evaluar el espacio',
        'Montaje, pruebas y entrega operativa',
      ],
      variant: 'install',
    },
  ];

  protected readonly steps: InstalacionStep[] = [
    {
      number: '01',
      title: 'Conocemos tu espacio',
      description: 'Visita técnica para medir, revisar conexiones y entender cómo operas.',
    },
    {
      number: '02',
      title: 'Propuesta sin sorpresas',
      description: 'Te enviamos el desglose: equipo, envío a tu zona e instalación.',
    },
    {
      number: '03',
      title: 'Montaje profesional',
      description: 'Instalamos tu equipo, conectamos servicios y dejamos todo probado.',
    },
    {
      number: '04',
      title: 'Arrancas a producir',
      description: 'Verificamos funcionamiento y te orientamos en el primer uso.',
    },
  ];

  protected readonly equipmentCategories = [
    'Hornos industriales',
    'Estufas y asadores',
    'Vitrinas y mesones',
    'Maquinaria de panadería',
    'Carros de comidas',
    'Sistemas de extracción',
  ];

  protected readonly services = [
    'Montaje y nivelación de equipos pesados',
    'Conexión de gas, electricidad y agua',
    'Campanas, ductos y sistemas de extracción',
    'Puesta en marcha y pruebas de funcionamiento',
    'Capacitación básica para tu equipo de trabajo',
    'Mantenimiento preventivo',
  ];

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Instalación de maquinaria industrial en Bogotá',
      description:
        'Instalación profesional de hornos, estufas, asadores, vitrinas y maquinaria industrial. Cotizamos equipo, envío por zona e instalación según tu proyecto.',
      keywords:
        'instalación maquinaria industrial, instalación hornos estufas Bogotá, montaje equipos cocina, costo instalación maquinaria Colombia',
      canonicalPath: '/instalacion-extraccion-industrial',
      jsonLd: combineJsonLd(buildBreadcrumbJsonLd(this.breadcrumbs)),
    });
  }
}

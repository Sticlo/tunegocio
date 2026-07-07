import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORY_LIST } from '../../core/constants/categories';
import { FEATURED_PRODUCTS } from '../../core/constants/featured-products';
import {
  SITE_NAME,
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '../../core/constants/navigation';
import { CategoryPageData } from '../../core/models/nav-item.model';
import { buildHomeJsonLd } from '../../core/constants/seo-schemas';
import { SeoService } from '../../core/services/seo.service';
import { ValuePropositionComponent } from '../../shared/value-proposition/value-proposition.component';
import { ReviewsSectionComponent } from '../../shared/reviews-section/reviews-section.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReviewsSectionComponent, ValuePropositionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly seo = inject(SeoService);
  private heroAutoplayId?: ReturnType<typeof setInterval>;

  @ViewChild('modelsTrack') private modelsTrack?: ElementRef<HTMLDivElement>;

  protected readonly categories = CATEGORY_LIST;
  protected readonly featuredProducts = FEATURED_PRODUCTS;
  protected readonly siteName = SITE_NAME;
  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  protected activeHeroSlide = 0;
  protected canScrollModelsPrev = false;
  protected canScrollModelsNext = true;

  protected readonly instalacionImage =
    'assets/categorias/ASADORES DE POLLOS - TUNEGOCIO.COM/imgi_69_IMG-20251019-WA0035.jpg';

  protected readonly heroSlides = [
    {
      src: 'assets/hero-banner.png',
      alt: 'TUNEGOCIO equipamiento profesional de cocina industrial en acero inoxidable',
    },
    {
      src: 'assets/categorias/equipamiento-profesional.png',
      alt: 'TUNEGOCIO equipamiento profesional — maquinaria industrial en acero inoxidable',
    },
    {
      src: 'assets/categorias/maquinariaespecial.png',
      alt: 'Maquinaria industrial especializada TUNEGOCIO en acero inoxidable',
    },
  ];

  protected assetUrl(path: string): string {
    return encodeURI(path);
  }

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Equipos industriales Bogotá | Hornos, asadores y maquinaria',
      description:
        'Fabricamos hornos, asadores, estufas y vitrinas en acero inoxidable. Envío nacional, instalación y cotización por WhatsApp. Bogotá, Colombia.',
      keywords:
        'equipos industriales Bogotá, hornos industriales Colombia, asadores de pollos, estufas industriales, vitrinas industriales, maquinaria panadería, acero inoxidable',
      canonicalPath: '/',
      jsonLd: buildHomeJsonLd(),
    });

    this.heroAutoplayId = setInterval(() => this.nextHeroSlide(), 5500);
  }

  ngOnDestroy(): void {
    if (this.heroAutoplayId) {
      clearInterval(this.heroAutoplayId);
    }
  }

  ngAfterViewInit(): void {
    this.updateModelsScrollState();
  }

  protected onModelsScroll(): void {
    this.updateModelsScrollState();
  }

  protected scrollModels(direction: 'prev' | 'next'): void {
    const track = this.modelsTrack?.nativeElement;
    if (!track) {
      return;
    }

    const firstCard = track.querySelector<HTMLElement>('.model-card');
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16');
    const amount = (firstCard?.offsetWidth ?? track.clientWidth * 0.85) + gap;

    track.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  }

  private updateModelsScrollState(): void {
    const track = this.modelsTrack?.nativeElement;
    if (!track) {
      return;
    }

    const maxScroll = track.scrollWidth - track.clientWidth;
    this.canScrollModelsPrev = track.scrollLeft > 4;
    this.canScrollModelsNext = track.scrollLeft < maxScroll - 4;
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

  protected categoryWhatsappUrl(category: CategoryPageData): string {
    const text = `Hola, me interesa cotizar ${category.heading}. ${WHATSAPP_MESSAGE}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }
}

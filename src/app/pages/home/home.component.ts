import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORY_LIST } from '../../core/constants/categories';
import { FEATURED_PRODUCTS } from '../../core/constants/featured-products';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '../../core/constants/navigation';
import { buildHomeJsonLd } from '../../core/constants/seo-schemas';
import { GOOGLE_REVIEWS_SUMMARY } from '../../core/constants/reviews';
import { SeoService } from '../../core/services/seo.service';
import { ValuePropositionComponent } from '../../shared/value-proposition/value-proposition.component';
import { ReviewsSectionComponent } from '../../shared/reviews-section/reviews-section.component';
import { CategoryCardComponent } from '../../shared/category-card/category-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReviewsSectionComponent, CategoryCardComponent, ValuePropositionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly categories = CATEGORY_LIST;
  protected readonly featuredProducts = FEATURED_PRODUCTS;
  protected readonly reviewSummary = GOOGLE_REVIEWS_SUMMARY;
  protected readonly siteName = SITE_NAME;
  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

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
  }
}

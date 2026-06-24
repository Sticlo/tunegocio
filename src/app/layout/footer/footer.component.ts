import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FOOTER_NAV,
  PRIMARY_NAV,
  SITE_NAME,
  SITE_TAGLINE,
  SOCIAL_LINKS,
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '../../core/constants/navigation';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly siteName = SITE_NAME;
  protected readonly siteTagline = SITE_TAGLINE;
  protected readonly footerNav = FOOTER_NAV;
  protected readonly categoryNav = PRIMARY_NAV;
  protected readonly socialLinks = SOCIAL_LINKS;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE_NAME } from '../constants/navigation';
import { SITE_OG_IMAGE, SITE_URL } from '../constants/site';

export interface PageMetaOptions {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly jsonLdScriptId = 'app-json-ld';

  updatePageMeta(options: PageMetaOptions): void {
    const fullTitle = `${options.title} | ${SITE_NAME}`;
    const canonicalUrl = this.buildCanonicalUrl(options.canonicalPath ?? '/');
    const ogImage = options.ogImage ?? SITE_OG_IMAGE;
    const ogType = options.ogType ?? 'website';

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: options.description });

    if (options.keywords) {
      this.meta.updateTag({ name: 'keywords', content: options.keywords });
    } else {
      this.meta.removeTag('name="keywords"');
    }

    this.meta.updateTag({
      name: 'robots',
      content: options.noIndex ? 'noindex, nofollow' : 'index, follow',
    });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: options.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CO' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: options.description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    this.setCanonical(canonicalUrl);

    if (options.jsonLd) {
      this.setJsonLd(options.jsonLd);
    } else {
      this.removeJsonLd();
    }
  }

  private buildCanonicalUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized === '/') {
      return SITE_URL;
    }
    return `${SITE_URL}${normalized}`;
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): void {
    this.removeJsonLd();

    const script = this.document.createElement('script');
    script.id = this.jsonLdScriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    this.document.getElementById(this.jsonLdScriptId)?.remove();
  }
}

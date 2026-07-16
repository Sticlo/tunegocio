import { Component, inject, OnInit, REQUEST, RESPONSE_INIT } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  ngOnInit(): void {
    if (this.responseInit) {
      this.responseInit.status = 404;
      this.responseInit.statusText = 'Not Found';
    }

    const canonicalPath = this.request
      ? new URL(this.request.url).pathname
      : this.router.url.split(/[?#]/)[0] || '/';
    this.seo.updatePageMeta({
      title: 'Página no encontrada',
      description: 'La página que buscas no existe o fue movida.',
      canonicalPath,
      noIndex: true,
    });
  }
}

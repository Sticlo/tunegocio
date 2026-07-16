import { Component, computed, input } from '@angular/core';
import {
  productDescriptionMeterMessage,
  productDescriptionMeterStatus,
  SeoMeterStatus,
  seoMeterMessage,
  seoMeterStatus,
} from '../../core/constants/seo-limits';

@Component({
  selector: 'app-seo-field-meter',
  template: `
    <div class="seo-meter" [class]="'seo-meter--' + status()">
      <div class="seo-meter__bar" aria-hidden="true">
        <span class="seo-meter__fill" [style.width.%]="fillPercent()"></span>
      </div>
      <p class="seo-meter__count">
        @if (unit() === 'words') {
          {{ length() }} de {{ max() }} palabras
        } @else {
          {{ length() }} de {{ max() }} letras
        }
      </p>
      <p class="seo-meter__hint">{{ message() }}</p>
    </div>
  `,
  styleUrl: './seo-field-meter.component.scss',
})
export class SeoFieldMeterComponent {
  readonly length = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly unit = input<'letters' | 'words'>('letters');

  protected readonly status = computed<SeoMeterStatus>(() =>
    this.unit() === 'words'
      ? productDescriptionMeterStatus(this.length())
      : seoMeterStatus(this.length(), this.min(), this.max()),
  );

  protected readonly message = computed(() =>
    this.unit() === 'words'
      ? productDescriptionMeterMessage(this.status())
      : seoMeterMessage(this.status(), this.min(), this.max()),
  );

  protected readonly fillPercent = computed(() =>
    Math.min(100, Math.round((this.length() / this.max()) * 100)),
  );
}

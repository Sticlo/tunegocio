import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryPageData } from '../../core/models/nav-item.model';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
})
export class CategoryCardComponent {
  readonly category = input.required<CategoryPageData>();
  readonly animationDelay = input('0ms');
  readonly variant = input<'compact' | 'showcase'>('compact');

  protected imageError = false;

  onImageError(): void {
    this.imageError = true;
  }
}

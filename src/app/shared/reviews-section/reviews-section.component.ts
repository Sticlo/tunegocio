import { Component } from '@angular/core';
import {
  GOOGLE_MAPS_URL,
  GOOGLE_REVIEWS,
  GOOGLE_REVIEWS_SUMMARY,
  GoogleReview,
} from '../../core/constants/reviews';

@Component({
  selector: 'app-reviews-section',
  templateUrl: './reviews-section.component.html',
  styleUrl: './reviews-section.component.scss',
})
export class ReviewsSectionComponent {
  protected readonly summary = GOOGLE_REVIEWS_SUMMARY;
  protected readonly carouselReviews = [...GOOGLE_REVIEWS, ...GOOGLE_REVIEWS];
  protected readonly googleMapsUrl = GOOGLE_MAPS_URL;
  protected readonly avatarErrors = new Set<string>();

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  trackReview(index: number, review: GoogleReview): string {
    return `${review.author}-${index}`;
  }

  onAvatarError(author: string): void {
    this.avatarErrors.add(author);
  }

  showAvatar(author: string): boolean {
    return !this.avatarErrors.has(author);
  }
}

import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ResourceDto, ResourceService } from '../../core/library/resource.service';
import { ReviewModalComponent } from '../../shared/review-modal/review-modal.component';

type ResourceType = 'Book' | 'PDF' | 'EBook' | 'MP3';
type PriceFilter = 'Free' | 'Paid';
type DeliveryFilter = 'Physical' | 'Online';
type Access = 'Public' | 'Restricted';
type Stock = 'In stock' | 'Out of stock';

type SortMode = 'Most Popular' | 'Newest' | 'Price: Low to High' | 'Price: High to Low' | 'Top Rated';

interface LibraryResource {
  id: string;
  resourceId: number;
  title: string;
  category: string;
  description: string;
  type: ResourceType;
  access: Access;
  delivery: DeliveryFilter;
  priceUsd: number;
  stock: Stock;
  durationOrPagesLabel: string;
  authorName: string;
  postedLabel: string;
  uploadDateLabel: string;
  uploadedAtMs: number;
  rating: number;
  reviews: number;
  coverSrc: string;
  fileUrl: string | null;
}

@Component({
  selector: 'app-library-page',
  imports: [FormsModule, NgOptimizedImage, ReviewModalComponent, RouterModule],
  templateUrl: './library.page.html',
  styleUrl: './library.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryPage {
  private readonly resourceService = inject(ResourceService);
  readonly resources = signal<LibraryResource[]>([]);

  readonly query = signal('');

  // Review Modal State
  readonly showReviewModal = signal(false);
  readonly selectedResourceId = signal<number | null>(null);
  readonly selectedResourceTitle = signal('');

  readonly draftTypes = signal<ResourceType[]>(['Book', 'PDF', 'EBook', 'MP3']);
  readonly draftPrices = signal<PriceFilter[]>(['Free', 'Paid']);
  readonly draftDelivery = signal<DeliveryFilter[]>(['Physical', 'Online']);

  readonly selectedTypes = signal<ResourceType[]>(['Book', 'PDF', 'EBook', 'MP3']);
  readonly selectedPrices = signal<PriceFilter[]>(['Free', 'Paid']);
  readonly selectedDelivery = signal<DeliveryFilter[]>(['Physical', 'Online']);

  readonly sortMode = signal<SortMode>('Most Popular');

  readonly page = signal(1);
  readonly pageSize = 6;

  readonly filteredResources = computed(() => {
    const q = this.query().trim().toLowerCase();
    const types = this.selectedTypes();
    const prices = this.selectedPrices();
    const delivery = this.selectedDelivery();

    const items = this.resources().filter((r) => {
      if (q && !`${r.title} ${r.category} ${r.description}`.toLowerCase().includes(q)) return false;
      if (types.length > 0 && !types.includes(r.type)) return false;
      const priceBucket: PriceFilter = r.priceUsd === 0 ? 'Free' : 'Paid';
      if (prices.length > 0 && !prices.includes(priceBucket)) return false;
      if (delivery.length > 0 && !delivery.includes(r.delivery)) return false;
      return true;
    });

    const sorted = [...items].sort((a, b) => {
      const mode = this.sortMode();
      if (mode === 'Price: Low to High') return a.priceUsd - b.priceUsd;
      if (mode === 'Price: High to Low') return b.priceUsd - a.priceUsd;
      if (mode === 'Top Rated') return b.rating - a.rating;
      if (mode === 'Newest') return b.uploadedAtMs - a.uploadedAtMs;
      return b.reviews - a.reviews;
    });

    return sorted;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredResources().length / this.pageSize)));

  readonly pagedResources = computed(() => {
    const page = Math.min(Math.max(1, this.page()), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredResources().slice(start, start + this.pageSize);
  });

  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  readonly types: ResourceType[] = ['Book', 'PDF', 'EBook', 'MP3'];
  readonly prices: PriceFilter[] = ['Free', 'Paid'];
  readonly deliveries: DeliveryFilter[] = ['Physical', 'Online'];
  readonly sorts: SortMode[] = ['Most Popular', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

  constructor() {
    this.resourceService
      .listResources()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (items) => this.resources.set(items.map((item) => this.mapResource(item))),
        error: () => this.resources.set([])
      });
  }

  toggleDraftType(t: ResourceType): void {
    this.draftTypes.update((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  toggleDraftPrice(p: PriceFilter): void {
    this.draftPrices.update((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  toggleDraftDelivery(d: DeliveryFilter): void {
    this.draftDelivery.update((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  applyFilters(): void {
    this.selectedTypes.set(this.draftTypes());
    this.selectedPrices.set(this.draftPrices());
    this.selectedDelivery.set(this.draftDelivery());
    this.page.set(1);
  }

  clearFilters(): void {
    this.draftTypes.set(['Book', 'PDF', 'EBook', 'MP3']);
    this.draftPrices.set(['Free', 'Paid']);
    this.draftDelivery.set(['Physical', 'Online']);
    this.applyFilters();
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }

  trackResourceId = (_: number, r: LibraryResource): string => r.id;

  openReviewModal(resource: LibraryResource): void {
    this.selectedResourceId.set(resource.resourceId);
    this.selectedResourceTitle.set(resource.title);
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.selectedResourceId.set(null);
    this.selectedResourceTitle.set('');
  }

  starsLabel(rating: number): string {
    const rounded = Math.round(rating * 10) / 10;
    return `${rounded} out of 5`;
  }

  primaryActionLabel(r: LibraryResource): string {
    if (r.priceUsd === 0) return 'Download';
    if (r.stock === 'Out of stock') return 'Notify Me';
    return 'Buy Now';
  }

  secondaryActionLabel(r: LibraryResource): string {
    if (r.delivery === 'Online') return r.priceUsd === 0 ? 'View Online' : 'View Online';
    return r.priceUsd === 0 ? 'Download' : 'Buy Now';
  }

  private mapResource(item: ResourceDto): LibraryResource {
    const uploadedAtMs = item.uploadDate ? Date.parse(item.uploadDate) : 0;
    return {
      id: `res-${item.resourceId}`,
      resourceId: item.resourceId,
      title: item.title,
      category: item.type,
      description: item.description,
      type: this.normalizeType(item.type),
      access: 'Public',
      delivery: 'Online',
      priceUsd: 0,
      stock: 'In stock',
      durationOrPagesLabel: 'N/A',
      authorName: 'Library',
      postedLabel: this.formatPostedLabel(uploadedAtMs),
      uploadDateLabel: this.formatUploadDateLabel(uploadedAtMs),
      uploadedAtMs,
      rating: 4.5,
      reviews: 0,
      coverSrc: '/englishimg2.png',
      fileUrl: item.fileUrl
    };
  }

  private normalizeType(raw: string): ResourceType {
    const upper = raw.toUpperCase();
    if (upper === 'BOOK') return 'Book';
    if (upper === 'EBOOK') return 'EBook';
    if (upper === 'MP3') return 'MP3';
    return 'PDF';
  }

  private formatPostedLabel(uploadedAtMs: number): string {
    if (!uploadedAtMs) return 'Just now';
    const diffMs = Date.now() - uploadedAtMs;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${Math.max(1, diffHours)} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} months ago`;
  }

  private formatUploadDateLabel(uploadedAtMs: number): string {
    if (!uploadedAtMs || Number.isNaN(uploadedAtMs)) return 'Unknown';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(uploadedAtMs));
  }
}

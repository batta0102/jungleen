import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DataService } from '../../core/data/data.service';
import { TrainingModel } from '../../core/data/models';
import { EnrollmentMode, UserContextService } from '../../core/user/user-context.service';
import { downloadTextFile } from '../../shared/utils/download';

type LevelFilter = 'Beginner' | 'Intermediate' | 'Advanced';
type CategoryFilter = 'General English' | 'Business English' | 'Exam Preparation' | 'Conversation';
type FormatFilter = 'Online' | 'On-site';
type PriceFilter = 'Under 600 TND' | '600–799 TND' | '800+ TND';

type SortMode = 'Popular' | 'Newest' | 'Price (Low)' | 'Price (High)' | 'A–Z';

const LEVELS: LevelFilter[] = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES: CategoryFilter[] = ['General English', 'Business English', 'Exam Preparation', 'Conversation'];
const FORMATS: FormatFilter[] = ['Online', 'On-site'];
const PRICES: PriceFilter[] = ['Under 600 TND', '600–799 TND', '800+ TND'];
const SORTS: SortMode[] = ['Popular', 'Newest', 'Price (Low)', 'Price (High)', 'A–Z'];

@Component({
  selector: 'app-trainings-page',
  imports: [RouterLink, NgOptimizedImage, FormsModule],
  templateUrl: './trainings.page.html',
  styleUrl: './trainings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingsPage {
  private readonly data = inject(DataService);
  private readonly user = inject(UserContextService);

  readonly trainings = this.data.trainings;
  readonly participation = this.user.participation;
  readonly enrollmentModes = this.user.trainingEnrollmentModes;
  readonly role = this.user.role;

  readonly levels = LEVELS;
  readonly categories = CATEGORIES;
  readonly formats = FORMATS;
  readonly prices = PRICES;
  readonly sorts = SORTS;

  readonly query = signal('');
  readonly sortMode = signal<SortMode>('Popular');

  readonly draftLevels = signal<LevelFilter[]>([]);
  readonly draftCategories = signal<CategoryFilter[]>([]);
  readonly draftFormats = signal<FormatFilter[]>([]);
  readonly draftPrices = signal<PriceFilter[]>([]);

  readonly selectedLevels = signal<LevelFilter[]>([]);
  readonly selectedCategories = signal<CategoryFilter[]>([]);
  readonly selectedFormats = signal<FormatFilter[]>([]);
  readonly selectedPrices = signal<PriceFilter[]>([]);

  readonly page = signal(1);
  readonly pageSize = 6;

  readonly certificateViewId = signal<string | null>(null);

  readonly earnedCertificates = computed(() => {
    // Use enrolled trainings as the basis for “earned certificates”.
    const enrolled = this.participation().enrolledTrainingIds;

    const certs = this.trainings()
      .filter((t) => enrolled.includes(t.id))
      .map((t) => {
        const progress = this.getProgress(t);
        return { training: t, progress };
      })
      .filter((row) => row.progress.total > 0 && row.progress.percent >= 100)
      .sort((a, b) => a.training.name.localeCompare(b.training.name));

    return certs;
  });

  readonly filteredTrainings = computed(() => {
    const q = this.query().trim().toLowerCase();
    const levels = this.selectedLevels();
    const categories = this.selectedCategories();
    const formats = this.selectedFormats();
    const prices = this.selectedPrices();
    const sortMode = this.sortMode();

    const rows = this.trainings().map((t) => {
      const level = this.getLevel(t);
      const category = this.getCategory(t);
      const pricesTnd = this.getPricesTnd(t);
      const bannerSrc = this.courseBannerSrc(t.id);
      const rating = this.getRating(t);
      const reviews = this.getReviewsCount(t);
      const createdSeed = this.seedNumber(t.id, 0, 1000);
      return {
        training: t,
        level,
        category,
        prices: pricesTnd,
        bannerSrc,
        rating,
        reviews,
        createdSeed
      };
    });

    const filtered = rows.filter((row) => {
      if (q && !row.training.name.toLowerCase().includes(q)) return false;
      if (levels.length > 0 && !levels.includes(row.level)) return false;
      if (categories.length > 0 && !categories.includes(row.category)) return false;

      if (formats.length > 0) {
        // All courses support both modes; treat this as a preference filter.
        // If only one format is selected, keep rows but we'll highlight the matching price in UI.
        // So we don't filter out anything here.
      }

      if (prices.length > 0) {
        const minPrice = Math.min(row.prices.online, row.prices.onsite);
        const match = prices.some((p) => {
          if (p === 'Under 600 TND') return minPrice < 600;
          if (p === '600–799 TND') return minPrice >= 600 && minPrice < 800;
          return minPrice >= 800;
        });
        if (!match) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === 'A–Z') return a.training.name.localeCompare(b.training.name);
      if (sortMode === 'Price (Low)') return Math.min(a.prices.online, a.prices.onsite) - Math.min(b.prices.online, b.prices.onsite);
      if (sortMode === 'Price (High)') return Math.min(b.prices.online, b.prices.onsite) - Math.min(a.prices.online, a.prices.onsite);
      if (sortMode === 'Newest') return b.createdSeed - a.createdSeed;
      return b.rating - a.rating;
    });

    return sorted;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredTrainings().length / this.pageSize)));

  readonly pagedTrainings = computed(() => {
    const page = Math.min(Math.max(1, this.page()), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredTrainings().slice(start, start + this.pageSize);
  });

  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  applyFilters(): void {
    this.selectedLevels.set(this.draftLevels());
    this.selectedCategories.set(this.draftCategories());
    this.selectedFormats.set(this.draftFormats());
    this.selectedPrices.set(this.draftPrices());
    this.page.set(1);
  }

  toggleDraftLevel(level: LevelFilter): void {
    this.draftLevels.update((prev) => (prev.includes(level) ? prev.filter((x) => x !== level) : [...prev, level]));
  }

  toggleDraftCategory(category: CategoryFilter): void {
    this.draftCategories.update((prev) =>
      prev.includes(category) ? prev.filter((x) => x !== category) : [...prev, category]
    );
  }

  toggleDraftFormat(format: FormatFilter): void {
    this.draftFormats.update((prev) => (prev.includes(format) ? prev.filter((x) => x !== format) : [...prev, format]));
  }

  toggleDraftPrice(price: PriceFilter): void {
    this.draftPrices.update((prev) => (prev.includes(price) ? prev.filter((x) => x !== price) : [...prev, price]));
  }

  clearAll(): void {
    this.query.set('');
    this.sortMode.set('Popular');
    this.draftLevels.set([]);
    this.draftCategories.set([]);
    this.draftFormats.set([]);
    this.draftPrices.set([]);
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

  enroll(trainingId: string, mode: EnrollmentMode): void {
    this.user.enrollTraining(trainingId, mode);
  }

  toggleCertificateView(trainingId: string): void {
    this.certificateViewId.set(this.certificateViewId() === trainingId ? null : trainingId);
  }

  certificateContent(trainingId: string): string {
    const t = this.data.getTrainingById(trainingId);
    if (!t) return '';
    const { percent } = this.getProgress(t);
    const date = new Date().toISOString().slice(0, 10);
    return `Jungle in English\n\nCertificate of Completion\n\nThis certifies that the learner has completed:\n${t.name}\n\nProgress: ${percent}%\n\nIssued on: ${date}\n`;
  }

  downloadCertificate(trainingId: string): void {
    const t = this.data.getTrainingById(trainingId);
    if (!t) return;
    const { percent } = this.getProgress(t);
    if (percent < 100) return;
    downloadTextFile(`certificate-${t.id}.txt`, this.certificateContent(t.id));
  }

  trackTrainingId = (_: number, row: { training: TrainingModel }): string => row.training.id;

  private getLevel(training: TrainingModel): LevelFilter {
    const raw = `${training.id} ${training.name}`.toLowerCase();
    if (raw.includes('a1') || raw.includes('a2')) return 'Beginner';
    if (raw.includes('b1') || raw.includes('b2')) return 'Intermediate';
    if (raw.includes('c1') || raw.includes('c2')) return 'Advanced';
    return 'Beginner';
  }

  private getCategory(training: TrainingModel): CategoryFilter {
    const raw = training.name.toLowerCase();
    if (raw.includes('business')) return 'Business English';
    if (raw.includes('ielts') || raw.includes('toeic') || raw.includes('exam')) return 'Exam Preparation';
    if (raw.includes('speaking') || raw.includes('conversation')) return 'Conversation';
    return 'General English';
  }

  private getPricesTnd(training: TrainingModel): { online: number; onsite: number } {
    const level = this.getLevel(training);
    const online = level === 'Beginner' ? 450 : level === 'Intermediate' ? 650 : 850;
    const onsite = online + 150;
    return { online, onsite };
  }

  private getRating(training: TrainingModel): number {
    const seed = training.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const rating = 4.1 + ((seed % 9) / 10);
    return Math.min(4.9, Math.max(4.1, Number(rating.toFixed(1))));
  }

  private getReviewsCount(training: TrainingModel): number {
    const seed = training.name.length * 37 + training.chapters.length * 13;
    return 120 + (seed % 420);
  }

  private seedNumber(seed: string, min: number, max: number): number {
    const n = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return min + (n % Math.max(1, max - min + 1));
  }

  private courseBannerSrc(trainingId: string): string {
    const images = ['/englishimg1.jpg', '/englishimg2.png', '/jungleabout.png'];
    const idx = this.seedNumber(trainingId, 0, images.length - 1);
    return images[idx];
  }

  private getProgress(training: TrainingModel): { completed: number; total: number; percent: number } {
    const total = training.chapters.reduce((acc, ch) => acc + ch.sections.length, 0);
    if (total === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = training.chapters.reduce(
      (acc, ch) => acc + ch.sections.filter((s) => this.data.isSectionComplete(training.id, ch.id, s.id)).length,
      0
    );
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  }
}

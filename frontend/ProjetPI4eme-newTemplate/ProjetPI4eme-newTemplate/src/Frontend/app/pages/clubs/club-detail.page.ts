import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { DataService } from '../../core/data/data.service';
import { UserContextService } from '../../core/user/user-context.service';

@Component({
  selector: 'app-club-detail-page',
  imports: [NgOptimizedImage],
  templateUrl: './club-detail.page.html',
  styleUrl: './club-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClubDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly user = inject(UserContextService);

  readonly clubId = toSignal(this.route.paramMap.pipe(map((p) => p.get('clubId') ?? '')),
    { initialValue: '' }
  );

  readonly club = computed(() => this.data.getClubById(this.clubId()));

  readonly joined = computed(() => this.user.participation().joinedClubIds.includes(this.clubId()));

  readonly imageIndex = signal(0);

  readonly images = computed(() => {
    const c = this.club();
    if (!c) return [] as string[];
    const base = ['/englishimg2.png', '/jungleabout.png', '/contactusjungle.png'];
    const seed = c.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const rotated = base.slice(seed % base.length).concat(base.slice(0, seed % base.length));
    return rotated;
  });

  readonly activeImage = computed(() => {
    const imgs = this.images();
    if (imgs.length === 0) return null;
    const idx = ((this.imageIndex() % imgs.length) + imgs.length) % imgs.length;
    return imgs[idx];
  });

  bookPlace(): void {
    const id = this.clubId();
    if (!id) return;
    this.user.joinClub(id);
  }

  prevImage(): void {
    const len = this.images().length;
    if (len <= 1) return;
    this.imageIndex.update((i) => (i - 1 + len) % len);
  }

  nextImage(): void {
    const len = this.images().length;
    if (len <= 1) return;
    this.imageIndex.update((i) => (i + 1) % len);
  }

  back(): void {
    void this.router.navigate(['/front/clubs']);
  }
}

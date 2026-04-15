import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';

import { AdmissionApiService, QcmDto, ResultatDto, SessionTestDto } from '../../core/services/admission-api.service';
import { AssessmentSyncService } from '../../core/services/assessment-sync.service';

@Component({
  selector: 'app-evaluations-page',
  imports: [CommonModule],
  templateUrl: './evaluations.page.html',
  styleUrl: './evaluations.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluationsPage {
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly assessmentSync = inject(AssessmentSyncService);
  private readonly destroyRef = inject(DestroyRef);

  readonly qcms = signal<QcmDto[]>([]);
  readonly sessions = signal<SessionTestDto[]>([]);
  readonly resultats = signal<ResultatDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionLoading = signal(false);
  readonly actionMessage = signal<string | null>(null);
  readonly showLatestResultDetails = signal(false);

  readonly latestResult = computed(() => {
    const all = this.resultats();
    if (all.length === 0) return null;
    return [...all].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
  });

  constructor() {
    this.assessmentSync.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadEvaluationData());

    this.loadEvaluationData();
  }

  private loadEvaluationData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      qcms: this.admissionApi.getQcms().pipe(
        catchError((error) => {
          console.error('Failed to load QCMs', error);
          return of([] as QcmDto[]);
        })
      ),
      sessions: this.admissionApi.getSessionTests().pipe(
        catchError((error) => {
          console.error('Failed to load session tests', error);
          return of([] as SessionTestDto[]);
        })
      ),
      resultats: this.admissionApi.getResultats().pipe(
        catchError((error) => {
          console.error('Failed to load results', error);
          return of([] as ResultatDto[]);
        })
      )
    }).subscribe({
      next: ({ qcms, sessions, resultats }) => {
        this.qcms.set(qcms ?? []);
        this.sessions.set(sessions ?? []);
        this.resultats.set(resultats ?? []);
        if ((resultats ?? []).length === 0) {
          this.showLatestResultDetails.set(false);
        }
        if ((qcms?.length ?? 0) === 0) {
          this.error.set('No evaluations were returned from backend.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load evaluations from backend.');
        this.loading.set(false);
      }
    });
  }

  startPlacementTest(): void {
    const qcm = this.qcms()[0];
    if (!qcm) {
      this.actionMessage.set('No placement quiz available yet.');
      return;
    }

    this.actionLoading.set(true);
    this.actionMessage.set(null);

    const now = new Date();
    const inThirtyMinutes = new Date(now.getTime() + 30 * 60 * 1000);

    this.admissionApi
      .createSessionTest({
        dateDebut: now.toISOString(),
        dateFin: inThirtyMinutes.toISOString(),
        statut: 'EN_COURS',
        scoreTotal: 0,
        pourcentage: 0,
        tempsPasseSecondes: 0,
        qcm: { id: qcm.id }
      })
      .subscribe({
        next: (session) => {
          this.sessions.update((prev) => [session, ...prev]);
          this.actionMessage.set(`Placement session #${session.id} started.`);
          this.actionLoading.set(false);
        },
        error: () => {
          this.actionMessage.set('Could not start placement test.');
          this.actionLoading.set(false);
        }
      });
  }

  toggleLatestResultDetails(): void {
    this.showLatestResultDetails.update((prev) => !prev);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }
}

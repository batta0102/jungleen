import {
  afterNextTick,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassroomApiService } from '../../../../core/services/classroom-api.service';
import { SketchfabModelsApiService } from '../../../../core/services/sketchfab-models-api.service';
import type { Classroom } from '../../../../core/models/classroom.model';
import type { SketchfabModelSearchItem } from '../../../../core/models/sketchfab-search.model';

@Component({
  selector: 'app-classrooms-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classrooms.page.html',
  styleUrls: ['./classrooms.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomsPage implements OnInit, OnDestroy {
  private readonly classroomApi = inject(ClassroomApiService);
  private readonly sketchfabModelsApi = inject(SketchfabModelsApiService);

  private sketchfabApi: SketchfabViewerApi | null = null;
  private sketchfabClient: SketchfabViewerClient | null = null;

  readonly sketchfabFrame = viewChild<ElementRef<HTMLIFrameElement>>('sketchfabFrame');

  classrooms = signal<Classroom[]>([]);
  selected = signal<Classroom | null>(null);
  /** UID affiché dans le viewer : salle sélectionnée ou résultat de recherche Sketchfab. */
  activeViewerUid = signal<string | null>(null);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  viewerError = signal<string | null>(null);

  searchQuery = signal('');
  searchResults = signal<SketchfabModelSearchItem[]>([]);
  searchLoading = signal(false);
  searchError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadClassrooms();
  }

  ngOnDestroy(): void {
    this.teardownViewer();
  }

  loadClassrooms(): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.classroomApi.getAll().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.classrooms.set(res.data ?? []);
        if ((res.data?.length ?? 0) === 0) {
          this.selected.set(null);
          this.teardownViewer();
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Impossible de charger les salles.';
        this.errorMessage.set(msg);
      },
    });
  }

  selectClassroom(classroom: Classroom): void {
    this.teardownViewer();
    this.selected.set(classroom);
    this.viewerError.set(null);

    const uid = classroom.sketchfabModelUid?.trim() ?? null;
    this.activeViewerUid.set(uid);
    if (!uid) {
      return;
    }

    afterNextTick(() => {
      this.initSketchfabWithRetry(uid, 40);
    });
  }

  searchSketchfabModels(): void {
    const q = this.searchQuery().trim();
    this.searchError.set(null);
    this.searchResults.set([]);
    if (!q) {
      this.searchError.set('Saisissez un mot-clé (ex. classroom, meeting room).');
      return;
    }
    this.searchLoading.set(true);
    this.sketchfabModelsApi.search(q, 12).subscribe({
      next: (res) => {
        this.searchLoading.set(false);
        this.searchResults.set(res.data ?? []);
      },
      error: (err) => {
        this.searchLoading.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Recherche Sketchfab impossible.';
        this.searchError.set(msg);
      },
    });
  }

  /** Prévisualise un modèle choisi depuis la recherche backend (API Sketchfab via Spring). */
  previewSearchResult(item: SketchfabModelSearchItem): void {
    const uid = item.uid?.trim();
    if (!uid) {
      return;
    }
    this.teardownViewer();
    this.activeViewerUid.set(uid);
    this.viewerError.set(null);
    afterNextTick(() => {
      this.initSketchfabWithRetry(uid, 40);
    });
  }

  /** Sketchfab script is loaded from index.html (may be async); retry briefly. */
  private initSketchfabWithRetry(uid: string, attemptsLeft: number): void {
    const iframe = this.sketchfabFrame()?.nativeElement;
    if (!iframe?.contentWindow) {
      if (attemptsLeft > 0) {
        setTimeout(() => this.initSketchfabWithRetry(uid, attemptsLeft - 1), 100);
        return;
      }
      this.viewerError.set('Cadre viewer indisponible.');
      return;
    }

    const SketchfabCtor = window.Sketchfab;
    if (!SketchfabCtor) {
      if (attemptsLeft > 0) {
        setTimeout(() => this.initSketchfabWithRetry(uid, attemptsLeft - 1), 100);
        return;
      }
      this.viewerError.set('API Sketchfab non chargée (vérifiez index.html).');
      return;
    }

    this.sketchfabClient = new SketchfabCtor(iframe.contentWindow);
    this.sketchfabClient.init(uid, {
      success: (api: SketchfabViewerApi) => {
        this.sketchfabApi = api;
        api.start();
      },
      error: () => {
        this.viewerError.set('Échec du chargement du modèle Sketchfab (UID invalide ou modèle privé).');
      },
      ui_infos: 0,
      ui_controls: 1,
    });
  }

  private teardownViewer(): void {
    try {
      this.sketchfabApi?.stop();
    } catch {
      /* ignore */
    }
    this.sketchfabApi = null;
    this.sketchfabClient = null;
  }
}

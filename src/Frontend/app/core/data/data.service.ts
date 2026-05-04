import { Injectable, computed, signal } from '@angular/core';

import { SAMPLE_CLUBS, SAMPLE_EVENTS, SAMPLE_TESTIMONIALS } from './sample-data';
import { ClubModel, EventModel, TestimonialModel, TrainingChapter, TrainingModel, TrainingSection } from './models';

type CompletionState = Record<string, boolean>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly _events = signal<EventModel[]>(SAMPLE_EVENTS);
  private readonly _clubs = signal<ClubModel[]>(SAMPLE_CLUBS);
  private readonly _testimonials = signal<TestimonialModel[]>(SAMPLE_TESTIMONIALS);

  private readonly completionKey = 'jie-training-completion-v1';
  private readonly _completion = signal<CompletionState>(readJson<CompletionState>(this.completionKey, {}));
  private readonly _chapterOverrides = signal<Record<string, TrainingChapter[]>>({});

  /** Courses/trainings are loaded via CourseApiService on /front/trainings. Other pages get empty list unless they use the API. */
  readonly trainings = signal<TrainingModel[]>([]);

  readonly completion = computed(() => this._completion());

  readonly events = this._events.asReadonly();
  readonly clubs = this._clubs.asReadonly();
  readonly testimonials = this._testimonials.asReadonly();

  getEventById(eventId: string): EventModel | undefined {
    return this._events().find((e) => e.id === eventId);
  }

  getClubById(clubId: string): ClubModel | undefined {
    return this._clubs().find((c) => c.id === clubId);
  }

  getTrainingById(trainingId: string): TrainingModel | undefined {
    return this.trainings().find((t) => String(t.id) === trainingId);
  }

  isSectionComplete(trainingId: string, chapterId: string, sectionId: string): boolean {
    const key = `${trainingId}:${chapterId}:${sectionId}`;
    return this._completion()[key] ?? false;
  }

  setSectionComplete(trainingId: string, chapterId: string, sectionId: string, complete: boolean): void {
    const key = `${trainingId}:${chapterId}:${sectionId}`;
    this._completion.update((state) => {
      const next = { ...state, [key]: complete };
      writeJson(this.completionKey, next);
      return next;
    });
  }

  addTrainingChapter(trainingId: string, chapterTitle: string): void {
    const newChapter: TrainingChapter = {
      id: `ch-${crypto.randomUUID().slice(0, 8)}`,
      title: chapterTitle,
      sections: []
    };
    this._chapterOverrides.update((m) => {
      const current = m[trainingId] ?? this.getTrainingById(trainingId)?.chapters ?? [];
      return { ...m, [trainingId]: [...current, newChapter] };
    });
  }

  addTrainingSection(
    trainingId: string,
    chapterId: string,
    sectionTitle: string,
    sectionObjective: string,
    contentTypes: TrainingSection['contentTypes']
  ): void {
    const newSection: TrainingSection = {
      id: `s-${crypto.randomUUID().slice(0, 8)}`,
      title: sectionTitle,
      objective: sectionObjective,
      contentTypes
    };
    this._chapterOverrides.update((m) => {
      const chapters = m[trainingId] ?? this.getTrainingById(trainingId)?.chapters ?? [];
      const updated = chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, sections: [...ch.sections, newSection] } : ch
      );
      return { ...m, [trainingId]: updated };
    });
  }
}

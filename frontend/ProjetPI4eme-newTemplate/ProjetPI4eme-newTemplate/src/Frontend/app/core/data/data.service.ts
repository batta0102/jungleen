import { Injectable, computed, signal } from '@angular/core';

import { SAMPLE_CLUBS, SAMPLE_EVENTS, SAMPLE_TESTIMONIALS, SAMPLE_TRAININGS } from './sample-data';
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
  private readonly _trainings = signal<TrainingModel[]>(SAMPLE_TRAININGS);
  private readonly _testimonials = signal<TestimonialModel[]>(SAMPLE_TESTIMONIALS);

  private readonly completionKey = 'jie-training-completion-v1';
  private readonly _completion = signal<CompletionState>(readJson<CompletionState>(this.completionKey, {}));

  readonly events = this._events.asReadonly();
  readonly clubs = this._clubs.asReadonly();
  readonly trainings = this._trainings.asReadonly();
  readonly testimonials = this._testimonials.asReadonly();

  readonly completion = computed(() => this._completion());

  setEvents(events: EventModel[]): void {
    this._events.set(events);
  }

  getEventById(eventId: string): EventModel | undefined {
    return this._events().find((e) => e.id === eventId);
  }

  getClubById(clubId: string): ClubModel | undefined {
    return this._clubs().find((c) => c.id === clubId);
  }

  getTrainingById(trainingId: string): TrainingModel | undefined {
    return this._trainings().find((t) => t.id === trainingId);
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

    this._trainings.update((all) =>
      all.map((t) => (t.id === trainingId ? { ...t, chapters: [...t.chapters, newChapter] } : t))
    );
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

    this._trainings.update((all) =>
      all.map((t) => {
        if (t.id !== trainingId) return t;
        return {
          ...t,
          chapters: t.chapters.map((ch) =>
            ch.id === chapterId ? { ...ch, sections: [...ch.sections, newSection] } : ch
          )
        };
      })
    );
  }
}

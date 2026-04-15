import { Injectable, signal } from '@angular/core';

export type UserRole = 'student' | 'tutor' | 'admin';
export type EnrollmentMode = 'online' | 'onsite';

interface ParticipationState {
  bookedEventIds: string[];
  joinedClubIds: string[];
  enrolledTrainingIds: string[];
}

type TrainingEnrollmentModes = Record<string, EnrollmentMode>;

function readParticipation(key: string): ParticipationState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { bookedEventIds: [], joinedClubIds: [], enrolledTrainingIds: [] };
    const parsed = JSON.parse(raw) as ParticipationState;
    return {
      bookedEventIds: Array.isArray(parsed.bookedEventIds) ? parsed.bookedEventIds : [],
      joinedClubIds: Array.isArray(parsed.joinedClubIds) ? parsed.joinedClubIds : [],
      enrolledTrainingIds: Array.isArray(parsed.enrolledTrainingIds) ? parsed.enrolledTrainingIds : []
    };
  } catch {
    return { bookedEventIds: [], joinedClubIds: [], enrolledTrainingIds: [] };
  }
}

function writeParticipation(key: string, value: ParticipationState): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function readEnrollmentModes(key: string): TrainingEnrollmentModes {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    const record = parsed as Record<string, unknown>;
    const out: TrainingEnrollmentModes = {};
    for (const [trainingId, mode] of Object.entries(record)) {
      if (mode === 'online' || mode === 'onsite') out[trainingId] = mode;
    }
    return out;
  } catch {
    return {};
  }
}

function writeEnrollmentModes(key: string, value: TrainingEnrollmentModes): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly roleKey = 'jie-role-v1';
  private readonly participationKey = 'jie-participation-v1';
  private readonly enrollmentModesKey = 'jie-training-enrollment-modes-v1';
  private readonly _role = signal<UserRole>(this.readRole());
  private readonly _participation = signal<ParticipationState>(
    readParticipation(this.participationKey)
  );
  private readonly _trainingEnrollmentModes = signal<TrainingEnrollmentModes>(
    readEnrollmentModes(this.enrollmentModesKey)
  );

  readonly role = this._role.asReadonly();
  readonly participation = this._participation.asReadonly();
  readonly trainingEnrollmentModes = this._trainingEnrollmentModes.asReadonly();

  setRole(role: UserRole): void {
    this._role.set(role);
    try {
      localStorage.setItem(this.roleKey, role);
    } catch {
      // ignore
    }
  }

  enrollTraining(trainingId: string, mode: EnrollmentMode = 'online'): void {
    this._participation.update((state) => {
      if (state.enrolledTrainingIds.includes(trainingId)) return state;
      const next = { ...state, enrolledTrainingIds: [...state.enrolledTrainingIds, trainingId] };
      writeParticipation(this.participationKey, next);
      return next;
    });

    this._trainingEnrollmentModes.update((prev) => {
      const next = { ...prev, [trainingId]: mode };
      writeEnrollmentModes(this.enrollmentModesKey, next);
      return next;
    });
  }

  getEnrollmentMode(trainingId: string): EnrollmentMode | null {
    return this._trainingEnrollmentModes()[trainingId] ?? null;
  }

  joinClub(clubId: string): void {
    this._participation.update((state) => {
      if (state.joinedClubIds.includes(clubId)) return state;
      const next = { ...state, joinedClubIds: [...state.joinedClubIds, clubId] };
      writeParticipation(this.participationKey, next);
      return next;
    });
  }

  bookEvent(eventId: string): void {
    this._participation.update((state) => {
      if (state.bookedEventIds.includes(eventId)) return state;
      const next = { ...state, bookedEventIds: [...state.bookedEventIds, eventId] };
      writeParticipation(this.participationKey, next);
      return next;
    });
  }

  private readRole(): UserRole {
    try {
      const raw = localStorage.getItem(this.roleKey);
      if (raw === 'student' || raw === 'tutor' || raw === 'admin') return raw;
      return 'student';
    } catch {
      return 'student';
    }
  }
}

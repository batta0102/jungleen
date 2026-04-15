import { Injectable, signal } from '@angular/core';

export type UserRole = 'student' | 'teacher' | 'tutor' | 'admin';
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
  private readonly legacyParticipationKey = 'jie-participation-v1';
  private readonly legacyEnrollmentModesKey = 'jie-training-enrollment-modes-v1';
  private readonly participationKeyPrefix = 'jie-participation-v1-';
  private readonly enrollmentModesKeyPrefix = 'jie-training-enrollment-modes-v1-';
  private readonly _currentUserId = signal<string | null>(null);
  private readonly _role = signal<UserRole>(this.readRole());
  private readonly _participation = signal<ParticipationState>(
    { bookedEventIds: [], joinedClubIds: [], enrolledTrainingIds: [] }
  );
  private readonly _trainingEnrollmentModes = signal<TrainingEnrollmentModes>({});

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

  setCurrentUser(userId: string): void {
    if (!userId) {
      this._currentUserId.set(null);
      this._participation.set({ bookedEventIds: [], joinedClubIds: [], enrolledTrainingIds: [] });
      this._trainingEnrollmentModes.set({});
      return;
    }

    if (this._currentUserId() !== userId) {
      this._currentUserId.set(userId);
      const participationKey = this.participationKeyPrefix + userId;
      const enrollmentModesKey = this.enrollmentModesKeyPrefix + userId;
      const userParticipation = readParticipation(participationKey);
      const userEnrollmentModes = readEnrollmentModes(enrollmentModesKey);

      const hasUserData =
        userParticipation.bookedEventIds.length > 0 ||
        userParticipation.joinedClubIds.length > 0 ||
        userParticipation.enrolledTrainingIds.length > 0;

      if (!hasUserData) {
        const legacyParticipation = readParticipation(this.legacyParticipationKey);
        const hasLegacyData =
          legacyParticipation.bookedEventIds.length > 0 ||
          legacyParticipation.joinedClubIds.length > 0 ||
          legacyParticipation.enrolledTrainingIds.length > 0;

        if (hasLegacyData) {
          this._participation.set(legacyParticipation);
          writeParticipation(participationKey, legacyParticipation);
        } else {
          this._participation.set(userParticipation);
        }
      } else {
        this._participation.set(userParticipation);
      }

      const hasUserModes = Object.keys(userEnrollmentModes).length > 0;
      if (!hasUserModes) {
        const legacyModes = readEnrollmentModes(this.legacyEnrollmentModesKey);
        if (Object.keys(legacyModes).length > 0) {
          this._trainingEnrollmentModes.set(legacyModes);
          writeEnrollmentModes(enrollmentModesKey, legacyModes);
        } else {
          this._trainingEnrollmentModes.set(userEnrollmentModes);
        }
      } else {
        this._trainingEnrollmentModes.set(userEnrollmentModes);
      }
    }
  }

  enrollTraining(trainingId: string, mode: EnrollmentMode = 'online'): void {
    const userId = this._currentUserId();
    if (!userId) return;

    const participationKey = this.participationKeyPrefix + userId;
    const enrollmentModesKey = this.enrollmentModesKeyPrefix + userId;

    this._participation.update((state) => {
      if (state.enrolledTrainingIds.includes(trainingId)) return state;
      const next = { ...state, enrolledTrainingIds: [...state.enrolledTrainingIds, trainingId] };
      writeParticipation(participationKey, next);
      return next;
    });

    this._trainingEnrollmentModes.update((prev) => {
      const next = { ...prev, [trainingId]: mode };
      writeEnrollmentModes(enrollmentModesKey, next);
      return next;
    });
  }

  getEnrollmentMode(trainingId: string): EnrollmentMode | null {
    return this._trainingEnrollmentModes()[trainingId] ?? null;
  }

  joinClub(clubId: string): void {
    const userId = this._currentUserId();
    if (!userId) return;

    const participationKey = this.participationKeyPrefix + userId;

    this._participation.update((state) => {
      if (state.joinedClubIds.includes(clubId)) return state;
      const next = { ...state, joinedClubIds: [...state.joinedClubIds, clubId] };
      writeParticipation(participationKey, next);
      return next;
    });
  }

  bookEvent(eventId: string): void {
    const userId = this._currentUserId();
    if (!userId) return;

    const participationKey = this.participationKeyPrefix + userId;

    this._participation.update((state) => {
      if (state.bookedEventIds.includes(eventId)) return state;
      const next = { ...state, bookedEventIds: [...state.bookedEventIds, eventId] };
      writeParticipation(participationKey, next);
      return next;
    });
  }

  setBookedEvents(eventIds: string[]): void {
    const userId = this._currentUserId();
    if (!userId) return;

    const uniqueIds = Array.from(new Set(eventIds));
    const participationKey = this.participationKeyPrefix + userId;
    const next = {
      ...this._participation(),
      bookedEventIds: uniqueIds
    };
    this._participation.set(next);
    writeParticipation(participationKey, next);
  }

  private readRole(): UserRole {
    try {
      const raw = localStorage.getItem(this.roleKey);
      if (raw === 'student' || raw === 'teacher' || raw === 'tutor' || raw === 'admin') return raw;
      return 'student';
    } catch {
      return 'student';
    }
  }
}

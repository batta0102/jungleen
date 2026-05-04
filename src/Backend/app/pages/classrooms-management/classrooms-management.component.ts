import { Component, ChangeDetectionStrategy, signal, inject, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ClassroomApiService } from '../../../../core/api/services/classroom-api.service';
import { CourseApiService } from '../../../../core/api/services/course-api.service';
import { SessionApiService } from '../../../../core/api/services/session-api.service';
import { Classroom, Course, Session } from '../../../../core/api/models';

type UiAlertType = 'success' | 'error' | 'info';
type UiAlert = { type: UiAlertType; message: string };

@Component({
  selector: 'app-classrooms-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './classrooms-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClassroomsManagementComponent {
  private readonly api = inject(ClassroomApiService);
  private readonly courseApi = inject(CourseApiService);
  private readonly sessionApi = inject(SessionApiService);

  classrooms = signal<Classroom[]>([]);
  onsiteSessions = signal<Session[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  alert = signal<UiAlert | null>(null);
  deletingMap = signal<Record<string, boolean>>({});

  searchQuery = signal('');
  filterCapacityMin = signal<number | null>(null);

  selectedClassroom = signal<Classroom | null>(null);
  reservationDateTime = signal('');
  reservationRequiredCapacity = signal<number>(1);
  reservationError = signal<string | null>(null);
  reservationSuccess = signal<string | null>(null);
  reserving = signal(false);
  suggestionType = signal<'STANDARD' | 'PREMIUM' | 'MEETING'>('STANDARD');
  suggestionDateTime = signal('');
  suggestionRequiredCapacity = signal<number>(1);
  suggestionResult = signal<Classroom | null>(null);
  suggestionMessage = signal<string | null>(null);

  extraProjector = signal(false);
  extraMicrophone = signal(false);
  coffeeBreak = signal(false);

  filteredClassrooms = computed(() => {
    let list = [...this.classrooms()];
    const q = (this.searchQuery() ?? '').trim().toLowerCase();
    const capMin = this.filterCapacityMin();

    if (q) {
      list = list.filter((c) => {
        const nameStr = (c.name ?? '').toLowerCase();
        const capStr = String(c.capacity ?? '').toLowerCase();
        const locStr = (c.location ?? '').toLowerCase();
        return [nameStr, capStr, locStr].some((x) => x.includes(q));
      });
    }
    if (capMin != null && capMin > 0) {
      list = list.filter((c) => (Number(c.capacity) || 0) >= capMin);
    }

    list.sort((a, b) => String(a.name ?? '').toLowerCase().localeCompare(String(b.name ?? '').toLowerCase()));
    return list;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getClassrooms().subscribe({
      next: (list) => {
        let items = Array.isArray(list) ? list : [];
        const created = this.api.getAndClearLastUpserted();
        if (created?.id != null) {
          const idStr = String(created.id);
          const idx = items.findIndex((c) => String(c.id) === idStr);
          if (idx >= 0) {
            items = [...items];
            items[idx] = this.mergeClassroomRow(items[idx], created);
          } else {
            items = [created, ...items];
          }
        }
        this.classrooms.set(items);
        this.loading.set(false);
        this.sessionApi.getOnsiteSessionsOnly().subscribe({
          next: (sessions) => this.onsiteSessions.set(Array.isArray(sessions) ? sessions : []),
          error: () => this.onsiteSessions.set([])
        });
      },
      error: (err) => {
        const msg = err?.message ?? 'Could not load classrooms.';
        this.error.set(msg);
        this.showAlert('error', msg, true);
        this.classrooms.set([]);
        this.loading.set(false);
      }
    });
  }

  id(c: Classroom): string {
    return String(c.id);
  }

  isDeleting(id: string | number): boolean {
    return this.deletingMap()[String(id)] === true;
  }

  parseCapacity(value: string | number | null | undefined): number | null {
    if (value === '' || value == null) return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  dismissAlert(): void {
    this.alert.set(null);
  }

  deleteClassroom(id: string | number, event?: Event): void {
    event?.stopPropagation();
    const idStr = String(id);
    if (this.deletingMap()[idStr]) return;
    if (!confirm('Delete this classroom?')) return;

    this.error.set(null);
    this.setDeleting(idStr, true);
    this.api
      .deleteClassroom(id)
      .pipe(finalize(() => this.setDeleting(idStr, false)))
      .subscribe({
        next: () => {
          this.classrooms.update((list) => list.filter((c) => String(c.id) !== idStr));
          if (String(this.selectedClassroom()?.id) === idStr) {
            this.clearSelection();
          }
          this.showAlert('success', 'Classroom deleted successfully.');
        },
        error: (err: { status?: number; message?: string }) => {
          const message = this.resolveDeleteErrorMessage(err, 'classroom');
          this.error.set(message);
          this.showAlert('error', message, true);
        }
      });
  }

  selectClassroom(classroom: Classroom): void {
    const idStr = String(classroom.id);
    const fresh = this.classrooms().find((c) => String(c.id) === idStr) ?? classroom;
    this.selectedClassroom.set(fresh);
    this.reservationRequiredCapacity.set(Math.max(1, Number(fresh.capacity) || 1));
    this.reservationDateTime.set('');
    this.reservationError.set(null);
    this.reservationSuccess.set(null);
    this.extraProjector.set(false);
    this.extraMicrophone.set(false);
    this.coffeeBreak.set(false);
  }

  clearSelection(): void {
    this.selectedClassroom.set(null);
    this.reservationError.set(null);
    this.reservationSuccess.set(null);
    this.reservationDateTime.set('');
    this.reservationRequiredCapacity.set(1);
    this.extraProjector.set(false);
    this.extraMicrophone.set(false);
    this.coffeeBreak.set(false);
  }

  isSelected(c: Classroom): boolean {
    return String(this.selectedClassroom()?.id) === String(c.id);
  }

  roomVisualByType(type: string): string {
    switch (type) {
      case 'PREMIUM':
        return '/Backend/assets/classrooms/isometric-premium.svg';
      case 'MEETING':
        return '/Backend/assets/classrooms/isometric-meeting.svg';
      case 'STANDARD':
      default:
        return '/Backend/assets/classrooms/isometric-standard.svg';
    }
  }

  tileVisualSrc(c: Classroom): string {
    return this.roomVisualByType(this.classroomType(c));
  }

  panelVisualSrc(c: Classroom): string {
    return this.roomVisualByType(this.classroomType(c));
  }

  roomModelSrc(c: Classroom): string {
    // Priority: explicit backend field if it points to a .glb model.
    const explicit = String(c.model3dUrl ?? '').trim();
    if (explicit.toLowerCase().endsWith('.glb')) {
      return explicit;
    }
    // Type-based default models for the demo.
    switch (this.classroomType(c)) {
      case 'PREMIUM':
        return '/Backend/assets/classrooms/models/premium-room.glb';
      case 'MEETING':
        return '/Backend/assets/classrooms/models/meeting-room.glb';
      case 'STANDARD':
      default:
        return '/Backend/assets/classrooms/models/standard-room.glb';
    }
  }

  featuresText(c: Classroom | null): string {
    const text = String(c?.featuresDescription ?? '').trim();
    return text !== '' ? text : 'Standard classroom equipment';
  }

  isClassroomOccupied(c: Classroom): boolean {
    const cid = String(c.id);
    return this.onsiteSessions().some((s) => String(s.classroomId ?? '') === cid);
  }

  classroomType(c: Classroom | null): string {
    if (!c) return 'STANDARD';
    const raw = (c as Record<string, unknown>)['type'];
    const normalized = String(raw ?? 'STANDARD').trim().toUpperCase();
    if (normalized === 'PREMIUM' || normalized === 'MEETING' || normalized === 'STANDARD') {
      return normalized;
    }
    return 'STANDARD';
  }

  typeBadgeClass(type: string): string {
    switch (type) {
      case 'PREMIUM':
        return 'bg-violet-600 text-white';
      case 'MEETING':
        return 'bg-emerald-700 text-white';
      case 'STANDARD':
      default:
        return 'bg-blue-700 text-white';
    }
  }

  displayClassroomTitle(c: Classroom | null): string {
    const raw = String(c?.name ?? '').trim();
    if (!raw) return 'Classroom';
    if (raw.toLowerCase().startsWith('classroom')) return raw;
    return raw;
  }

  onReservationInputChange(): void {
    this.reservationError.set(null);
    this.reservationSuccess.set(null);
  }

  suggestBestClassroom(): void {
    const type = this.suggestionType();
    const requiredCapacity = Number(this.suggestionRequiredCapacity());
    const dateTime = this.suggestionDateTime().trim();
    this.suggestionResult.set(null);
    this.suggestionMessage.set(null);

    if (!Number.isFinite(requiredCapacity) || requiredCapacity < 1) {
      this.suggestionMessage.set('Required capacity must be at least 1.');
      return;
    }
    const requestedMs = Date.parse(dateTime);
    if (!dateTime || Number.isNaN(requestedMs)) {
      this.suggestionMessage.set('Choose a valid date and time.');
      return;
    }

    const candidates = this.classrooms()
      .filter((c) => this.classroomType(c) === type)
      .filter((c) => (Number(c.capacity) || 0) >= requiredCapacity)
      .filter((c) => this.isClassroomAvailableAt(c, requestedMs))
      .sort((a, b) => {
        const capDiff = (Number(a.capacity) || 0) - (Number(b.capacity) || 0);
        if (capDiff !== 0) return capDiff;
        return this.displayClassroomTitle(a).localeCompare(this.displayClassroomTitle(b));
      });

    const best = candidates[0] ?? null;
    if (!best) {
      this.suggestionMessage.set('No suitable classroom found.');
      return;
    }

    this.suggestionResult.set(best);
    this.suggestionMessage.set(`Suggested classroom: ${this.displayClassroomTitle(best)}`);
  }

  applySuggestedClassroom(): void {
    const suggested = this.suggestionResult();
    if (!suggested) return;
    this.selectClassroom(suggested);
  }

  includedEquipment(c: Classroom | null): string[] {
    if (!c) return ['Standard seating'];
    const byType = {
      STANDARD: ['Desks and chairs', 'Whiteboard', 'Wall display'],
      PREMIUM: ['Premium seating', 'Interactive display', 'Smart lighting'],
      MEETING: ['Conference table', 'Wall screen', 'Collaboration board']
    };
    return byType[this.classroomType(c) as keyof typeof byType] ?? byType.STANDARD;
  }

  reserveClassroom(): void {
    const classroom = this.selectedClassroom();
    if (!classroom) return;

    this.reservationError.set(null);
    this.reservationSuccess.set(null);

    const requiredCapacity = Number(this.reservationRequiredCapacity());
    if (!Number.isFinite(requiredCapacity) || requiredCapacity < 1) {
      this.reservationError.set('Required capacity must be at least 1.');
      return;
    }

    const classroomCapacity = Number(classroom.capacity ?? 0);
    if (requiredCapacity > classroomCapacity) {
      this.reservationError.set(`This room seats up to ${classroomCapacity}.`);
      return;
    }

    const dateTime = this.reservationDateTime().trim();
    if (!dateTime) {
      this.reservationError.set('Choose a date and time.');
      return;
    }

    const requestedMs = Date.parse(dateTime);
    if (Number.isNaN(requestedMs)) {
      this.reservationError.set('Invalid date or time.');
      return;
    }

    this.reserving.set(true);

    this.sessionApi.getOnsiteSessionsOnly().subscribe({
      next: (sessions: Session[]) => {
        const occupied = sessions.some((s) => {
          if (String(s.classroomId ?? '') !== String(classroom.id)) return false;
          const sessionDate = String(s.date ?? s.startDate ?? '').trim();
          if (!sessionDate) return false;
          const sessionMs = Date.parse(sessionDate);
          if (Number.isNaN(sessionMs)) return false;
          return Math.abs(sessionMs - requestedMs) < 60_000;
        });

        if (occupied) {
          this.reserving.set(false);
          this.reservationError.set('This room is already booked at that time.');
          return;
        }

        this.courseApi.getCourses().subscribe({
          next: (courses: Course[]) => {
            const onsiteCourse = courses.find((c) => String(c.type ?? '').toLowerCase() === 'on-site');

            if (!onsiteCourse?.id) {
              this.reserving.set(false);
              this.reservationError.set('No on-site course is available for reservation.');
              return;
            }

            this.sessionApi
              .createSession({
                type: 'On-site',
                courseId: onsiteCourse.id,
                date: dateTime,
                capacity: requiredCapacity,
                classroomId: classroom.id
              })
              .subscribe({
                next: () => {
                  this.reserving.set(false);
                  this.reservationSuccess.set('Your reservation is confirmed.');
                  this.load();
                },
                error: (err: unknown) => {
                  this.reserving.set(false);
                  this.reservationError.set(err instanceof Error ? err.message : 'Reservation could not be completed.');
                }
              });
          },
          error: (err: unknown) => {
            this.reserving.set(false);
            this.reservationError.set(err instanceof Error ? err.message : 'Something went wrong.');
          }
        });
      },
      error: (err: unknown) => {
        this.reserving.set(false);
        this.reservationError.set(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  private mergeClassroomRow(fromApi: Classroom, fromUpsert: Classroom): Classroom {
    const u = fromUpsert;
    const next: Classroom = { ...fromApi };
    if (u.name != null && String(u.name).trim() !== '') next.name = String(u.name).trim();
    if (u.capacity != null) next.capacity = u.capacity;
    if (u.location != null && String(u.location).trim() !== '') {
      next.location = String(u.location).trim();
    } else if (u.location != null && String(u.location).trim() === '' && fromApi.location) {
      next.location = fromApi.location;
    }
    const sf = u.sketchfabModelUid != null ? String(u.sketchfabModelUid).trim() : '';
    if (sf !== '') next.sketchfabModelUid = sf;
    const m3 = u.model3dUrl != null ? String(u.model3dUrl).trim() : '';
    if (m3 !== '') next.model3dUrl = m3;
    const t = u.type != null ? String(u.type).trim() : '';
    if (t !== '') (next as Record<string, unknown>)['type'] = t;
    const feat = u.featuresDescription != null ? String(u.featuresDescription).trim() : '';
    if (feat !== '') next.featuresDescription = feat;
    return next;
  }

  private showAlert(type: UiAlertType, message: string, sticky = false): void {
    this.alert.set({ type, message });
    if (sticky) return;
    setTimeout(() => {
      if (this.alert()?.message === message) this.alert.set(null);
    }, 3500);
  }

  private setDeleting(id: string, value: boolean): void {
    this.deletingMap.update((current) => ({ ...current, [id]: value }));
  }

  private resolveDeleteErrorMessage(err: { status?: number; message?: string }, entity: string): string {
    const isConflict = err?.status === 409 || /\b409\b|conflict/i.test(err?.message ?? '');
    if (isConflict) {
      return `This ${entity} cannot be deleted because it is in use.`;
    }
    return err?.message ?? `Could not delete the ${entity}.`;
  }

  private isClassroomAvailableAt(c: Classroom, requestedMs: number): boolean {
    const cid = String(c.id);
    return !this.onsiteSessions().some((s) => {
      if (String(s.classroomId ?? '') !== cid) return false;
      const sessionDate = String(s.date ?? s.startDate ?? '').trim();
      if (!sessionDate) return false;
      const sessionMs = Date.parse(sessionDate);
      if (Number.isNaN(sessionMs)) return false;
      return Math.abs(sessionMs - requestedMs) < 60_000;
    });
  }

}

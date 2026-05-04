import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceApiService } from '../../core/services/attendance-api.service';
import type { Attendance, AttendanceStatus, SessionType } from '../../core/models/attendance.model';
import { SESSION_TYPES, ATTENDANCE_STATUSES } from '../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.css'],
})
export class AttendancePage {
  sessionType = signal<SessionType>('ONLINE');
  sessionId = signal<string>('');
  list = signal<Attendance[]>([]);
  loading = signal(false);
  loadingSave = signal<number | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly sessionTypes = SESSION_TYPES;
  readonly statuses = ATTENDANCE_STATUSES;

  constructor(private api: AttendanceApiService) {}

  load(): void {
    const type = this.sessionType();
    const idStr = this.sessionId().trim();
    const id = idStr ? Number(idStr) : NaN;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!idStr || Number.isNaN(id) || id <= 0) {
      this.errorMessage.set('Veuillez saisir un ID de session valide (nombre > 0).');
      return;
    }

    this.loading.set(true);
    this.api.getBySession(type, id).subscribe({
      next: (items) => {
        this.list.set(items);
        this.loading.set(false);
        if (items.length === 0) {
          this.successMessage.set('Aucune présence enregistrée pour cette session.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Erreur lors du chargement.';
        this.errorMessage.set(msg);
      },
    });
  }

  saveRow(row: Attendance): void {
    const type = this.sessionType();
    const idStr = this.sessionId().trim();
    const id = idStr ? Number(idStr) : NaN;
    if (Number.isNaN(id) || id <= 0) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.loadingSave.set(row.id);

    this.api.markAttendance({
      sessionType: type,
      sessionId: id,
      studentId: row.studentId,
      status: row.status,
      note: row.note ?? undefined,
    }).subscribe({
      next: (updated) => {
        this.list.update((items) =>
          items.map((a) => (a.id === updated.id ? updated : a))
        );
        this.loadingSave.set(null);
        this.successMessage.set('Présence enregistrée.');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.loadingSave.set(null);
        const msg = err?.error?.message ?? err?.message ?? 'Erreur lors de l\'enregistrement.';
        this.errorMessage.set(msg);
      },
    });
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '–';
    try {
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
}

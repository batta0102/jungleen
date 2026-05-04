import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DataService } from '../../core/data/data.service';
import { UserContextService } from '../../core/user/user-context.service';
import { downloadTextFile } from '../../shared/utils/download';

@Component({
  selector: 'app-profile-student-page',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './profile-student.page.html',
  styleUrl: './profile-student.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileStudentPage {
  private readonly data = inject(DataService);
  private readonly user = inject(UserContextService);
  readonly participation = this.user.participation;
  readonly enrollmentModes = this.user.trainingEnrollmentModes;

  readonly displayName = signal<string>(this.readDisplayName());

  readonly enrolledTrainings = computed(() =>
    this.participation().enrolledTrainingIds
      .map((id) => this.data.getTrainingById(id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
  );

  readonly joinedClubs = computed(() =>
    this.participation().joinedClubIds
      .map((id) => this.data.getClubById(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  );

  readonly bookedEvents = computed(() =>
    this.participation().bookedEventIds
      .map((id) => this.data.getEventById(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
  );

  readonly nextBooking = computed(() => {
    const events = this.bookedEvents();
    if (events.length === 0) return null;
    return [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  });

  readonly ongoingCourses = computed(() =>
    this.enrolledTrainings().map((t) => {
      const level = this.trainingLevelTag(t.id);
      const mode = this.enrollmentModes()[t.id] ?? 'online';
      return {
        id: t.id,
        title: t.name,
        level,
        formatLabel: mode === 'onsite' ? 'On-site' : 'Online',
        tutorLabel: 'Jungle Team',
        upcomingSessions: Math.max(1, t.chapters.length),
        studentsCount: this.seedNumber(t.id, 12, 28),
        chipLabel: mode === 'onsite' ? 'Room 3' : 'Online',
        bannerSrc: this.courseBannerSrc(t.id)
      };
    })
  );

  readonly earnedCertificates = computed(() => {
    const completed = this.enrolledTrainings()
      .filter((t) => this.trainingProgressPercent(t.id) >= 100)
      .map((t) => ({
        trainingId: t.id,
        title: `${this.trainingLevelTag(t.id)} Level`,
        validUntil: this.validUntilDateLabel()
      }));
    return completed.slice(0, 2);
  });

  readonly notifications = computed(() => {
    const items: Array<{ title: string; text: string }> = [];

    const club = this.joinedClubs()[0];
    if (club?.upcomingActivities?.length) {
      const next = club.upcomingActivities[0];
      items.push({
        title: club.name,
        text: `is scheduled for ${next.date}, ${next.time}.`
      });
    } else {
      items.push({
        title: 'Conversation Club',
        text: 'New session announcements are coming soon.'
      });
    }

    items.push({
      title: 'Payment Reminder',
      text: 'Your monthly payment is due tomorrow.'
    });

    return items;
  });

  private trainingLevelTag(trainingId: string): string {
    const raw = trainingId.toLowerCase();
    if (raw.includes('a1') || raw.includes('a2')) return 'A2';
    if (raw.includes('b1') || raw.includes('b2')) return 'B1';
    if (raw.includes('c1') || raw.includes('c2')) return 'C1';
    return 'A2';
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

  private validUntilDateLabel(): string {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setFullYear(now.getFullYear() + 1);
    return validUntil.toISOString().slice(0, 10);
  }

  private readDisplayName(): string {
    try {
      const raw = localStorage.getItem('jie-display-name-v1');
      return raw && raw.trim().length > 0 ? raw.trim() : 'Sarah';
    } catch {
      return 'Sarah';
    }
  }

  trainingProgressPercent(trainingId: string): number {
    const t = this.data.getTrainingById(trainingId);
    if (!t) return 0;
    const total = t.chapters.reduce((acc, ch) => acc + ch.sections.length, 0);
    const completed = t.chapters.reduce(
      (acc, ch) => acc + ch.sections.filter((s) => this.data.isSectionComplete(t.id, ch.id, s.id)).length,
      0
    );
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  downloadTrainingCertificate(trainingId: string): void {
    const t = this.data.getTrainingById(trainingId);
    if (!t) return;
    const percent = this.trainingProgressPercent(trainingId);
    const content = `Jungle in English\n\nCertificate (Training)\n\nCourse: ${t.name}\nProgress: ${percent}%\nIssued on: ${new Date().toISOString().slice(0, 10)}\n`;
    downloadTextFile(`certificate-training-${t.id}.txt`, content);
  }

  downloadEventCertificate(eventId: string): void {
    const e = this.data.getEventById(eventId);
    if (!e) return;
    const content = `Jungle in English\n\nCertificate (Event)\n\nEvent: ${e.name}\nDate: ${e.date} ${e.time}\nIssued on: ${new Date().toISOString().slice(0, 10)}\n`;
    downloadTextFile(`certificate-event-${e.id}.txt`, content);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DataService } from '../../core/data/data.service';
import { PriceType, Visibility } from '../../core/data/models';

@Component({
  selector: 'app-landing-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPage {
  private readonly data = inject(DataService);
  private readonly fb = inject(FormBuilder);

  readonly trainings = this.data.trainings;
  readonly clubs = this.data.clubs;
  readonly events = this.data.events;
  readonly testimonials = this.data.testimonials;

  private readonly todayIso = new Date().toISOString().slice(0, 10);

  readonly upcomingEvents = computed(() => this.events().filter((e) => e.date >= this.todayIso));

  readonly stats = [
    { value: '200K+', label: 'Active learners' },
    { value: '10K+', label: 'Courses' },
    { value: '50+', label: 'Instructors' },
    { value: '80K+', label: 'Success stories' }
  ] as const;

  readonly instructors = [
    { name: 'David Richard', title: 'English Instructor' },
    { name: 'Sophia Abo', title: 'Conversation Coach' },
    { name: 'Michael Lee', title: 'Exam Preparation Tutor' },
    { name: 'Emily Watson', title: 'Writing Specialist' }
  ] as const;

  readonly contactSent = signal(false);
  readonly contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.minLength(6)]],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  scrollRow(container: HTMLElement, direction: -1 | 1): void {
    container.scrollBy({ left: direction * 340, behavior: 'smooth' });
  }

  submitContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.contactSent.set(true);
    this.contactForm.reset();
  }
}

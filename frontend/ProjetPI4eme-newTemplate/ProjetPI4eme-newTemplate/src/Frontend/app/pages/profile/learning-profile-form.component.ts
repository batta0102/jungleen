import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface PredictionResult {
  clusterId: number;
  profileName: string;
  confidence: number;
  strategy: string;
}

@Component({
  selector: 'app-learning-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div class="mx-auto max-w-2xl">
        <!-- Header -->
        <div class="mb-8 text-center">
          <h1 class="text-4xl font-serif font-bold text-slate-900 mb-2">Learning Profile Assessment</h1>
          <p class="text-slate-600">Discover your personalized learning profile based on your habits and performance</p>
        </div>

        <!-- Form Container -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          <!-- Tabs/Steps -->
          <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div class="flex gap-4 text-sm font-medium">
              <button
                [class.text-slate-900]="!showResults()"
                [class.text-slate-500]="showResults()"
                (click)="showResults.set(false)"
                class="transition-colors hover:text-slate-700">
                Assessment Form
              </button>
              <span class="text-slate-300" *ngIf="showResults()">→</span>
              <button
                [class.text-slate-900]="showResults()"
                [class.text-slate-500]="!showResults()"
                (click)="showResults.set(true)"
                *ngIf="prediction()"
                class="transition-colors hover:text-slate-700">
                Your Profile
              </button>
            </div>
            <button
              *ngIf="showResults() && prediction()"
              (click)="resetForm()"
              class="text-sm text-blue-600 hover:text-blue-700 transition-colors">
              Start Over
            </button>
          </div>

          <!-- Form Section -->
          <div *ngIf="!showResults()" class="p-8">
            <form [formGroup]="assessmentForm" (ngSubmit)="onSubmit()" class="space-y-8">
              <!-- Study Hours -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  📚 Average Study Hours per Week
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    formControlName="studyHours"
                    min="0"
                    max="100"
                    class="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    style="accent-color: #3b82f6;" />
                  <span class="text-lg font-bold text-blue-600 w-16 text-right">{{ assessmentForm.get('studyHours')?.value || 0 }}</span>
                </div>
              </div>

              <!-- Attendance -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  📅 Class Attendance Percentage
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    formControlName="attendance"
                    min="0"
                    max="100"
                    class="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    style="accent-color: #3b82f6;" />
                  <span class="text-lg font-bold text-blue-600 w-16 text-right">{{ assessmentForm.get('attendance')?.value || 0 }}%</span>
                </div>
              </div>

              <!-- Assignment Completion -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  ✅ Assignment Completion Rate
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    formControlName="assignmentCompletion"
                    min="0"
                    max="100"
                    class="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    style="accent-color: #3b82f6;" />
                  <span class="text-lg font-bold text-blue-600 w-16 text-right">{{ assessmentForm.get('assignmentCompletion')?.value || 0 }}%</span>
                </div>
              </div>

              <!-- Online Courses -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  💻 Number of Online Courses Enrolled
                </label>
                <input
                  type="number"
                  formControlName="onlineCourses"
                  min="0"
                  class="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Discussions -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  💬 Discussions Participated
                </label>
                <input
                  type="number"
                  formControlName="discussions"
                  min="0"
                  class="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Motivation -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  🚀 Motivation Level
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    formControlName="motivation"
                    min="0"
                    max="100"
                    class="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    style="accent-color: #3b82f6;" />
                  <span class="text-lg font-bold text-blue-600 w-16 text-right">{{ assessmentForm.get('motivation')?.value || 0 }}</span>
                </div>
              </div>

              <!-- Stress Level -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  😰 Stress Level
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    formControlName="stressLevel"
                    min="0"
                    max="100"
                    class="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    style="accent-color: #3b82f6;" />
                  <span class="text-lg font-bold text-blue-600 w-16 text-right">{{ assessmentForm.get('stressLevel')?.value || 0 }}</span>
                </div>
              </div>

              <!-- Age (Optional) -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  🎂 Age (Optional)
                </label>
                <input
                  type="number"
                  formControlName="age"
                  min="0"
                  class="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Gender (Optional) -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  👤 Gender (Optional)
                </label>
                <select
                  formControlName="gender"
                  class="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-blue-500">
                  <option value="" class="bg-white">Select one...</option>
                  <option value="M" class="bg-white">Male</option>
                  <option value="F" class="bg-white">Female</option>
                  <option value="Other" class="bg-white">Other</option>
                </select>
              </div>

              <!-- Learning Style (Optional) -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  🎨 Learning Style (Optional)
                </label>
                <select
                  formControlName="learningStyle"
                  class="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-blue-500">
                  <option value="" class="bg-white">Select one...</option>
                  <option value="Visual" class="bg-white">Visual</option>
                  <option value="Auditory" class="bg-white">Auditory</option>
                  <option value="Kinesthetic" class="bg-white">Kinesthetic</option>
                  <option value="Reading/Writing" class="bg-white">Reading/Writing</option>
                </select>
              </div>

              <!-- Exam Score -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  📊 Last Exam Score
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    formControlName="examScore"
                    min="0"
                    max="100"
                    class="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    style="accent-color: #3b82f6;" />
                  <span class="text-lg font-bold text-blue-600 w-16 text-right">{{ assessmentForm.get('examScore')?.value || 0 }}</span>
                </div>
              </div>

              <!-- Final Grade (Optional) -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  🏆 Current Grade (Optional)
                </label>
                <input
                  type="number"
                  formControlName="finalGrade"
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="!assessmentForm.valid || isLoading()"
                class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all duration-200 mt-8">
                {{ isLoading() ? 'Analyzing...' : 'Get My Learning Profile' }}
              </button>

              <!-- Error message -->
              <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {{ error() }}
              </div>
            </form>
          </div>

          <!-- Results Section -->
          <div *ngIf="showResults() && prediction()" class="p-8">
            <div class="space-y-8">
              <!-- Profile Badge -->
              <div [ngSwitch]="prediction()?.clusterId" class="rounded-2xl p-8 text-white backdrop-blur-sm border-2 text-center"
                [ngClass]="{
                  'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500': prediction()?.clusterId === 1,
                  'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500': prediction()?.clusterId === 0,
                  'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-500': prediction()?.clusterId === 2,
                  'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-500': prediction()?.clusterId === 3,
                  'bg-gradient-to-br from-violet-600 to-violet-700 border-violet-500': prediction()?.clusterId === 4,
                  'bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500': prediction()?.clusterId === 5
                }">
                <div class="text-5xl mb-4">
                  <span *ngIf="prediction()?.clusterId === 0">👨‍🎓</span>
                  <span *ngIf="prediction()?.clusterId === 1">🌟</span>
                  <span *ngIf="prediction()?.clusterId === 2">⚠️</span>
                  <span *ngIf="prediction()?.clusterId === 3">😴</span>
                  <span *ngIf="prediction()?.clusterId === 4">🚀</span>
                  <span *ngIf="prediction()?.clusterId === 5">😰</span>
                </div>
                <h2 class="text-3xl font-serif font-bold mb-2">{{ prediction()?.profileName }}</h2>
                <p class="text-white/90 mb-4">Cluster {{ prediction()?.clusterId }} • Confidence: {{ (prediction()?.confidence || 0) | number: '1.0-1' }}</p>
              </div>

              <!-- Profile Descriptions -->
              <div [ngSwitch]="prediction()?.clusterId" class="space-y-4 text-slate-700">
                <div *ngSwitchCase="0" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 class="font-semibold text-blue-900 mb-2">Regular Learners</h3>
                  <p>You maintain consistent attendance and complete assignments regularly. You're a steady, reliable learner who benefits from structured routines.</p>
                </div>
                <div *ngSwitchCase="1" class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 class="font-semibold text-emerald-900 mb-2">High Performers</h3>
                  <p>Excellent work! You excel in exams, maintain high attendance, and demonstrate strong motivation. Keep up this momentum!</p>
                </div>
                <div *ngSwitchCase="2" class="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <h3 class="font-semibold text-rose-900 mb-2">Struggling Learners</h3>
                  <p>You may be facing challenges with assignments or attendance. Consider reaching out to tutors or forming study groups for support.</p>
                </div>
                <div *ngSwitchCase="3" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 class="font-semibold text-amber-900 mb-2">Low Engagement Learners</h3>
                  <p>Your current engagement level is lower than optimal. Consider setting goals and finding ways to increase motivation and participation.</p>
                </div>
                <div *ngSwitchCase="4" class="bg-violet-50 border border-violet-200 rounded-lg p-4">
                  <h3 class="font-semibold text-violet-900 mb-2">Highly Autonomous Learners</h3>
                  <p>You're independent and self-driven. You're likely taking advantage of online courses and extra opportunities. Excellent initiative!</p>
                </div>
                <div *ngSwitchCase="5" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 class="font-semibold text-orange-900 mb-2">Stressed Learners</h3>
                  <p>You may be experiencing stress that's affecting your learning. Consider discussing workload with instructors or seeking mental health support.</p>
                </div>
              </div>

              <!-- Recommendations -->
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 class="font-semibold text-slate-900 mb-4">📋 Recommendations</h3>
                <ul class="space-y-2 text-slate-700 text-sm">
                  <li *ngIf="prediction()?.clusterId === 1">✨ Consider becoming a peer mentor for other students</li>
                  <li *ngIf="prediction()?.clusterId !== 1 && prediction()?.clusterId !== 4">📚 Schedule regular study sessions</li>
                  <li *ngIf="prediction()?.clusterId === 2 || prediction()?.clusterId === 3">👥 Join a study group for motivation</li>
                  <li *ngIf="prediction()?.clusterId === 5">💆 Practice stress management techniques</li>
                  <li>🎯 Set clear, achievable learning goals</li>
                  <li>📞 Don't hesitate to reach out to tutors or instructors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-slate-600 text-sm">
          <p>Your learning profile helps personalize your educational experience</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LearningProfileFormComponent implements OnInit {
  assessmentForm!: FormGroup;
  showResults = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  prediction = signal<PredictionResult | null>(null);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.assessmentForm = this.fb.group({
      studyHours: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      attendance: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      assignmentCompletion: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      onlineCourses: [0, [Validators.required, Validators.min(0)]],
      discussions: [0, [Validators.required, Validators.min(0)]],
      motivation: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      stressLevel: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      age: [null],
      gender: [''],
      learningStyle: [''],
      examScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      finalGrade: [null]
    });
  }

  onSubmit(): void {
    if (!this.assessmentForm.valid) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const formData = this.assessmentForm.value;

    // First, get prediction from ML service
    this.http.post<PredictionResult>('/api/ml/predict', formData).subscribe({
      next: (prediction) => {
        // Then, save to persistence layer with ML prediction results
        const profileData = {
          studentId: this.getCurrentStudentId(),
          ...formData,
          clusterId: prediction.clusterId,
          profileName: prediction.profileName,
          confidence: prediction.confidence
        };

        this.http.post('/api/learner-profiles', profileData).subscribe({
          next: () => {
            this.prediction.set(prediction);
            this.showResults.set(true);
            this.isLoading.set(false);
          },
          error: (saveErr) => {
            console.error('Failed to save profile:', saveErr);
            // Still show prediction even if save fails
            this.prediction.set(prediction);
            this.showResults.set(true);
            this.isLoading.set(false);
            this.error.set('Profile assessed but save failed. Try again later.');
          }
        });
      },
      error: (err) => {
        console.error('Prediction error:', err);
        this.error.set('Failed to analyze your profile. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  private getCurrentStudentId(): number {
    const userId = localStorage.getItem('userId') || '1';
    return parseInt(userId, 10);
  }

  resetForm(): void {
    this.assessmentForm.reset();
    this.prediction.set(null);
    this.showResults.set(false);
    this.error.set(null);
  }
}

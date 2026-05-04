import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnsiteSessionApiService } from '../../core/services/onsite-session-api.service';
import type { ClassroomRecommendation, ClassroomType } from '../../core/models/onsite-session.model';

@Component({
  selector: 'app-onsite-session-recommendation-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onsite-session-recommendation.page.html',
  styleUrls: ['./onsite-session-recommendation.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnsiteSessionRecommendationPage {
  date = signal<string>('');
  requiredCapacity = signal<string>('');
  preferredType = signal<string>('');
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  recommendation = signal<ClassroomRecommendation | null>(null);

  readonly classroomTypes: ClassroomType[] = ['STANDARD', 'PREMIUM', 'MEETING'];

  constructor(private onsiteSessionApi: OnsiteSessionApiService) {}

  recommend(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.recommendation.set(null);

    const dateValue = this.date().trim();
    const capacityValue = Number(this.requiredCapacity().trim());
    const preferredTypeValue = this.preferredType().trim() as ClassroomType | '';

    if (!dateValue) {
      this.errorMessage.set('Veuillez saisir une date de session.');
      return;
    }
    if (Number.isNaN(capacityValue) || capacityValue <= 0) {
      this.errorMessage.set('Veuillez saisir une capacité valide (> 0).');
      return;
    }

    const dateIso = new Date(dateValue).toISOString();
    const preferredType = preferredTypeValue || undefined;

    this.loading.set(true);
    this.onsiteSessionApi.recommendClassroom(dateIso, capacityValue, preferredType).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.recommendation.set(response.data);
        this.successMessage.set(response.message || 'Salle recommandée trouvée.');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Aucune salle recommandée pour ces critères.';
        this.errorMessage.set(msg);
      },
    });
  }
}

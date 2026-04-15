import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import {
  AdmissionAnalyticsService,
  FailedQuestionStatDto,
  ProgressPointDto,
  TopicAverageDto,
  WeakAreaStatDto
} from '../../services/admission-analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admission-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admission-analytics.component.html',
  styleUrls: ['./admission-analytics.component.scss']
})
export class AdmissionAnalyticsComponent implements AfterViewInit, OnDestroy {
  private readonly analyticsService = inject(AdmissionAnalyticsService);

  @ViewChild('progressCanvas') progressCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('topicCanvas') topicCanvas?: ElementRef<HTMLCanvasElement>;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly failedQuestions = signal<FailedQuestionStatDto[]>([]);
  readonly weakAreas = signal<WeakAreaStatDto[]>([]);
  readonly progress = signal<ProgressPointDto[]>([]);
  readonly topicAverages = signal<TopicAverageDto[]>([]);

  private progressChart?: Chart;
  private topicChart?: Chart;

  ngAfterViewInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  weakAreaStrength(area: WeakAreaStatDto): number {
    const weakness = 100 - (area.accuracy ?? 0);
    return Math.max(0, Math.min(100, weakness));
  }

  hasProgressData(): boolean {
    return this.progress().length > 0;
  }

  hasTopicData(): boolean {
    return this.topicAverages().length > 0;
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.analyticsService.getDashboard().subscribe({
      next: (response) => {
        this.failedQuestions.set((response.mostFailedQuestions ?? []).slice(0, 10));
        this.weakAreas.set(response.weakGrammarAreas ?? []);
        this.progress.set(response.progressOverTime ?? []);
        this.topicAverages.set((response.averageScoreByTopic ?? []).slice(0, 10));
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 0);
      },
      error: () => {
        this.error.set('Failed to load advanced analytics.');
        this.loading.set(false);
      }
    });
  }

  private renderCharts(): void {
    this.destroyCharts();

    const progressCanvas = this.progressCanvas?.nativeElement;
    const topicCanvas = this.topicCanvas?.nativeElement;

    if (progressCanvas) {
      const progressData = this.progress();
      if (progressData.length > 0) {
        const config: ChartConfiguration<'line'> = {
          type: 'line',
          data: {
            labels: progressData.map((point) => point.period),
            datasets: [
              {
                label: 'Average student score (%)',
                data: progressData.map((point) => Number((point.averageScore ?? 0).toFixed(2))),
                borderColor: '#2D5E5B',
                backgroundColor: 'rgba(45,94,91,0.15)',
                fill: true,
                tension: 0.25
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 100
              }
            }
          }
        };
        this.progressChart = new Chart(progressCanvas, config);
      }
    }

    if (topicCanvas) {
      const topicData = this.topicAverages();
      if (topicData.length > 0) {
        const config: ChartConfiguration<'bar'> = {
          type: 'bar',
          data: {
            labels: topicData.map((topic) => topic.topic),
            datasets: [
              {
                label: 'Average score by topic (%)',
                data: topicData.map((topic) => Number((topic.averageScore ?? 0).toFixed(2))),
                backgroundColor: 'rgba(255,196,63,0.65)',
                borderColor: '#2D5E5B',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 100
              }
            }
          }
        };
        this.topicChart = new Chart(topicCanvas, config);
      }
    }
  }

  private destroyCharts(): void {
    this.progressChart?.destroy();
    this.topicChart?.destroy();
    this.progressChart = undefined;
    this.topicChart = undefined;
  }
}

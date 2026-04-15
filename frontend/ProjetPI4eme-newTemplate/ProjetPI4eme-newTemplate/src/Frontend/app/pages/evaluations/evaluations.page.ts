import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-evaluations-page',
  templateUrl: './evaluations.page.html',
  styleUrl: './evaluations.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluationsPage {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-qcm-page',
  templateUrl: './qcm.page.html',
  styleUrl: './qcm.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QcmPage {}

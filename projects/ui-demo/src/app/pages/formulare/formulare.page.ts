import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'demo-formulare-page',
  template: `
    <h1 class="heading-1 demo-title">Formulare</h1>
    <p class="demo-lead">Dieser Abschnitt wird in Welle 1 gefüllt.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularePage {}

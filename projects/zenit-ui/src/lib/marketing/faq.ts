import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Eine Frage als natives `details`/`summary`: ohne JavaScript bedienbar und
 * per Tastatur erreichbar. Die Antwort ist der projizierte Inhalt.
 */
@Component({
  selector: 'z-faq',
  template: `<details class="z-faq" [open]="open()">
    <summary>{{ question() }}</summary>
    <p class="z-faq__body"><ng-content /></p>
  </details>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZFaq {
  readonly question = input('');
  readonly open = input(false, { transform: booleanAttribute });
}

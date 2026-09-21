import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Untere Zeile: Copyright links, rechtliche Links rechts. */
@Directive({ selector: '[zFooterBase]' })
export class ZFooterBase {}

/** Eine Linkspalte des oeffentlichen Fusses. Inhalt sind die `<li>`. */
@Component({
  selector: 'z-footer-col',
  template: `
    @if (heading()) {
      <h2 class="z-footer__head">{{ heading() }}</h2>
    }
    <ul class="z-footer__list"><ng-content /></ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZFooterCol {
  readonly heading = input('');
}

/**
 * Fuss jeder Seite. Oeffentlich mit Spalten, im Kundenbereich nur mit der
 * unteren Zeile. Ohne Spalten bleibt das Raster leer und faellt zusammen.
 */
@Component({
  selector: 'z-footer',
  template: `
    <div class="z-footer__cols"><ng-content select="z-footer-col" /></div>
    <div class="z-footer__base"><ng-content select="[zFooterBase]" /></div>
  `,
  host: { 'class': 'z-footer' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZFooter {}

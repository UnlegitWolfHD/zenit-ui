import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import {
  afterEveryRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ZIcon } from '../icon';

/**
 * Flaeche des Menues. Tastatur, Rollen und Schliessen kommen aus
 * `@angular/cdk/menu`. Ausgeloest wird sie am Button mit `[cdkMenuTriggerFor]`.
 */
@Component({
  selector: 'z-menu',
  template: `<ng-content />`,
  host: { 'class': 'z-menu' },
  hostDirectives: [CdkMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenu {}

/** Ein Eintrag aus Icon und Verb plus Gegenstand. */
@Component({
  // Laut API-Tabelle ist der Eintrag ein Button mit Attribut-Selektor.
  selector: 'button[zMenuItem]',
  imports: [ZIcon],
  template: `@if (icon()) {<z-icon [name]="icon()" />}<ng-content />`,
  host: {
    'class': 'z-menu__item',
    '[class.z-menu__item--danger]': `danger()`,
  },
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenuItem {
  readonly icon = input('');
  readonly danger = input(false, { transform: booleanAttribute });

  constructor() {
    const eintrag = inject(CdkMenuItem);
    const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // Ohne das nimmt die Tastensuche des CDK den textContent, und darin steht
    // die Ligatur des Icons vor dem Text ("content_copyAdresse kopieren").
    // Der Text kann sich jederzeit aendern, deshalb nach jedem Render.
    afterEveryRender({ read: () => (eintrag.typeaheadLabel = beschriftung(wirt)) });
  }
}

/**
 * Text des Eintrags ohne die Ligatur des Icons. Kommentarknoten bleiben
 * draussen, weil Angular dort seine Anker ablegt und `textContent` deren
 * Inhalt mitliefert ("container").
 */
function beschriftung(wirt: HTMLElement): string {
  return Array.from(wirt.childNodes)
    .filter(
      (knoten) =>
        knoten.nodeType !== Node.COMMENT_NODE && (knoten as Element).localName !== 'z-icon',
    )
    .map((knoten) => knoten.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trennlinie vor den destruktiven Eintraegen. */
@Component({
  selector: 'z-menu-separator',
  template: ``,
  host: {
    'class': 'z-menu__sep',
    'role': 'separator',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenuSeparator {}

/** Alle Bausteine des Menues auf einmal. */
export const Z_MENU = [ZMenu, ZMenuItem, ZMenuSeparator];

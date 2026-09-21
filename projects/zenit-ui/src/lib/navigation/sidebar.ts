import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ZSelect } from '../field';
import { ZIcon } from '../icon';

/**
 * Ein Eintrag der Sidebar, als `<button>` oder `<a>`. Der aktive Eintrag
 * traegt `aria-current="page"`, nur dort ist das Icon farbig.
 */
@Component({
  // Die API-Tabelle schreibt den Selektor `[zSidebarItem]` ohne Element vor:
  // der Eintrag ist ein `<button>` oder ein `<a>`. Icon und Zaehler braucht
  // eine Vorlage, deshalb eine Komponente statt einer Direktive.
  selector: '[zSidebarItem]',
  imports: [ZIcon],
  // Kein Leerraum zwischen den Teilen: .z-side__item ist flex mit gap, jeder
  // Textknoten waere sonst ein eigenes Element in der Zeile.
  template: `@if (icon()) {<z-icon [name]="icon()" />}<ng-content />@if (count() !== null) {<span class="z-side__count">{{ count() }}</span>}`,
  host: {
    'class': 'z-side__item',
    '[attr.aria-current]': `active() ? "page" : null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSidebarItem {
  readonly icon = input('');
  readonly active = input(false, { transform: booleanAttribute });
  readonly count = input<number | null>(null);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Sichtbarer Text ohne Icon und Zaehler, fuer das Select unter 900px.
   * Gelesen werden nur die projizierten Textknoten; steht die Beschriftung in
   * einem Element, bleibt sie hier leer.
   */
  beschriftung(): string {
    return Array.from(this.el.nativeElement.childNodes)
      .filter((knoten) => knoten.nodeType === Node.TEXT_NODE)
      .map((knoten) => knoten.textContent ?? '')
      .join('')
      .trim();
  }

  /** Loest den Eintrag aus, wenn er im Select gewaehlt wird. */
  klicke(): void {
    this.el.nativeElement.click();
  }
}

/** Gruppe von Eintraegen, mit einem Wort als Ueberschrift. */
@Component({
  selector: 'z-sidebar-group',
  template: `@if (label()) {<span class="z-side__label">{{ label() }}</span>}<ng-content />`,
  host: { 'class': 'z-side__group' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSidebarGroup {
  readonly label = input('');
}

/**
 * Navigation innerhalb eines Server-Panels. Unter 900px steht statt der Liste
 * ein natives Select (Sidebar/README). Es spiegelt dieselben Eintraege und
 * loest beim Wechsel den Klick des gewaehlten Eintrags aus; die Gruppen
 * fallen dabei weg.
 */
@Component({
  selector: 'z-sidebar',
  imports: [ZSelect],
  template: `
    <nav class="z-side" [attr.aria-label]="ariaLabel() || null"><ng-content /></nav>
    <z-select>
      <select [attr.aria-label]="ariaLabel() || null" (change)="waehle($event)">
        @for (eintrag of eintraege(); track eintrag; let i = $index) {
          <option [selected]="eintrag.active()">{{ beschriftungen()[i] }}</option>
        }
      </select>
    </z-select>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSidebar {
  readonly ariaLabel = input('');

  protected readonly eintraege = contentChildren(ZSidebarItem, { descendants: true });
  protected readonly beschriftungen = signal<string[]>([]);

  constructor() {
    // Die Beschriftungen stehen als projizierter Text im DOM und lassen sich
    // erst nach dem Rendern lesen, deshalb der Umweg ueber ein Signal.
    afterRenderEffect(() => {
      this.beschriftungen.set(this.eintraege().map((eintrag) => eintrag.beschriftung()));
    });
  }

  protected waehle(ereignis: Event): void {
    const ziel = ereignis.target as HTMLSelectElement;
    this.eintraege()[ziel.selectedIndex]?.klicke();
  }
}

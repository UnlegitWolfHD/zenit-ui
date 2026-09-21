import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, computed, inject } from '@angular/core';
import { ZButton, ZIcon, ZMenu, ZMenuItem, ZTheme } from 'zenit-ui';

/** The schemes of `themes.css` plus the one that follows the operating system. */
const SCHEMATA = [
  { id: 'dark', name: 'Dunkel', icon: 'dark_mode' },
  { id: 'light', name: 'Hell', icon: 'light_mode' },
  { id: 'contrast', name: 'Kontrast', icon: 'contrast' },
  { id: 'system', name: 'System', icon: 'brightness_auto' },
] as const;

/** The four accents of `accents.css`. `rot` is the default and carries no attribute. */
const AKZENTE = [
  { id: 'rot', name: 'Rot' },
  { id: 'blau', name: 'Blau' },
  { id: 'gruen', name: 'Grün' },
  { id: 'violett', name: 'Violett' },
] as const;

/**
 * Colour scheme and accent, for the end slot of the header.
 *
 * Two menus instead of two `z-select`s: a select needs a visible label and a
 * width of its own, and at 360px the header already carries brand, menu
 * button, credit and avatar. An icon button is 40px on mobile and says its
 * current value in its `aria-label`, so nothing is lost. The menus come from
 * the library, the state from `ZTheme`, which also stores it in
 * `localStorage`; this component holds none of its own.
 */
@Component({
  selector: 'app-theme-control',
  imports: [CdkMenuTrigger, ZButton, ZIcon, ZMenu, ZMenuItem],
  host: { class: 'z-cluster' },
  template: `
    <button
      zBtn="ghost"
      size="sm"
      iconOnly
      type="button"
      [attr.aria-label]="'Farbschema wählen, aktuell ' + schemaName()"
      [cdkMenuTriggerFor]="schemaMenue"
    >
      <z-icon [name]="schemaIcon()" />
    </button>
    <ng-template #schemaMenue>
      <z-menu>
        @for (schema of schemata; track schema.id) {
          <button
            zMenuItem
            [icon]="schema.icon"
            [attr.aria-current]="schema.id === theme.scheme() ? 'true' : null"
            (triggered)="theme.setScheme(schema.id)"
          >
            {{ schema.name }}
          </button>
        }
      </z-menu>
    </ng-template>

    <button
      zBtn="ghost"
      size="sm"
      iconOnly
      type="button"
      [attr.aria-label]="'Akzentfarbe wählen, aktuell ' + akzentName()"
      [cdkMenuTriggerFor]="akzentMenue"
    >
      <z-icon name="palette" />
    </button>
    <ng-template #akzentMenue>
      <z-menu>
        @for (akzent of akzente; track akzent.id) {
          <button
            zMenuItem
            [attr.aria-current]="akzent.id === theme.accent() ? 'true' : null"
            (triggered)="theme.setAccent(akzent.id)"
          >
            {{ akzent.name }}
          </button>
        }
      </z-menu>
    </ng-template>
  `,
})
export class ThemeControl {
  protected readonly theme = inject(ZTheme);
  protected readonly schemata = SCHEMATA;
  protected readonly akzente = AKZENTE;

  /** German name of the chosen scheme, for the label of the trigger. */
  protected readonly schemaName = computed(
    () => SCHEMATA.find((s) => s.id === this.theme.scheme())?.name ?? this.theme.scheme(),
  );

  /**
   * Icon of the chosen scheme. In system mode it shows what is applied right
   * now, so the button never claims a scheme the page is not in.
   */
  protected readonly schemaIcon = computed(() => {
    const gewaehlt = SCHEMATA.find((s) => s.id === this.theme.scheme());
    return gewaehlt?.id === 'system' || !gewaehlt
      ? (SCHEMATA.find((s) => s.id === this.theme.resolvedScheme())?.icon ?? 'brightness_auto')
      : gewaehlt.icon;
  });

  protected readonly akzentName = computed(
    () => AKZENTE.find((a) => a.id === this.theme.accent())?.name ?? this.theme.accent(),
  );
}

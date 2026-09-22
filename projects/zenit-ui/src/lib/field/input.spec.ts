import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZTooltip } from '../tooltip';
import { ZField } from './field';
import { ZInput } from './input';
import { ZInputGroup } from './input-group';

@Component({
  imports: [ZInput],
  template: `<input zInput [mono]="mono()" [invalid]="ungueltig()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InputHost {
  readonly mono = signal(false);
  readonly ungueltig = signal(false);
}

@Component({
  imports: [ZInput],
  template: `<input zInput size="sm" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class KleinHost {}

@Component({
  imports: [ZField, ZInput],
  template: `<z-field label="Servername" for="name" [hint]="hinweis()" [error]="fehler()"
    ><input zInput id="name"
  /></z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FeldHost {
  readonly hinweis = signal('Nur Buchstaben und Ziffern');
  readonly fehler = signal('');
}

@Component({
  imports: [ZField, ZInputGroup, ZInput],
  template: `<z-field label="Suche" for="suche" hint="Name oder IP">
    <z-input-group icon="search"><input zInput id="suche" /></z-input-group>
  </z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GruppeHost {}

@Component({
  imports: [ZField, ZInput],
  template: `<z-field label="Notiz" for="notiz" hint="Optional">
    <textarea zInput id="notiz"></textarea>
  </z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TextareaHost {}

/** The caller describes the control itself, and a tooltip writes there too. */
@Component({
  imports: [ZField, ZInput, ZTooltip],
  template: `<z-field label="Servername" for="name" [hint]="hinweis()" [error]="fehler()">
      <input
        zInput
        id="name"
        zTooltip="Steht später in der Serverliste"
        [attr.aria-describedby]="eigen()"
      />
    </z-field>
    <p id="p-eigen">Nur du siehst ihn.</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DreiSchreiberHost {
  readonly hinweis = signal('Nur Buchstaben und Ziffern');
  readonly fehler = signal('');
  readonly eigen = signal<string | null>('p-eigen');
}

/** A caller that marks the control invalid by hand. */
@Component({
  imports: [ZInput],
  template: `<input zInput aria-invalid="true" [invalid]="ungueltig()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenUngueltigHost {
  readonly ungueltig = signal(false);
}

/** A caller that binds `aria-invalid` and keeps writing while it is lent. */
@Component({
  imports: [ZInput],
  template: `<input zInput [attr.aria-invalid]="eigen()" [invalid]="ungueltig()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GebundenUngueltigHost {
  readonly ungueltig = signal(true);
  readonly eigen = signal<string | null>('false');
}

@Component({
  imports: [ZInput, FormsModule],
  template: `<input zInput [(ngModel)]="wert" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly wert = signal('Beispiel-Server');
}

@Component({
  imports: [ZInput, ReactiveFormsModule],
  template: `<input zInput [formControl]="steuerung" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl('Beispiel-Server');
}

describe('ZInput', () => {
  it('carries the class z-input', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').classList.contains('z-input')).toBe(true);
  });

  it('sets the class for size="sm" and keeps no native size attribute', () => {
    const fixture = TestBed.createComponent(KleinHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.classList.contains('z-input--sm')).toBe(true);
    expect(feld.hasAttribute('size')).toBe(false);
  });

  it('sets the class z-input--mono for mono', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.classList.contains('z-input--mono')).toBe(false);

    fixture.componentInstance.mono.set(true);
    fixture.detectChanges();

    expect(feld.classList.contains('z-input--mono')).toBe(true);
  });

  // Finding: invalid only sets aria-invalid, there is no error class of its own.
  // The border in danger hangs off the selector .z-input[aria-invalid="true"]
  // in _grundlage.css, which is why this test checks the attribute.
  it('reports the error state as aria-invalid="true"', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.ungueltig.set(true);
    fixture.detectChanges();

    expect(feld.getAttribute('aria-invalid')).toBe('true');
  });

  it('points with aria-describedby at hint and error of the surrounding z-field', () => {
    const fixture = TestBed.createComponent(FeldHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.getAttribute('aria-describedby')).toBe('name-hint');

    fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
    fixture.detectChanges();

    expect(feld.getAttribute('aria-describedby')).toBe('name-error');
  });

  it('finds the z-field through a z-input-group as well', () => {
    const fixture = TestBed.createComponent(GruppeHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
      'suche-hint',
    );
  });

  it('renders the icon inside the z-input-group', () => {
    const fixture = TestBed.createComponent(GruppeHost);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('z-input-group z-icon');

    expect(icon).not.toBeNull();
    expect(icon.textContent.trim()).toBe('search');
  });

  it('sets no aria-describedby outside a z-field', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('works with ngModel in both directions', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.value).toBe('Beispiel-Server');

    feld.value = 'Test';
    feld.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.wert()).toBe('Test');

    fixture.componentInstance.wert.set('Beispiel-Zwei');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(feld.value).toBe('Beispiel-Zwei');
  });

  it('works with formControl in both directions', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    expect(feld.value).toBe('Beispiel-Server');

    feld.value = 'Test';
    feld.dispatchEvent(new Event('input'));

    expect(steuerung.value).toBe('Test');

    steuerung.setValue('Beispiel-Zwei');
    fixture.detectChanges();

    expect(feld.value).toBe('Beispiel-Zwei');
  });

  it('is disabled through forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(feld.disabled).toBe(true);
  });

  describe('aria-describedby with three writers', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<DreiSchreiberHost>>;
    let feld: HTMLInputElement;
    let behaelter: OverlayContainer;

    function ids(): string[] {
      return (feld.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    }

    /** Opens the tooltip panel and returns its id. */
    function zeigeTooltip(): string {
      feld.dispatchEvent(new Event('mouseenter'));
      fixture.detectChanges();
      return behaelter.getContainerElement().querySelector('.z-tooltip')!.id;
    }

    beforeEach(() => {
      fixture = TestBed.createComponent(DreiSchreiberHost);
      behaelter = TestBed.inject(OverlayContainer);
      fixture.detectChanges();
      feld = fixture.nativeElement.querySelector('input');
    });

    it('adds the id of the field to what the caller wrote', () => {
      expect(ids()).toEqual(['name-hint', 'p-eigen']);
    });

    it('swaps hint for error and takes only its own token back', () => {
      fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
      fixture.detectChanges();

      expect(ids()).toEqual(['name-error', 'p-eigen']);

      fixture.componentInstance.fehler.set('');
      fixture.componentInstance.hinweis.set('');
      fixture.detectChanges();

      expect(ids()).toEqual(['p-eigen']);
    });

    it('puts its token back when the caller rewrites the whole attribute', async () => {
      fixture.componentInstance.eigen.set('p-zwei');
      fixture.detectChanges();
      // The MutationObserver answers in a microtask.
      await Promise.resolve();

      expect(ids()).toEqual(['name-hint', 'p-zwei']);
    });

    it('holds the token of the field, of the caller and of the tooltip at once', async () => {
      const panelId = zeigeTooltip();

      expect(ids()).toEqual(['name-hint', 'p-eigen', panelId]);

      fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
      fixture.detectChanges();
      await Promise.resolve();

      expect(ids()).toEqual(['name-error', 'p-eigen', panelId]);

      fixture.componentInstance.fehler.set('');
      fixture.componentInstance.hinweis.set('');
      fixture.detectChanges();
      await Promise.resolve();

      expect(ids()).toEqual(['p-eigen', panelId]);
    });

    it('writes no token twice when the caller names the id of the field itself', async () => {
      fixture.componentInstance.eigen.set('name-hint');
      fixture.detectChanges();
      await Promise.resolve();

      expect(ids()).toEqual(['name-hint']);
    });

    it('removes the attribute when the last token is gone', () => {
      fixture.componentInstance.eigen.set(null);
      fixture.componentInstance.hinweis.set('');
      fixture.detectChanges();

      expect(feld.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  it('keeps an aria-invalid the caller wrote when invalid goes back to false', () => {
    const fixture = TestBed.createComponent(EigenUngueltigHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.ungueltig.set(true);
    fixture.detectChanges();
    fixture.componentInstance.ungueltig.set(false);
    fixture.detectChanges();

    expect(feld.getAttribute('aria-invalid')).toBe('true');
  });

  it('holds aria-invalid against a caller binding and gives back its latest value', async () => {
    const fixture = TestBed.createComponent(GebundenUngueltigHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.eigen.set('grammar');
    fixture.detectChanges();
    // The MutationObserver answers in a microtask.
    await Promise.resolve();

    expect(feld.getAttribute('aria-invalid'), 'die Eingabe hält').toBe('true');

    fixture.componentInstance.ungueltig.set(false);
    fixture.detectChanges();

    expect(feld.getAttribute('aria-invalid'), 'der letzte Wert des Aufrufers').toBe('grammar');
  });

  it('applies to textarea[zInput] in the same way', () => {
    const fixture = TestBed.createComponent(TextareaHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('textarea');

    expect(feld.classList.contains('z-input')).toBe(true);
    expect(feld.getAttribute('aria-describedby')).toBe('notiz-hint');
  });
});

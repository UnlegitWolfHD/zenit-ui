import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZEmptyAction, ZEmptyState } from './empty-state';

@Component({
  imports: [ZEmptyState],
  template: `<z-empty-state [title]="titel()"
    >Wir antworten in der Regel innerhalb von 24 Stunden.</z-empty-state
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyHost {
  readonly titel = signal('');
}

@Component({
  imports: [ZEmptyState, ZEmptyAction],
  template: `<z-empty-state title="Keine offenen Tickets"
    >Wir antworten in der Regel innerhalb von 24 Stunden.<button zEmptyAction type="button">
      Ticket erstellen
    </button></z-empty-state
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AktionHost {}

@Component({
  imports: [ZEmptyState],
  template: `<z-empty-state title="Seite nicht gefunden" [headingLevel]="stufe()"
    >Die Adresse gibt es nicht.</z-empty-state
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StufenHost {
  readonly stufe = signal<1 | 2 | 3 | 4 | undefined>(undefined);
}

@Component({
  imports: [ZEmptyState],
  template: `<z-empty-state title="Seite nicht gefunden" headingLevel="1">Text</z-empty-state>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AttributHost {}

describe('ZEmptyState', () => {
  it('carries the class z-empty and shows no title without one', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();
    const leer = fixture.nativeElement.querySelector('z-empty-state');

    expect(leer.classList.contains('z-empty')).toBe(true);
    expect(leer.querySelector('.z-empty__title')).toBeNull();
  });

  it('shows the title from title before the text', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.componentInstance.titel.set('Keine offenen Tickets');
    fixture.detectChanges();
    const leer = fixture.nativeElement.querySelector('z-empty-state');

    expect(leer.querySelector('.z-empty__title').textContent.trim()).toBe('Keine offenen Tickets');
    expect(leer.firstElementChild.classList.contains('z-empty__title')).toBe(true);
  });

  it('shows the projected text in the body', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-empty__body').textContent.trim()).toBe(
      'Wir antworten in der Regel innerhalb von 24 Stunden.',
    );
  });

  it('carries no native title attribute despite the title input', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.componentInstance.titel.set('Keine offenen Tickets');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-empty-state').hasAttribute('title')).toBe(false);
  });

  it('projects the slot zEmptyAction after the body, not into it', () => {
    const fixture = TestBed.createComponent(AktionHost);
    fixture.detectChanges();
    const leer = fixture.nativeElement.querySelector('z-empty-state');
    const button = leer.querySelector('button[zEmptyAction]');

    expect(button.textContent.trim()).toBe('Ticket erstellen');
    expect(button.parentElement).toBe(leer);
    expect(leer.querySelector('.z-empty__body button')).toBeNull();
    expect(leer.querySelector('.z-empty__body').textContent.trim()).toBe(
      'Wir antworten in der Regel innerhalb von 24 Stunden.',
    );
  });

  it('keeps the title a span without headingLevel and makes it h1 to h4 with one', () => {
    const fixture = TestBed.createComponent(StufenHost);
    fixture.detectChanges();
    const titel = () => fixture.nativeElement.querySelector('.z-empty__title') as HTMLElement;

    expect(titel().tagName).toBe('SPAN');

    for (const stufe of [1, 2, 3, 4] as const) {
      fixture.componentInstance.stufe.set(stufe);
      fixture.detectChanges();

      expect(titel().tagName).toBe(`H${stufe}`);
      expect(titel().textContent?.trim()).toBe('Seite nicht gefunden');
      expect(fixture.nativeElement.querySelectorAll('.z-empty__title').length).toBe(1);
    }
  });

  it('takes headingLevel as a static attribute', () => {
    const fixture = TestBed.createComponent(AttributHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1.z-empty__title')?.textContent?.trim()).toBe(
      'Seite nicht gefunden',
    );
  });
});

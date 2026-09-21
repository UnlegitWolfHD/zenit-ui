import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZFaq } from './faq';

@Component({
  imports: [ZFaq],
  template: `<z-faq [question]="frage()" [open]="offen()"
    >Nach der Bestellung dauert die Einrichtung in der Regel etwa 60 Sekunden.</z-faq
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FaqHost {
  readonly frage = signal('Wie schnell ist mein Server online?');
  readonly offen = signal(false);
}

describe('ZFaq', () => {
  function baue(): { details: HTMLDetailsElement; host: FaqHost; rendere: () => void } {
    const fixture = TestBed.createComponent(FaqHost);
    fixture.detectChanges();
    return {
      details: fixture.nativeElement.querySelector('details.z-faq'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('uses a native details with a summary', () => {
    const { details } = baue();

    expect(details.tagName).toBe('DETAILS');
    expect(details.firstElementChild?.tagName).toBe('SUMMARY');
  });

  it('puts the question into the summary', () => {
    const { details, host, rendere } = baue();

    expect(details.querySelector('summary')?.textContent?.trim()).toBe(
      'Wie schnell ist mein Server online?',
    );

    host.frage.set('Kann ich später mehr RAM buchen?');
    rendere();

    expect(details.querySelector('summary')?.textContent?.trim()).toBe(
      'Kann ich später mehr RAM buchen?',
    );
  });

  it('stays closed by default and opens with the open input', () => {
    const { details, host, rendere } = baue();

    expect(details.open).toBe(false);

    host.offen.set(true);
    rendere();

    expect(details.open).toBe(true);

    host.offen.set(false);
    rendere();

    expect(details.open).toBe(false);
  });

  it('shows the projected answer in z-faq__body', () => {
    const { details } = baue();
    const body = details.querySelector('.z-faq__body') as HTMLElement;

    expect(body.tagName).toBe('P');
    expect(body.textContent?.trim()).toBe(
      'Nach der Bestellung dauert die Einrichtung in der Regel etwa 60 Sekunden.',
    );
  });
});

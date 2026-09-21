import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZTooltip } from './tooltip';

@Component({
  imports: [ZTooltip],
  template: `<button [zTooltip]="text()">Aktualisieren</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TooltipHost {
  readonly text = signal('Server neu starten');
}

/** Grace period of the directive between leaving and closing. */
const NACHLAUF = 100;

describe('ZTooltip', () => {
  let fixture: ComponentFixture<TooltipHost>;
  let ausloeser: HTMLButtonElement;
  let behaelter: OverlayContainer;

  function flaeche(): HTMLElement | null {
    return behaelter.getContainerElement().querySelector('.z-tooltip');
  }

  function pane(): HTMLElement {
    return behaelter.getContainerElement().querySelector('.z-tooltip-pane')!;
  }

  function loese(name: string): void {
    ausloeser.dispatchEvent(new Event(name, { bubbles: name.startsWith('focus') }));
    fixture.detectChanges();
  }

  function loeseAm(ziel: HTMLElement, name: string): void {
    ziel.dispatchEvent(new Event(name));
    fixture.detectChanges();
  }

  /** Lets the grace period run out and renders what came of it. */
  function warteAb(): void {
    vi.advanceTimersByTime(NACHLAUF);
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(TooltipHost);
    behaelter = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
    ausloeser = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    behaelter.ngOnDestroy();
    vi.useRealTimers();
  });

  it('shows the panel on mouseenter and takes it back on mouseleave', () => {
    loese('mouseenter');

    expect(flaeche()?.textContent?.trim()).toBe('Server neu starten');

    loese('mouseleave');
    warteAb();

    expect(flaeche()).toBeNull();
  });

  it('shows the panel on focusin and takes it back on focusout', () => {
    loese('focusin');

    expect(flaeche()).not.toBeNull();

    loese('focusout');

    expect(flaeche()).toBeNull();
  });

  it('gives the panel role tooltip and an id and points at it with aria-describedby', () => {
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);

    loese('mouseenter');
    const panel = flaeche();

    expect(panel?.getAttribute('role')).toBe('tooltip');
    expect(panel?.id).toBeTruthy();
    expect(ausloeser.getAttribute('aria-describedby')).toBe(panel?.id);

    loese('mouseleave');
    warteAb();

    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('closes the panel with Escape', () => {
    loese('mouseenter');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(flaeche()).toBeNull();
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('shows nothing without text', () => {
    fixture.componentInstance.text.set('');
    fixture.detectChanges();

    loese('mouseenter');
    loese('focusin');

    expect(flaeche()).toBeNull();
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('follows a text change while the panel is open', () => {
    loese('mouseenter');

    expect(flaeche()?.textContent?.trim()).toBe('Server neu starten');

    fixture.componentInstance.text.set('Server läuft bereits');
    fixture.detectChanges();

    expect(flaeche()?.textContent?.trim()).toBe('Server läuft bereits');
  });

  it('closes the panel when the text becomes empty while open', () => {
    loese('mouseenter');

    expect(flaeche()).not.toBeNull();

    fixture.componentInstance.text.set('');
    fixture.detectChanges();

    expect(flaeche()).toBeNull();
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('never holds more than one panel', () => {
    loese('mouseenter');
    loese('focusin');
    loese('mouseenter');

    expect(behaelter.getContainerElement().querySelectorAll('.z-tooltip')).toHaveLength(1);

    loese('mouseleave');
    loese('mouseenter');
    warteAb();

    expect(behaelter.getContainerElement().querySelectorAll('.z-tooltip')).toHaveLength(1);
  });

  it('takes the panel with it when the directive is destroyed', () => {
    loese('mouseenter');

    expect(flaeche()).not.toBeNull();

    fixture.destroy();

    expect(flaeche()).toBeNull();
  });

  // WCAG 2.1 SC 1.4.13 "Hoverable": the panel stands 8px away on the body, so
  // it may only close once the pointer has had the time to reach it.
  it('keeps the panel standing during the grace period after mouseleave', () => {
    loese('mouseenter');
    loese('mouseleave');

    vi.advanceTimersByTime(NACHLAUF - 1);
    fixture.detectChanges();

    expect(flaeche()).not.toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    expect(flaeche()).toBeNull();
  });

  it('keeps the panel while the pointer rests on it and closes when it leaves both', () => {
    loese('mouseenter');
    loese('mouseleave');
    loeseAm(pane(), 'mouseenter');
    warteAb();

    expect(flaeche()).not.toBeNull();

    loeseAm(pane(), 'mouseleave');
    warteAb();

    expect(flaeche()).toBeNull();
  });

  it('does not close on mouseleave while the trigger holds the focus', () => {
    ausloeser.focus();
    loese('focusin');
    loese('mouseenter');
    loese('mouseleave');
    warteAb();

    expect(flaeche()).not.toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    ausloeser.blur();
    loese('focusout');

    expect(flaeche()).toBeNull();
  });

  it('keeps the panel on focusout while the pointer still rests on it', () => {
    loese('mouseenter');
    loeseAm(pane(), 'mouseenter');
    loese('focusout');

    expect(flaeche()).not.toBeNull();
  });

  it('closes at once with Escape although the grace period is still running', () => {
    loese('mouseenter');
    loese('mouseleave');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(flaeche()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  /** A scroll somewhere in the document, heard in the capture phase. */
  function scrolleAn(ziel: EventTarget): void {
    ziel.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  }

  /** Puts the trigger into a box of its own, which jsdom does not do. */
  function liegtBei(top: number, bottom: number): void {
    ausloeser.getBoundingClientRect = () => ({ top, bottom, left: 10, right: 30 }) as DOMRect;
  }

  // The reposition strategy builds on ScrollDispatcher, which only hears the
  // window and containers marked cdkScrollable; the directive therefore listens
  // on the document in the capture phase.
  it('takes the panel back when anything around the trigger scrolls', () => {
    loese('mouseenter');

    scrolleAn(document);

    expect(flaeche()).toBeNull();
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('ignores a scroll inside its own panel', () => {
    loese('mouseenter');

    scrolleAn(pane());

    expect(flaeche()).not.toBeNull();
  });

  // WCAG 2.1 SC 1.4.13 "Persistent": as long as the trigger holds the focus the
  // panel stays and follows the scroll.
  it('keeps the panel on a scroll while the trigger holds the focus', () => {
    liegtBei(10, 30);
    ausloeser.focus();
    loese('focusin');

    scrolleAn(document);

    expect(flaeche()).not.toBeNull();
  });

  it('closes when the scroll pushes the focused trigger out of the scroller', () => {
    liegtBei(-80, -60);
    ausloeser.focus();
    loese('focusin');

    scrolleAn(document);

    expect(flaeche()).toBeNull();
  });

  it('listens for scrolling only while the panel stands', () => {
    const horcher = vi.spyOn(document, 'addEventListener');

    loese('mouseenter');
    // ScrollDispatcher of the CDK registers one of its own without options, so
    // the one with the options object is the one of the directive.
    const optionen = horcher.mock.calls
      .map(([typ, , optionen]) => (typ === 'scroll' ? optionen : undefined))
      .find((optionen) => typeof optionen === 'object' && optionen !== null) as
      AddEventListenerOptions | undefined;

    expect(optionen).toMatchObject({ capture: true, passive: true });
    expect(optionen?.signal?.aborted).toBe(false);

    loese('mouseleave');
    warteAb();

    expect(optionen?.signal?.aborted).toBe(true);
  });

  it('clears the pending timer when the directive is destroyed', () => {
    // Tearing an open overlay down schedules timers of the CDK itself. That is
    // the baseline the grace period of the directive has to vanish into, so it
    // is measured once with the grace period already cancelled.
    loese('mouseenter');
    loese('mouseleave');
    loese('mouseenter');
    fixture.destroy();
    const grundlast = vi.getTimerCount();
    vi.clearAllTimers();

    fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();
    ausloeser = fixture.nativeElement.querySelector('button');
    loese('mouseenter');
    loese('mouseleave');

    expect(vi.getTimerCount()).toBe(1);

    fixture.destroy();

    expect(vi.getTimerCount()).toBe(grundlast);
  });
});

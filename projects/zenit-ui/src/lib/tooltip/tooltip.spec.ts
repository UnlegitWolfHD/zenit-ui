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

describe('ZTooltip', () => {
  let fixture: ComponentFixture<TooltipHost>;
  let ausloeser: HTMLButtonElement;
  let behaelter: OverlayContainer;

  function flaeche(): HTMLElement | null {
    return behaelter.getContainerElement().querySelector('.z-tooltip');
  }

  function loese(name: string): void {
    ausloeser.dispatchEvent(new Event(name, { bubbles: name.startsWith('focus') }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(TooltipHost);
    behaelter = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
    ausloeser = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    behaelter.ngOnDestroy();
  });

  it('shows the panel on mouseenter and takes it back on mouseleave', () => {
    loese('mouseenter');

    expect(flaeche()?.textContent?.trim()).toBe('Server neu starten');

    loese('mouseleave');

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

  it('never holds more than one panel', () => {
    loese('mouseenter');
    loese('focusin');
    loese('mouseenter');

    expect(behaelter.getContainerElement().querySelectorAll('.z-tooltip')).toHaveLength(1);

    loese('mouseleave');
    loese('mouseenter');

    expect(behaelter.getContainerElement().querySelectorAll('.z-tooltip')).toHaveLength(1);
  });

  it('takes the panel with it when the directive is destroyed', () => {
    loese('mouseenter');

    expect(flaeche()).not.toBeNull();

    fixture.destroy();

    expect(flaeche()).toBeNull();
  });
});

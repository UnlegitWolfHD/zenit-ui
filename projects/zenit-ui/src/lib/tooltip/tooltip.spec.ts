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

  it('zeigt die Flaeche bei mouseenter und nimmt sie bei mouseleave zurueck', () => {
    loese('mouseenter');

    expect(flaeche()?.textContent?.trim()).toBe('Server neu starten');

    loese('mouseleave');

    expect(flaeche()).toBeNull();
  });

  it('zeigt die Flaeche bei focusin und nimmt sie bei focusout zurueck', () => {
    loese('focusin');

    expect(flaeche()).not.toBeNull();

    loese('focusout');

    expect(flaeche()).toBeNull();
  });

  it('gibt der Flaeche role tooltip und eine id und verweist mit aria-describedby darauf', () => {
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);

    loese('mouseenter');
    const panel = flaeche();

    expect(panel?.getAttribute('role')).toBe('tooltip');
    expect(panel?.id).toBeTruthy();
    expect(ausloeser.getAttribute('aria-describedby')).toBe(panel?.id);

    loese('mouseleave');

    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('schliesst die Flaeche mit Escape', () => {
    loese('mouseenter');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(flaeche()).toBeNull();
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('zeigt ohne Text nichts', () => {
    fixture.componentInstance.text.set('');
    fixture.detectChanges();

    loese('mouseenter');
    loese('focusin');

    expect(flaeche()).toBeNull();
    expect(ausloeser.hasAttribute('aria-describedby')).toBe(false);
  });

  it('haelt nie mehr als eine Flaeche', () => {
    loese('mouseenter');
    loese('focusin');
    loese('mouseenter');

    expect(behaelter.getContainerElement().querySelectorAll('.z-tooltip')).toHaveLength(1);

    loese('mouseleave');
    loese('mouseenter');

    expect(behaelter.getContainerElement().querySelectorAll('.z-tooltip')).toHaveLength(1);
  });

  it('nimmt die Flaeche mit, wenn die Direktive zerstoert wird', () => {
    loese('mouseenter');

    expect(flaeche()).not.toBeNull();

    fixture.destroy();

    expect(flaeche()).toBeNull();
  });
});

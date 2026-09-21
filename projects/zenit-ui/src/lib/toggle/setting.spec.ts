import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSetting } from './setting';
import { ZToggle } from './toggle';

@Component({
  imports: [ZSetting, ZToggle],
  template: `<z-setting
    title="Automatischer Neustart"
    [key]="schluessel()"
    [description]="wirkung()"
    titleId="neustart-titel"
  >
    <z-toggle [(checked)]="an" ariaLabelledby="neustart-titel" />
  </z-setting>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SettingHost {
  readonly an = signal(false);
  readonly schluessel = signal('auto_restart');
  readonly wirkung = signal('Startet den Server nach einem Absturz neu.');
}

describe('ZSetting', () => {
  it('carries the class z-setting and renders the title with titleId', () => {
    const fixture = TestBed.createComponent(SettingHost);
    fixture.detectChanges();
    const zeile: HTMLElement = fixture.nativeElement.querySelector('z-setting');
    const titel = zeile.querySelector('.z-setting__title');

    expect(zeile.classList.contains('z-setting')).toBe(true);
    expect(titel?.textContent?.trim()).toBe('Automatischer Neustart');
    expect(titel?.getAttribute('id')).toBe('neustart-titel');
  });

  // The browser hangs its own tooltip on a static title="…". Because title is
  // an input at the same time, the component clears the attribute away.
  it('keeps no native title attribute on the host', () => {
    const fixture = TestBed.createComponent(SettingHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-setting').hasAttribute('title')).toBe(false);
  });

  it('renders the key in mono and the effect as the description', () => {
    const fixture = TestBed.createComponent(SettingHost);
    fixture.detectChanges();
    const zeile: HTMLElement = fixture.nativeElement.querySelector('z-setting');
    const schluessel = zeile.querySelector('.z-mono');

    expect(schluessel?.textContent?.trim()).toBe('auto_restart');
    expect(schluessel?.classList.contains('z-subtle')).toBe(true);
    expect(zeile.querySelector('.z-muted')?.textContent?.trim()).toBe(
      'Startet den Server nach einem Absturz neu.',
    );
  });

  it('leaves key and description out when they are empty', () => {
    const fixture = TestBed.createComponent(SettingHost);
    fixture.componentInstance.schluessel.set('');
    fixture.componentInstance.wirkung.set('');
    fixture.detectChanges();
    const zeile: HTMLElement = fixture.nativeElement.querySelector('z-setting');

    expect(zeile.querySelector('.z-mono')).toBeNull();
    expect(zeile.querySelector('.z-muted')).toBeNull();
  });

  it('projects the control and lets its ariaLabelledby point at the title', () => {
    const fixture = TestBed.createComponent(SettingHost);
    fixture.detectChanges();
    const zeile: HTMLElement = fixture.nativeElement.querySelector('z-setting');
    const schalter = zeile.querySelector('z-toggle input');

    expect(schalter).not.toBeNull();
    expect(schalter?.getAttribute('aria-labelledby')).toBe('neustart-titel');
    expect(zeile.querySelector('.z-setting__title')?.getAttribute('id')).toBe(
      schalter?.getAttribute('aria-labelledby'),
    );
  });
});

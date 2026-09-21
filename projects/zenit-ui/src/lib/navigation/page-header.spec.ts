import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZPageHeader } from './page-header';

@Component({
  imports: [ZPageHeader],
  template: `<z-page-header [title]="titel()" [sub]="unterzeile()">
    <button type="button">Server erstellen</button>
  </z-page-header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PageHeaderHost {
  readonly titel = signal('Meine Server');
  readonly unterzeile = signal('');
}

@Component({
  imports: [ZPageHeader],
  template: `<z-page-header title="Meine Server" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StatischerTitelHost {}

describe('ZPageHeader', () => {
  it('renders title as h1', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.detectChanges();
    const titel = fixture.nativeElement.querySelector('h1.z-pagehead__title');

    expect(titel.textContent.trim()).toBe('Meine Server');
    expect(fixture.nativeElement.querySelector('z-page-header').classList).toContain('z-pagehead');
  });

  it('renders sub only when it is set', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pagehead__sub')).toBeNull();

    fixture.componentInstance.unterzeile.set('3 Server, 1 gestoppt');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-pagehead__sub').textContent.trim()).toBe(
      '3 Server, 1 gestoppt',
    );
  });

  it('projects the content into the actions slot next to the title', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.detectChanges();
    const aktionen = fixture.nativeElement.querySelector('.z-pagehead__actions');

    expect(aktionen.querySelector('button').textContent.trim()).toBe('Server erstellen');
    expect(aktionen.querySelector('h1')).toBeNull();
  });

  it('keeps no native title attribute on the host', () => {
    const fixture = TestBed.createComponent(StatischerTitelHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('z-page-header');

    expect(host.hasAttribute('title')).toBe(false);
    expect(host.querySelector('h1.z-pagehead__title').textContent.trim()).toBe('Meine Server');
  });
});

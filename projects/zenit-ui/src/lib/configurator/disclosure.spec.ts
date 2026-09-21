import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZDisclosure } from './disclosure';

@Component({
  imports: [ZDisclosure],
  template: `<z-disclosure title="Expertenmodus" [summary]="kurz()" [(open)]="offen">
    <p class="felder">Java-Version</p>
  </z-disclosure>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly offen = signal(false);
  readonly kurz = signal('Build, Java-Version, Startscript');
}

function details(fixture: ComponentFixture<Host>): HTMLDetailsElement {
  return fixture.nativeElement.querySelector('details.z-disclosure');
}

describe('ZDisclosure', () => {
  it('is a native details with title, short line and body', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const block = details(fixture);

    expect(block.tagName).toBe('DETAILS');
    expect(block.querySelector('summary')?.textContent).toContain('Expertenmodus');
    expect(block.querySelector('summary small')?.textContent?.trim()).toBe(
      'Build, Java-Version, Startscript',
    );
    expect(block.querySelector('.z-disclosure__body .felder')).not.toBeNull();
    expect(block.open).toBe(false);
  });

  it('keeps no native title attribute on the host', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.querySelector('z-disclosure');

    expect(host.hasAttribute('title')).toBe(false);
  });

  it('opens when the caller writes open', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    fixture.componentInstance.offen.set(true);
    fixture.detectChanges();

    expect(details(fixture).open).toBe(true);
  });

  it('reports the visitor toggling it back through the native event', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const block = details(fixture);

    block.open = true;
    block.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();

    expect(fixture.componentInstance.offen()).toBe(true);

    block.open = false;
    block.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();

    expect(fixture.componentInstance.offen()).toBe(false);
  });

  it('leaves the short line out when it is empty', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    fixture.componentInstance.kurz.set('');
    fixture.detectChanges();

    expect(details(fixture).querySelector('summary small')).toBeNull();
  });
});

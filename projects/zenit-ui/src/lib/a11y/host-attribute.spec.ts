import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZField } from '../field/field';
import { ZInput } from '../field/input';
import { ZTokenAttribut } from './host-attribute';

@Component({
  imports: [ZField, ZInput],
  template: `<z-field label="Servername" for="name" [hint]="hinweis()"
    ><input zInput id="name"
  /></z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FeldHost {
  readonly hinweis = signal('Nur Buchstaben und Ziffern');
}

describe('ZTokenAttribut', () => {
  it('writes its token without a MutationObserver, as on the server', () => {
    // The observer used to be created from the first change detection run, not
    // from a DOM event, so a field with a hint threw on the server.
    vi.stubGlobal('MutationObserver', undefined);
    try {
      const fixture = TestBed.createComponent(FeldHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
        'name-hint',
      );

      fixture.componentInstance.hinweis.set('');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
        false,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('refuses a second writer on the same end of the same attribute', () => {
    const el = document.createElement('input');
    const erster = new ZTokenAttribut(el, 'aria-describedby', 'vorn');
    const zweiter = new ZTokenAttribut(el, 'aria-describedby', 'vorn');
    erster.setze('a');

    expect(() => zweiter.setze('b')).toThrowError(/two writers keep the front/);

    // The other end is free, and so is the same end once the first lets go.
    expect(() => new ZTokenAttribut(el, 'aria-describedby', 'hinten').setze('c')).not.toThrow();
    erster.setze(null);

    expect(() => zweiter.setze('b')).not.toThrow();
  });
});

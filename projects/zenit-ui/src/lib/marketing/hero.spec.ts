import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZHero, ZHeroActions, ZHeroAside } from './hero';

@Component({
  imports: [ZHero],
  template: `<z-hero [title]="titel()" [lead]="lead()" [note]="note()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HeroHost {
  readonly titel = signal('Gameserver aus Nürnberg. In etwa 60 Sekunden online.');
  readonly lead = signal('');
  readonly note = signal('');
}

@Component({
  imports: [ZHero, ZHeroActions, ZHeroAside],
  template: `<z-hero title="Gameserver aus Nürnberg." note="Keine Kreditkarte nötig">
    <div zHeroActions><button type="button">Server erstellen</button></div>
    <div zHeroAside>Günstigste Spiele</div>
  </z-hero>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SlotHost {}

describe('ZHero', () => {
  it('carries the class z-hero and puts the title into the h1', () => {
    const fixture = TestBed.createComponent(HeroHost);
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector('z-hero');
    const titel = hero.querySelector('h1');

    expect(hero.classList.contains('z-hero')).toBe(true);
    expect(titel.classList.contains('z-hero__title')).toBe(true);
    expect(titel.textContent.trim()).toBe('Gameserver aus Nürnberg. In etwa 60 Sekunden online.');
  });

  it('shows the lead only when it is set', () => {
    const fixture = TestBed.createComponent(HeroHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-hero__lead')).toBeNull();

    fixture.componentInstance.lead.set('Spiel wählen, RAM einstellen, starten.');
    fixture.detectChanges();
    const lead = fixture.nativeElement.querySelector('p.z-hero__lead');

    expect(lead.textContent.trim()).toBe('Spiel wählen, RAM einstellen, starten.');
  });

  it('shows the note only when it is set', () => {
    const fixture = TestBed.createComponent(HeroHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-hero__note')).toBeNull();

    fixture.componentInstance.note.set('Keine Kreditkarte nötig');
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('p.z-hero__note');

    expect(note.textContent.trim()).toBe('Keine Kreditkarte nötig');
  });

  it('projects zHeroActions into the text column, between lead and note', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector('z-hero');
    const aktionen = hero.querySelector('[zHeroActions]');

    expect(aktionen.classList.contains('z-hero__actions')).toBe(true);
    expect(aktionen.parentElement).toBe(hero.firstElementChild);
    expect(aktionen.nextElementSibling.classList.contains('z-hero__note')).toBe(true);
  });

  it('projects zHeroAside as the second column of the hero', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector('z-hero');
    const aside = hero.querySelector('[zHeroAside]');

    expect(aside.textContent.trim()).toBe('Günstigste Spiele');
    expect(aside.parentElement).toBe(hero);
    expect(hero.firstElementChild.querySelector('[zHeroAside]')).toBeNull();
  });
});

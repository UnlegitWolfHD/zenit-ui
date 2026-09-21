import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZHero, ZHeroActions, ZHeroAside } from './hero';

@Component({
  imports: [ZHero],
  template: `<z-hero [title]="titel()" [lead]="lead()" [note]="note()" [headingLevel]="ebene()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HeroHost {
  readonly titel = signal('Gameserver aus Nürnberg. In etwa 60 Sekunden online.');
  readonly lead = signal('');
  readonly note = signal('');
  readonly ebene = signal<1 | 2 | 3>(1);
}

/** The level as a static attribute, which reaches the input as a string. */
@Component({
  imports: [ZHero],
  template: `<z-hero title="Gameserver aus Nürnberg." headingLevel="2" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AttributHost {}

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

  it('renders h2 or h3 for headingLevel, with the same class and text', () => {
    const fixture = TestBed.createComponent(HeroHost);
    fixture.componentInstance.ebene.set(2);
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector('z-hero');

    expect(hero.querySelector('h1')).toBeNull();
    expect(hero.querySelector('h2.z-hero__title').textContent.trim()).toBe(
      'Gameserver aus Nürnberg. In etwa 60 Sekunden online.',
    );

    fixture.componentInstance.ebene.set(3);
    fixture.detectChanges();

    expect(hero.querySelector('h2')).toBeNull();
    expect(hero.querySelector('h3.z-hero__title').textContent.trim()).toBe(
      'Gameserver aus Nürnberg. In etwa 60 Sekunden online.',
    );

    fixture.componentInstance.ebene.set(1);
    fixture.detectChanges();

    expect(hero.querySelector('h3')).toBeNull();
    expect(hero.querySelector('h1.z-hero__title')).not.toBeNull();
  });

  it('takes headingLevel from a static attribute as a number', () => {
    const fixture = TestBed.createComponent(AttributHost);
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector('z-hero');

    expect(hero.querySelector('h1')).toBeNull();
    expect(hero.querySelector('h2.z-hero__title').textContent.trim()).toBe(
      'Gameserver aus Nürnberg.',
    );
  });

  it('keeps the heading in the text column, before lead and actions', () => {
    const fixture = TestBed.createComponent(HeroHost);
    fixture.componentInstance.ebene.set(2);
    fixture.componentInstance.lead.set('Spiel wählen, RAM einstellen, starten.');
    fixture.detectChanges();
    const hero = fixture.nativeElement.querySelector('z-hero');
    const titel = hero.querySelector('.z-hero__title');

    expect(titel.parentElement).toBe(hero.firstElementChild);
    expect(titel.nextElementSibling.classList.contains('z-hero__lead')).toBe(true);
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

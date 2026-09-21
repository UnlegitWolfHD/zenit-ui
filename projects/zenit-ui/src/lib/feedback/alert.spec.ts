import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZAlert, ZAlertAction, ZAlertStatus } from './alert';

@Component({
  imports: [ZAlert],
  template: `<z-alert [status]="status()" [title]="titel()" [icon]="icon()"
    >Der Speicher ist zu 95 % belegt.</z-alert
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AlertHost {
  readonly status = signal<ZAlertStatus>('neutral');
  readonly titel = signal('');
  readonly icon = signal('');
}

@Component({
  imports: [ZAlert, ZAlertAction],
  template: `<z-alert status="danger" title="Backup fehlgeschlagen" icon="error"
    >Der Speicher ist voll. Lösche alte Backups und starte erneut.<button zAlertAction type="button">
      Speicher ansehen
    </button></z-alert
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AktionHost {}

describe('ZAlert', () => {
  it('traegt z-alert und fuer neutral keinen Modifier', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('z-alert');

    expect(alert.classList.contains('z-alert')).toBe(true);
    expect(alert.className).toBe('z-alert');
  });

  it('setzt je Status die eigene Klasse und keine zweite', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('z-alert');
    const stati: ZAlertStatus[] = ['info', 'success', 'warning', 'danger'];

    for (const status of stati) {
      fixture.componentInstance.status.set(status);
      fixture.detectChanges();

      expect(alert.classList.contains(`z-alert--${status}`)).toBe(true);
      for (const andere of stati.filter((eine) => eine !== status)) {
        expect(alert.classList.contains(`z-alert--${andere}`)).toBe(false);
      }
    }

    fixture.componentInstance.status.set('neutral');
    fixture.detectChanges();

    expect(alert.className).toBe('z-alert');
  });

  it('zeigt den projizierten Text und ohne title keinen Titel', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-alert__title')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-alert__body').textContent.trim()).toBe(
      'Der Speicher ist zu 95 % belegt.',
    );
  });

  it('zeigt den Titel aus title vor dem Text', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.titel.set('Speicher wird knapp');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.z-alert__text');

    expect(text.querySelector('.z-alert__title').textContent.trim()).toBe('Speicher wird knapp');
    expect(text.firstElementChild.classList.contains('z-alert__title')).toBe(true);
  });

  it('zeigt das Icon aus icon und ohne icon keines', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-icon')).toBeNull();

    fixture.componentInstance.icon.set('warning');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-icon').textContent.trim()).toBe('warning');
  });

  it('traegt kein role am Host', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.status.set('danger');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-alert').hasAttribute('role')).toBe(false);
  });

  it('traegt trotz title kein natives title-Attribut am Host', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.titel.set('Speicher wird knapp');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('z-alert').hasAttribute('title')).toBe(false);
  });

  it('projiziert den Slot zAlertAction neben den Text, nicht hinein', () => {
    const fixture = TestBed.createComponent(AktionHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('z-alert');
    const button = alert.querySelector('button[zAlertAction]');

    expect(button.textContent.trim()).toBe('Speicher ansehen');
    expect(button.parentElement).toBe(alert);
    expect(alert.querySelector('.z-alert__text button')).toBeNull();
    expect(alert.querySelector('.z-alert__body').textContent.trim()).toBe(
      'Der Speicher ist voll. Lösche alte Backups und starte erneut.',
    );
  });
});

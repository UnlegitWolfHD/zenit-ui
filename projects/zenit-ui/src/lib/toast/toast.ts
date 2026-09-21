import { Injectable, signal } from '@angular/core';

export type ZToastStatus = 'neutral' | 'success' | 'danger';

export interface ZToastOptions {
  status?: ZToastStatus;
  /** Name der Material-Icon-Ligatur. */
  icon?: string;
  actionLabel?: string;
  action?: () => void;
  /** Millisekunden. 0 heisst: bleibt stehen, bis man ihn schliesst. */
  duration?: number;
}

export interface ZToastItem {
  readonly id: number;
  readonly text: string;
  readonly status: ZToastStatus;
  readonly icon: string;
  readonly actionLabel: string;
  readonly action?: () => void;
}

/** Hoechstens drei gleichzeitig, der neueste unten. */
const HOECHSTENS = 3;
const DAUER = 5000;
const DAUER_MIT_AKTION = 8000;

/**
 * Kurze Rueckmeldung ueber dem Inhalt. Das Bild haelt `z-toast-outlet`, das
 * einmal im Root-Template steht.
 */
@Injectable({ providedIn: 'root' })
export class ZToast {
  private letzteId = 0;
  private readonly timer = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly liste = signal<readonly ZToastItem[]>([]);

  /** Die sichtbaren Toasts, aeltester zuerst. */
  readonly toasts = this.liste.asReadonly();

  /** Zeigt einen Toast und liefert seine id fuer `dismiss`. */
  show(text: string, optionen: ZToastOptions = {}): number {
    while (this.liste().length >= HOECHSTENS) {
      this.dismiss(this.liste()[0].id);
    }
    const id = ++this.letzteId;
    this.liste.update((alt) => [
      ...alt,
      {
        id,
        text,
        status: optionen.status ?? 'neutral',
        icon: optionen.icon ?? '',
        actionLabel: optionen.actionLabel ?? '',
        action: optionen.action,
      },
    ]);
    const dauer = optionen.duration ?? (optionen.actionLabel ? DAUER_MIT_AKTION : DAUER);
    if (dauer > 0) {
      this.timer.set(
        id,
        setTimeout(() => this.dismiss(id), dauer),
      );
    }
    return id;
  }

  success(text: string, optionen: ZToastOptions = {}): number {
    return this.show(text, { status: 'success', icon: 'check_circle', ...optionen });
  }

  /** Fehler bleiben stehen, bis man sie schliesst. */
  error(text: string, optionen: ZToastOptions = {}): number {
    return this.show(text, { status: 'danger', icon: 'error', duration: 0, ...optionen });
  }

  /** Ohne id: schliesst alle. */
  dismiss(id?: number): void {
    for (const toast of this.liste()) {
      if (id === undefined || toast.id === id) {
        clearTimeout(this.timer.get(toast.id));
        this.timer.delete(toast.id);
      }
    }
    this.liste.update((alt) => (id === undefined ? [] : alt.filter((t) => t.id !== id)));
  }
}

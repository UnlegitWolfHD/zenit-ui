import { DestroyRef, inject, Service, signal } from '@angular/core';

/**
 * Status of a toast. `neutral` confirms, `info` adds a hint, `success` reports
 * a completed operation, `warning` something to act on soon and `danger` a
 * failed one. Only `danger` is announced as `role="alert"`; the other four are
 * announced politely.
 *
 * The status is never the colour alone: the toast text itself says what
 * happened, so a colour-blind reader and a screen reader get the same message.
 */
export type ZToastStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Options for a single toast, passed to `show`, `info`, `success`, `warning`
 * and `error`.
 */
export interface ZToastOptions {
  /** Color and announcement of the toast. Defaults to `neutral`. */
  status?: ZToastStatus;
  /**
   * Line above the message, as a full sentence or a short heading. Omitted
   * means the toast stays a single line, exactly as before.
   */
  title?: string;
  /** Name of the Material Icons ligature. Omitted means no icon. */
  icon?: string;
  /** Label of the extra action, for example `Rückgängig`. Omitted means no action button. */
  actionLabel?: string;
  /** Called when the action is used. The toast closes afterwards. */
  action?: () => void;
  /**
   * Milliseconds the toast stays visible. 0 means it stays until it is closed.
   * Without a value: 5000, or 8000 when `actionLabel` is set.
   */
  duration?: number;
}

/** A toast as it is currently shown. Read from `ZToast.toasts` by the outlet. */
export interface ZToastItem {
  /** Running number, also the handle for `dismiss`. */
  readonly id: number;
  /** The message, one sentence without a full stop. */
  readonly text: string;
  /** Line above the message, empty for a single-line toast. */
  readonly title: string;
  readonly status: ZToastStatus;
  /** Name of the Material Icons ligature, empty for no icon. */
  readonly icon: string;
  /** Label of the action button, empty for no action. */
  readonly actionLabel: string;
  /** Called when the action is used. */
  readonly action?: () => void;
}

/** At most three at a time, the newest at the bottom. */
const HOECHSTENS = 3;
const DAUER = 5000;
const DAUER_MIT_AKTION = 8000;

/**
 * Short feedback above the content: confirms that something happened and
 * disappears by itself. The visible part is `z-toast-outlet`, which stands once
 * in the root template.
 *
 * At most three toasts at a time, the newest at the bottom; a fourth one closes
 * the oldest. An error that requires an action on the page is an alert and not
 * a toast.
 *
 * A toast is one sentence by default. `title` adds a line above it, so a
 * service that carries a title, a message and a type of its own can hand all
 * three over: `title` to `title`, the message to `text`, the type to `status`.
 * The status never stands in the colour alone; the text says what happened.
 *
 * @example
 * ```html
 * <!-- once in the root template -->
 * <z-toast-outlet />
 * <button zBtn="secondary" (click)="toast.success('Eigenschaften gespeichert')">Speichern</button>
 * ```
 */
@Service()
export class ZToast {
  private letzteId = 0;
  private readonly timer = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly liste = signal<readonly ZToastItem[]>([]);

  /** The visible toasts, oldest first. Read by `z-toast-outlet`. */
  readonly toasts = this.liste.asReadonly();

  constructor() {
    // Closes all toasts so no timer keeps running when the application is torn
    // down.
    inject(DestroyRef).onDestroy(() => this.dismiss());
  }

  /**
   * Shows a toast and returns its id for `dismiss`. While three toasts are
   * already visible, the oldest one is closed first.
   *
   * @param text Message, one sentence without a full stop, in the past
   *   participle, for example `Eigenschaften gespeichert`.
   * @param optionen Status, title, icon, action and duration. Default duration:
   *   5000ms, 8000ms with `actionLabel`, 0 keeps the toast until it is closed.
   * @returns id of the new toast.
   */
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
        title: optionen.title ?? '',
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

  /**
   * Shows a hint: status `info` and the icon `info`, both overridable through
   * `optionen`. Duration and live region are those of a neutral toast: 5000ms,
   * 8000ms with `actionLabel`, announced politely.
   *
   * @returns id of the new toast.
   */
  info(text: string, optionen: ZToastOptions = {}): number {
    return this.show(text, { status: 'info', icon: 'info', ...optionen });
  }

  /**
   * Shows a success toast: status `success` and the icon `check_circle`, both
   * overridable through `optionen`.
   *
   * @returns id of the new toast.
   */
  success(text: string, optionen: ZToastOptions = {}): number {
    return this.show(text, { status: 'success', icon: 'check_circle', ...optionen });
  }

  /**
   * Shows a warning: status `warning` and the icon `warning`, both overridable
   * through `optionen`. A warning is not an error, so duration and live region
   * stay those of a neutral toast: 5000ms, 8000ms with `actionLabel`, announced
   * politely. Something the customer has to act on right now is an alert on the
   * page, not a toast.
   *
   * @returns id of the new toast.
   */
  warning(text: string, optionen: ZToastOptions = {}): number {
    return this.show(text, { status: 'warning', icon: 'warning', ...optionen });
  }

  /**
   * Shows an error toast: status `danger`, the icon `error` and `duration: 0`,
   * so it stays until it is closed. The outlet announces it with
   * `role="alert"`. All three values are overridable through `optionen`.
   *
   * @returns id of the new toast.
   */
  error(text: string, optionen: ZToastOptions = {}): number {
    return this.show(text, { status: 'danger', icon: 'error', duration: 0, ...optionen });
  }

  /**
   * Closes a toast and stops its timer.
   *
   * @param id id from `show`, `info`, `success`, `warning` or `error`. Without
   *   an id all toasts are closed.
   */
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

import {
  DestroyRef,
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Service,
  signal,
} from '@angular/core';

/**
 * Status of a toast. `neutral` confirms, `info` adds a hint, `success` reports
 * a completed operation, `warning` something to act on soon and `danger` a
 * failed one. Only `danger` is announced as `role="alert"`; the other four are
 * announced politely, unless {@link ZToastOptions.live} says otherwise.
 *
 * The status is never the colour alone: the toast text itself says what
 * happened, so a colour-blind reader and a screen reader get the same message.
 */
export type ZToastStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Live region a toast is announced in: `polite` waits until the screen reader
 * is idle, `assertive` interrupts it (`role="alert"`).
 */
export type ZToastLive = 'polite' | 'assertive';

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
  /**
   * Live region of the toast. Without a value `danger` is `assertive` and the
   * other four are `polite`. `assertive` for a `warning` is what an application
   * sets when its warnings used to interrupt the screen reader.
   */
  live?: ZToastLive;
}

/** A toast as it is currently shown. Read from `ZToast.toasts` by the outlet. */
export interface ZToastItem {
  /** Running number, also the handle for `dismiss`. */
  readonly id: number;
  /** The message, one sentence without a full stop. */
  readonly text: string;
  /** Line above the message, empty for a single-line toast. */
  readonly title: string;
  /**
   * Which of the five looks the toast has. Without {@link live} it also picks
   * the live region: `danger` goes into the assertive one, the other four into
   * the polite one; `live` overrides that. Always set here; `show()` falls
   * back to `neutral`.
   */
  readonly status: ZToastStatus;
  /** Name of the Material Icons ligature, empty for no icon. */
  readonly icon: string;
  /** Label of the action button, empty for no action. */
  readonly actionLabel: string;
  /** Called when the action is used. */
  readonly action?: () => void;
  /**
   * Live region the outlet puts the toast into. `ZToast` always sets it;
   * without it the outlet derives it from {@link status} as before.
   */
  readonly live?: ZToastLive;
}

/**
 * Configuration of {@link provideZenitToast}. Every field is optional; the
 * defaults are the behaviour without the provider.
 */
export interface ZToastConfig {
  /**
   * How many toasts are visible at a time, at least 1.
   *
   * @default 3
   */
  readonly maxVisible?: number;
  /**
   * What a new toast does while {@link maxVisible} toasts are visible.
   * `'replace'` closes the oldest toast that is not standing and waits only
   * when every visible toast is standing. `'queue'` never closes one: the new
   * toast waits until a place is free. Standing means `duration: 0` or an
   * action; such a toast is never closed to make room, in either mode.
   *
   * @default 'replace'
   */
  readonly overflow?: 'replace' | 'queue';
}

const Z_TOAST_CONFIG = new InjectionToken<ZToastConfig>('Z_TOAST_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * Sets how many toasts `ZToast` shows at once and what happens to the ones
 * beyond that. Application root only: `ZToast` is a root service and reads
 * the config of the root injector once.
 *
 * @param config Deviations from the defaults; see {@link ZToastConfig}.
 * @returns Providers for the application root (`bootstrapApplication`).
 *
 * @example
 * ```ts
 * // app.config.ts: no toast is ever closed to make room
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideZenitToast({ overflow: 'queue' })],
 * };
 * ```
 */
export function provideZenitToast(config: ZToastConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: Z_TOAST_CONFIG, useValue: config }]);
}

const DAUER = 5000;
const DAUER_MIT_AKTION = 8000;

/** A toast that waits for a place, with the duration it gets once visible. */
interface Wartend {
  readonly toast: ZToastItem;
  readonly dauer: number;
}

/**
 * Short feedback above the content: confirms that something happened and
 * disappears by itself. The visible part is `z-toast-outlet`, which stands once
 * in the root template.
 *
 * At most three toasts at a time, the newest at the bottom; a fourth one closes
 * the oldest toast that is not standing. A standing toast, one with
 * `duration: 0` or an action, is never closed to make room: while only
 * standing toasts are visible, the new one waits and appears as soon as a
 * place is free. {@link provideZenitToast} changes the number and can make
 * every toast wait instead of closing one. An error that requires an action on
 * the page is an alert and not a toast.
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
  private warteschlange: readonly Wartend[] = [];
  private readonly config = inject(Z_TOAST_CONFIG);
  private readonly hoechstens = Math.max(
    1,
    Number.isFinite(this.config.maxVisible) ? Number(this.config.maxVisible) : 3,
  );
  /** Ids of the standing toasts, visible or waiting: never closed to make room. */
  private readonly stehend = new Set<number>();

  /**
   * The visible toasts, oldest first. Read by `z-toast-outlet`. A waiting toast
   * is not in here; its timer starts when it moves in.
   */
  readonly toasts = this.liste.asReadonly();

  constructor() {
    // Closes all toasts so no timer keeps running when the application is torn
    // down.
    inject(DestroyRef).onDestroy(() => this.dismiss());
  }

  /**
   * Shows a toast and returns its id for `dismiss`. While three toasts are
   * already visible, the oldest one that is not standing is closed first; if
   * every visible toast is standing, or with `overflow: 'queue'`, the new one
   * waits for a place instead.
   *
   * @param text Message, one sentence without a full stop, in the past
   *   participle, for example `Eigenschaften gespeichert`.
   * @param optionen Status, title, icon, action and duration. Default duration:
   *   5000ms, 8000ms with `actionLabel`, 0 keeps the toast until it is closed.
   * @returns id of the new toast.
   */
  show(text: string, optionen: ZToastOptions = {}): number {
    const id = ++this.letzteId;
    const status = optionen.status ?? 'neutral';
    const dauer = optionen.duration ?? (optionen.actionLabel ? DAUER_MIT_AKTION : DAUER);
    if (dauer <= 0 || optionen.actionLabel) {
      this.stehend.add(id);
    }
    const toast: ZToastItem = {
      id,
      text,
      title: optionen.title ?? '',
      status,
      icon: optionen.icon ?? '',
      actionLabel: optionen.actionLabel ?? '',
      action: optionen.action,
      live: optionen.live ?? (status === 'danger' ? 'assertive' : 'polite'),
    };
    this.warteschlange = [...this.warteschlange, { toast, dauer }];
    if (this.config.overflow !== 'queue') {
      this.platzMachen();
    }
    this.nachruecken();
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
   * Closes a toast and stops its timer, or takes it out of the queue before it
   * was ever shown. The next waiting toast moves into the free place.
   *
   * @param id id from `show`, `info`, `success`, `warning` or `error`. Without
   *   an id all toasts are closed, the waiting ones included.
   */
  dismiss(id?: number): void {
    if (id === undefined) {
      this.timer.forEach((timer) => clearTimeout(timer));
      this.timer.clear();
      this.stehend.clear();
      this.warteschlange = [];
      this.liste.set([]);
      return;
    }
    clearTimeout(this.timer.get(id));
    this.timer.delete(id);
    this.stehend.delete(id);
    this.warteschlange = this.warteschlange.filter((w) => w.toast.id !== id);
    this.liste.update((alt) => alt.filter((t) => t.id !== id));
    this.nachruecken();
  }

  /**
   * `'replace'`: one new toast frees at most one place. While every place is
   * taken, the oldest visible toast that is not standing gives way, and the
   * head of the queue moves in, which is the new toast only when nothing else
   * waits. One and not a loop: a loop would also close the toast that just
   * moved in, and every further one after it, so a waiting toast could vanish
   * without ever having been in `toasts`. Only visible toasts give way; a
   * waiting one is never dropped.
   */
  private platzMachen(): void {
    if (this.warteschlange.length === 0 || this.liste().length < this.hoechstens) {
      return;
    }
    const aeltester = this.liste().find((t) => !this.stehend.has(t.id));
    if (aeltester) {
      this.dismiss(aeltester.id);
    }
  }

  /** Moves waiting toasts in while places are free and starts their timers. */
  private nachruecken(): void {
    while (this.warteschlange.length > 0 && this.liste().length < this.hoechstens) {
      const [{ toast, dauer }, ...rest] = this.warteschlange;
      this.warteschlange = rest;
      this.liste.update((alt) => [...alt, toast]);
      if (dauer > 0) {
        this.timer.set(
          toast.id,
          setTimeout(() => this.dismiss(toast.id), dauer),
        );
      }
    }
  }
}

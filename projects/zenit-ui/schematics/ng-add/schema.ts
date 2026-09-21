/** Options of the `ng add zenit-ui` schematic. */
export interface Schema {
  /**
   * Name of the application the library is wired into. Without it the workspace
   * must have exactly one application.
   */
  project?: string;
  /**
   * Register `zenit-ui/styles/themes.css` and wire the theme without a flash: init
   * script in `index.html`, `provideZenitTheme()`, `inlineCritical` off.
   */
  themes?: boolean;
  /** Add the self-hosted fonts as devDependencies and import them. */
  fonts?: boolean;
  /** Mount `<z-toast-outlet />` in the root component. */
  toastOutlet?: boolean;
}

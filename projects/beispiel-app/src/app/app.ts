import { Component } from '@angular/core';
import { Shell } from './layout/shell/shell';

/**
 * Root component. It holds nothing but the layout shell, so that every route
 * gets the same header, footer and toast outlet.
 */
@Component({
  imports: [Shell],
  selector: 'app-root',
  template: `<app-shell />`,
})
export class App {}

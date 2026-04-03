import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen w-full bg-slate-50 overflow-hidden font-sans print:h-auto print:overflow-visible">
      <app-sidebar></app-sidebar>
      <div class="flex-1 flex flex-col h-full overflow-hidden relative print:h-auto print:overflow-visible">
        <main class="flex-1 overflow-hidden print:overflow-visible">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {}

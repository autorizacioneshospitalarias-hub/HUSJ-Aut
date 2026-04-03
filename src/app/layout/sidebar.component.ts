import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  styles: [`
    nav mat-icon {
      font-weight: 300 !important;
      color: #475569; /* slate-600 */
      opacity: 0.7;
      transition: all 0.3s ease;
    }
    .active-nav-item mat-icon {
      color: #34d399; /* emerald-400 */
      opacity: 1;
      font-weight: 300 !important;
    }
  `],
  template: `
    <aside class="w-56 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div class="p-4 flex items-center gap-3 border-b border-slate-800">
        <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
          <mat-icon class="material-icons-outlined text-white text-[20px]">health_and_safety</mat-icon>
        </div>
        <div>
          <h1 class="font-bold text-[10px] tracking-tight leading-tight uppercase">Autorizaciones</h1>
          <h2 class="text-[9px] text-emerald-400 font-medium">HUSJP</h2>
        </div>
      </div>

      <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        <a routerLink="/" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item" [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent mb-2">
          <mat-icon class="material-icons-outlined text-[14px]">dashboard</mat-icon>
          Inicio
        </a>

        <a routerLink="/lista-pacientes" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent mb-2">
          <mat-icon class="material-icons-outlined text-[14px]">groups</mat-icon>
          Pacientes del Día
        </a>

        <div class="space-y-0.5 mb-4">
          <button (click)="toggleConsolidado()" class="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-white transition-colors">
            Consolidado Estancias
            <mat-icon class="text-[12px]">{{ isConsolidadoExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
          @if (isConsolidadoExpanded()) {
            <a routerLink="/consolidado" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">grid_view</mat-icon>
              Consolidado
            </a>
            <a routerLink="/pacientes-ingresos" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">person_search</mat-icon>
              Pacientes Ingresos
            </a>
            <a routerLink="/estancias-nuevas" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">add_circle_outline</mat-icon>
              Estancias nuevas
            </a>
            <a routerLink="/sin-convenio" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">person_off</mat-icon>
              Sin Convenio
            </a>
            <a routerLink="/giro-cama" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">swap_horiz</mat-icon>
              Giro Cama
            </a>
            <a routerLink="/pgp-aic" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">verified</mat-icon>
              PGP AIC
            </a>
            <a routerLink="/seguimiento" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">track_changes</mat-icon>
              Seguimiento
            </a>
            <a routerLink="/validacion-derechos" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
              <mat-icon class="material-icons-outlined text-[14px]">fact_check</mat-icon>
              Validación de derechos
            </a>
          }
        </div>

        <a routerLink="/turnos" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
          <mat-icon class="material-icons-outlined text-[14px]">calendar_today</mat-icon>
          Turnos Quirúrgicos
        </a>
        <a routerLink="/nota-operatoria" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item active-nota"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
          <mat-icon class="material-icons-outlined text-[14px]">article</mat-icon>
          Nota Operatoria
        </a>
        <a routerLink="/cirugias" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item active-liquidación" 
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
          <mat-icon class="material-icons-outlined text-[14px]">receipt_long</mat-icon>
          Liquidación Cx
        </a>
        <a routerLink="/egresos" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
          <mat-icon class="material-icons-outlined text-[14px]">door_front</mat-icon>
          Egresos
        </a>

        <div class="space-y-0.5 mt-4">
          <div class="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anexos</div>
          <a routerLink="/anexos/formulario" routerLinkActive="bg-emerald-500/10 border-l-4 border-emerald-500 active-nav-item"
             class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border-l-4 border-transparent">
            <mat-icon class="material-icons-outlined text-[14px]">assignment</mat-icon>
            Formulario
          </a>
        </div>
      </nav>

      <div class="p-2 border-t border-slate-800">
        <div class="flex items-center gap-2 px-3 py-2">
          <div class="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
            AH
          </div>
          <div class="text-[10px] overflow-hidden">
            <p class="font-medium text-white truncate">Admin</p>
            <p class="text-slate-400 truncate">admin&#64;husjp.gov.co</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  isConsolidadoExpanded = signal(true);

  toggleConsolidado() {
    this.isConsolidadoExpanded.update(v => !v);
  }
}

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  styles: [`
    nav mat-icon {
      font-family: 'Material Symbols Outlined' !important;
      font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 20 !important;
      color: #A3A199;
      opacity: 0.8;
      transition: all 0.3s ease;
    }
    .active-nav-item mat-icon {
      color: #E5D5B5;
      opacity: 1;
      font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20 !important;
    }
    .active-nav-item {
      color: #E5D5B5 !important;
    }
  `],
  template: `
    <aside class="w-56 bg-[#242320] text-[#D4D3D0] flex flex-col h-full border-r border-[#31302C]">
      <div class="p-4 flex items-center gap-3 border-b border-[#31302C]">
        <div class="w-8 h-8 bg-[#8C7A6B] rounded-lg flex items-center justify-center shadow-md shadow-[#8C7A6B]/20">
          <mat-icon class="material-symbols-outlined text-white text-[20px]" style="font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 20;">health_and_safety</mat-icon>
        </div>
        <div>
          <h1 class="font-bold text-[10px] tracking-tight leading-tight uppercase text-[#E5D5B5]">Autorizaciones</h1>
          <h2 class="text-[9px] text-[#A3A199] font-medium">HUSJP</h2>
        </div>
      </div>

      <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        <a routerLink="/" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item" [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent mb-2">
          <mat-icon class="material-symbols-outlined text-[16px]">home</mat-icon>
          Inicio
        </a>

        <a routerLink="/lista-pacientes" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent mb-2">
          <mat-icon class="material-symbols-outlined text-[16px]">group</mat-icon>
          Pacientes del Día
        </a>

        <div class="space-y-0.5 mb-4">
          <button (click)="toggleConsolidado()" class="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-[#A3A199] uppercase tracking-wider hover:text-[#E5D5B5] transition-colors">
            Consolidado Estancias
            <mat-icon class="text-[14px]">{{ isConsolidadoExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
          @if (isConsolidadoExpanded()) {
            <a routerLink="/consolidado" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">grid_view</mat-icon>
              Consolidado
            </a>
            <a routerLink="/pacientes-ingresos" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">person_search</mat-icon>
              Pacientes Ingresos
            </a>
            <a routerLink="/estancias-nuevas" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">add</mat-icon>
              Estancias nuevas
            </a>
            <a routerLink="/sin-convenio" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">person_off</mat-icon>
              Sin Convenio
            </a>
            <a routerLink="/giro-cama" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">sync_alt</mat-icon>
              Giro Cama
            </a>
            <a routerLink="/pgp-aic" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">verified</mat-icon>
              PGP AIC
            </a>
            <a routerLink="/seguimiento" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">track_changes</mat-icon>
              Seguimiento
            </a>
            <a routerLink="/validacion-derechos" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2 px-6 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
              <mat-icon class="material-symbols-outlined text-[16px]">fact_check</mat-icon>
              Validación de derechos
            </a>
          }
        </div>

        <a routerLink="/turnos" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
          <mat-icon class="material-symbols-outlined text-[16px]">calendar_today</mat-icon>
          Turnos Quirúrgicos
        </a>
        <a routerLink="/nota-operatoria" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item active-nota"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
          <mat-icon class="material-symbols-outlined text-[16px]">article</mat-icon>
          Nota Operatoria
        </a>
        <a routerLink="/cirugias" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item active-liquidación" 
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
          <mat-icon class="material-symbols-outlined text-[16px]">receipt_long</mat-icon>
          Liquidación Cx
        </a>
        <a routerLink="/egresos" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
           class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
          <mat-icon class="material-symbols-outlined text-[16px]">door_front</mat-icon>
          Egresos
        </a>

        <div class="space-y-0.5 mt-4">
          <div class="px-3 py-2 text-[10px] font-bold text-[#A3A199] uppercase tracking-wider">Anexos</div>
          <a routerLink="/anexos/formulario" routerLinkActive="bg-[#31302C] border-l-4 border-[#E5D5B5] active-nav-item"
             class="flex items-center gap-2 px-3 py-2 rounded-r-lg text-xs font-medium text-[#D4D3D0] hover:bg-[#31302C] hover:text-[#E5D5B5] transition-colors border-l-4 border-transparent">
            <mat-icon class="material-symbols-outlined text-[16px]">assignment</mat-icon>
            Formulario
          </a>
        </div>
      </nav>

      <div class="p-2 border-t border-[#31302C]">
        <div class="flex items-center gap-2 px-3 py-2">
          <div class="w-7 h-7 rounded-full bg-[#31302C] flex items-center justify-center text-[10px] font-bold text-[#E5D5B5]">
            AH
          </div>
          <div class="text-[10px] overflow-hidden">
            <p class="font-medium text-[#E5D5B5] truncate">Admin</p>
            <p class="text-[#A3A199] truncate">admin&#64;husjp.gov.co</p>
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

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, ShieldPlus, Home, Users, LayoutGrid, UserSearch, PlusSquare, UserX, Repeat, BadgeCheck, Activity, FileCheck, Calendar, FileText, Receipt, DoorOpen, ClipboardList, ChevronDown, ChevronUp } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  styles: [`
    .active-nav-item lucide-icon {
      color: #E5D5B5;
      stroke-width: 2.5px;
    }
    .active-nav-item {
      color: #E5D5B5 !important;
    }
  `],
  template: `
    <aside class="w-[240px] bg-[#242320] text-[#D4D3D0] flex flex-col h-full border-r border-[#31302C] font-sans shadow-[1px_0_2px_rgba(0,0,0,0.05)]">
      <div class="p-4 flex items-center gap-3 border-b border-[#31302C]">
        <div class="w-8 h-8 bg-[#8C7A6B] rounded-lg flex items-center justify-center shadow-md shadow-[#8C7A6B]/20">
          <lucide-icon [name]="ShieldPlusIcon" class="w-5 h-5 text-white" strokeWidth="2"></lucide-icon>
        </div>
        <div>
          <h1 class="font-bold text-[11px] tracking-tight leading-tight uppercase text-[#E5D5B5]">Autorizaciones</h1>
          <h2 class="text-[10px] text-[#A3A199] font-medium">HUSJP</h2>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-0 overflow-y-auto scrollbar-hide">
        <a routerLink="/" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item" [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent mb-1 group">
          <lucide-icon [name]="HomeIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
          Inicio
        </a>

        <a routerLink="/lista-pacientes" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
           class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent mb-3 group">
          <lucide-icon [name]="UsersIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
          Pacientes del Día
        </a>

        <div class="space-y-0 mb-3">
          <button (click)="toggleConsolidado()" class="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-[#A3A199] uppercase tracking-wider hover:text-[#E5D5B5] transition-colors group">
            Consolidado Estancias
            <lucide-icon [name]="isConsolidadoExpanded() ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4 opacity-70 group-hover:opacity-100"></lucide-icon>
          </button>
          @if (isConsolidadoExpanded()) {
            <a routerLink="/consolidado" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent mt-1 group">
              <lucide-icon [name]="LayoutGridIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Consolidado
            </a>
            <a routerLink="/pacientes-ingresos" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
              <lucide-icon [name]="UserSearchIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Pacientes Ingresos
            </a>
            <a routerLink="/estancias-nuevas" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
              <lucide-icon [name]="PlusSquareIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Estancias nuevas
            </a>
            <a routerLink="/sin-convenio" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
              <lucide-icon [name]="UserXIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Sin Convenio
            </a>
            <a routerLink="/giro-cama" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
              <lucide-icon [name]="RepeatIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Giro Cama
            </a>
            <a routerLink="/pgp-aic" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
              <lucide-icon [name]="BadgeCheckIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              PGP AIC
            </a>
            <a routerLink="/seguimiento" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
              <lucide-icon [name]="ActivityIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Seguimiento
            </a>
            <a routerLink="/validacion-derechos" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
               class="flex items-center gap-2.5 pl-6 pr-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent mb-2 group">
              <lucide-icon [name]="FileCheckIcon" class="w-[16px] h-[16px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
              Validación de derechos
            </a>
          }
        </div>

        <a routerLink="/turnos" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
           class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
          <lucide-icon [name]="CalendarIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
          Turnos Quirúrgicos
        </a>
        <a routerLink="/nota-operatoria" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item active-nota"
           class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
          <lucide-icon [name]="FileTextIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
          Nota Operatoria
        </a>
        <a routerLink="/cirugias" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item active-liquidación" 
           class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
          <lucide-icon [name]="ReceiptIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
          Liquidación Cx
        </a>
        <a routerLink="/egresos" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
           class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
          <lucide-icon [name]="DoorOpenIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
          Egresos
        </a>

        <div class="space-y-0 mt-3 pt-3 border-t border-[#31302C]/50">
          <div class="px-3 py-1 text-[11px] font-medium text-[#A3A199] uppercase tracking-wider">Anexos</div>
          <a routerLink="/anexos/formulario" routerLinkActive="bg-[#31302C]/50 border-l-[3px] border-[#E5D5B5] active-nav-item"
             class="flex items-center gap-2.5 px-3 py-1.5 rounded-r text-[13px] font-medium text-[#A3A199] hover:bg-[#31302C]/50 hover:text-[#E5D5B5] transition-colors border-l-[3px] border-transparent group">
            <lucide-icon [name]="ClipboardListIcon" class="w-[18px] h-[18px] text-[#A3A199] group-hover:text-[#E5D5B5] transition-colors" strokeWidth="2"></lucide-icon>
            Formulario
          </a>
        </div>
      </nav>

      <div class="p-3 border-t border-[#31302C]">
        <div class="flex items-center gap-3 px-3 py-2 rounded border border-transparent hover:border-[#31302C] hover:bg-[#31302C]/30 transition-all cursor-pointer group">
          <div class="w-8 h-8 rounded-full bg-[#31302C] flex items-center justify-center text-[11px] font-bold text-[#E5D5B5] group-hover:bg-[#E5D5B5] group-hover:text-[#242320] transition-colors">
            AH
          </div>
          <div class="flex-1 overflow-hidden">
            <p class="text-[13px] font-medium text-[#D4D3D0] truncate group-hover:text-white transition-colors">Admin</p>
            <p class="text-[11px] text-[#A3A199] truncate">admin&#64;husjp.gov.co</p>
          </div>
          <lucide-icon [name]="ChevronUpIcon" class="w-4 h-4 text-[#A3A199]"></lucide-icon>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly ShieldPlusIcon = ShieldPlus;
  readonly HomeIcon = Home;
  readonly UsersIcon = Users;
  readonly LayoutGridIcon = LayoutGrid;
  readonly UserSearchIcon = UserSearch;
  readonly PlusSquareIcon = PlusSquare;
  readonly UserXIcon = UserX;
  readonly RepeatIcon = Repeat;
  readonly BadgeCheckIcon = BadgeCheck;
  readonly ActivityIcon = Activity;
  readonly FileCheckIcon = FileCheck;
  readonly CalendarIcon = Calendar;
  readonly FileTextIcon = FileText;
  readonly ReceiptIcon = Receipt;
  readonly DoorOpenIcon = DoorOpen;
  readonly ClipboardListIcon = ClipboardList;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;

  isConsolidadoExpanded = signal(true);

  toggleConsolidado() {
    this.isConsolidadoExpanded.update(v => !v);
  }
}


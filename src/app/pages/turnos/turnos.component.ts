import { Component, inject, signal, computed } from '@angular/core';
import { TurnoService } from '../../services/turno.service';
import { TurnosListComponent } from './turnos-list.component';
import { TurnosBoardComponent } from './turnos-board.component';
import { TurnoDetailComponent } from './turno-detail.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { Turno } from '../../models/turno';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [TurnosListComponent, TurnosBoardComponent, TurnoDetailComponent, HeaderComponent, MatIconModule, NgClass],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full">
      <!-- BROWSER-LIKE TABS -->
      @if (openTurnoTabs().length > 0) {
        <div class="flex items-end px-2 pt-1.5 bg-slate-200 border-b border-slate-300 h-10 overflow-x-auto shrink-0 scrollbar-hide">
          <!-- Open Turno Tabs -->
          @for (t of openTurnoTabs(); track t.id) {
            <button (click)="activeTabId.set(t.id)"
                    class="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[200px] max-w-[250px] rounded-t-lg border-t border-x text-[11px] font-medium transition-colors group"
                    [ngClass]="activeTabId() === t.id ? 'bg-emerald-50 border-emerald-200 text-emerald-800 relative z-10 translate-y-[1px]' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-50'">
              <div class="flex items-center gap-1 overflow-hidden">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span class="truncate">{{ t.paciente }} - Turnos</span>
              </div>
              <button (click)="$event.stopPropagation(); closeTurnoTab(t.id)" 
                      (keyup.enter)="$event.stopPropagation(); closeTurnoTab(t.id)"
                      class="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors">
                <mat-icon class="text-[12px] w-3 h-3 flex items-center justify-center">close</mat-icon>
              </button>
            </button>
          }
        </div>
      }

      <!-- Header with Icons (Moved below tabs) -->
      <app-header></app-header>

      <!-- Header de la página (Only visible in Main View) -->
      @if (activeTabId() === 'main') {
        <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-800 tracking-tight">Turnos Quirúrgicos</h2>
            <button (click)="showAdvancedFilters.set(!showAdvancedFilters())" 
                    class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                    [ngClass]="showAdvancedFilters() ? 'bg-emerald-100 text-emerald-800' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'">
              <mat-icon class="text-[18px] w-4.5 h-4.5">tune</mat-icon>
              Filtros Avanzados
            </button>
          </div>
        </div>

        <!-- Filtros Avanzados -->
        @if (showAdvancedFilters()) {
          <div class="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 relative mb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="bg-emerald-100 p-1.5 rounded-md">
                <mat-icon class="text-[18px] w-4.5 h-4.5 text-emerald-700">tune</mat-icon>
              </div>
              Filtros Avanzados
            </h3>
            <button (click)="limpiarFiltros()" class="text-xs font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 border border-transparent hover:border-emerald-200">
              <mat-icon class="text-[16px] w-4 h-4">clear_all</mat-icon>
              Limpiar filtros
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            
            <!-- Pendientes de Gestión Toggle -->
            <div class="lg:col-span-1 flex flex-col justify-center h-[34px]">
              <label class="flex items-center gap-2.5 cursor-pointer group w-fit">
                <div class="relative flex items-center justify-center w-10 h-5 bg-slate-200 rounded-full transition-colors duration-300" [ngClass]="{'bg-emerald-500': advancedFilters().pendientesGestion}">
                  <input type="checkbox" class="sr-only" [checked]="advancedFilters().pendientesGestion" (change)="togglePendientesGestion()">
                  <div class="absolute left-1 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 shadow-sm" [ngClass]="{'translate-x-4.5': advancedFilters().pendientesGestion}"></div>
                </div>
                <span class="text-xs font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">Pendientes de Gestión</span>
              </label>
            </div>

            <!-- EPS Filter -->
            <div class="flex flex-col gap-1.5 lg:col-span-1">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entidad (EPS)</div>
              <div class="relative">
                <mat-icon class="absolute left-2.5 top-2 text-[16px] w-4 h-4 text-slate-400">business</mat-icon>
                <select [value]="advancedFilters().eps" (change)="updateFilter('eps', $event)" class="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none text-slate-700 font-medium cursor-pointer hover:bg-white transition-colors">
                  <option value="">Todas las entidades</option>
                  @for (eps of uniqueEps(); track eps) {
                    <option [value]="eps">{{ eps }}</option>
                  }
                </select>
                <mat-icon class="absolute right-2 top-2 text-[16px] w-4 h-4 text-slate-400 pointer-events-none">expand_more</mat-icon>
              </div>
            </div>

            <!-- Especialidad Filter -->
            <div class="flex flex-col gap-1.5 lg:col-span-1">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Especialidad</div>
              <div class="relative">
                <mat-icon class="absolute left-2.5 top-2 text-[16px] w-4 h-4 text-slate-400">medical_services</mat-icon>
                <select [value]="advancedFilters().especialidad" (change)="updateFilter('especialidad', $event)" class="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none text-slate-700 font-medium cursor-pointer hover:bg-white transition-colors">
                  <option value="">Todas las especialidades</option>
                  @for (esp of uniqueEspecialidades(); track esp) {
                    <option [value]="esp">{{ esp }}</option>
                  }
                </select>
                <mat-icon class="absolute right-2 top-2 text-[16px] w-4 h-4 text-slate-400 pointer-events-none">expand_more</mat-icon>
              </div>
            </div>

            <!-- Rango de Fechas -->
            <div class="flex flex-col gap-1.5 lg:col-span-2">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rango de Fechas</div>
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <mat-icon class="absolute left-2.5 top-2 text-[16px] w-4 h-4 text-slate-400">event</mat-icon>
                  <input type="date" [value]="advancedFilters().fechaDesde" (change)="updateFilter('fechaDesde', $event)" class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium hover:bg-white transition-colors">
                </div>
                <span class="text-slate-400 text-xs font-medium">a</span>
                <div class="relative flex-1">
                  <mat-icon class="absolute left-2.5 top-2 text-[16px] w-4 h-4 text-slate-400">event</mat-icon>
                  <input type="date" [value]="advancedFilters().fechaHasta" (change)="updateFilter('fechaHasta', $event)" class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium hover:bg-white transition-colors">
                </div>
              </div>
            </div>

            <!-- Rango de Horas -->
            <div class="flex flex-col gap-1.5 lg:col-span-1">
              <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hora (Desde)</div>
              <div class="relative">
                <mat-icon class="absolute left-2.5 top-2 text-[16px] w-4 h-4 text-slate-400">schedule</mat-icon>
                <input type="time" [value]="advancedFilters().horaDesde" (change)="updateFilter('horaDesde', $event)" class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium hover:bg-white transition-colors">
              </div>
            </div>

          </div>
        </div>
        }
      }

      <!-- Contenido -->
      <div class="flex-1 min-h-0 relative">
        @if (activeTabId() === 'main') {
          @if (turnoService.cargando()) {
            <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-3">
                <mat-icon class="animate-spin text-emerald-600 text-[32px] w-8 h-8">refresh</mat-icon>
                <p class="text-sm font-medium text-slate-600">Cargando turnos...</p>
              </div>
            </div>
          }

          @if (turnoService.error()) {
            <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3">
              <mat-icon>error_outline</mat-icon>
              <div>
                <p class="font-medium">Error al cargar los datos</p>
                <p class="text-sm opacity-80">{{ turnoService.error() }}</p>
              </div>
            </div>
          }

          @if (turnoService.viewMode() === 'list') {
            <app-turnos-list 
              [turnos]="turnosFiltrados()" 
              [activeFilter]="activeCoincidenceFilter()"
              (turnoClick)="openTurnoTab($event)"
              (filterCoincidences)="activeCoincidenceFilter.set($event)"
              (clearFilter)="activeCoincidenceFilter.set(null)">
            </app-turnos-list>
          } @else {
            <app-turnos-board [turnos]="turnosFiltrados()" (turnoClick)="openTurnoTab($event)"></app-turnos-board>
          }
        } @else {
          @let activeTurno = getActiveTurno();
          @if (activeTurno) {
            <app-turno-detail [turno]="activeTurno"></app-turno-detail>
          }
        }
      </div>
    </div>
  `
})
export class TurnosComponent {
  turnoService = inject(TurnoService);
  
  activeTabId = signal<string>('main');
  openTurnoTabs = signal<Turno[]>([]);
  showAdvancedFilters = signal<boolean>(false);
  activeCoincidenceFilter = signal<{ folio: string | null, ingreso: string | null, paciente: string | null } | null>(null);
  
  advancedFilters = signal({
    pendientesGestion: false,
    eps: '',
    especialidad: '',
    fechaDesde: '',
    fechaHasta: '',
    horaDesde: ''
  });

  uniqueEps = computed(() => {
    const turnos = this.turnoService.turnos();
    const epsSet = new Set(turnos.map(t => t.eps).filter(Boolean));
    return Array.from(epsSet).sort();
  });

  uniqueEspecialidades = computed(() => {
    const turnos = this.turnoService.turnos();
    const espSet = new Set(turnos.map(t => t.especialidad).filter(Boolean));
    return Array.from(espSet).sort();
  });

  togglePendientesGestion() {
    this.advancedFilters.update(f => ({ ...f, pendientesGestion: !f.pendientesGestion }));
  }

  updateFilter(key: keyof ReturnType<typeof this.advancedFilters>, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.advancedFilters.update(f => ({ ...f, [key]: value }));
  }

  limpiarFiltros() {
    this.advancedFilters.set({
      pendientesGestion: false,
      eps: '',
      especialidad: '',
      fechaDesde: '',
      fechaHasta: '',
      horaDesde: ''
    });
  }

  turnosFiltrados = computed(() => {
    const turnos = this.turnoService.turnos();
    const filters = this.advancedFilters();
    const query = this.turnoService.searchQuery().toLowerCase().trim();
    
    let result = turnos;

    // Apply Search Filter
    if (query) {
      result = result.filter(t => 
        t.paciente?.toString()?.toLowerCase()?.includes(query) ||
        t.documento?.toString()?.toLowerCase()?.includes(query) ||
        t.n_ingreso?.toString()?.toLowerCase()?.includes(query) ||
        t.folio?.toString()?.toLowerCase()?.includes(query) ||
        t.eps?.toString()?.toLowerCase()?.includes(query) ||
        t.especialista?.toString()?.toLowerCase()?.includes(query)
      );
    }
    
    // Apply Advanced Filters
    if (filters.pendientesGestion) {
      result = result.filter(t => (!t.estado || t.estado.trim() === '') && (!t.observacion || t.observacion.trim() === ''));
    }

    if (filters.eps) {
      result = result.filter(t => t.eps === filters.eps);
    }

    if (filters.especialidad) {
      result = result.filter(t => t.especialidad === filters.especialidad);
    }

    if (filters.fechaDesde) {
      result = result.filter(t => t.fecha >= filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      result = result.filter(t => t.fecha <= filters.fechaHasta);
    }

    if (filters.horaDesde) {
      result = result.filter(t => {
        const hora = t.hora_24_h ? t.hora_24_h.toString().substring(0, 5) : '';
        return hora >= filters.horaDesde;
      });
    }

    // Group by Ingreso and Documento: Show only one row per unique patient admission
    const groupedMap = new Map<string, Turno>();
    result.forEach(t => {
      const key = `${t.n_ingreso}_${t.documento}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, t);
      }
    });

    return Array.from(groupedMap.values());
  });

  openTurnoTab(turno: Turno) {
    const currentTabs = this.openTurnoTabs();
    if (!currentTabs.find(t => t.id === turno.id)) {
      // Limit to 5 open tabs
      if (currentTabs.length >= 5) {
        currentTabs.shift();
      }
      this.openTurnoTabs.set([...currentTabs, turno]);
    }
    this.activeTabId.set(turno.id);
  }

  closeTurnoTab(id: string) {
    const updated = this.openTurnoTabs().filter(t => t.id !== id);
    this.openTurnoTabs.set(updated);
    if (this.activeTabId() === id) {
      this.activeTabId.set('main');
    }
  }

  getActiveTurno(): Turno | undefined {
    return this.openTurnoTabs().find(t => t.id === this.activeTabId());
  }
}

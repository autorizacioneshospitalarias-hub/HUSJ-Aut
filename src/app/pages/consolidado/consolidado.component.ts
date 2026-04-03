import { Component, inject, computed, effect, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConsolidadoService, ConsolidadoRecord } from '../../services/consolidado.service';
import { AreaAgrupacionService } from '../../services/area-agrupacion.service';
import { ConsolidadoListComponent } from './consolidado-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';

// MODIFICADO: consolidado.component.ts no necesita cambios para el Realtime
// porque consolidado.service.ts ya tiene la suscripción en iniciarRealtime()
// y llama a loadRegistros() automáticamente cuando base_hoy cambia.

@Component({
  selector: 'app-consolidado',
  standalone: true,
  imports: [ConsolidadoListComponent, HeaderComponent, MatIconModule],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Header with Icons -->
      <app-header></app-header>

      <!-- Header de la página -->
      <div class="bg-white border-b border-slate-200 px-6 py-3 relative z-30 shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h2 class="text-xl font-bold text-slate-800 tracking-tight">
            @switch (activeView()) {
              @case ('pgp_aic') { Confirmación PGP AIC }
              @case ('estancias_nuevas') { Estancias Nuevas }
              @case ('seguimiento') { Seguimiento }
              @case ('validacion_derechos') { Validación de derechos }
              @default { Consolidado Estancia }
            }
          </h2>
          
          <div class="flex items-center gap-3">
            <!-- Area Group Filter -->
            <div class="flex items-center gap-2 relative z-50">
              <mat-icon class="text-slate-400 text-[18px] w-5 h-5">category</mat-icon>
              <div class="relative">
                <button (click)="isAreaGroupDropdownOpen.set(!isAreaGroupDropdownOpen()); isServicioDropdownOpen.set(false)" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[160px]">
                  <span class="truncate">{{ selectedAreaGroup() || 'Todas las áreas' }}</span>
                  <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                </button>

                @if (isAreaGroupDropdownOpen()) {
                  <!-- Backdrop -->
                  <div class="fixed inset-0 z-40" 
                       (click)="isAreaGroupDropdownOpen.set(false)"
                       (keydown.escape)="isAreaGroupDropdownOpen.set(false)"
                       tabindex="0"
                       role="button"
                       aria-label="Cerrar menú desplegable"></div>
                  
                  <div class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg">
                    <ul class="py-1 text-[11px]">
                      <li>
                        <button (click)="selectedAreaGroup.set(null); isAreaGroupDropdownOpen.set(false)" class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                          <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="selectedAreaGroup() === null" [class.opacity-0]="selectedAreaGroup() !== null">check</mat-icon>
                          <span class="text-left leading-tight" [class.font-medium]="selectedAreaGroup() === null">Todas las áreas</span>
                        </button>
                      </li>
                      <li>
                        <button (click)="selectedAreaGroup.set('Urgencias'); isAreaGroupDropdownOpen.set(false)" class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                          <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="selectedAreaGroup() === 'Urgencias'" [class.opacity-0]="selectedAreaGroup() !== 'Urgencias'">check</mat-icon>
                          <span class="text-left leading-tight" [class.font-medium]="selectedAreaGroup() === 'Urgencias'">Urgencias</span>
                        </button>
                      </li>
                      <li>
                        <button (click)="selectedAreaGroup.set('Hospitalización'); isAreaGroupDropdownOpen.set(false)" class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                          <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="selectedAreaGroup() === 'Hospitalización'" [class.opacity-0]="selectedAreaGroup() !== 'Hospitalización'">check</mat-icon>
                          <span class="text-left leading-tight" [class.font-medium]="selectedAreaGroup() === 'Hospitalización'">Hospitalización</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                }
              </div>
            </div>

            <div class="flex items-center gap-2 relative z-50">
              <mat-icon class="text-slate-400 text-[18px] w-5 h-5">filter_alt</mat-icon>
              <div class="relative">
                <button (click)="isServicioDropdownOpen.set(!isServicioDropdownOpen()); isAreaGroupDropdownOpen.set(false)" class="flex items-center justify-between w-full text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]">
                  <span class="truncate">{{ getServicioButtonText() }}</span>
                  <mat-icon class="text-[16px] w-4 h-4 text-slate-400">arrow_drop_down</mat-icon>
                </button>

                @if (isServicioDropdownOpen()) {
                  <!-- Backdrop -->
                  <div class="fixed inset-0 z-40" 
                       (click)="isServicioDropdownOpen.set(false)"
                       (keydown.escape)="isServicioDropdownOpen.set(false)"
                       tabindex="0"
                       role="button"
                       aria-label="Cerrar menú desplegable"></div>
                  
                  <div class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg">
                    <div class="p-2 border-b border-slate-100">
                      <div class="relative">
                        <mat-icon class="absolute left-2 top-1/2 -translate-y-1/2 text-[14px] w-3.5 h-3.5 text-slate-400">search</mat-icon>
                        <input type="text" 
                               [value]="servicioSearchTerm()" 
                               (input)="servicioSearchTerm.set($any($event.target).value)"
                               class="w-full pl-7 pr-2 py-1.5 text-[11px] border border-slate-300 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                               placeholder="Buscar servicio..."
                               (click)="$event.stopPropagation()">
                      </div>
                      <div class="flex justify-between mt-2 px-1 text-[11px] font-medium text-emerald-600">
                        <button (click)="selectAllServicios(); $event.stopPropagation()" class="hover:underline">Seleccionar todo</button>
                        <button (click)="clearServicios(); $event.stopPropagation()" class="hover:underline">Borrar</button>
                      </div>
                    </div>
                    <ul class="max-h-60 overflow-y-auto py-1 text-[11px]">
                      @for (servicio of filteredServiciosUnicos(); track servicio) {
                        <li>
                          <button (click)="toggleServicio(servicio); $event.stopPropagation()" class="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700">
                            <mat-icon class="text-[16px] w-4 h-4 shrink-0 mt-0.5" [class.text-emerald-600]="isServicioSelected(servicio)" [class.opacity-0]="!isServicioSelected(servicio)">
                              check
                            </mat-icon>
                            <span class="text-left leading-tight" [class.font-medium]="isServicioSelected(servicio)">{{ servicio }}</span>
                          </button>
                        </li>
                      }
                      @if (filteredServiciosUnicos().length === 0) {
                        <li class="px-3 py-2 text-slate-400 italic text-center">No hay resultados</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="flex-1 min-h-0 relative">
        @if (consolidadoService.cargando()) {
          <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div class="flex flex-col items-center gap-3">
              <mat-icon class="animate-spin text-emerald-600 text-[32px] w-8 h-8">refresh</mat-icon>
              <p class="text-sm font-medium text-slate-600">Cargando consolidado...</p>
            </div>
          </div>
        }

        @if (consolidadoService.error()) {
          <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3">
            <mat-icon>error_outline</mat-icon>
            <div>
              <p class="font-medium">Error al cargar los datos</p>
              <p class="text-sm opacity-80">{{ consolidadoService.error() }}</p>
            </div>
          </div>
        }

        <app-consolidado-list [registros]="registrosFiltrados()" [view]="activeView()"></app-consolidado-list>
      </div>
    </div>
  `
})
export class ConsolidadoComponent {
  consolidadoService = inject(ConsolidadoService);
  areaAgrupacionService = inject(AreaAgrupacionService);
  route = inject(ActivatedRoute);
  
  activeView = signal<'general' | 'pgp_aic' | 'estancias_nuevas' | 'seguimiento' | 'validacion_derechos'>('general');
  selectedServicios = signal<string[] | null>(null);
  selectedAreaGroup = signal<'Urgencias' | 'Hospitalización' | null>(null);
  
  isServicioDropdownOpen = signal(false);
  isAreaGroupDropdownOpen = signal(false);
  servicioSearchTerm = signal('');

  getServicioButtonText() {
    const selected = this.selectedServicios();
    if (selected === null) return 'Todos los servicios';
    if (selected.length === 0) return 'Ninguno seleccionado';
    if (selected.length === 1) return selected[0];
    return `${selected.length} seleccionados`;
  }

  isServicioSelected(servicio: string): boolean {
    const selected = this.selectedServicios();
    if (selected === null) return true;
    return selected.includes(servicio);
  }

  toggleServicio(servicio: string) {
    const selected = this.selectedServicios();
    if (selected === null) {
      const all = this.serviciosUnicos();
      this.selectedServicios.set(all.filter(s => s !== servicio));
    } else {
      if (selected.includes(servicio)) {
        this.selectedServicios.set(selected.filter(s => s !== servicio));
      } else {
        const next = [...selected, servicio];
        if (next.length === this.serviciosUnicos().length) {
          this.selectedServicios.set(null);
        } else {
          this.selectedServicios.set(next);
        }
      }
    }
  }

  selectAllServicios() {
    this.selectedServicios.set(null);
  }

  clearServicios() {
    this.selectedServicios.set([]);
  }

  constructor() {
    // Sync activeView con la ruta actual
    effect(() => {
      const path = this.route.snapshot.url[0]?.path;
      if (path === 'pgp-aic') {
        this.activeView.set('pgp_aic');
      } else if (path === 'estancias-nuevas') {
        this.activeView.set('estancias_nuevas');
      } else if (path === 'seguimiento') {
        this.activeView.set('seguimiento');
      } else if (path === 'validacion-derechos') {
        this.activeView.set('validacion_derechos');
      } else {
        this.activeView.set('general');
      }
    }, {});

    effect(() => {
      const query = this.consolidadoService.searchQuery();
      this.consolidadoService.searchRegistros(query);
    });
  }

  serviciosUnicos = computed(() => {
    let records = this.consolidadoService.registros();
    
    if (this.activeView() === 'estancias_nuevas') {
      records = records.filter((r: ConsolidadoRecord) => !r['gestion_estancia'] || r['gestion_estancia'] === '' || r['gestion_estancia'] === '---');
    } else if (this.activeView() === 'pgp_aic') {
      records = records.filter((r: ConsolidadoRecord) => !!r['confirmacion_pgp'] && r['confirmacion_pgp'] !== '-');
    } else if (this.activeView() === 'seguimiento') {
      records = records.filter((r: ConsolidadoRecord) => r['aut_estancia'] === 'NO');
    } else if (this.activeView() === 'validacion_derechos') {
      records = records.filter((r: ConsolidadoRecord) => (Number(r['dias_ingr']) || 0) > 3);
    }

    const areas = records.map((r: ConsolidadoRecord) => r['area']).filter(Boolean) as string[];
    return [...new Set(areas)].sort();
  });

  filteredServiciosUnicos = computed(() => {
    const term = this.servicioSearchTerm().toLowerCase();
    return this.serviciosUnicos().filter(s => s.toLowerCase().includes(term));
  });

  registrosFiltrados = computed(() => {
    let registros = this.consolidadoService.registros();
    
    if (this.activeView() === 'pgp_aic') {
      registros = registros.filter((r: ConsolidadoRecord) => !!r['confirmacion_pgp'] && r['confirmacion_pgp'] !== '-');
    } else if (this.activeView() === 'estancias_nuevas') {
      registros = registros.filter((r: ConsolidadoRecord) => !r['gestion_estancia'] || r['gestion_estancia'] === '' || r['gestion_estancia'] === '---');
    } else if (this.activeView() === 'seguimiento') {
      registros = registros.filter((r: ConsolidadoRecord) => r['aut_estancia'] === 'NO');
    } else if (this.activeView() === 'validacion_derechos') {
      registros = registros.filter((r: ConsolidadoRecord) => (Number(r['dias_ingr']) || 0) > 3);
    }

    const selected = this.selectedServicios();
    if (selected !== null) {
      if (selected.length === 0) {
        registros = [];
      } else {
        registros = registros.filter((r: ConsolidadoRecord) => selected.includes(r['area'] as string));
      }
    }

    const areaGroup = this.selectedAreaGroup();
    if (areaGroup !== null) {
      registros = registros.filter((r: ConsolidadoRecord) => this.areaAgrupacionService.getAreaGroup(r['area'] as string) === areaGroup);
    }

    return registros;
  });
}
import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PacienteIngresoService } from '../services/paciente-ingreso.service';
import { ConsolidadoService } from '../services/consolidado.service';
import { SupabaseService } from '../services/supabase.service';
import { TurnoService } from '../services/turno.service';
import { CirugiaService } from '../services/cirugia.service';
import { NotaOperatoriaService } from '../services/nota-operatoria.service';
import { EgresoService } from '../services/egreso.service';
import { EpsSinConvenioService } from '../services/eps-sin-convenio.service';
import { EpsCorteAdministrativoService } from '../services/eps-corte-administrativo.service';
import { EpsGiroCamaService } from '../services/eps-giro-cama.service';
import { AreaAgrupacionService } from '../services/area-agrupacion.service';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, NgClass],
  template: `
    <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
      <div class="flex items-center gap-4">
        <div class="relative group">
          <mat-icon class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</mat-icon>
          <input type="text" 
                 [value]="getSearchQuery()"
                 (input)="setSearchQuery($any($event.target).value)"
                 placeholder="Buscar paciente, documento..." 
                 class="pl-10 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
          
          @if (getSearchQuery()) {
            <button (click)="setSearchQuery('')" 
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
              <mat-icon class="material-icons-outlined text-[16px] w-4 h-4">close</mat-icon>
            </button>
          }
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Turnos Controls -->
        @if (isTurnosRoute()) {
          <div class="flex items-center gap-1 mr-4 border-r border-slate-200 pr-4">
            <button 
              (click)="turnoService.cargarTurnos()"
              [disabled]="turnoService.cargando()"
              class="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
              title="Sincronizar con Supabase">
              <mat-icon [class.animate-spin]="turnoService.cargando()" class="material-icons-outlined text-[20px]">sync</mat-icon>
            </button>
            
            <div class="h-6 w-px bg-slate-200 mx-1"></div>

            <button 
              (click)="turnoService.viewMode.set('list')"
              [ngClass]="turnoService.viewMode() === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-100'"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              title="Vista de Lista">
              <mat-icon class="material-icons-outlined text-[20px]">view_list</mat-icon>
            </button>

            <button 
              (click)="turnoService.viewMode.set('board')"
              [ngClass]="turnoService.viewMode() === 'board' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-100'"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              title="Vista de Tablero">
              <mat-icon class="material-icons-outlined text-[20px]">view_kanban</mat-icon>
            </button>
          </div>
        }

        <button class="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors relative">
          <mat-icon class="material-icons-outlined">notifications</mat-icon>
          <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button (click)="showEpsSettings.set(true)" class="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
          <mat-icon class="material-icons-outlined">settings</mat-icon>
        </button>
        
        @if (user()) {
          <button (click)="logout()" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
            Cerrar sesión
          </button>
        } @else {
          <button (click)="login()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            Iniciar sesión
          </button>
        }
      </div>
    </header>

    @if (showEpsSettings()) {
      <div class="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-200">
        <!-- Top header of the settings -->
        <div class="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
            <mat-icon class="text-slate-500 text-[20px] w-5 h-5">settings</mat-icon>
            Configuración General
          </h2>
          <button (click)="showEpsSettings.set(false)" class="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200">
            <mat-icon class="text-[20px] w-5 h-5">close</mat-icon>
          </button>
        </div>
        
        <!-- Main content area with sidebar -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Sidebar for tabs -->
          <div class="w-56 border-r border-slate-200 bg-slate-50 p-3 flex flex-col gap-1">
            <button (click)="activeConfigTab.set('sin_convenio')" 
                    [class.bg-emerald-50]="activeConfigTab() === 'sin_convenio'"
                    [class.text-emerald-700]="activeConfigTab() === 'sin_convenio'"
                    [class.text-slate-600]="activeConfigTab() !== 'sin_convenio'"
                    [class.hover:bg-slate-200]="activeConfigTab() !== 'sin_convenio'"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left">
              <mat-icon class="text-[18px] w-4.5 h-4.5">business</mat-icon>
              EPS Sin Convenio
            </button>
            <button (click)="activeConfigTab.set('corte_admin')" 
                    [class.bg-emerald-50]="activeConfigTab() === 'corte_admin'"
                    [class.text-emerald-700]="activeConfigTab() === 'corte_admin'"
                    [class.text-slate-600]="activeConfigTab() !== 'corte_admin'"
                    [class.hover:bg-slate-200]="activeConfigTab() !== 'corte_admin'"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left">
              <mat-icon class="text-[18px] w-4.5 h-4.5">event_busy</mat-icon>
              Corte Administrativo
            </button>
            <button (click)="activeConfigTab.set('giro_cama')" 
                    [class.bg-emerald-50]="activeConfigTab() === 'giro_cama'"
                    [class.text-emerald-700]="activeConfigTab() === 'giro_cama'"
                    [class.text-slate-600]="activeConfigTab() !== 'giro_cama'"
                    [class.hover:bg-slate-200]="activeConfigTab() !== 'giro_cama'"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left">
              <mat-icon class="text-[18px] w-4.5 h-4.5">bed</mat-icon>
              Giro Cama
            </button>
            <button (click)="activeConfigTab.set('agrupacion_areas')" 
                    [class.bg-emerald-50]="activeConfigTab() === 'agrupacion_areas'"
                    [class.text-emerald-700]="activeConfigTab() === 'agrupacion_areas'"
                    [class.text-slate-600]="activeConfigTab() !== 'agrupacion_areas'"
                    [class.hover:bg-slate-200]="activeConfigTab() !== 'agrupacion_areas'"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left">
              <mat-icon class="text-[18px] w-4.5 h-4.5">category</mat-icon>
              Agrupación de Áreas
            </button>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 flex flex-col bg-white overflow-hidden">
            @if (activeConfigTab() === 'sin_convenio') {
              <div class="p-5 border-b border-slate-200">
                <h3 class="text-base font-semibold text-slate-800">EPS Sin Convenio</h3>
                <p class="text-xs text-slate-500 mt-1">Selecciona las EPS con las que no tenemos convenio. Estas se marcarán automáticamente en el consolidado.</p>
                
                <div class="relative mt-3 max-w-sm">
                  <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] w-4 h-4">search</mat-icon>
                  <input type="text" 
                         [value]="epsSearchQuery()"
                         (input)="epsSearchQuery.set($any($event.target).value)"
                         placeholder="Buscar EPS..." 
                         class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                </div>
              </div>

              <div class="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-5 bg-slate-50/50">
                <!-- Column 1: Convenio Vigente -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Convenio Vigente</h4>
                    <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{{ epsConConvenioList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (eps of epsConConvenioList(); track eps) {
                      <button (click)="epsSinConvenioService.toggleEps(eps)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-colors group">
                        <span class="text-xs font-medium text-slate-700 truncate pr-2" [title]="eps">{{ eps }}</span>
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0">arrow_forward</mat-icon>
                      </button>
                    }
                    @if (epsConConvenioList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay EPS en esta lista</div>
                    }
                  </div>
                </div>

                <!-- Column 2: Sin Convenio Vigente -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Sin Convenio Vigente</h4>
                    <span class="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full">{{ epsSinConvenioList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (eps of epsSinConvenioList(); track eps) {
                      <button (click)="epsSinConvenioService.toggleEps(eps)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0">arrow_back</mat-icon>
                        <span class="text-xs font-medium text-slate-700 truncate pl-2 text-right" [title]="eps">{{ eps }}</span>
                      </button>
                    }
                    @if (epsSinConvenioList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay EPS en esta lista</div>
                    }
                  </div>
                </div>
              </div>
            } @else if (activeConfigTab() === 'corte_admin') {
              <div class="p-5 border-b border-slate-200">
                <h3 class="text-base font-semibold text-slate-800">Corte Administrativo</h3>
                <p class="text-xs text-slate-500 mt-1">Selecciona las entidades a las que se les hace corte administrativo. Solo a estas se les mostrará la etiqueta de CORTE VENCIDO.</p>
                
                <div class="relative mt-3 max-w-sm">
                  <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] w-4 h-4">search</mat-icon>
                  <input type="text" 
                         [value]="epsSearchQuery()"
                         (input)="epsSearchQuery.set($any($event.target).value)"
                         placeholder="Buscar Entidad..." 
                         class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                </div>
              </div>

              <div class="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-5 bg-slate-50/50">
                <!-- Column 1: Sin Corte -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Sin Corte Administrativo</h4>
                    <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{{ epsSinCorteList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (eps of epsSinCorteList(); track eps) {
                      <button (click)="epsCorteAdministrativoService.toggleEps(eps)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-colors group">
                        <span class="text-xs font-medium text-slate-700 truncate pr-2" [title]="eps">{{ eps }}</span>
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0">arrow_forward</mat-icon>
                      </button>
                    }
                    @if (epsSinCorteList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay entidades en esta lista</div>
                    }
                  </div>
                </div>

                <!-- Column 2: Con Corte -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Con Corte Administrativo</h4>
                    <span class="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full">{{ epsConCorteList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (eps of epsConCorteList(); track eps) {
                      <button (click)="epsCorteAdministrativoService.toggleEps(eps)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0">arrow_back</mat-icon>
                        <span class="text-xs font-medium text-slate-700 truncate pl-2 text-right" [title]="eps">{{ eps }}</span>
                      </button>
                    }
                    @if (epsConCorteList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay entidades en esta lista</div>
                    }
                  </div>
                </div>
              </div>
            } @else if (activeConfigTab() === 'giro_cama') {
              <div class="p-5 border-b border-slate-200">
                <h3 class="text-base font-semibold text-slate-800">Giro Cama</h3>
                <p class="text-xs text-slate-500 mt-1">Selecciona las EPS a las que se les debe hacer seguimiento de Giro Cama.</p>
                
                <div class="relative mt-3 max-w-sm">
                  <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] w-4 h-4">search</mat-icon>
                  <input type="text" 
                         [value]="epsSearchQuery()"
                         (input)="epsSearchQuery.set($any($event.target).value)"
                         placeholder="Buscar EPS..." 
                         class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                </div>
              </div>

              <div class="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-5 bg-slate-50/50">
                <!-- Column 1: Sin Giro Cama -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Sin Seguimiento</h4>
                    <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{{ epsSinGiroCamaList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (eps of epsSinGiroCamaList(); track eps) {
                      <button (click)="epsGiroCamaService.toggleEps(eps)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-colors group">
                        <span class="text-xs font-medium text-slate-700 truncate pr-2" [title]="eps">{{ eps }}</span>
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0">arrow_forward</mat-icon>
                      </button>
                    }
                    @if (epsSinGiroCamaList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay EPS en esta lista</div>
                    }
                  </div>
                </div>

                <!-- Column 2: Con Giro Cama -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Con Seguimiento</h4>
                    <span class="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full">{{ epsConGiroCamaList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (eps of epsConGiroCamaList(); track eps) {
                      <button (click)="epsGiroCamaService.toggleEps(eps)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0">arrow_back</mat-icon>
                        <span class="text-xs font-medium text-slate-700 truncate pl-2 text-right" [title]="eps">{{ eps }}</span>
                      </button>
                    }
                    @if (epsConGiroCamaList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay EPS en esta lista</div>
                    }
                  </div>
                </div>
              </div>
            } @else if (activeConfigTab() === 'agrupacion_areas') {
              <div class="p-5 border-b border-slate-200">
                <h3 class="text-base font-semibold text-slate-800">Agrupación de Áreas</h3>
                <p class="text-xs text-slate-500 mt-1">Selecciona las áreas que se agruparán como "Urgencias". Las áreas no seleccionadas se agruparán como "Hospitalización".</p>
                
                <div class="relative mt-3 max-w-sm">
                  <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] w-4 h-4">search</mat-icon>
                  <input type="text" 
                         [value]="areaSearchQuery()"
                         (input)="areaSearchQuery.set($any($event.target).value)"
                         placeholder="Buscar Área..." 
                         class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                </div>
              </div>

              <div class="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-5 bg-slate-50/50">
                <!-- Column 1: Hospitalización -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Hospitalización</h4>
                    <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{{ areasHospitalizacionList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (area of areasHospitalizacionList(); track area) {
                      <button (click)="areaAgrupacionService.setAsUrgencias(area)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-colors group">
                        <span class="text-xs font-medium text-slate-700 truncate pr-2" [title]="area">{{ area }}</span>
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0">arrow_forward</mat-icon>
                      </button>
                    }
                    @if (areasHospitalizacionList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay áreas en esta lista</div>
                    }
                  </div>
                </div>

                <!-- Column 2: Urgencias -->
                <div class="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Urgencias</h4>
                    <span class="text-[10px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full">{{ areasUrgenciasList().length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
                    @for (area of areasUrgenciasList(); track area) {
                      <button (click)="areaAgrupacionService.setAsHospitalizacion(area)" class="w-full flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <mat-icon class="text-[16px] w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0">arrow_back</mat-icon>
                        <span class="text-xs font-medium text-slate-700 truncate pl-2 text-right" [title]="area">{{ area }}</span>
                      </button>
                    }
                    @if (areasUrgenciasList().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-xs">No hay áreas en esta lista</div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class HeaderComponent {
  turnoService = inject(TurnoService);
  cirugiaService = inject(CirugiaService);
  notaService = inject(NotaOperatoriaService);
  egresoService = inject(EgresoService);
  consolidadoService = inject(ConsolidadoService);
  pacienteIngresoService = inject(PacienteIngresoService);
  supabaseService = inject(SupabaseService);
  epsSinConvenioService = inject(EpsSinConvenioService);
  epsCorteAdministrativoService = inject(EpsCorteAdministrativoService);
  epsGiroCamaService = inject(EpsGiroCamaService);
  areaAgrupacionService = inject(AreaAgrupacionService);
  router = inject(Router);
  user = signal<unknown>(null);
  
  showEpsSettings = signal(false);
  activeConfigTab = signal<'sin_convenio' | 'corte_admin' | 'giro_cama' | 'agrupacion_areas'>('sin_convenio');
  epsSearchQuery = signal('');
  areaSearchQuery = signal('');
  
  uniqueEpsList = computed(() => {
    const records = this.consolidadoService.allRegistros();
    const epsSet = new Set<string>();
    
    // Add EPS from current records
    records.forEach(r => {
      if (r['entidad']) {
        epsSet.add(String(r['entidad']).trim());
      }
    });
    
    // Add EPS that were previously saved in configurations
    this.epsSinConvenioService.epsSinConvenio().forEach(eps => epsSet.add(eps));
    this.epsCorteAdministrativoService.epsCorteAdministrativo().forEach(eps => epsSet.add(eps));
    this.epsGiroCamaService.epsGiroCama().forEach(eps => epsSet.add(eps));
    
    return Array.from(epsSet).sort();
  });

  filteredEpsList = computed(() => {
    const query = this.epsSearchQuery().toLowerCase();
    const list = this.uniqueEpsList();
    if (!query) return list;
    return list.filter(eps => eps.toLowerCase().includes(query));
  });

  epsConConvenioList = computed(() => {
    return this.filteredEpsList().filter(eps => !this.epsSinConvenioService.isSinConvenio(eps));
  });

  epsSinConvenioList = computed(() => {
    return this.filteredEpsList().filter(eps => this.epsSinConvenioService.isSinConvenio(eps));
  });

  epsConCorteList = computed(() => {
    return this.filteredEpsList().filter(eps => this.epsCorteAdministrativoService.isCorteAdministrativo(eps));
  });

  epsSinCorteList = computed(() => {
    return this.filteredEpsList().filter(eps => !this.epsCorteAdministrativoService.isCorteAdministrativo(eps));
  });

  epsConGiroCamaList = computed(() => {
    return this.filteredEpsList().filter(eps => this.epsGiroCamaService.isGiroCama(eps));
  });

  epsSinGiroCamaList = computed(() => {
    return this.filteredEpsList().filter(eps => !this.epsGiroCamaService.isGiroCama(eps));
  });

  uniqueAreasList = computed(() => {
    const records = this.consolidadoService.allRegistros();
    const areaSet = new Set<string>();
    
    // Add areas from current records
    records.forEach(r => {
      if (r['area']) {
        areaSet.add(String(r['area']).trim());
      }
    });
    
    // Add areas that were previously saved in configurations
    this.areaAgrupacionService.customUrgencias().forEach(area => areaSet.add(area));
    this.areaAgrupacionService.customHospitalizacion().forEach(area => areaSet.add(area));
    
    return Array.from(areaSet).sort();
  });

  filteredAreasList = computed(() => {
    const query = this.areaSearchQuery().toLowerCase();
    const list = this.uniqueAreasList();
    if (!query) return list;
    return list.filter(area => area.toLowerCase().includes(query));
  });

  areasUrgenciasList = computed(() => {
    return this.filteredAreasList().filter(area => this.areaAgrupacionService.getAreaGroup(area) === 'Urgencias');
  });

  areasHospitalizacionList = computed(() => {
    return this.filteredAreasList().filter(area => this.areaAgrupacionService.getAreaGroup(area) === 'Hospitalización');
  });

  constructor() {
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user || null);
    });
  }

  async login() {
    await this.supabaseService.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  async logout() {
    await this.supabaseService.client.auth.signOut();
  }

  isConsolidadoRoute(): boolean {
    return this.router.url.includes('/consolidado') || 
           this.router.url.includes('/giro-cama') || 
           this.router.url.includes('/pgp-aic') ||
           this.router.url.includes('/sin-convenio');
  }

  isTurnosRoute(): boolean {
    return this.router.url.includes('/turnos');
  }

  isCirugiasRoute(): boolean {
    return this.router.url.includes('/cirugias');
  }

  isNotaRoute(): boolean {
    return this.router.url.includes('/nota-operatoria');
  }

  isEgresosRoute(): boolean {
    return this.router.url.includes('/egresos');
  }

  isPacientesIngresosRoute(): boolean {
    return this.router.url.includes('/pacientes-ingresos');
  }

  getSearchQuery(): string {
    if (this.isConsolidadoRoute()) {
      return this.consolidadoService.searchQuery();
    }
    if (this.isCirugiasRoute()) {
      return this.cirugiaService.searchQuery();
    }
    if (this.isNotaRoute()) {
      return this.notaService.searchQuery();
    }
    if (this.isEgresosRoute()) {
      return this.egresoService.searchQuery();
    }
    if (this.isPacientesIngresosRoute()) {
      return this.pacienteIngresoService.searchQuery();
    }
    return this.turnoService.searchQuery();
  }

  setSearchQuery(query: string) {
    if (this.isConsolidadoRoute()) {
      this.consolidadoService.searchQuery.set(query);
    } else if (this.isCirugiasRoute()) {
      this.cirugiaService.searchQuery.set(query);
    } else if (this.isNotaRoute()) {
      this.notaService.searchQuery.set(query);
    } else if (this.isEgresosRoute()) {
      this.egresoService.searchQuery.set(query);
    } else if (this.isPacientesIngresosRoute()) {
      this.pacienteIngresoService.searchQuery.set(query);
    } else {
      this.turnoService.searchQuery.set(query);
    }
  }
}


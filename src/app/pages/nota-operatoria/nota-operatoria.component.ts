import { Component, inject, signal, effect } from '@angular/core';
import { NotaOperatoriaService } from '../../services/nota-operatoria.service';
import { NotaOperatoriaListComponent } from './nota-operatoria-list.component';
import { HeaderComponent } from '../../layout/header.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, DatePipe } from '@angular/common';
import { NotaOperatoria } from '../../models/nota-operatoria';

@Component({
  selector: 'app-nota-operatoria',
  standalone: true,
  imports: [NotaOperatoriaListComponent, HeaderComponent, MatIconModule, NgClass, DatePipe],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="flex flex-col h-full">
      <!-- BROWSER-LIKE TABS -->
      @if (openNotaTabs().length > 0) {
        <div class="flex items-end px-2 pt-1.5 bg-slate-200 border-b border-slate-300 h-10 overflow-x-auto shrink-0 scrollbar-hide">
          @for (n of openNotaTabs(); track n.id) {
            <button (click)="activeTabId.set(n.id)"
                    class="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[200px] max-w-[250px] rounded-t-lg border-t border-x text-[11px] font-medium transition-colors group"
                    [ngClass]="activeTabId() === n.id ? 'bg-blue-50 border-blue-200 text-blue-800 relative z-10 translate-y-[1px]' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-50'">
              <div class="flex items-center gap-1 overflow-hidden">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span class="truncate">{{ n.paciente }} - Nota Operatoria</span>
              </div>
              <button (click)="$event.stopPropagation(); closeNotaTab(n.id)" 
                      class="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors">
                <mat-icon class="text-[12px] w-3 h-3 flex items-center justify-center">close</mat-icon>
              </button>
            </button>
          }
        </div>
      }

      <app-header></app-header>

      @if (activeTabId() === 'main') {
      }

      <div class="flex-1 min-h-0 relative">
        @if (activeTabId() === 'main') {
          @if (notaService.cargando()) {
            <div class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div class="flex flex-col items-center gap-3">
                <mat-icon class="animate-spin text-blue-600 text-[32px] w-8 h-8">refresh</mat-icon>
                <p class="text-sm font-medium text-slate-600">Cargando notas...</p>
              </div>
            </div>
          }

          @if (notaService.error()) {
            <div class="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3">
              <mat-icon>error_outline</mat-icon>
              <div>
                <p class="font-medium">Error al cargar los datos</p>
                <p class="text-sm opacity-80">{{ notaService.error() }}</p>
              </div>
            </div>
          }

          <app-nota-operatoria-list 
            [notas]="notaService.notas()" 
            [activeFilter]="activeCoincidenceFilter()"
            (notaClick)="openNotaTab($event)"
            (filterCoincidences)="activeCoincidenceFilter.set($event)"
            (clearFilter)="activeCoincidenceFilter.set(null)">
          </app-nota-operatoria-list>
        } @else {
          <div class="h-full overflow-y-auto bg-[#F3F4F6] p-6 animate-in fade-in duration-200">
            @let activeNota = getActiveNota();
            @if (activeNota) {
              <div class="max-w-5xl mx-auto space-y-4">
                
                <!-- Nota Header Card -->
                <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-200 shadow-sm flex justify-between items-start relative overflow-hidden">
                  <div class="relative z-10">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                        {{ activeNota.autorizacion }}
                      </span>
                    </div>
                    <h2 class="text-base font-bold text-slate-900 leading-tight mb-1 uppercase">{{ activeNota.paciente }}</h2>
                    <div class="flex flex-wrap items-center gap-3 text-[11px]">
                      <span class="font-mono text-slate-600 font-medium">CC: {{ activeNota.documento }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-slate-600">Ingreso: {{ activeNota.ingreso }}</span>
                      <span class="text-slate-400">•</span>
                      <span (click)="activeCoincidenceFilter.set({folio: activeNota.folio, ingreso: activeNota.ingreso, paciente: activeNota.paciente}); activeTabId.set('main')"
                            (keydown.enter)="activeCoincidenceFilter.set({folio: activeNota.folio, ingreso: activeNota.ingreso, paciente: activeNota.paciente}); activeTabId.set('main')"
                            tabindex="0"
                            class="text-emerald-600 font-bold cursor-pointer hover:underline decoration-emerald-400 decoration-2 underline-offset-2 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-0.5"
                            title="Ver coincidencias de este folio">
                        Folio: {{ activeNota.folio || 'N/A' }}
                      </span>
                      <span class="text-slate-400">•</span>
                      <span class="text-slate-600">{{ activeNota.tipo_ingreso }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="font-bold text-indigo-600">{{ activeNota.eps }}</span>
                    </div>
                  </div>
                  
                  <div class="flex flex-col items-center bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</span>
                    <span class="text-lg font-bold text-emerald-600 font-mono leading-none mb-1">{{ activeNota.hora }}</span>
                    <span class="text-[11px] font-medium text-slate-500">{{ activeNota.fecha | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <!-- Main Info Column -->
                  <div class="lg:col-span-2 space-y-5">
                    
                    <!-- Procedimiento Card -->
                    <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Procedimiento Quirúrgico</h3>
                        <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <span>CUPS:</span>
                          <span class="font-mono">{{ activeNota.cups }}</span>
                        </span>
                      </div>
                      
                      <div class="space-y-4">
                        <div class="group relative pl-4 border-l-2 border-emerald-400 transition-colors pb-1">
                          <p class="text-xs font-bold text-slate-800 leading-snug">{{ activeNota.procedimiento }}</p>
                        </div>
                      </div>
                      
                      <div class="pt-4 mt-4 border-t border-slate-100">
                        <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Diagnóstico (DX)</p>
                        <p class="text-[11px] text-slate-700 leading-relaxed font-mono">{{ activeNota.dx }}</p>
                      </div>
                    </div>

                    <!-- Observaciones -->
                    <div class="bg-amber-50 rounded-xl p-5 border border-amber-200 shadow-sm flex flex-col">
                      <h3 class="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <mat-icon class="text-[14px] w-3.5 h-3.5">info</mat-icon>
                        Observación
                      </h3>
                      <p class="text-[11px] text-amber-900 flex-1 italic leading-relaxed whitespace-pre-wrap">{{ activeNota.observacion || 'Sin observaciones registradas.' }}</p>
                    </div>
                  </div>

                  <!-- Side Column -->
                  <div class="space-y-5">
                    <!-- Administrativo -->
                    <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Administrativo</h3>
                      <div class="space-y-2.5">
                        <div>
                          <p class="text-[9px] font-bold text-slate-400 uppercase">Autorización</p>
                          <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block mt-1" [ngClass]="getStatusClass(activeNota.autorizacion)">
                            {{ activeNota.autorizacion }}
                          </span>
                        </div>
                        <div>
                          <p class="text-[9px] font-bold text-slate-400 uppercase">Soporte</p>
                          <p class="text-[11px] text-slate-700 font-medium">{{ activeNota.soporte }}</p>
                        </div>
                        <div class="pt-3 border-t border-slate-100">
                          <p class="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Autorizador</p>
                          @if (activeNota.autorizador) {
                            <div class="inline-flex items-center gap-2.5 px-3 py-2 bg-white border-l-4 border-emerald-500 rounded-r-lg shadow-sm ring-1 ring-slate-200">
                              <span class="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide whitespace-normal">{{ activeNota.autorizador }}</span>
                            </div>
                          } @else {
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg italic">
                              <span class="text-[11px] text-slate-400 font-medium">Pendiente de asignación</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class NotaOperatoriaComponent {
  notaService = inject(NotaOperatoriaService);
  
  activeTabId = signal<string>('main');
  openNotaTabs = signal<NotaOperatoria[]>([]);
  activeCoincidenceFilter = signal<{ folio: string | null, ingreso: string | null, paciente: string | null } | null>(null);

  constructor() {
    effect(() => {
      const query = this.notaService.searchQuery();
      this.notaService.buscarNotas(query);
    });
  }

  getCoincidenceCount(n: NotaOperatoria): number {
    const allNotas = this.notaService.notas();
    return allNotas.filter(x => 
      x.folio === n.folio && 
      x.ingreso === n.ingreso && 
      x.paciente === n.paciente
    ).length;
  }

  openNotaTab(nota: NotaOperatoria) {
    const currentTabs = this.openNotaTabs();
    if (!currentTabs.find(n => n.id === nota.id)) {
      if (currentTabs.length >= 5) {
        currentTabs.shift();
      }
      this.openNotaTabs.set([...currentTabs, nota]);
    }
    this.activeTabId.set(nota.id);
  }

  closeNotaTab(id: string) {
    const updated = this.openNotaTabs().filter(n => n.id !== id);
    this.openNotaTabs.set(updated);
    if (this.activeTabId() === id) {
      this.activeTabId.set('main');
    }
  }

  getActiveNota(): NotaOperatoria | undefined {
    return this.openNotaTabs().find(n => n.id === this.activeTabId());
  }

  getStatusClass(status: string | null): string {
    if (!status) return 'bg-slate-100 text-slate-500';
    const s = status.toUpperCase();
    if (s === 'SI') return 'bg-[#1a7441] text-white';
    if (s === 'NO') return 'bg-[#b60205] text-white';
    if (s === 'VERIFICADO') return 'bg-[#0b5394] text-white';
    if (s === 'PENDIENTE') return 'bg-[#ffe599] text-slate-800';
    if (s === 'CX AMBULATORIO') return 'bg-[#e0e0e0] text-slate-800';
    if (s === 'GESTIONADO') return 'bg-[#cfe2f3] text-slate-800';
    return 'bg-slate-100 text-slate-600';
  }
}

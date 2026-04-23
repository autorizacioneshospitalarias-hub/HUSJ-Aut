import { Component, input, output, computed, signal, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { NotaOperatoria } from '../../models/nota-operatoria';
import { NotaOperatoriaService } from '../../services/nota-operatoria.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Check, X, Clock } from 'lucide-angular';

@Component({
  selector: 'app-nota-operatoria-list',
  standalone: true,
  imports: [MatIconModule, NgClass, DatePipe, FormsModule, LucideAngularModule],
  template: `
    <div class="h-full animate-in fade-in duration-300 bg-white focus:outline-none">
      <div class="h-full flex flex-col relative" [ngClass]="hasActiveFilters() ? 'bg-slate-50' : 'bg-white'">
        <div class="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white relative z-30">
          <h2 class="text-xl font-bold text-slate-800 tracking-tight">Nota Operatoria</h2>
          <div class="flex items-center gap-2">
            <div class="relative">
              <button #filterButton (click)="toggleFilterMenu($event)" class="p-1 hover:bg-slate-100 rounded transition-colors"
                      [ngClass]="{'text-blue-600': hasAnyFilter()}">
                <mat-icon class="text-[16px] w-4 h-4">filter_list</mat-icon>
              </button>
              @if (filterMenuOpen) {
                <div #filterMenu class="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 p-2">
                  @if (!selectedColumn) {
                    @for (col of filterableColumns; track col.key) {
                      <div (click)="selectColumn(col.key)" 
                           (keydown.enter)="selectColumn(col.key)" 
                           tabindex="0" 
                           class="cursor-pointer hover:bg-slate-50 p-2 text-[11px] rounded flex items-center justify-between">
                        {{ col.label }}
                        @if (getFilterSize(col.key) > 0) {
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        }
                      </div>
                    }
                  } @else {
                    <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <button (click)="selectedColumn = null" class="p-1 hover:bg-slate-100 rounded">
                        <mat-icon class="text-[14px] w-4 h-4">arrow_back</mat-icon>
                      </button>
                      <span class="text-[11px] font-bold">{{ getColumnLabel(selectedColumn) }}</span>
                    </div>
                    <input type="text" [(ngModel)]="searchTerms[selectedColumn]" placeholder="Buscar..." class="w-full text-[11px] px-2 py-1 border border-slate-200 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-black">
                    <div class="max-h-48 overflow-y-auto">
                      @for (val of getUniqueValues(selectedColumn, searchTerms[selectedColumn]); track val) {
                        <div (click)="toggleFilter(selectedColumn, val)" 
                             (keydown.enter)="toggleFilter(selectedColumn, val)" 
                             tabindex="0" 
                             role="checkbox"
                             [attr.aria-checked]="activeFilters()[selectedColumn]?.has(val)"
                             class="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-50 rounded text-[11px]">
                          <input type="checkbox" [checked]="activeFilters()[selectedColumn]?.has(val)" class="accent-black" tabindex="-1">
                          {{ val }}
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
        <div class="overflow-auto flex-1 scrollbar-hide">
          <table class="w-full text-sm text-left whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 font-medium w-10">#</th>
                <th class="px-4 py-3 font-medium">Fecha/Hora</th>
                <th class="px-4 py-3 font-medium">Ingreso</th>
                <th class="px-4 py-3 font-medium">Paciente</th>
                <th class="px-4 py-3 font-medium w-[300px]">Entidad (EPS)
                  @if (getFilterSize('eps') > 0) {
                    <div class="inline-flex items-center gap-1 ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px]">
                      <mat-icon class="text-[10px] w-3 h-3">filter_list</mat-icon>
                      <button (click)="clearColumnFilter('eps', $event)" class="hover:text-blue-900">×</button>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-medium w-[300px]">Procedimiento / DX</th>
                <th class="px-4 py-3 font-medium">Autorizador
                  @if (getFilterSize('autorizacion') > 0) {
                    <div class="inline-flex items-center gap-1 ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px]">
                      <mat-icon class="text-[10px] w-3 h-3">filter_list</mat-icon>
                      <button (click)="clearColumnFilter('autorizacion', $event)" class="hover:text-blue-900">×</button>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-medium">SERVICIO
                  @if (getFilterSize('servicio') > 0) {
                    <div class="inline-flex items-center gap-1 ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px]">
                      <mat-icon class="text-[10px] w-3 h-3">filter_list</mat-icon>
                      <button (click)="clearColumnFilter('servicio', $event)" class="hover:text-blue-900">×</button>
                    </div>
                  }
                </th>
              </tr>
            </thead>
            <tbody class="text-slate-600 align-top bg-white">
              @for (n of filteredNotas(); track n.id; let i = $index) {
                <tr (click)="notaClick.emit(n)" 
                    class="border-b border-slate-200 cursor-pointer group focus:outline-none hover:bg-slate-50 transition-colors duration-200"
                    [ngClass]="hasActiveFilters() ? 'bg-white' : ''">
                  <td class="px-4 py-3 text-center">
                    <span class="text-[10px] font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {{ i + 1 }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    <span class="font-mono text-emerald-600 text-[11px] block leading-none mb-1">{{ n.hora }}</span>
                    <span class="text-[10px] font-medium text-slate-500 block">{{ n.fecha | date:'dd/MM/yyyy' }}</span>
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    <div class="flex flex-col gap-1">
                      <div class="font-mono text-slate-700 mb-0.5 hover:text-emerald-600 transition-colors">Ing: {{ n.ingreso }}</div>
                      <div class="font-mono text-emerald-600 mb-0.5 cursor-pointer hover:underline decoration-emerald-400 decoration-2 underline-offset-2 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-0.5"
                           title="Folio: {{ n.folio || 'N/A' }}">
                        Fol: {{ n.folio || 'N/A' }}
                      </div>
                      <div class="text-[9px] text-slate-400 uppercase">{{ n.tipo_ingreso }}</div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-bold text-[11px] text-slate-900 mb-0.5">{{ n.paciente }}</div>
                    <div class="text-[10px] text-slate-500 hover:text-emerald-600 transition-colors">CC: {{ n.documento }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px] w-[300px] whitespace-normal">
                    <div class="font-semibold text-slate-800">{{ n.eps }}</div>
                  </td>
                  <td class="px-4 py-3 text-[11px] w-[300px] whitespace-normal">
                    <div class="line-clamp-2 font-medium text-slate-800">{{ n.procedimiento }}</div>
                    <div class="text-[9px] text-slate-500 mt-1 flex items-center gap-2">
                       <span class="font-mono text-slate-700 bg-slate-100 px-1 rounded">CUPS: {{ n.cups }}</span>
                       <span class="font-mono text-slate-700 bg-slate-100 px-1 rounded">DX: {{ n.dx }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-[11px] flex flex-col items-start gap-1">
                    @if (n.autorizador) {
                      <span class="text-slate-700" [ngClass]="{'font-medium': n.autorizador.toUpperCase() !== 'GESTIONADO'}">{{ n.autorizador }}</span>
                    } @else {
                      <span class="text-slate-300 italic">Sin asignar</span>
                    }
                    @if (n.autorizacion) {
                      @if (n.autorizacion.toUpperCase() === 'SI' || n.autorizacion.toUpperCase() === 'SÍ') {
                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold mt-1 w-fit">
                          <lucide-icon [name]="Check" class="w-2.5 h-2.5"></lucide-icon>
                          Aut: SI
                        </span>
                      } @else if (n.autorizacion.toUpperCase() === 'NO') {
                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold mt-1 w-fit">
                          <lucide-icon [name]="X" class="w-2.5 h-2.5"></lucide-icon>
                          Aut: NO
                        </span>
                      } @else if (n.autorizacion.toUpperCase() === 'PTE' || n.autorizacion.toUpperCase() === 'PENDIENTE') {
                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold mt-1 w-fit">
                          <lucide-icon [name]="Clock" class="w-2.5 h-2.5"></lucide-icon>
                          Aut: {{ n.autorizacion.toUpperCase() === 'PENDIENTE' ? 'PTE' : n.autorizacion.toUpperCase() }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[9px] font-bold mt-1 w-fit">
                          Aut: {{ n.autorizacion.toUpperCase() }}
                        </span>
                      }
                    }
                  </td>
                  <td class="px-4 py-3 text-[11px]">
                    @if (n.servicio) {
                      <div class="text-slate-700">{{ n.servicio.split(' - ')[1] }}</div>
                      <div class="text-[10px] text-slate-500">{{ n.servicio.split(' - ')[0] }}</div>
                    } @else {
                      <span class="text-slate-300 italic">N/A</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="px-6 py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center gap-2">
                      <mat-icon class="w-8 h-8 text-slate-300 text-[32px]">description</mat-icon>
                      No se encontraron notas operatorias.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class NotaOperatoriaListComponent {
  readonly Check = Check;
  readonly X = X;
  readonly Clock = Clock;

  notas = input.required<NotaOperatoria[]>();
  activeFilter = input<{ folio: string | null, ingreso: string | null, paciente: string | null } | null>(null);
  
  notaClick = output<NotaOperatoria>();
  filterCoincidences = output<{ folio: string | null, ingreso: string | null, paciente: string | null }>();
  clearFilter = output<void>();

  filterableColumns = [
    { key: 'eps', label: 'EPS' },
    { key: 'servicio', label: 'Servicio' },
    { key: 'autorizacion', label: 'Autorización' }
  ];

  activeFilters = signal<Record<string, Set<string>>>({});
  searchTerms: Record<string, string> = {};
  filterMenuOpen = false;
  selectedColumn: string | null = null;
  @ViewChild('filterMenu') filterMenu!: ElementRef;
  @ViewChild('filterButton') filterButton!: ElementRef;
  private el = inject(ElementRef);

  notaService = inject(NotaOperatoriaService);

  hasActiveFilters = computed(() => {
    return this.hasAnyFilter() || !!this.notaService.searchQuery();
  });

  filteredNotas = computed(() => {
    const allNotas = this.notas();
    const filter = this.activeFilter();
    const filters = this.activeFilters();
    
    let result = allNotas;

    // Existing filter
    if (filter) {
      result = result.filter(n => 
        n.folio === filter.folio && 
        n.ingreso === filter.ingreso && 
        n.paciente === filter.paciente
      );
    }

    // New Notion-like filters
    return result.filter(n => {
      for (const col of this.filterableColumns) {
        const activeValues = filters[col.key];
        if (activeValues && activeValues.size > 0) {
          const val = this.getColValue(n, col.key);
          if (!activeValues.has(val)) return false;
        }
      }
      return true;
    });
  });

  getFilterSize(key: string): number {
    return this.activeFilters()[key]?.size || 0;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.filterMenuOpen && 
        this.filterMenu && 
        !this.filterMenu.nativeElement.contains(event.target) &&
        this.filterButton &&
        !this.filterButton.nativeElement.contains(event.target)) {
      this.filterMenuOpen = false;
      this.selectedColumn = null;
    }
  }

  hasAnyFilter = computed(() => Object.values(this.activeFilters()).some(set => set.size > 0));

  toggleFilterMenu(event: Event) {
    event.stopPropagation();
    this.filterMenuOpen = !this.filterMenuOpen;
    if (!this.filterMenuOpen) this.selectedColumn = null;
  }

  selectColumn(key: string) {
    this.selectedColumn = key;
  }

  clearColumnFilter(key: string, event: Event) {
    event.stopPropagation();
    this.activeFilters.update(filters => {
      const newFilters = { ...filters };
      delete newFilters[key];
      return newFilters;
    });
  }

  getColumnLabel(key: string): string {
    return this.filterableColumns.find(c => c.key === key)?.label || '';
  }

  toggleFilter(key: string, value: string) {
    this.activeFilters.update(filters => {
      const newFilters = { ...filters };
      if (!newFilters[key]) newFilters[key] = new Set();
      if (newFilters[key].has(value)) {
        newFilters[key].delete(value);
      } else {
        newFilters[key].add(value);
      }
      return newFilters;
    });
    this.filterMenuOpen = false;
    this.selectedColumn = null;
  }

  getColValue(n: NotaOperatoria, key: string): string {
    const val = n[key as keyof NotaOperatoria];
    return val ? String(val) : 'N/A';
  }

  getUniqueValues(key: string, searchTerm: string): string[] {
    const values = new Set(this.notas().map(n => this.getColValue(n, key)));
    return Array.from(values)
      .filter(v => v.toLowerCase().includes((searchTerm || '').toLowerCase()))
      .sort();
  }

  getStatusClass(status: string | null): string {
    if (!status) return 'bg-slate-100 text-slate-500';
    const s = status.toUpperCase();
    if (s === 'SI') return 'bg-[#1a7441] text-white';
    if (s === 'NO' || s === 'SIN AUTORIZAR') return 'bg-[#b60205] text-white';
    if (s === 'VERIFICADO') return 'bg-[#0b5394] text-white';
    if (s === 'PENDIENTE') return 'bg-[#ffe599] text-slate-800';
    if (s === 'CX AMBULATORIO') return 'bg-[#e0e0e0] text-slate-800';
    if (s === 'GESTIONADO') return 'bg-[#cfe2f3] text-slate-800';
    return 'bg-slate-100 text-slate-600';
  }
}

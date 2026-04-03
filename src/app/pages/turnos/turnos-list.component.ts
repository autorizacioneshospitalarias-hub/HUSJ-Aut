import { Component, input, output, inject, signal, computed } from '@angular/core';
import { Turno } from '../../models/turno';
import { TurnoService } from '../../services/turno.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-turnos-list',
  standalone: true,
  imports: [MatIconModule, NgClass],
  template: `
    <div class="h-full p-2 animate-in fade-in duration-300 bg-slate-50" (click)="closeAllFilters()" role="button" tabindex="0" (keydown.enter)="closeAllFilters()">
      <div class="rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col" [ngClass]="hasActiveFilters() ? 'bg-slate-100/50' : 'bg-white'">
        @if (activeFilter(); as filter) {
          <div class="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div class="flex items-center gap-2 text-emerald-800 text-sm">
              <mat-icon class="text-[18px] w-5 h-5">filter_alt</mat-icon>
              <span class="font-bold">Coincidencias de Ingreso</span>
              <span class="text-emerald-600 text-xs font-medium px-2 border-l border-emerald-300">Paciente: {{ filter.paciente }}</span>
              <span class="text-emerald-600 text-xs font-medium px-2 border-l border-emerald-300">Ingreso: {{ filter.ingreso }}</span>
              <span class="text-emerald-600 text-xs font-medium px-2 border-l border-emerald-300">Folio: {{ filter.folio }}</span>
            </div>
            <button (click)="clearFilter.emit()" class="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded transition-colors">
              <mat-icon class="text-[14px] w-4 h-4">close</mat-icon>
              Cerrar Filtro
            </button>
          </div>
        }
        <div class="overflow-auto flex-1 scrollbar-hide">
          <table class="w-full text-sm text-left whitespace-nowrap">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th class="px-4 py-3 font-semibold w-10">#</th>
                <th class="px-4 py-3 font-semibold group relative">
                  Fecha
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('fecha', $event)">search</mat-icon>
                  @if (filters()['fecha'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('fecha', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('fecha', $event)" [value]="filters()['fecha']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('fecha', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Admisión
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('n_ingreso', $event)">search</mat-icon>
                  @if (filters()['n_ingreso'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('n_ingreso', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('n_ingreso', $event)" [value]="filters()['n_ingreso']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('n_ingreso', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Paciente
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('paciente', $event)">search</mat-icon>
                  @if (filters()['paciente'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('paciente', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('paciente', $event)" [value]="filters()['paciente']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('paciente', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold w-[800px] group relative">
                  Entidad
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('eps', $event)">search</mat-icon>
                  @if (filters()['eps'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('eps', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('eps', $event)" [value]="filters()['eps']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('eps', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Autorizador
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('autorizador', $event)">search</mat-icon>
                  @if (filters()['autorizador'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('autorizador', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('autorizador', $event)" [value]="filters()['autorizador']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('autorizador', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Ubicación Actual
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('servicio_actual', $event)">search</mat-icon>
                  @if (filters()['servicio_actual'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('servicio_actual', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('servicio_actual', $event)" [value]="filters()['servicio_actual']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('servicio_actual', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Especialista
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('especialista', $event)">search</mat-icon>
                  @if (filters()['especialista'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('especialista', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('especialista', $event)" [value]="filters()['especialista']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('especialista', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Procedimiento
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('cups_descripcion', $event)">search</mat-icon>
                  @if (filters()['cups_descripcion'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('cups_descripcion', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('cups_descripcion', $event)" [value]="filters()['cups_descripcion']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('cups_descripcion', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Diagnóstico
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('dx_descr', $event)">search</mat-icon>
                  @if (filters()['dx_descr'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('dx_descr', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('dx_descr', $event)" [value]="filters()['dx_descr']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('dx_descr', $event)">close</mat-icon>
                    </div>
                  }
                </th>
                <th class="px-4 py-3 font-semibold group relative">
                  Estado & Obs
                  <mat-icon class="absolute right-1 top-3 text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('estado', $event)">search</mat-icon>
                  @if (filters()['estado'] !== undefined) { 
                    <div class="absolute top-full left-0 w-full flex items-center bg-white border border-slate-300 rounded shadow-lg z-20">
                      <input class="w-full p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" 
                             (input)="onFilterInput('estado', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('estado', $event)" [value]="filters()['estado']" placeholder="Buscar..."> 
                      <mat-icon class="text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900 mr-1" (click)="toggleFilter('estado', $event)">close</mat-icon>
                    </div>
                  }
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600 align-top">
              @for (t of filteredTurnos(); track t.id; let i = $index) {
                <tr (click)="turnoClick.emit(t)" 
                    class="transition-colors cursor-pointer group"
                    [ngClass]="hasActiveFilters() ? 'bg-white hover:bg-slate-50' : 'hover:bg-slate-50'">
                  <!-- Enumeración -->
                  <td class="px-4 py-3 text-center">
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-[10px] font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200">
                        {{ i + 1 }}
                      </span>
                      @if (getProcedimientosCount(t.n_ingreso, t.documento) > 1) {
                        <button (click)="toggleExpand(t.n_ingreso, t.documento, $event)" 
                                class="text-[8px] font-bold text-emerald-700 bg-emerald-50 w-5 h-4 flex items-center justify-center rounded border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors">
                          {{ expandedRows().has(t.n_ingreso + '_' + t.documento) ? '-' : '+' }}
                        </button>
                      }
                    </div>
                  </td>
                  
                  <!-- Programación -->
                  <td class="px-4 py-3">
                    <span class="font-mono text-emerald-600 text-[11px] block leading-none mb-1">{{ formatearHora(t.hora_24_h) }}</span>
                    <span class="text-[10px] font-medium text-slate-500 block mb-1.5">{{ formatearFecha(t.fecha) }}</span>
                    <span class="text-[8px] font-bold uppercase px-1 py-0.5 rounded inline-block shadow-sm" [ngClass]="getPrioridadClass(t.prioridad)">{{ t.prioridad }}</span>
                  </td>
                  
                  <!-- Admisión -->
                  <td class="px-4 py-3 text-[11px]">
                    <button type="button" class="font-mono text-slate-700 mb-0.5 cursor-pointer hover:text-emerald-600" (click)="copyToClipboard(t.n_ingreso, $event)" title="Copiar Ingreso">Ing: {{ t.n_ingreso }}</button>
                    <div class="font-mono text-emerald-600 cursor-pointer hover:underline decoration-emerald-400 decoration-2 underline-offset-2 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-0.5" 
                         (click)="filterCoincidences.emit({folio: t.folio, ingreso: t.n_ingreso, paciente: t.paciente})" 
                         (keydown.enter)="filterCoincidences.emit({folio: t.folio, ingreso: t.n_ingreso, paciente: t.paciente})"
                         tabindex="0"
                         title="Ver coincidencias de este folio">Folio: {{ t.folio }}</div>
                  </td>

                  <!-- Paciente -->
                  <td class="px-4 py-3">
                    <div class="font-bold text-[11px] text-slate-900 mb-0.5">{{ t.paciente }}</div>
                    <button type="button" class="text-[10px] text-slate-500 mb-0.5 cursor-pointer hover:text-emerald-600" (click)="copyToClipboard(t.documento, $event)" title="Copiar Documento">CC: {{ t.documento }} • Sexo: {{ t.genero }}</button>
                    <div class="text-[9px] text-slate-400">Nac: {{ formatearFecha(t.fecha_nacimiento) }} ({{ t.edad }})</div>
                  </td>

                  <!-- Entidad -->
                  <td class="px-4 py-3 text-[11px] w-[800px] whitespace-normal">
                    <div class="font-semibold text-slate-800">{{ t.eps }}</div>
                  </td>

                  <!-- Autorizador -->
                  <td class="px-4 py-3 text-[11px] whitespace-normal">
                    @if (t.autorizador) {
                      <div class="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50/50 text-emerald-800 border-l-2 border-emerald-500 rounded-sm font-bold uppercase tracking-tighter">
                        <span class="leading-tight">{{ t.autorizador }}</span>
                      </div>
                    } @else {
                      <span class="text-slate-300 italic">Sin asignar</span>
                    }
                  </td>

                  <!-- Ubicación -->
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-medium text-slate-800 mb-0.5">{{ t.servicio_actual }}</div>
                    <div class="font-mono text-slate-500">Cama: {{ t.cama }}</div>
                  </td>

                  <!-- Especialista -->
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-medium text-slate-800 mb-0.5">{{ t.especialista }}</div>
                    <div class="text-[9px] text-slate-500">{{ t.especialidad }}</div>
                  </td>

                  <!-- Procedimiento -->
                  <td class="px-4 py-3 text-[11px] w-[350px] whitespace-normal">
                    <div class="font-medium text-slate-800 line-clamp-2" title="{{ t.cups_descripcion }}">{{ t.cups_descripcion }}</div>
                    <div class="flex justify-between items-center mt-1">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[9px] text-slate-500">CUPS: {{ t.cups }}</span>
                      </div>
                      <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{{ t.anestesia }}</span>
                    </div>
                  </td>

                  <!-- Diagnóstico -->
                  <td class="px-4 py-3 text-[11px] max-w-[250px] whitespace-normal">
                    <div class="font-medium text-slate-800 line-clamp-2" title="{{ t.dx_descr }}">{{ t.dx_descr }}</div>
                    <div class="text-[9px] text-slate-500 mt-1 font-mono">CIE: {{ t.dx }}</div>
                  </td>

                  <!-- Estado y Observación -->
                  <td class="px-4 py-3 min-w-[180px] whitespace-normal">
                    <div class="mb-1.5 flex justify-between items-center">
                      <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase" [ngClass]="getEstadoClass(t.estado)">
                        {{ t.estado }}
                      </span>
                      @if (t.imagenes) {
                        <span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{{ t.imagenes }}</span>
                      }
                      <span class="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">→</span >
                    </div>
                    <div class="text-[9px] text-slate-500 italic line-clamp-2" title="{{ t.observacion }}">{{ t.observacion || 'Sin observaciones' }}</div>
                  </td>
                </tr>
                @if (expandedRows().has(t.n_ingreso + '_' + t.documento)) {
                  @for (subProc of getProcedimientos(t.n_ingreso, t.documento); track subProc.id) {
                    <tr class="bg-slate-50/50 border-t border-slate-100">
                      <td class="px-4 py-3 text-center"></td>
                      
                      <!-- Programación -->
                      <td class="px-4 py-3">
                        <span class="font-mono text-emerald-600 text-[11px] block leading-none mb-1">{{ formatearHora(subProc.hora_24_h) }}</span>
                        <span class="text-[10px] font-medium text-slate-500 block mb-1.5">{{ formatearFecha(subProc.fecha) }}</span>
                      </td>
                      
                      <!-- Admisión -->
                      <td class="px-4 py-3 text-[11px]">
                        <button type="button" class="font-mono text-slate-700 mb-0.5 cursor-pointer hover:text-emerald-600" (click)="copyToClipboard(subProc.n_ingreso, $event)" title="Copiar Ingreso">Ing: {{ subProc.n_ingreso }}</button>
                        <div class="font-mono text-slate-500">Folio: {{ subProc.folio }}</div>
                      </td>

                      <!-- Paciente -->
                      <td class="px-4 py-3">
                        <div class="font-bold text-[11px] text-slate-900 mb-0.5">{{ subProc.paciente }}</div>
                      </td>

                      <!-- Entidad -->
                      <td class="px-4 py-3 text-[11px] w-[800px] whitespace-normal">
                        <div class="font-semibold text-slate-800">{{ subProc.eps }}</div>
                      </td>

                      <!-- Autorizador -->
                      <td class="px-4 py-3 text-[11px] whitespace-normal">
                        @if (subProc.autorizador) {
                          <div class="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50/50 text-emerald-800 border-l-2 border-emerald-500 rounded-sm font-bold uppercase tracking-tighter">
                            <mat-icon class="text-[12px] w-3 h-3 text-emerald-600">verified_user</mat-icon>
                            <span class="leading-tight">{{ subProc.autorizador }}</span>
                          </div>
                        }
                      </td>

                      <!-- Ubicación -->
                      <td class="px-4 py-3 text-[11px]">
                        <div class="font-medium text-slate-800 mb-0.5">{{ subProc.servicio_actual }}</div>
                        <div class="font-mono text-slate-500">Cama: {{ subProc.cama }}</div>
                      </td>

                      <!-- Especialista -->
                      <td class="px-4 py-3 text-[11px]">
                        <div class="font-medium text-slate-800 mb-0.5">{{ subProc.especialista }}</div>
                        <div class="text-[9px] text-slate-500">{{ subProc.especialidad }}</div>
                      </td>

                      <!-- Procedimiento -->
                      <td class="px-4 py-3 text-[11px] max-w-[250px] whitespace-normal">
                        <div class="font-medium text-slate-800 line-clamp-2" title="{{ subProc.cups_descripcion }}">{{ subProc.cups_descripcion }}</div>
                        <div class="flex items-center gap-1.5 mt-1">
                          <span class="text-[9px] text-slate-500">CUPS: {{ subProc.cups }}</span>
                          <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{{ subProc.anestesia }}</span>
                        </div>
                      </td>

                      <!-- Diagnóstico -->
                      <td class="px-4 py-3 text-[11px] max-w-[250px] whitespace-normal">
                        <div class="font-medium text-slate-800 line-clamp-2" title="{{ subProc.dx_descr }}">{{ subProc.dx_descr }}</div>
                        <div class="text-[9px] text-slate-500 mt-1 font-mono">CIE: {{ subProc.dx }}</div>
                      </td>

                      <!-- Estado y Observación -->
                      <td class="px-4 py-3 min-w-[180px] whitespace-normal">
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase" [ngClass]="getEstadoClass(subProc.estado)">
                          {{ subProc.estado }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              } @empty {
                <tr>
                  <td colspan="11" class="px-6 py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center gap-2">
                      <mat-icon class="w-8 h-8 text-slate-300 text-[32px]">inbox</mat-icon>
                      No se encontraron turnos quirúrgicos.
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
export class TurnosListComponent {
  turnos = input.required<Turno[]>();
  activeFilter = input<{ folio: string | null, ingreso: string | null, paciente: string | null } | null>(null);
  turnoClick = output<Turno>();
  filterCoincidences = output<{ folio: string | null, ingreso: string | null, paciente: string | null } | null>();
  clearFilter = output<void>();
  turnoService = inject(TurnoService);

  expandedRows = signal<Set<string>>(new Set());
  filters = signal<Record<string, string>>({});

  hasActiveFilters = computed(() => {
    const hasSearch = !!this.turnoService.searchQuery();
    const hasColumnFilters = Object.keys(this.filters()).length > 0;
    const hasActiveFilter = !!this.activeFilter();
    return hasSearch || hasColumnFilters || hasActiveFilter;
  });

  filteredTurnos = computed(() => {
    const allTurnos = this.turnos();
    const activeFilters = this.filters();
    const coincidenceFilter = this.activeFilter();
    
    let result = allTurnos;

    if (coincidenceFilter) {
      result = result.filter(t => 
        t.folio === coincidenceFilter.folio && 
        t.n_ingreso === coincidenceFilter.ingreso && 
        t.paciente === coincidenceFilter.paciente
      );
    }

    return result.filter(t => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        const val = (t as unknown as Record<string, unknown>)[key]?.toString()?.toLowerCase() || '';
        return val.includes(value.toLowerCase());
      });
    });
  });

  closeAllFilters() {
    this.filters.set({});
  }

  toggleFilter(column: string, event: Event) {
    event.stopPropagation();
    this.filters.update(f => {
      const newFilters = { ...f };
      if (newFilters[column] === undefined) {
        newFilters[column] = '';
      } else {
        delete newFilters[column];
      }
      return newFilters;
    });
  }

  onFilterInput(column: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.updateFilter(column, input.value);
  }

  updateFilter(column: string, value: string) {
    this.filters.update(f => ({ ...f, [column]: value }));
  }

  toggleExpand(n_ingreso: string | null, documento: string | null, event: Event) {
    event.stopPropagation();
    if (!n_ingreso || !documento) return;
    const key = `${n_ingreso}_${documento}`;
    const newExpanded = new Set(this.expandedRows());
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    this.expandedRows.set(newExpanded);
  }

  getProcedimientos(n_ingreso: string | null, documento: string | null): Turno[] {
    if (!n_ingreso || !documento) return [];
    return this.turnoService.turnos().filter(t => t.n_ingreso === n_ingreso && t.documento === documento);
  }

  getProcedimientosCount(n_ingreso: string | null, documento: string | null): number {
    return this.getProcedimientos(n_ingreso, documento).length;
  }

  getPrioridadClass(prioridad: string | null): string {
    const p = prioridad?.toUpperCase() || '';
    if (p.includes('URGENCIA') || p.includes('EMERGENCIA')) return 'bg-red-600 text-white border border-red-700';
    if (p.includes('REGULAR') || p.includes('PROGRAMADA')) return 'bg-green-800 text-white border border-green-900';
    return 'bg-slate-200 text-slate-700 border border-slate-300';
  }

  getEstadoClass(estado: string | null): string {
    const e = estado?.toUpperCase() || '';
    if (e.includes('AUTORIZADO') && !e.includes('NO')) return 'bg-[#1a7441] text-white';
    if (e.includes('PENDIENTE')) return 'bg-[#ffe599] text-slate-800';
    if (e.includes('VERIFICADO')) return 'bg-[#0b5394] text-white';
    if (e.includes('NO AUTORIZADO')) return 'bg-[#b60205] text-white';
    if (e.includes('EN COTIZACIÓN')) return 'bg-[#d9ead3] text-slate-800';
    if (e.includes('GESTIONADO')) return 'bg-[#cfe2f3] text-slate-800';
    if (e.includes('CX AMBULATORIA')) return 'bg-[#e0e0e0] text-slate-800';
    if (e.includes('EGRESO')) return 'bg-[#295e6a] text-white';
    return 'bg-slate-200 text-slate-700';
  }

  formatearHora(horaStr: string | null): string {
    if (!horaStr) return '--:--';
    const str = horaStr.toString();
    const match = str.match(/\d{2}:\d{2}(:\d{2})?/);
    return match ? match[0] : str;
  }

  formatearFecha(fechaStr: string | null): string {
    if (!fechaStr) return '';
    const str = fechaStr.toString();
    
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.split('T')[0];
    }

    const date = new Date(str);
    if (isNaN(date.getTime())) return str; // Return original if invalid
    
    // Format as YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  copyToClipboard(text: string | null, event: Event) {
    event.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Add a toast notification here
      console.log('Copiado al portapapeles:', text);
    });
  }
}

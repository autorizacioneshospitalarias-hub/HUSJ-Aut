import { Component, input, output, inject, signal, computed } from '@angular/core';
import { Turno } from '../../models/turno';
import { TurnoService } from '../../services/turno.service';
import { LucideAngularModule, Check, X, Clock } from 'lucide-angular';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-turnos-list',
  standalone: true,
  imports: [MatIconModule, NgClass, LucideAngularModule],
  template: `
    <div class="h-full animate-in fade-in duration-300 bg-white focus:outline-none" (click)="closeAllFilters()" role="button" tabindex="0" (keydown.enter)="closeAllFilters()">
      <div class="h-full flex flex-col relative" [ngClass]="hasActiveFilters() ? 'bg-slate-50' : 'bg-white'">
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
            <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 font-medium w-10">#</th>
                <th class="px-4 py-3 font-medium group relative">
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
                <th class="px-4 py-3 font-medium group relative">
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
                <th class="px-4 py-3 font-medium group relative">
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
                  <th class="px-4 py-3 font-medium w-[450px] group relative">
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
                <th class="px-4 py-3 font-medium group relative">
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
                <th class="px-4 py-3 font-medium group relative">
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
                <th class="px-4 py-3 font-medium group relative">
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
                <th class="px-4 py-3 font-medium w-[250px] group relative">
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
                <th class="px-4 py-3 font-medium w-[250px] group relative">
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
                <th class="px-4 py-3 font-medium group relative">
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
            <tbody class="text-slate-600 align-top bg-white">
              @for (t of paginatedTurnos(); track t.id; let i = $index) {
                <tr (click)="turnoClick.emit(t)" 
                    class="border-b transition-all duration-200 cursor-pointer group focus:outline-none relative"
                    [ngClass]="expandedRows().has(t.folio + '_' + t.n_ingreso + '_' + t.documento) ? 'bg-indigo-50/60 border-indigo-200 shadow-sm z-10' : (hasActiveFilters() ? 'bg-white hover:bg-slate-50 border-slate-200' : 'hover:bg-slate-50 border-slate-200')">
                  <!-- Enumeración -->
                  <td class="px-4 py-3 text-center relative">
                    <!-- Accent vertical line when expanded -->
                    @if (expandedRows().has(t.folio + '_' + t.n_ingreso + '_' + t.documento)) {
                      <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[1px_0_4px_rgba(99,102,241,0.4)]"></div>
                    }
                    
                    <div class="flex flex-col items-center gap-1.5">
                      <span class="text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border transition-colors"
                            [ngClass]="expandedRows().has(t.folio + '_' + t.n_ingreso + '_' + t.documento) ? 'text-indigo-700 bg-indigo-100 border-indigo-200' : 'text-slate-400 bg-slate-100 border-slate-200'">
                        {{ getAbsIndex(i) }}
                      </span>
                      @if (getProcedimientosCount(t.folio, t.n_ingreso, t.documento) > 1) {
                        <button (click)="toggleExpand(t.folio, t.n_ingreso, t.documento, $event)" 
                                class="text-[9px] font-bold px-1.5 py-0.5 flex items-center justify-center rounded border shadow-sm transition-all shadow-indigo-500/20"
                                [ngClass]="expandedRows().has(t.folio + '_' + t.n_ingreso + '_' + t.documento) ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' : 'text-indigo-700 bg-white border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'">
                          {{ expandedRows().has(t.folio + '_' + t.n_ingreso + '_' + t.documento) ? '-' : '+' }} {{ getProcedimientosCount(t.folio, t.n_ingreso, t.documento) }}
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
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="font-bold text-[11px] text-slate-900 mb-0.5 whitespace-nowrap">{{ t.paciente }}</div>
                    <button type="button" class="text-[10px] text-slate-500 mb-0.5 cursor-pointer hover:text-emerald-600" (click)="copyToClipboard(t.documento, $event)" title="Copiar Documento">CC: {{ t.documento }} • Sexo: {{ t.genero }}</button>
                    <div class="text-[9px] text-slate-400">Nac: {{ formatearFecha(t.fecha_nacimiento) }} ({{ t.edad }})</div>
                  </td>

                  <!-- Entidad -->
                  <td class="px-4 py-3 text-[11px] w-[450px] whitespace-normal">
                    <div class="font-semibold text-slate-800 leading-tight line-clamp-2" title="{{ t.eps }}">{{ t.eps }}</div>
                  </td>

                  <!-- Autorizador -->
                  <td class="px-4 py-3 text-[11px] w-[150px] whitespace-nowrap">
                    @if (t.autorizador) {
                      <span class="text-slate-900 text-[11px] whitespace-nowrap">{{ t.autorizador }}</span>
                    } @else {
                      <span class="text-slate-300 italic">Sin asignar</span>
                    }
                    @if (t.estado) {
                      <div class="mt-1">
                        @if (t.estado.toUpperCase() === 'SI' || t.estado.toUpperCase() === 'SÍ') {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                            <lucide-icon [name]="Check" class="w-2 h-2"></lucide-icon>
                            Aut: SI
                          </span>
                        } @else if (t.estado.toUpperCase() === 'NO') {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold">
                            <lucide-icon [name]="X" class="w-2 h-2"></lucide-icon>
                            Aut: NO
                          </span>
                        } @else if (t.estado.toUpperCase() === 'PTE' || t.estado.toUpperCase() === 'PENDIENTE') {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                            <lucide-icon [name]="Clock" class="w-2 h-2"></lucide-icon>
                            Aut: {{ t.estado.toUpperCase() === 'PENDIENTE' ? 'PTE' : t.estado.toUpperCase() }}
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[9px] font-bold">
                            Aut: {{ t.estado.toUpperCase() }}
                          </span>
                        }
                      </div>
                    }
                  </td>

                  <!-- Ubicación -->
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-medium text-slate-800 mb-0.5">{{ t.servicio_actual }}</div>
                    <div class="font-mono text-slate-500">Cama: {{ t.cama }}</div>
                  </td>

                  <!-- Especialista -->
                  <td class="px-4 py-3 text-[11px] w-[150px]">
                    <div class="font-medium text-slate-800 leading-tight whitespace-normal">{{ t.especialista }}</div>
                    <div class="text-[9px] text-slate-500 mt-1">{{ t.especialidad }}</div>
                  </td>

                  <!-- Procedimiento -->
                  <td class="px-4 py-3 text-[11px] w-[250px] whitespace-normal">
                    <div class="flex flex-col gap-2">
                      @for (p of getProcedimientos(t.folio, t.n_ingreso, t.documento); track p.id) {
                        <div>
                          <div class="text-slate-800 leading-tight whitespace-normal line-clamp-2" title="{{ p.cups_descripcion }}">
                            @if (getProcedimientosCount(t.folio, t.n_ingreso, t.documento) > 1) { <span class="text-slate-400 font-bold mr-0.5">•</span> }
                            {{ p.cups_descripcion }}
                          </div>
                          <div class="text-[9px] text-slate-500 mt-1 font-mono flex flex-wrap gap-2">
                             <span class="bg-indigo-50/50 text-indigo-700 px-1 rounded border border-indigo-100 shadow-sm">CUPS: {{ p.cups }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </td>

                  <!-- Diagnóstico -->
                  <td class="px-4 py-3 text-[11px] w-[250px] whitespace-normal">
                    <div class="flex flex-col gap-2">
                      @for (p of getProcedimientos(t.folio, t.n_ingreso, t.documento); track p.id) {
                        <div>
                          <div class="text-slate-800 leading-tight line-clamp-2" title="{{ p.dx_descr }}">
                            @if (getProcedimientosCount(t.folio, t.n_ingreso, t.documento) > 1) { <span class="text-slate-400 font-bold mr-0.5">•</span> }
                            {{ p.dx_descr }}
                          </div>
                          <div class="text-[9px] text-slate-500 mt-1 font-mono flex flex-wrap gap-2">
                             <span class="bg-slate-50 px-1 text-slate-600 rounded border border-slate-200">CIE: {{ p.dx }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </td>

                  <!-- Estado y Observación -->
                  <td class="px-4 py-3 min-w-[180px] whitespace-normal">
                    <div class="mb-1.5 flex justify-between items-center">
                      @if (t.imagenes) {
                        <span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{{ t.imagenes }}</span>
                      }
                      <span class="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">→</span >
                    </div>
                    <div class="text-[9px] text-slate-500 italic line-clamp-2" title="{{ t.observacion }}">{{ t.observacion || 'Sin observaciones' }}</div>
                  </td>
                </tr>
                @if (expandedRows().has(t.folio + '_' + t.n_ingreso + '_' + t.documento)) {
                  @for (subProc of getProcedimientos(t.folio, t.n_ingreso, t.documento); track subProc.id; let subIdx = $index) {
                    <tr class="bg-indigo-50/20 border-b border-indigo-100/60 relative">
                      <td class="px-4 py-3 text-center relative">
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[1px_0_4px_rgba(99,102,241,0.4)]"></div>
                        <div class="flex flex-col items-center justify-center h-full text-indigo-300">
                           <span class="text-[9px] font-bold">{{ subIdx + 1 }}</span>
                        </div>
                      </td>
                      
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
                      <td class="px-4 py-3 text-[11px] w-[450px] whitespace-normal">
                        <div class="font-semibold text-slate-800 leading-tight line-clamp-2" title="{{ subProc.eps }}">{{ subProc.eps }}</div>
                      </td>

                      <!-- Autorizador -->
                      <td class="px-4 py-3 text-[11px] w-[150px] whitespace-nowrap">
                        @if (subProc.autorizador) {
                          <span class="text-slate-900 text-[11px] whitespace-nowrap">{{ subProc.autorizador }}</span>
                        } @else {
                          <span class="text-slate-300 italic">Sin asignar</span>
                        }
                        @if (subProc.estado) {
                          <div class="mt-1">
                            @if (subProc.estado.toUpperCase() === 'SI' || subProc.estado.toUpperCase() === 'SÍ') {
                              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                <lucide-icon [name]="Check" class="w-2 h-2"></lucide-icon>
                                Aut: SI
                              </span>
                            } @else if (subProc.estado.toUpperCase() === 'NO') {
                              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold">
                                <lucide-icon [name]="X" class="w-2 h-2"></lucide-icon>
                                Aut: NO
                              </span>
                            } @else if (subProc.estado.toUpperCase() === 'PTE' || subProc.estado.toUpperCase() === 'PENDIENTE') {
                              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                                <lucide-icon [name]="Clock" class="w-2 h-2"></lucide-icon>
                                Aut: {{ subProc.estado.toUpperCase() === 'PENDIENTE' ? 'PTE' : subProc.estado.toUpperCase() }}
                              </span>
                            } @else {
                              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[9px] font-bold">
                                Aut: {{ subProc.estado.toUpperCase() }}
                              </span>
                            }
                          </div>
                        }
                      </td>

                      <!-- Ubicación -->
                      <td class="px-4 py-3 text-[11px]">
                        <div class="font-medium text-slate-800 mb-0.5">{{ subProc.servicio_actual }}</div>
                        <div class="font-mono text-slate-500">Cama: {{ subProc.cama }}</div>
                      </td>

                      <!-- Especialista -->
                      <td class="px-4 py-3 text-[11px] w-[150px]">
                        <div class="font-medium text-slate-800 leading-tight whitespace-normal">{{ subProc.especialista }}</div>
                        <div class="text-[9px] text-slate-500 mt-1">{{ subProc.especialidad }}</div>
                      </td>

                      <!-- Procedimiento -->
                      <td class="px-4 py-3 text-[11px] w-[250px] whitespace-normal">
                        <div class="text-slate-800 leading-tight whitespace-normal line-clamp-2" title="{{ subProc.cups_descripcion }}">{{ subProc.cups_descripcion }}</div>
                        <div class="text-[9px] text-slate-500 mt-2 font-mono flex flex-wrap gap-2">
                           <span class="bg-slate-100 px-1 rounded">CUPS: {{ subProc.cups }}</span>
                        </div>
                      </td>

                      <!-- Diagnóstico -->
                      <td class="px-4 py-3 text-[11px] w-[250px] whitespace-normal">
                        <div class="text-slate-800 leading-tight line-clamp-2" title="{{ subProc.dx_descr }}">{{ subProc.dx_descr }}</div>
                        <div class="text-[9px] text-slate-500 mt-2 font-mono flex flex-wrap gap-2">
                           <span class="bg-slate-100 px-1 rounded">CIE: {{ subProc.dx }}</span>
                        </div>
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
        
        <!-- Pagination Controls -->
        <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 shrink-0">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-500">Filas por página:</label>
              <select class="text-sm border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      (change)="onPageSizeChange($event)">
                <option value="50" [selected]="pageSize() === 50">50</option>
                <option value="100" [selected]="pageSize() === 100">100</option>
                <option value="200" [selected]="pageSize() === 200">200</option>
                <option value="500" [selected]="pageSize() === 500">500</option>
                <option value="Todos" [selected]="pageSize() === 'Todos'">Todos</option>
              </select>
            </div>
            <div class="text-sm text-slate-500 hidden sm:block">
              Mostrando <span class="font-medium">{{ filteredTurnos().length === 0 ? 0 : (pageSize() === 'Todos' ? 1 : (currentPage() - 1) * +pageSize() + 1) }}</span> a <span class="font-medium">{{ pageSize() === 'Todos' ? filteredTurnos().length : Math.min(currentPage() * +pageSize(), filteredTurnos().length) }}</span> de <span class="font-medium">{{ filteredTurnos().length }}</span> turnos
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="prevPage()" [disabled]="currentPage() === 1 || pageSize() === 'Todos'" class="px-3 py-1.5 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors font-medium text-slate-700 flex items-center gap-1">
              <mat-icon class="text-[16px] w-4 h-4">chevron_left</mat-icon> Anterior
            </button>
            <div class="text-sm text-slate-600 px-2 font-medium">
              Página {{ currentPage() }} de {{ totalPages() }}
            </div>
            <button (click)="nextPage()" [disabled]="currentPage() === totalPages() || pageSize() === 'Todos'" class="px-3 py-1.5 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors font-medium text-slate-700 flex items-center gap-1">
              Siguiente <mat-icon class="text-[16px] w-4 h-4">chevron_right</mat-icon>
            </button>
          </div>
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
  readonly Check = Check;
  readonly X = X;
  readonly Clock = Clock;
  Math = Math;

  turnoService = inject(TurnoService);

  expandedRows = signal<Set<string>>(new Set());
  filters = signal<Record<string, string>>({});

  // Pagination
  pageSize = signal<number | 'Todos'>(50);
  currentPage = signal(1);

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
    }).filter((t, index, self) => {
      // Unique rows calculation based on folio, n_ingreso and documento
      const firstIndex = self.findIndex(x => x.folio === t.folio && x.n_ingreso === t.n_ingreso && x.documento === t.documento);
      return index === firstIndex;
    });
  });

  paginatedTurnos = computed(() => {
    const filtered = this.filteredTurnos();
    const size = this.pageSize();
    if (size === 'Todos') return filtered;
    
    const start = (this.currentPage() - 1) * size;
    const end = start + size;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    const filterLength = this.filteredTurnos().length;
    const size = this.pageSize();
    if (size === 'Todos' || filterLength === 0) return 1;
    return Math.ceil(filterLength / size);
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
    this.currentPage.set(1);
  }

  toggleExpand(folio: string | null, n_ingreso: string | null, documento: string | null, event: Event) {
    event.stopPropagation();
    if (!documento) return;
    const key = `${folio}_${n_ingreso}_${documento}`;
    const newExpanded = new Set(this.expandedRows());
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    this.expandedRows.set(newExpanded);
  }

  getProcedimientos(folio: string | null, n_ingreso: string | null, documento: string | null): Turno[] {
    if (!documento) return [];
    return this.turnoService.turnos()
      .filter(t => t.folio === folio && t.n_ingreso === n_ingreso && t.documento === documento)
      .sort((a, b) => {
        const dtA = (a.fecha || '') + 'T' + (a.hora_24_h || '00:00:00');
        const dtB = (b.fecha || '') + 'T' + (b.hora_24_h || '00:00:00');
        return dtA.localeCompare(dtB);
      });
  }

  getProcedimientosCount(folio: string | null, n_ingreso: string | null, documento: string | null): number {
    return this.getProcedimientos(folio, n_ingreso, documento).length;
  }

  getAbsIndex(index: number): number {
    const size = this.pageSize();
    if (size === 'Todos') return index + 1;
    return (this.currentPage() - 1) * (+size) + index + 1;
  }

  onPageSizeChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === 'Todos') {
      this.pageSize.set('Todos');
    } else {
      this.pageSize.set(Number(val));
    }
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
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

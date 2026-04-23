import { Component, input, output, inject, signal, computed, effect } from '@angular/core';
import { Cirugia } from '../../models/cirugia';
import { CirugiaService } from '../../services/cirugia.service';
import { PacienteIngresoService } from '../../services/paciente-ingreso.service';
import { ConsolidadoService, ConsolidadoRecord } from '../../services/consolidado.service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, NgClass } from '@angular/common';
import { LucideAngularModule, Check, X, Clock, FileText, ClipboardList } from 'lucide-angular';

interface GroupedCirugia extends Cirugia {
  groupId: string;
  tq_count: number;
  detalles: Cirugia[];
}

@Component({
  selector: 'app-cirugias-list',
  standalone: true,
  imports: [MatIconModule, NgClass, DatePipe, LucideAngularModule],
  template: `
    <div class="h-full animate-in fade-in duration-300 bg-white focus:outline-none" (click)="closeAllFilters()" role="button" tabindex="0" (keydown.enter)="closeAllFilters()">
      <div class="h-full flex flex-col relative" [ngClass]="hasActiveFilters() ? 'bg-slate-50' : 'bg-white'">
        @if (activeTQFilter(); as tq) {
          <div class="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div class="flex items-center gap-2 text-blue-800 text-sm">
              <mat-icon class="text-[18px] w-5 h-5">filter_alt</mat-icon>
              <span class="font-bold">{{ tq.cups ? 'Historial de T.Q.' : 'Historial de Ingreso' }}</span>
              @if (tq.cups) {
                <span class="text-blue-600 text-xs font-medium px-2 border-l border-blue-300">CUPS: {{ tq.cups }}</span>
              }
              @if (tq.estado) {
                <span class="text-blue-600 text-xs font-medium px-2 border-l border-blue-300">Estado: {{ tq.estado }}</span>
              }
              <span class="text-blue-600 text-xs font-medium px-2 border-l border-blue-300">Paciente: {{ tq.patientName }}</span>
              <span class="text-blue-600 text-xs font-medium px-2 border-l border-blue-300">Ingreso: {{ tq.admissionNumber }}</span>
            </div>
            <button (click)="clearTQFilter()" class="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors">
              <mat-icon class="text-[14px] w-4 h-4">close</mat-icon>
              Cerrar Historial
            </button>
          </div>
        }
        <div class="overflow-auto flex-1 scrollbar-hide">
          <table class="w-full text-sm text-left whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 font-medium w-10">#</th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('date')">
                  <div class="flex items-center gap-1">
                    <span>Fecha</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('date', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['date'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-date" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('date', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('date', $event)" [value]="filters()['date'] || ''" placeholder="Fecha / Qx" (blur)="onBlurFilter('date')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('date', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('admissionNumber')">
                  <div class="flex items-center gap-1">
                    <span>Admisión</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('admissionNumber', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['admissionNumber'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-admissionNumber" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('admissionNumber', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('admissionNumber', $event)" [value]="filters()['admissionNumber'] || ''" placeholder="Admisión" (blur)="onBlurFilter('admissionNumber')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('admissionNumber', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('patientName')">
                  <div class="flex items-center gap-1">
                    <span>Paciente</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('patientName', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['patientName'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-patientName" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('patientName', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('patientName', $event)" [value]="filters()['patientName'] || ''" placeholder="Paciente / CC" (blur)="onBlurFilter('patientName')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('patientName', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('patientName')">
                  <div class="flex items-center gap-1">
                    <span>Ubicación</span>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium w-[800px] group relative cursor-pointer" (click)="toggleSort('entity')">
                  <div class="flex items-center gap-1">
                    <span>Entidad</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('entity', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['entity'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-entity" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('entity', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('entity', $event)" [value]="filters()['entity'] || ''" placeholder="Entidad" (blur)="onBlurFilter('entity')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('entity', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative min-w-[250px] cursor-pointer" (click)="toggleSort('procedure')">
                  <div class="flex items-center gap-1">
                    <span>Procedimiento</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('procedure', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['procedure'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-procedure" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('procedure', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('procedure', $event)" [value]="filters()['procedure'] || ''" placeholder="Procedimiento / CUPS" (blur)="onBlurFilter('procedure')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('procedure', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('estado')">
                  <div class="flex items-center gap-1">
                    <span>Estado & Novedad</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('estado', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['estado'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-estado" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('estado', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('estado', $event)" [value]="filters()['estado'] || ''" placeholder="Estado / Novedad" (blur)="onBlurFilter('estado')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('estado', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('authorization')">
                  <div class="flex items-center gap-1">
                    <span>Autorización</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('authorization', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['authorization'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-authorization" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('authorization', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('authorization', $event)" [value]="filters()['authorization'] || ''" placeholder="Autorización" (blur)="onBlurFilter('authorization')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('authorization', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('surgeon')">
                  <div class="flex items-center gap-1">
                    <span>Especialista</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('surgeon', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['surgeon'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-surgeon" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('surgeon', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('surgeon', $event)" [value]="filters()['surgeon'] || ''" placeholder="Especialista / Especialidad / Anest" (blur)="onBlurFilter('surgeon')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('surgeon', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium group relative cursor-pointer" (click)="toggleSort('assistant1')">
                  <div class="flex items-center gap-1">
                    <span>Ayudantes</span>
                    <mat-icon class="text-[14px] w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-900 transition-opacity duration-200" (click)="toggleFilter('assistant1', $event)">search</mat-icon>
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center z-20 transition-all duration-200 ease-out overflow-hidden"
                       [ngClass]="filters()['assistant1'] !== undefined ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0 pointer-events-none'">
                    <div class="relative w-full flex items-center">
                      <input id="filter-input-assistant1" class="w-full py-1 pl-2 pr-8 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 placeholder:text-slate-400 min-w-[100px]" 
                             (input)="onFilterInput('assistant1', $event)" (click)="$event.stopPropagation()" (keydown.escape)="toggleFilter('assistant1', $event)" [value]="filters()['assistant1'] || ''" placeholder="Ayudante 1 / 2" (blur)="onBlurFilter('assistant1')"> 
                      <mat-icon class="absolute right-2 text-[14px] w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-900" (click)="toggleFilter('assistant1', $event)">close</mat-icon>
                    </div>
                  </div>
                </th>
                <th class="px-4 py-3 font-medium w-24 text-center">
                  <div class="flex items-center justify-center h-full">
                    <button (click)="toggleAllVerificado($event)"
                            class="w-5 h-5 flex items-center justify-center rounded-full border transition-colors mx-auto focus:outline-none cursor-pointer"
                            [ngClass]="isAllVerificado() ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-300 hover:border-slate-400'">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="text-slate-600 align-top bg-white">
              @for (c of paginatedCirugias(); track c.groupId; let i = $index) {
                <tr (click)="cirugiaClick.emit(c)" 
                    (keydown.enter)="cirugiaClick.emit(c)"
                    tabindex="0"
                    class="border-b border-slate-200 cursor-pointer group focus:outline-none transition-colors duration-1000"
                    [ngClass]="isRecentlyUpdated(c) ? 'animate-highlight-fade hover:bg-red-50 focus:bg-red-50' : (c.status === 'Verificado' ? 'bg-emerald-50/60 hover:bg-emerald-100 focus:bg-emerald-100' : (hasActiveFilters() ? 'bg-white hover:bg-slate-50 focus:bg-slate-100' : 'hover:bg-slate-50 focus:bg-slate-100'))">
                  <!-- Enumeración -->
                  <td class="px-4 py-3 text-center">
                    <div class="flex flex-col items-center gap-1">
                      <button (click)="toggleExpansion(c.groupId, $event)" 
                              class="text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border transition-colors mx-auto focus:outline-none"
                              [ngClass]="selectedGroupId() === c.groupId ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'text-slate-400 bg-slate-100 border-slate-200 hover:bg-blue-600 hover:text-white'">
                        {{ i + 1 }}
                      </button>
                    </div>
                  </td>
                  
                  <!-- Fecha -->
                  <td class="px-4 py-3">
                    <span class="font-mono text-emerald-600 text-[10px] block leading-none mb-1">Qx: {{ c.orNumber || 'N/A' }}</span>
                    <span class="text-[10px] font-medium text-slate-500 block mb-1.5">{{ c.date | date:'dd/MM/yyyy' }}</span>
                    <span class="text-[8px] font-bold uppercase px-1 py-0.5 rounded inline-block shadow-sm border transition-colors"
                          [ngClass]="c.type?.toUpperCase() === 'ENDOSCOPIA' ? 'bg-[#4285f4] text-white border-[#4285f4]' : 'bg-slate-200 text-slate-700 border-slate-300'">
                      {{ c.type }}
                    </span>
                  </td>
                  
                  <!-- Admisión -->
                  <td class="px-4 py-3 text-[11px]">
                    <div class="flex items-center gap-1 group/ingreso">
                      <div class="font-mono text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer" 
                           (click)="copyToClipboard(c.admissionNumber || '', $event)"
                           (keydown.enter)="copyToClipboard(c.admissionNumber || '', $event)"
                           tabindex="0">Ing: {{ c.admissionNumber }}</div>
                      <button (click)="openConsolidadoModal(c.admissionNumber || '', $event)" class="text-slate-400 hover:text-indigo-600 opacity-0 group-hover/ingreso:opacity-100 transition-opacity p-0.5 rounded hover:bg-indigo-50" title="Ver información del consolidado">
                        <lucide-icon [name]="FileText" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </td>

                  <!-- Paciente -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="font-bold text-[11px] text-slate-900 mb-0.5">{{ c.patientName || getPatientName(c.admissionNumber || '') }}</div>
                    </div>
                    <div class="text-[10px] text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer" 
                         (click)="copyToClipboard(c.documento && c.documento !== 'N/A' ? c.documento : getPatientDocument(c.admissionNumber || ''), $event)"
                         (keydown.enter)="copyToClipboard(c.documento && c.documento !== 'N/A' ? c.documento : getPatientDocument(c.admissionNumber || ''), $event)"
                         tabindex="0">CC: {{ c.documento && c.documento !== 'N/A' ? c.documento : getPatientDocument(c.admissionNumber || '') }}</div>
                  </td>

                  <!-- Ubicación -->
                  <td class="px-4 py-3">
                    @let ubicacion = getUbicacion(c.admissionNumber || '', c.patientName || '');
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold text-slate-700">{{ ubicacion.area }}</span>
                      <span class="text-[10px] text-slate-500">{{ ubicacion.cama }}</span>
                    </div>
                  </td>

                  <!-- Entidad -->
                  <td class="px-4 py-3 text-[11px] w-[600px] whitespace-normal">
                    <div class="font-semibold text-slate-800">{{ c.entity }}</div>
                  </td>

                  <!-- Procedimiento -->
                  <td class="px-4 py-3 text-[11px] min-w-[250px] whitespace-normal">
                    <div class="font-medium text-slate-800 line-clamp-2" title="{{ c.procedure }}">{{ c.procedure }}</div>
                    <div class="flex justify-between items-center mt-1">
                      <div class="flex items-center gap-1.5">
                          <span class="text-[9px] text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors inline-flex items-center gap-0.5 group/cups"
                                (click)="copyToClipboard(c.cups, $event, c.groupId)"
                                (keydown.enter)="copyToClipboard(c.cups, $event, c.groupId)"
                                tabindex="0"
                                title="Copiar CUPS">
                            <lucide-icon [name]="ClipboardList" class="w-3 h-3"></lucide-icon>
                            CUPS: {{ c.cups }}
                            @if (copiedCupsId() === c.groupId) {
                              <lucide-icon [name]="Check" class="w-3 h-3 text-emerald-500"></lucide-icon>
                            } @else {
                              <lucide-icon [name]="ClipboardList" class="w-3 h-3 opacity-0 group-hover/cups:opacity-100"></lucide-icon>
                            }
                          </span>
                        <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-300 shadow-sm cursor-pointer hover:bg-blue-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400"
                              (click)="setTQFilter(c.admissionNumber, c.patientName, c.cups, $event)"
                              (keydown.enter)="setTQFilter(c.admissionNumber, c.patientName, c.cups, $event)"
                              tabindex="0"
                              title="Ver historial de tiempos para este CUPS">
                          T.Q: {{ c.tq_count }}
                        </span>
                      </div>
                      <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">GQX: {{ c.gqx }}</span>
                    </div>
                  </td>

                  <!-- Estado y Novedad -->
                  <td class="px-4 py-3 min-w-[180px] whitespace-normal">
                    <div class="mb-1.5 flex justify-between items-center">
                      <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer hover:bg-transparent hover:text-slate-900 border border-transparent hover:border-slate-400 transition-all focus:outline-none focus:ring-1 focus:ring-slate-400" 
                            [ngClass]="getEstadoClass(c.estado || '')"
                            (click)="setAdmissionFilter(c.admissionNumber, c.patientName, c.estado || null, $event)"
                            (keydown.enter)="setAdmissionFilter(c.admissionNumber, c.patientName, c.estado || null, $event)"
                            tabindex="0"
                            title="Ver registros con este estado en este ingreso">
                        {{ c.estado }}
                      </span>
                      <span class="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">→</span >
                    </div>
                    <div class="text-[9px] text-slate-500 italic line-clamp-2" title="{{ c.novedad }}">{{ c.novedad || 'Sin novedades' }}</div>
                    @if (c.imagesDx) {
                      <div class="text-[9px] text-blue-500 mt-1 font-mono">{{ c.imagesDx }}</div>
                    }
                  </td>

                  <!-- Autorización -->
                  <td class="px-4 py-3 text-[11px] whitespace-normal group/auth">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex flex-col">
                        @if (normalizeAuth(c.authorization) === 'SI') {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold mb-1 w-fit">
                            <lucide-icon [name]="Check" class="w-2.5 h-2.5"></lucide-icon>
                            SI
                          </span>
                        } @else if (normalizeAuth(c.authorization) === 'NO') {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold mb-1 w-fit">
                            <lucide-icon [name]="X" class="w-2.5 h-2.5"></lucide-icon>
                            NO
                          </span>
                        } @else if (normalizeAuth(c.authorization) === 'PTE') {
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold mb-1 w-fit">
                            <lucide-icon [name]="Clock" class="w-2.5 h-2.5"></lucide-icon>
                            PTE
                          </span>
                        } @else {
                          <span class="text-slate-300 italic block mb-1">Sin autorizar</span>
                        }
                        <div class="mt-1">
                          <span class="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 shadow-sm inline-block">
                            Liq: {{ formatLiquidation(c.auditLiquidation) }}
                          </span>
                        </div>
                      </div>
                      <button (click)="openAuthModal(c, $event)" class="text-slate-400 hover:text-emerald-600 opacity-0 group-hover/auth:opacity-100 transition-opacity p-1 rounded hover:bg-emerald-50 shrink-0" title="Registrar autorización">
                        <lucide-icon [name]="Check" [strokeWidth]="3" class="w-4 h-4"></lucide-icon>
                      </button>
                    </div>
                  </td>

                  <!-- Especialista -->
                  <td class="px-4 py-3 text-[11px]">
                    <div class="font-medium text-slate-800 mb-0.5">{{ c.surgeon }}</div>
                    <div class="text-[9px] text-slate-500 mb-1">{{ c.specialty }}</div>
                    <div class="text-[9px] text-slate-400">Anest: {{ c.anesthesiologist || 'N/A' }}</div>
                  </td>

                  <!-- Ayudantes -->
                  <td class="px-4 py-3 text-[11px] max-w-[200px] whitespace-normal">
                    <div class="text-[10px] text-slate-700 mb-0.5">1: {{ c.assistant1 || 'N/A' }}</div>
                    <div class="text-[10px] text-slate-700">2: {{ c.assistant2 || 'N/A' }}</div>
                  </td>

                  <!-- Verificado -->
                  <td class="px-4 py-3 text-center" (click)="$event.stopPropagation()">
                    <button (click)="toggleVerificado(c, $event)"
                            role="checkbox"
                            [attr.aria-checked]="c.status === 'Verificado'"
                            class="w-4 h-4 flex items-center justify-center rounded-full border transition-colors mx-auto focus:outline-none cursor-pointer"
                            [ngClass]="c.status === 'Verificado' ? 'bg-white border-slate-400 text-black shadow-sm' : 'bg-white border-slate-300 text-transparent hover:border-slate-400'">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-2.5 h-2.5">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </td>
                </tr>

                @if (expandedIds().has(c.groupId)) {
                  <tr class="bg-slate-50/50">
                    <td colspan="12" class="px-8 py-4">
                      <div class="border-l-2 border-emerald-200 pl-4 space-y-3 max-w-6xl mx-auto">
                        <div class="flex flex-col items-center justify-center mb-4 relative">
                          <div class="flex items-center gap-2">
                            <mat-icon class="text-emerald-500 text-[16px] w-4 h-4">check_circle</mat-icon>
                            <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detalle de Tiempos Quirúrgicos ({{ c.tq_count }})</h4>
                          </div>
                          <span class="absolute right-0 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors inline-flex items-center gap-1 group/cups-header"
                                (click)="copyToClipboard(c.cups, $event, c.groupId + '_header')"
                                (keydown.enter)="copyToClipboard(c.cups, $event, c.groupId + '_header')"
                                tabindex="0"
                                title="Copiar CUPS">
                            CUPS: {{ c.cups }}
                            @if (copiedCupsId() === c.groupId + '_header') {
                              <mat-icon class="text-[10px] w-3 h-3 text-emerald-500">check</mat-icon>
                            } @else {
                              <mat-icon class="text-[10px] w-3 h-3 opacity-0 group-hover/cups-header:opacity-100">content_copy</mat-icon>
                            }
                          </span>
                        </div>
                        <div class="grid grid-cols-1 gap-2">
                          @for (det of c.detalles; track det.id; let j = $index) {
                            <div class="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                              <div class="flex items-center gap-4 flex-1">
                                <span class="text-[10px] font-bold text-slate-400 w-4 shrink-0">{{ j + 1. }}.</span>
                                <div class="flex flex-col shrink-0">
                                  <span class="text-[10px] font-bold text-slate-700">{{ det.date | date:'dd/MM/yyyy' }}</span>
                                  <span class="text-[9px] text-slate-400">Qx: {{ det.orNumber || 'N/A' }}</span>
                                </div>
                                <div class="h-6 w-px bg-slate-100 mx-1 shrink-0"></div>
                                <div class="flex flex-col min-w-0 flex-1">
                                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Procedimientos</span>
                                  <span class="text-[10px] text-slate-700 line-clamp-2 leading-tight break-words" [title]="det.procedure || ''">{{ det.procedure || 'N/A' }}</span>
                                </div>
                              </div>
                              <div class="flex items-center gap-6 shrink-0">
                                <div class="text-right min-w-[100px] flex items-center justify-end gap-2 group/auth">
                                  <div class="flex flex-col items-end">
                                    <p class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter mb-1">Autorización</p>
                                    @if (normalizeAuth(det.authorization) === 'SI') {
                                      <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                        <lucide-icon [name]="Check" class="w-2.5 h-2.5"></lucide-icon>
                                        SI
                                      </span>
                                    } @else if (normalizeAuth(det.authorization) === 'NO') {
                                      <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold">
                                        <lucide-icon [name]="X" class="w-2.5 h-2.5"></lucide-icon>
                                        NO
                                      </span>
                                    } @else if (normalizeAuth(det.authorization) === 'PTE') {
                                      <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                                        <lucide-icon [name]="Clock" class="w-2.5 h-2.5"></lucide-icon>
                                        PTE
                                      </span>
                                    } @else {
                                      <p class="text-[10px] text-slate-400 italic">Sin autorizar</p>
                                    }
                                  </div>
                                  <button (click)="openAuthModal(det, $event)" class="text-slate-400 hover:text-emerald-600 opacity-0 group-hover/auth:opacity-100 transition-opacity p-1 rounded hover:bg-emerald-50 shrink-0" title="Registrar autorización">
                                    <mat-icon class="text-[16px] w-4 h-4">check_circle</mat-icon>
                                  </button>
                                </div>
                                <div class="text-right">
                                  <p class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">GQX</p>
                                  <p class="text-[10px] font-mono font-bold text-emerald-600">{{ det.gqx || 'N/A' }}</p>
                                </div>
                                <div class="text-right min-w-[80px]">
                                  <p class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Estado</p>
                                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" [ngClass]="getEstadoClass(det.estado || '')">
                                    {{ det.estado || 'OK' }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="12" class="px-6 py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center gap-2">
                      <mat-icon class="w-8 h-8 text-slate-300 text-[32px]">search</mat-icon>
                      Realiza una búsqueda para ver los resultados.
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
              <label class="text-sm text-slate-500">Grupos por página:</label>
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
              Mostrando <span class="font-medium">{{ filteredCirugias().length === 0 ? 0 : (pageSize() === 'Todos' ? 1 : (currentPage() - 1) * +pageSize() + 1) }}</span> a <span class="font-medium">{{ pageSize() === 'Todos' ? filteredCirugias().length : Math.min(currentPage() * +pageSize(), filteredCirugias().length) }}</span> de <span class="font-medium">{{ filteredCirugias().length }}</span> grupos
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

    <!-- Modals -->
    @if (viewingConsolidadoRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-indigo-600">info</mat-icon>
              Información del Consolidado
            </h3>
            <button (click)="closeConsolidadoModal()" class="text-slate-400 hover:text-slate-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="p-6 flex-1 overflow-y-auto">
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
              <!-- Datos del Paciente -->
              <div class="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paciente</p>
                    <p class="text-sm font-semibold text-slate-800">{{ viewingConsolidadoRecord()?.nombre || 'N/A' }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ingreso</p>
                    <p class="text-sm font-mono text-slate-700">{{ viewingConsolidadoRecord()?.ingreso || 'N/A' }}</p>
                  </div>
                </div>
              </div>

              <!-- Información Adicional -->
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">EPS / SOAT</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.eps_soat || 'N/A' }}</p>
              </div>
              
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contrato</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.contrato || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gestión Estancia</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.gestion_estancia || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Autorización Estancia</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.aut_estancia || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Próxima Gestión</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.fecha_proxima_gestion ? (viewingConsolidadoRecord()?.fecha_proxima_gestion | date:'dd/MM/yyyy') : 'N/A' }}</p>
              </div>
              
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Autorizador</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.autorizador || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Proceso Notif.</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.proceso_notif || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Notif.</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.nombre_notif || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Soportes</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.soportes || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Ingreso</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.fecha_ingreso ? (viewingConsolidadoRecord()?.fecha_ingreso | date:'dd/MM/yyyy') : 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Egreso Entidad</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.fecha_egreso_entidad ? (viewingConsolidadoRecord()?.fecha_egreso_entidad | date:'dd/MM/yyyy') : 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aut. Estancia Entidad</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.aut_estancia_entidad || 'N/A' }}</p>
              </div>

              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cortes Estancia</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.cortes_estancia || 'N/A' }}</p>
              </div>

              <div class="col-span-2">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Validación de Derechos</p>
                <p class="text-xs font-medium text-slate-700">{{ viewingConsolidadoRecord()?.validacion_derechos || 'N/A' }}</p>
              </div>

              <div class="col-span-2">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observaciones</p>
                <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 min-h-[60px] whitespace-pre-wrap">{{ viewingConsolidadoRecord()?.observaciones || 'Sin observaciones' }}</p>
              </div>

              <div class="col-span-2">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Justificación</p>
                <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 min-h-[60px] whitespace-pre-wrap">{{ viewingConsolidadoRecord()?.justificacion || 'Sin justificación' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    @if (editingAuthRecord()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-emerald-600">check_circle</mat-icon>
              Registrar Autorización
            </h3>
            <button (click)="closeAuthModal()" class="text-slate-400 hover:text-slate-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="p-6 flex-1 overflow-y-auto">
            <div class="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p class="text-[11px] font-bold text-slate-700 mb-1">Paciente: <span class="font-normal">{{ editingAuthRecord()?.patientName }}</span></p>
              <p class="text-[11px] font-bold text-slate-700 mb-1">Procedimiento: <span class="font-normal">{{ editingAuthRecord()?.procedure }}</span></p>
              <p class="text-[11px] font-bold text-slate-700">CUPS: <span class="font-normal">{{ editingAuthRecord()?.cups }}</span></p>
            </div>
            
            <div class="space-y-4">
              <div>
                <label for="auth-select" class="block text-xs font-bold text-slate-700 mb-1">Estado de Autorización</label>
                <select id="auth-select" #authSelect [value]="editingAuthRecord()?.authorization || 'PTE'" 
                       class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                       (keydown.enter)="saveAuth(authSelect.value)">
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="PTE">PTE</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
            <button (click)="closeAuthModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancelar</button>
            <button (click)="saveAuth(authSelect.value)" [disabled]="saving()" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <mat-icon class="animate-spin w-4 h-4 text-[16px]">refresh</mat-icon>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CirugiasListComponent {
  readonly Check = Check;
  readonly X = X;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly ClipboardList = ClipboardList;

  cirugias = input.required<Cirugia[]>();
  cirugiaClick = output<Cirugia>();
  cirugiaService = inject(CirugiaService);
  ingresoService = inject(PacienteIngresoService);
  consolidadoService = inject(ConsolidadoService);

  // Get patient name for a surgery
  getPatientName(admissionNumber: string) {
    if (!admissionNumber) return 'N/A';
    const ingresos = this.ingresoService.ingresos();
    const cleanAdmission = admissionNumber.toString().trim().toLowerCase();
    const ingreso = ingresos.find(i => String(i.ingreso).trim().toLowerCase() === cleanAdmission);
    return ingreso ? ingreso.nombre : 'N/A';
  }

  // Get patient document for a surgery
  getPatientDocument(admissionNumber: string) {
    if (!admissionNumber) return 'N/A';
    const ingresos = this.ingresoService.ingresos();
    const cleanAdmission = admissionNumber.toString().trim().toLowerCase();
    const ingreso = ingresos.find(i => String(i.ingreso).trim().toLowerCase() === cleanAdmission);
    return ingreso ? ingreso.hc : 'N/A';
  }

  // Get admission info for a patient
  getUbicacion(admissionNumber: string, patientName?: string): { area: string, cama: string } {
    if (this.consolidadoService.cargando() && this.consolidadoService.allRegistros().length === 0) return { area: '...', cama: '...' };
    if (!admissionNumber && !patientName) return { area: 'N/A', cama: 'N/A' };
    
    const registros = this.consolidadoService.allRegistros();
    const cleanAdmission = admissionNumber?.toString().trim().toLowerCase();
    
    // Try to find by admission number
    let registro = cleanAdmission ? registros.find(r => {
      const num = String(r.ingreso || '').trim().toLowerCase();
      return num === cleanAdmission || num.includes(cleanAdmission) || cleanAdmission.includes(num);
    }) : null;
    
    // Fallback: search by patient name if no match by admission number
    if (!registro && patientName) {
      const cleanName = patientName.trim().toLowerCase();
      registro = registros.find(r => String(r.nombre || '').trim().toLowerCase() === cleanName);
    }
    
    if (!registro) return { area: 'N/A', cama: 'N/A' };
    
    const area = registro.area || 'N/A';
    const cama = registro.cama || 'N/A';
    return { area, cama };
  }

  filters = signal<Record<string, string>>({});
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  activeTQFilter = signal<{ admissionNumber: string, patientName: string, cups: string | null, estado: string | null } | null>(null);
  showRightsDialog = signal<string | null>(null);
  editingAuthRecord = signal<Cirugia | null>(null);
  saving = signal<boolean>(false);
  copiedCupsId = signal<string | null>(null);
  viewingConsolidadoRecord = signal<ConsolidadoRecord | null>(null);

  hasActiveFilters = computed(() => {
    const hasSearch = !!this.cirugiaService.searchQuery();
    const hasColumnFilters = Object.keys(this.filters()).length > 0;
    const hasTqFilter = !!this.activeTQFilter();
    return hasSearch || hasColumnFilters || hasTqFilter;
  });

  Math = Math;

  // Pagination
  pageSize = signal<number | 'Todos'>(50);
  currentPage = signal(1);

  paginatedCirugias = computed(() => {
    const filtered = this.filteredCirugias();
    const size = this.pageSize();
    if (size === 'Todos') return filtered;
    
    const start = (this.currentPage() - 1) * size;
    const end = start + size;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    const size = this.pageSize();
    if (size === 'Todos') return 1;
    return Math.ceil(this.filteredCirugias().length / size) || 1;
  });

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
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

  constructor() {
    // Reset to page 1 when filters or search query change
    effect(() => {
      this.filters();
      this.cirugiaService.searchQuery();
      this.activeTQFilter();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
    
    // Auto-expand when TQ filter is active and there's only one group
    effect(() => {
      const filter = this.activeTQFilter();
      const groups = this.groupedCirugias();
      if (filter && groups.length === 1) {
        const groupId = groups[0].groupId;
        this.expandedIds.update(ids => {
          if (ids.has(groupId)) return ids;
          const next = new Set(ids);
          next.add(groupId);
          return next;
        });
        this.selectedGroupId.set(groupId);
      }
    });
  }

  retryLoad() {
    const query = this.cirugiaService.searchQuery();
    if (query && query.length >= 3) {
      this.cirugiaService.searchCirugias(query);
    } else {
      this.cirugiaService.loadCirugias();
    }
  }

  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  async toggleVerificado(group: GroupedCirugia, event: Event) {
    event.stopPropagation();
    const newValue = group.status !== 'Verificado';
    const newStatus = newValue ? 'Verificado' : null;
    
    // Get all IDs in the group
    const ids = group.detalles.map(d => d.id);
    if (ids.length === 0) return;
    const idSet = new Set(ids);

    // Optimistic update
    this.cirugiaService.cirugias.update(current => 
      current.map(c => idSet.has(c.id) ? { ...c, status: newStatus } : c)
    );

    try {
      // Update all cirugias in the group in a single request
      await this.cirugiaService.updateMultipleCirugias(ids, { status: newStatus });
    } catch (error) {
      console.error('Error updating verificado status:', error);
      // Revert on error
      const oldStatus = group.status;
      this.cirugiaService.cirugias.update(current => 
        current.map(c => idSet.has(c.id) ? { ...c, status: oldStatus } : c)
      );
    }
  }

  isAllVerificado = computed(() => {
    const filtered = this.filteredCirugias();
    if (filtered.length === 0) return false;
    return filtered.every(c => c.status === 'Verificado');
  });

  async toggleAllVerificado(event: Event) {
    event.stopPropagation();
    const filtered = this.filteredCirugias();
    if (filtered.length === 0) return;

    const newValue = !this.isAllVerificado();
    const newStatus = newValue ? 'Verificado' : null;

    // Get all IDs from all filtered groups
    const allIds = filtered.flatMap(group => group.detalles.map(d => d.id));
    if (allIds.length === 0) return;
    const idSet = new Set(allIds);

    // Optimistic update
    this.cirugiaService.cirugias.update(current => 
      current.map(c => idSet.has(c.id) ? { ...c, status: newStatus } : c)
    );

    try {
      // Update all in one batch
      await this.cirugiaService.updateMultipleCirugias(allIds, { status: newStatus });
    } catch (error) {
      console.error('Error updating all verificado status:', error);
      this.cirugiaService.loadCirugias();
    }
  }

  openRightsDialog(id: string, event: Event) {
    event.stopPropagation();
    this.showRightsDialog.set(id);
  }

  openAuthModal(record: Cirugia, event: Event) {
    event.stopPropagation();
    this.editingAuthRecord.set(record);
  }

  closeAuthModal() {
    this.editingAuthRecord.set(null);
  }

  openConsolidadoModal(admissionNumber: string, event: Event) {
    event.stopPropagation();
    const registros = this.consolidadoService.allRegistros();
    const cleanAdmission = admissionNumber?.toString().trim().toLowerCase();
    
    if (cleanAdmission) {
      const registro = registros.find(r => {
        const num = String(r.ingreso || '').trim().toLowerCase();
        return num === cleanAdmission || num.includes(cleanAdmission) || cleanAdmission.includes(num);
      });
      
      if (registro) {
        this.viewingConsolidadoRecord.set(registro);
      }
    }
  }

  closeConsolidadoModal() {
    this.viewingConsolidadoRecord.set(null);
  }

  copyToClipboard(text: string | null | undefined, event: Event, id?: string) {
    event.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (id) {
        this.copiedCupsId.set(id);
        setTimeout(() => {
          if (this.copiedCupsId() === id) {
            this.copiedCupsId.set(null);
          }
        }, 2000);
      } else {
        console.log('Copiado al portapapeles:', text);
      }
    });
  }

  async saveAuth(newAuth: string) {
    const record = this.editingAuthRecord();
    if (!record || !record.id) return;

    this.saving.set(true);
    try {
      if ('detalles' in record && Array.isArray((record as GroupedCirugia).detalles)) {
        const detalles = (record as GroupedCirugia).detalles;
        const ids = detalles.map(d => d.id);
        await this.cirugiaService.updateMultipleCirugias(ids, { authorization: newAuth });
      } else {
        await this.cirugiaService.updateCirugia(record.id, { authorization: newAuth });
      }
      this.closeAuthModal();
    } catch (error) {
      console.error('Error saving authorization:', error);
    } finally {
      this.saving.set(false);
    }
  }

  isRecentlyUpdated(c: GroupedCirugia): boolean {
    const updatedIds = this.cirugiaService.recentlyUpdatedIds();
    return c.detalles.some((d: Cirugia) => updatedIds.has(String(d.id)));
  }

  normalizeAuth(auth: string | null | undefined): string {
    return auth ? auth.toUpperCase() : '';
  }

  getAuthStatusClass(status: string | null | undefined): string {
    if (!status) return 'bg-slate-50 text-slate-500 border-slate-300';
    switch (status.toUpperCase()) {
      case 'SI': return 'bg-emerald-50 text-emerald-800 border-emerald-500';
      case 'NO': return 'bg-red-50 text-red-800 border-red-500';
      case 'PTE': return 'bg-amber-50 text-amber-800 border-amber-500';
      default: return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  }

  getAuthStatusTextClass(status: string | null | undefined): string {
    if (!status) return 'text-slate-400';
    switch (status.toUpperCase()) {
      case 'SI': return 'text-emerald-600';
      case 'NO': return 'text-red-600';
      case 'PTE': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  }

  tiemposQuirurgicosMap = computed(() => {
    const map = new Map<string, number>();
    const allCirugias = this.cirugiaService.cirugias();

    const grouped = new Map<string, {c: Cirugia, index: number}[]>();
    allCirugias.forEach((c, index) => {
      if (c.admissionNumber && c.cups) {
        const key = `${c.admissionNumber}_${c.cups.trim()}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push({c, index});
      }
    });

    for (const cirugiasGroup of grouped.values()) {
      const sorted = cirugiasGroup.sort((a, b) => {
        const dateA = a.c.date ? new Date(a.c.date).getTime() : 0;
        const dateB = b.c.date ? new Date(b.c.date).getTime() : 0;
        if (dateA === dateB) {
          return a.index - b.index; // Preservar el orden original de inserción para el mismo día
        }
        return dateA - dateB;
      });

      sorted.forEach((item, i) => {
        map.set(item.c.id, i + 1);
      });
    }
    return map;
  });

  patientDocumentMap = computed(() => {
    const map = new Map<string, string>();
    this.cirugias().forEach(c => {
      if (c.patientName && c.documento && c.documento !== 'N/A') {
        map.set(c.patientName, c.documento);
      }
    });
    return map;
  });

  getTiempoQuirurgico(id: string | undefined): number | null {
    if (!id) return null;
    return this.tiemposQuirurgicosMap().get(id) || null;
  }

  expandedIds = signal<Set<string>>(new Set());
  selectedGroupId = signal<string | null>(null);

  toggleExpansion(groupId: string, event: Event) {
    event.stopPropagation();
    const current = new Set(this.expandedIds());
    if (current.has(groupId)) {
      current.delete(groupId);
      if (this.selectedGroupId() === groupId) {
        this.selectedGroupId.set(null);
      }
    } else {
      current.add(groupId);
      this.selectedGroupId.set(groupId);
    }
    this.expandedIds.set(current);
  }

  groupedCirugias = computed(() => {
    const filtered = this.getFilteredBase();
    
    // Agrupar por CUPS e Ingreso
    const groupsMap = filtered.reduce((acc, c) => {
      const cups = c.cups?.trim() || 'N/A';
      const adm = c.admissionNumber || 'N/A';
      const key = `${cups}-${adm}`;
      
      if (!acc[key]) {
        acc[key] = {
          ...c,
          groupId: key,
          tq_count: 0,
          detalles: []
        } as GroupedCirugia;
      }
      acc[key].tq_count += 1;
      acc[key].detalles.push(c);
      return acc;
    }, {} as Record<string, GroupedCirugia>);

    return Object.values(groupsMap).map((group: GroupedCirugia) => {
      // Sort detalles by date ascending (keep details chronological)
      group.detalles.sort((a: Cirugia, b: Cirugia) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      return group;
    }).sort((a: GroupedCirugia, b: GroupedCirugia) => {
      const sortCol = this.sortColumn();
      const direction = this.sortDirection() === 'asc' ? 1 : -1;

      if (sortCol) {
        const valA = (a as unknown as Record<string, unknown>)[sortCol]?.toString()?.toLowerCase() || '';
        const valB = (b as unknown as Record<string, unknown>)[sortCol]?.toString()?.toLowerCase() || '';
        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
      }

      // Default sort by date ascending (oldest to newest)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  });

  getFilteredBase() {
    let allCirugias = this.cirugias();
    const tqFilter = this.activeTQFilter();
    
    if (tqFilter) {
      allCirugias = allCirugias.filter(c => 
        c.admissionNumber === tqFilter.admissionNumber && 
        (tqFilter.cups === null || c.cups?.trim() === tqFilter.cups?.trim()) &&
        (tqFilter.estado === null || c.estado?.trim() === tqFilter.estado?.trim())
      );
    }

    const activeFilters = this.filters();
    
    let filtered = allCirugias.filter(c => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        const searchVal = value.toLowerCase();
        
        // Multi-field filtering logic
        if (key === 'procedure') {
          const procVal = c.procedure?.toLowerCase() || '';
          const cupsVal = c.cups?.toLowerCase() || '';
          return procVal.includes(searchVal) || cupsVal.includes(searchVal);
        }
        
        if (key === 'patientName') {
          const nameVal = c.patientName?.toLowerCase() || '';
          const docVal = c.documento?.toLowerCase() || '';
          return nameVal.includes(searchVal) || docVal.includes(searchVal);
        }
        
        if (key === 'date') {
          const dateVal = c.date?.toString()?.toLowerCase() || '';
          const orVal = c.orNumber?.toLowerCase() || '';
          return dateVal.includes(searchVal) || orVal.includes(searchVal);
        }
        
        if (key === 'estado') {
          const estadoVal = c.estado?.toLowerCase() || '';
          const novedadVal = c.novedad?.toLowerCase() || '';
          return estadoVal.includes(searchVal) || novedadVal.includes(searchVal);
        }
        
        if (key === 'surgeon') {
          const surgeonVal = c.surgeon?.toLowerCase() || '';
          const specialtyVal = c.specialty?.toLowerCase() || '';
          const anestVal = c.anesthesiologist?.toLowerCase() || '';
          return surgeonVal.includes(searchVal) || specialtyVal.includes(searchVal) || anestVal.includes(searchVal);
        }
        
        if (key === 'assistant1') {
          const asst1Val = c.assistant1?.toLowerCase() || '';
          const asst2Val = c.assistant2?.toLowerCase() || '';
          return asst1Val.includes(searchVal) || asst2Val.includes(searchVal);
        }

        const val = (c as unknown as Record<string, unknown>)[key]?.toString()?.toLowerCase() || '';
        return val.includes(searchVal);
      });
    });

    // Apply sorting if specified
    const sortCol = this.sortColumn();
    if (sortCol) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        const valA = (a as unknown as Record<string, unknown>)[sortCol]?.toString()?.toLowerCase() || '';
        const valB = (b as unknown as Record<string, unknown>)[sortCol]?.toString()?.toLowerCase() || '';
        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
      });
    }
    
    return filtered;
  }

  filteredCirugias = computed(() => {
    return this.groupedCirugias();
  });

  setTQFilter(admissionNumber: string | null, patientName: string | null, cups: string | null, event: Event) {
    event.stopPropagation();
    if (admissionNumber && patientName) {
      this.activeTQFilter.set({ admissionNumber, patientName, cups, estado: null });
      // Limpiamos los filtros de las columnas para asegurarnos de que no oculten el historial
      this.filters.set({});
    }
  }

  setAdmissionFilter(admissionNumber: string | null, patientName: string | null, estado: string | null, event: Event) {
    event.stopPropagation();
    if (admissionNumber && patientName) {
      // Usamos el mismo mecanismo que TQ para mostrar la barra azul superior
      this.activeTQFilter.set({ admissionNumber, patientName, cups: null, estado });
      // Limpiamos filtros de columnas
      this.filters.set({});
    }
  }

  clearTQFilter() {
    this.activeTQFilter.set(null);
  }

  formatLiquidation(val: string | null): string {
    if (!val) return 'N/A';
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return `${Math.round(num * 100)}%`;
    }
    return val;
  }

  closeAllFilters() {
    this.filters.update(f => {
      const newFilters = { ...f };
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key] === '') {
          delete newFilters[key];
        }
      });
      return newFilters;
    });
  }

  onBlurFilter(column: string) {
    // Retrasamos un poco para permitir que el clic en la "X" se procese si fue eso lo que quitó el foco
    setTimeout(() => {
      this.filters.update(f => {
        if (f[column] === '') {
          const newFilters = { ...f };
          delete newFilters[column];
          return newFilters;
        }
        return f;
      });
    }, 150);
  }

  toggleFilter(column: string, event: Event) {
    event.stopPropagation();
    this.filters.update(f => {
      const newFilters = { ...f };
      if (newFilters[column] === undefined) {
        newFilters[column] = '';
        setTimeout(() => {
          const input = document.getElementById(`filter-input-${column}`);
          if (input) input.focus();
        }, 50);
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

  getEstadoClass(estado: string): string {
    const e = estado?.toUpperCase().trim() || '';
    
    // Colores exactos según la imagen solicitada
    if (e === 'NO FACTURABLE') return 'bg-[#FF0000] text-white';
    if (e === 'OK') return 'bg-[#38761D] text-white';
    if (e === 'CAMBIO') return 'bg-[#666666] text-white';
    if (e === 'HECHO') return 'bg-[#6AA84F] text-white';
    if (e === 'ADICION') return 'bg-[#38761D] text-white';
    if (e === 'ADICION PTE') return 'bg-white text-black border border-slate-300';
    if (e === 'HECHO PTE') return 'bg-white text-black border border-slate-300';

    // Estados anteriores como respaldo
    if (e.includes('AUTORIZADO') && !e.includes('NO')) return 'bg-[#1a7441] text-white';
    if (e.includes('PENDIENTE') || e.includes('PROGRAMADO')) return 'bg-[#ffe599] text-slate-800';
    if (e.includes('VERIFICADO') || e.includes('FINALIZADO')) return 'bg-[#0b5394] text-white';
    if (e.includes('NO AUTORIZADO')) return 'bg-[#b60205] text-white';
    if (e.includes('EN CIRUGÍA') || e.includes('EN CIRUGIA')) return 'bg-[#d9ead3] text-slate-800';
    return 'bg-slate-200 text-slate-700';
  }

}

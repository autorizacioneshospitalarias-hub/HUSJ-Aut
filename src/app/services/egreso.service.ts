import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Egreso } from '../models/egreso';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class EgresoService {
  private supabase = inject(SupabaseService);
  egresos = signal<Egreso[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  updatedCells = signal<Set<string>>(new Set());
  private pollingInterval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      this.cargarEgresos();
      // Configurar polling cada 15 segundos
      this.pollingInterval = setInterval(() => {
        const query = this.searchQuery();
        if (query && query.length >= 3) {
          this.buscarEgresos(query, true); // true = es un refresco en segundo plano
        } else {
          this.cargarEgresos(true);
        }
      }, 15000);
    }
  }

  async cargarEgresos(isBackgroundRefresh = false) {
    if (!isBackgroundRefresh) {
      this.cargando.set(true);
    }
    this.error.set(null);
    try {
      // Simplificamos el filtro para evitar errores 400
      // Buscamos estados que contengan PENDIENTE o que sean nulos/vacíos
      const { data, error } = await this.supabase.client
        .from('egresos')
        .select('*')
        .or('estado_y.ilike.*PENDIENTE*,estado_y.is.null')
        .order('fecha_salida', { ascending: true, nullsFirst: false })
        .limit(100);
      
      if (error) throw error;
      
      const egresosConId = (data || []).map((e: Egreso) => ({ ...e, id: e.id || crypto.randomUUID() }));
      
      this.procesarNuevosDatos(egresosConId);
    } catch (error: unknown) {
      console.error('Error cargando egresos:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      if (!isBackgroundRefresh) {
        this.cargando.set(false);
      }
    }
  }

  async buscarEgresos(query: string, isBackgroundRefresh = false) {
    if (!query || query.length < 3) {
      this.cargarEgresos(isBackgroundRefresh);
      return;
    }

    if (!isBackgroundRefresh) {
      this.cargando.set(true);
    }
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('egresos')
        .select('*')
        .or(`nombre.ilike.*${query}*,documento.ilike.*${query}*,ingreso.ilike.*${query}*`)
        .order('fecha_salida', { ascending: true, nullsFirst: false })
        .limit(100);
      
      if (error) throw error;
      
      const egresosConId = (data || []).map((e: Egreso) => ({ ...e, id: e.id || crypto.randomUUID() }));
      
      this.procesarNuevosDatos(egresosConId);
    } catch (error: unknown) {
      console.error('Error buscando egresos:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      if (!isBackgroundRefresh) {
        this.cargando.set(false);
      }
    }
  }

  private procesarNuevosDatos(nuevosEgresos: Egreso[]) {
    const currentEgresos = this.egresos();
    
    // Si ya teníamos datos, comparamos para detectar cambios
    if (currentEgresos.length > 0) {
      const currentMap = new Map(currentEgresos.map(e => [e.id, e]));
      
      nuevosEgresos.forEach(nuevo => {
        const viejo = currentMap.get(nuevo.id);
        if (viejo) {
          // Detectar si hubo algún cambio relevante
          const cambioObservacion = viejo.observacion !== nuevo.observacion;
          const cambioEstado = viejo.estado_y !== nuevo.estado_y;
          const cambioAutorizador = viejo.autorizador !== nuevo.autorizador;
          const cambioFacturador = viejo.facturador !== nuevo.facturador;
          
          if (cambioObservacion) this.marcarCeldaActualizada(nuevo.id, 'observacion');
          if (cambioEstado) this.marcarCeldaActualizada(nuevo.id, 'estado_y');
          if (cambioAutorizador) this.marcarCeldaActualizada(nuevo.id, 'autorizador');
          if (cambioFacturador) this.marcarCeldaActualizada(nuevo.id, 'facturador');
        }
      });
    }
    
    this.egresos.set(nuevosEgresos);
  }

  async actualizarObservacion(id: string, nuevaObservacion: string) {
    try {
      const { error } = await this.supabase.client
        .from('egresos')
        .update({ observacion: nuevaObservacion })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado local
      const currentEgresos = this.egresos();
      const updatedEgresos = currentEgresos.map(e => 
        e.id === id ? { ...e, observacion: nuevaObservacion } : e
      );
      this.egresos.set(updatedEgresos);

      // Marcar para animación
      this.marcarCeldaActualizada(id, 'observacion');
      
      return true;
    } catch (error) {
      console.error('Error actualizando observación:', error);
      throw error;
    }
  }

  private marcarCeldaActualizada(id: string, campo: string) {
    const cellKey = `${id}-${campo}`;
    const current = new Set(this.updatedCells());
    current.add(cellKey);
    this.updatedCells.set(current);
    
    // Remover la clase después de 25 segundos
    setTimeout(() => {
      const updated = new Set(this.updatedCells());
      updated.delete(cellKey);
      this.updatedCells.set(updated);
    }, 25000);
  }
}

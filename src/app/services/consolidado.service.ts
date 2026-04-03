import { Injectable, signal, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

export interface ConsolidadoRecord {
  id?: string;
  area?: string;
  cama?: string;
  nombre?: string;
  hc?: string;
  ingreso?: string;
  entidad?: string;
  eps_soat?: string;
  contrato?: string;
  gestion_estancia?: string;
  aut_estancia?: string;
  tipo_contrato_no_aut?: string | null;
  fecha_proxima_gestion?: string | null;
  observaciones?: string;
  proceso_notif?: string;
  nombre_notif?: string;
  soportes?: string;
  novedad?: string;
  justificacion?: string;
  fecha_ingreso?: string;
  fecha_egreso_entidad?: string;
  aut_estancia_entidad?: string;
  cortes_estancia?: string;
  updated_at?: string;
  historial_cambios?: HistorialCambio[];
  validacion_derechos?: string | null;
  validacion_derechos_fecha?: string | null;
  valdiacion_derechos?: string | null;
  valdiacion_derechos_fecha?: string | null;
  historial_derechos?: string | null;
  derechos_paciente?: unknown;
  autorizador?: string | null;
  [key: string]: any;
}

export interface CorteEstancia {
  id: string;
  base_hoy_id: number;
  tipo: string;
  autorizacion: string;
  fecha_corte: string;
  fecha_registro?: string;
  created_at?: string;
}

export interface HistorialCambio {
  id: number;
  tabla: string;
  sourcerow: number;
  campo: string;
  valor_antes: string;
  valor_nuevo: string;
  cambiado_en: string;
  hc: string;
  ingreso: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsolidadoService {
  allRegistros = signal<ConsolidadoRecord[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  
  // Señal computada para los registros filtrados por búsqueda
  registros = computed(() => {
    const all = this.allRegistros();
    const query = this.searchQuery().toLowerCase();
    
    if (!query) return all;
    
    return all.filter(r => 
      String(r['nombre'] || '').toLowerCase().includes(query) ||
      String(r['hc'] || '').toLowerCase().includes(query) ||
      String(r['ingreso'] || '').toLowerCase().includes(query) ||
      String(r['documento'] || '').toLowerCase().includes(query) ||
      String(r['entidad'] || '').toLowerCase().includes(query)
    );
  });
  
  registrosActualizados = signal<Set<string>>(new Set());
  private updateTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingDeletes = new Map<string, ReturnType<typeof setTimeout>>();

  marcarComoActualizado(id: string | number) {
    const strId = String(id);
    
    if (this.updateTimeouts.has(strId)) {
      clearTimeout(this.updateTimeouts.get(strId));
    }

    this.registrosActualizados.update(set => {
      const newSet = new Set(set);
      newSet.add(strId);
      return newSet;
    });

    // Remover rápido para que inicie la transición CSS
    const timeoutId = setTimeout(() => {
      this.registrosActualizados.update(set => {
        const newSet = new Set(set);
        newSet.delete(strId);
        return newSet;
      });
      this.updateTimeouts.delete(strId);
    }, 500);

    this.updateTimeouts.set(strId, timeoutId);
  }

  // MODIFICADO: usar cliente centralizado en vez de fetch directo
  private supabaseService = inject(SupabaseService);
  private get client() { return this.supabaseService.client; }

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      this.loadRegistros();
      this.iniciarRealtime();
    }
  }

  // NUEVO: suscripción Realtime a base_hoy
  // Recarga automáticamente cuando el script de Google Sheets actualiza la tabla
  private iniciarRealtime() {
    this.client
      .channel('consolidado-base-hoy')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'base_hoy' },
        (payload) => {
          console.log('🔄 Realtime: base_hoy actualizado', payload);
          const updatedRecord = payload.new as ConsolidadoRecord;
          if (updatedRecord && updatedRecord.id) {
            this.allRegistros.update(regs => regs.map(r => String(r.id) === String(updatedRecord.id) ? updatedRecord : r));
            this.marcarComoActualizado(updatedRecord.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'base_hoy' },
        (payload) => {
          console.log('🔄 Realtime: base_hoy insertado', payload);
          const newRecord = payload.new as ConsolidadoRecord;
          if (newRecord && newRecord.id) {
            let replacedOldId: string | null = null;

            this.allRegistros.update(regs => {
              const existingIdx = regs.findIndex(r => 
                (newRecord.ingreso && r.ingreso === newRecord.ingreso) || 
                (newRecord.hc && r.hc === newRecord.hc && !newRecord.ingreso)
              );
              
              if (existingIdx >= 0) {
                replacedOldId = String(regs[existingIdx].id);
                const updatedRegs = [...regs];
                updatedRegs[existingIdx] = newRecord;
                return updatedRegs;
              }
              return [newRecord, ...regs];
            });

            if (replacedOldId && this.pendingDeletes.has(replacedOldId)) {
              clearTimeout(this.pendingDeletes.get(replacedOldId));
              this.pendingDeletes.delete(replacedOldId);
            }

            this.marcarComoActualizado(newRecord.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'base_hoy' },
        (payload) => {
          console.log('🔄 Realtime: base_hoy eliminado', payload);
          const oldRecord = payload.old as { id: string | number };
          if (oldRecord && oldRecord.id) {
            const strId = String(oldRecord.id);
            const existing = this.allRegistros().find(r => String(r.id) === strId);
            
            if (existing) {
              const timeout = setTimeout(() => {
                this.allRegistros.update(regs => regs.filter(r => String(r.id) !== strId));
                this.pendingDeletes.delete(strId);
              }, 5000); // 5 segundos de gracia
              this.pendingDeletes.set(strId, timeout);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime consolidado:', status);
      });
  }

  async getHistorialCambios(hc: string): Promise<HistorialCambio[]> {
    try {
      // MODIFICADO: usar cliente Supabase en vez de fetch
      const { data, error } = await this.client
        .from('historial_cambios')
        .select('*')
        .eq('hc', hc)
        .order('cambiado_en', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as HistorialCambio[]) ?? [];
    } catch (error) {
      console.error('Error fetching historial:', error);
      throw error;
    }
  }

  async getCortesEstancia(baseHoyId: number): Promise<CorteEstancia[]> {
    try {
      const { data, error } = await this.client
        .from('cortes_estancia')
        .select('*')
        .eq('base_hoy_id', baseHoyId)
        .order('fecha_corte', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as CorteEstancia[]) ?? [];
    } catch (error) {
      console.error('Error fetching cortes:', error);
      throw error;
    }
  }

  async addCorteEstancia(corte: Omit<CorteEstancia, 'id' | 'created_at'>): Promise<CorteEstancia | null> {
    try {
      const { data, error } = await this.client
        .from('cortes_estancia')
        .insert(corte)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as CorteEstancia;
    } catch (error) {
      console.error('Error adding corte:', error);
      throw error;
    }
  }

  async deleteCorteEstancia(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('cortes_estancia')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      console.error('Error deleting corte:', error);
      return false;
    }
  }

  async insertHistorialCambio(cambio: Partial<HistorialCambio>): Promise<boolean> {
    try {
      // MODIFICADO: usar cliente Supabase en vez de fetch
      const { error } = await this.client
        .from('historial_cambios')
        .insert(cambio);

      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      console.error('Error inserting historial:', error);
      return false;
    }
  }

  async getGiroCama() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // MODIFICADO: usar cliente Supabase en vez de fetch
      const { data, error } = await this.client
        .from('historial_cambios')
        .select('*')
        .eq('campo', 'cama')
        .gte('cambiado_en', yesterday.toISOString())
        .order('cambiado_en', { ascending: false });

      if (error) throw new Error(error.message);

      const changes = (data as HistorialCambio[]) ?? [];

      if (this.allRegistros().length === 0) {
        await this.loadRegistros();
      }

      const allRecords = this.allRegistros();
      return changes
        .map(change => {
          const patient = allRecords.find(r => r.hc === change.hc);
          return { ...patient, cambio: change };
        })
        .filter(item => item.id !== undefined);
    } catch (error) {
      console.error('Error fetching giro cama:', error);
      throw error;
    }
  }

  async updateRegistro(id: string | number, data: Partial<ConsolidadoRecord>): Promise<boolean> {
    let targetId = id;
    let queryField = 'id';

    if (!targetId && data.ingreso) {
      targetId = data.ingreso;
      queryField = 'ingreso';
      console.log(`Usando ingreso como fallback para id: ${targetId}`);
    }

    if (!targetId) {
      throw new Error('No se puede actualizar: falta el ID del registro.');
    }

    console.log(`Actualizando ${queryField}=${targetId}:`, data);

    try {
      // MODIFICADO: usar cliente Supabase en vez de fetch
      const { data: updatedRecords, error } = await this.client
        .from('base_hoy')
        .update(data)
        .eq(queryField, targetId)
        .select();

      if (error) {
        console.error(`Error al actualizar ${targetId}:`, error);
        throw new Error(error.message);
      }

      if (updatedRecords && updatedRecords.length > 0) {
        const updatedRecord = updatedRecords[0] as ConsolidadoRecord;
        this.allRegistros.update(regs =>
          regs.map(r => String(r.id) === String(updatedRecord.id) ? updatedRecord : r)
        );
        this.marcarComoActualizado(updatedRecord.id!);
        return true;
      } else {
        console.warn(`No se encontró el registro con ${queryField}=${targetId}`);
        return false;
      }
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  searchRegistros(query: string) {
    this.searchQuery.set(query);
  }

  async loadRegistros() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      // Optimizamos la consulta seleccionando solo los campos necesarios
      const columns = `
        id, area, cama, giro_cama, nombre, hc, ingreso, documento,
        validacion_derechos, validacion_derechos_fecha, fecha_ingreso, fecha_hosp, 
        dias_ingr, dias_hosp, entidad, contrato, municipio, eps_soat, 
        aut_estancia, fecha_proxima_gestion, gestion_estancia, cortes_estancia, 
        novedad, observaciones, justificacion, proceso_notif, nombre_notif, 
        confirmacion_pgp, soportes, historial_derechos, tramite_autorizador, 
        tramite_option, aut_estancia_obs, gestion_estancia_obs, giro_cama_obs, 
        autorizacion_pgp, soporte_pdf_pgp, obs_pgp, fecha_egreso_entidad, updated_at
      `.replace(/\s+/g, '');

      const { data, error } = await this.client
        .from('base_hoy')
        .select(columns)
        .order('id', { ascending: false });

      if (error) throw new Error(error.message);

      const registros = (data as any as ConsolidadoRecord[]) ?? [];
      console.log('Registros cargados:', registros.length);

      this.allRegistros.set(registros);
    } catch (error: unknown) {
      console.error('Error cargando registros:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }
}
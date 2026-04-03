// CAMBIOS: getPacienteCompleto ahora usa consultas paralelas por tabla con las FK correctas (admissionNumber, n_ingreso, ingreso) sin usar joins automáticos ni mapeos, cumpliendo con la estructura esperada por el template.
import { Injectable, signal, inject } from '@angular/core';
import { PacienteIngreso } from '../models/paciente-ingreso';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PacienteIngresoService {
  private supabase = inject(SupabaseService);
  ingresos = signal<PacienteIngreso[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');

  async loadIngresos() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('pacientes_ingresos')
        .select('*')
        .order('ingreso', { ascending: false })
        .limit(10000);

      if (error) throw error;
      this.ingresos.set(data || []);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      this.cargando.set(false);
    }
  }

  async getIngresoByNumero(numero: string): Promise<PacienteIngreso | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('pacientes_ingresos')
        .select('*')
        .eq('ingreso', numero)
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ingreso:', error);
      return null;
    }
  }

  async createIngreso(ingreso: PacienteIngreso) {
    try {
      const { data, error } = await this.supabase.client
        .from('pacientes_ingresos')
        .insert(ingreso)
        .select()
        .single();

      if (error) throw error;
      this.ingresos.update(current => [data, ...current]);
      return data;
    } catch (error) {
      console.error('Error creating ingreso:', error);
      throw error;
    }
  }

  async updateIngreso(id: string, updates: Partial<PacienteIngreso>) {
    try {
      const { data, error } = await this.supabase.client
        .from('pacientes_ingresos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      this.ingresos.update(current => current.map(i => i.id === id ? { ...i, ...data } : i));
      return data;
    } catch (error) {
      console.error('Error updating ingreso:', error);
      throw error;
    }
  }

  async getPacienteCompleto(numero: string): Promise<PacienteIngreso | null> {
    try {
      // Consultas paralelas para evitar joins automáticos y manejar FKs distintas
      const [
        { data: paciente, error: errP },
        { data: cirugias },
        { data: turnos },
        { data: egresos },
        { data: nota_operatoria }
      ] = await Promise.all([
        this.supabase.client.from('pacientes_ingresos').select('*').eq('ingreso', numero).single(),
        this.supabase.client.from('cirugias').select('*').eq('admissionNumber', numero),
        this.supabase.client.from('turnos').select('*').eq('n_ingreso', numero),
        this.supabase.client.from('egresos').select('*').eq('ingreso', numero),
        this.supabase.client.from('nota_operatoria').select('*').eq('ingreso', numero)
      ]);

      if (errP) throw errP;

      return {
        ...paciente,
        cirugias: cirugias || [],
        turnos: turnos || [],
        egresos: egresos || [],
        nota_operatoria: nota_operatoria || []
      };
    } catch (error) {
      console.error('Error fetching complete patient data:', error);
      return null;
    }
  }

  /**
   * Suscribe a cambios en tiempo real en la tabla base_hoy
   */
  suscribirCambiosBaseHoy(callback: (payload: unknown) => void) {
    return this.supabase.client
      .channel('base_hoy_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'base_hoy' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload);
          }
        }
      )
      .subscribe();
  }
}

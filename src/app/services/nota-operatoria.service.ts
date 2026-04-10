import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NotaOperatoria, SupabaseNotaOperatoria } from '../models/nota-operatoria';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class NotaOperatoriaService {
  private supabase = inject(SupabaseService);
  notas = signal<NotaOperatoria[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      this.cargarNotas();
    }
  }

  async getNotasByIngreso(ingreso: string): Promise<NotaOperatoria[]> {
    if (!ingreso) return [];
    
    try {
      const { data, error } = await this.supabase.client
        .from('nota_operatoria')
        .select('*')
        .eq('ingreso', ingreso)
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((n: SupabaseNotaOperatoria) => ({ 
        ...n, 
        id: n.id || crypto.randomUUID(),
        autorizacion: n.autorizacion || n.Authorization || null
      }));
    } catch (error) {
      console.error('Error fetching notas operatorias by ingreso:', error);
      return [];
    }
  }

  async cargarNotas() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('nota_operatoria')
        .select('*')
        .limit(100);
      
      if (error) throw error;
      
      const notasConId = (data || []).map((n: SupabaseNotaOperatoria) => ({ 
        ...n, 
        id: n.id || crypto.randomUUID(),
        autorizacion: n.autorizacion || n.Authorization || null
      }));
      this.notas.set(notasConId);
    } catch (error: unknown) {
      console.error('Error cargando notas operatorias:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }

  async buscarNotas(query: string) {
    if (!query || query.length < 3) {
      this.cargarNotas();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('nota_operatoria')
        .select('*')
        .or(`paciente.ilike.*${query}*,documento.ilike.*${query}*,ingreso.ilike.*${query}*`)
        .limit(100);
      
      if (error) throw error;
      
      const notasConId = (data || []).map((n: SupabaseNotaOperatoria) => ({ 
        ...n, 
        id: n.id || crypto.randomUUID(),
        autorizacion: n.autorizacion || n.Authorization || null
      }));
      this.notas.set(notasConId);
    } catch (error: unknown) {
      console.error('Error buscando notas operatorias:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }
}

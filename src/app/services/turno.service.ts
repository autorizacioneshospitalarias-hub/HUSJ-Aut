import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Turno } from '../models/turno';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private supabase = inject(SupabaseService);
  turnos = signal<Turno[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  viewMode = signal<'list' | 'board'>('list');
  searchQuery = signal<string>('');

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      this.cargarTurnos();
    }
  }

  async cargarTurnos() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('turnos')
        .select('*');
      
      if (error) throw error;
      
      const turnosConId = (data || []).map((t: Turno) => ({ ...t, id: t.id || crypto.randomUUID() }));
      this.turnos.set(turnosConId);
    } catch (error: unknown) {
      console.error('Error cargando Supabase:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }

  async getTurnosByIngreso(ingreso: string): Promise<Turno[]> {
    if (!ingreso) return [];
    
    try {
      const { data, error } = await this.supabase.client
        .from('turnos')
        .select('*')
        .eq('n_ingreso', ingreso);
      
      if (error) throw error;
      
      return (data || []).map((t: Turno) => ({ ...t, id: t.id || crypto.randomUUID() }));
    } catch (error) {
      console.error('Error fetching turnos by ingreso:', error);
      return [];
    }
  }
}

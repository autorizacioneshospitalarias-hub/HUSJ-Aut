import { Injectable, signal, inject } from '@angular/core';
import { Cirugia } from '../models/cirugia';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class CirugiaService {
  private supabase = inject(SupabaseService);
  cirugias = signal<Cirugia[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');

  async searchCirugias(query: string) {
    if (!query || query.length < 3) {
      this.cirugias.set([]);
      return;
    }
    
    this.cargando.set(true);
    this.error.set(null);
    
    try {
      const isNumeric = /^\d+$/.test(query.trim());
      
      let queryBuilder = this.supabase.client
        .from('cirugias')
        .select('*');

      if (isNumeric) {
        queryBuilder = queryBuilder.or(`admissionNumber.eq.${query},cups.eq.${query},orNumber.eq.${query}`);
      } else {
        queryBuilder = queryBuilder.or(`patientName.ilike.*${query}*,procedure.ilike.*${query}*,specialty.ilike.*${query}*,surgeon.ilike.*${query}*,admissionNumber.ilike.*${query}*,cups.ilike.*${query}*`);
      }

      const { data, error } = await queryBuilder
        .order('date', { ascending: false })
        .limit(10000);
      
      if (error) throw error;
      
      const cirugiasConId = (data as Cirugia[] || []).map((c: Cirugia) => ({ ...c, id: String(c.id || crypto.randomUUID()) }));
      this.cirugias.set(cirugiasConId);
    } catch (error: unknown) {
      console.error('Error buscando cirugías:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }

  async getCirugiasByIngreso(ingreso: string): Promise<Cirugia[]> {
    if (!ingreso) return [];
    
    try {
      const { data, error } = await this.supabase.client
        .from('cirugias')
        .select('*')
        .eq('admissionNumber', ingreso)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data as Cirugia[] || []).map((c: Cirugia) => ({ ...c, id: String(c.id || crypto.randomUUID()) }));
    } catch (error) {
      console.error('Error fetching cirugias by ingreso:', error);
      return [];
    }
  }

  async loadCirugias() {
    this.cargando.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabase.client
        .from('cirugias')
        .select('*')
        .order('date', { ascending: false })
        .limit(10000);
      
      if (error) throw error;
      
      const cirugiasConId = (data as Cirugia[] || []).map((c: Cirugia) => ({ ...c, id: String(c.id || crypto.randomUUID()) }));
      this.cirugias.set(cirugiasConId);
    } catch (error: unknown) {
      console.error('Error cargando cirugías:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }

  async updateCirugia(id: string, updates: Partial<Cirugia>) {
    try {
      const { data, error } = await this.supabase.client
        .from('cirugias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        this.cirugias.update(current => 
          current.map(c => c.id === id ? { ...c, ...data } : c)
        );
      }
    } catch (error) {
      console.error('Error updating cirugia:', error);
      throw error;
    }
  }

  async updateMultipleCirugias(ids: string[], updates: Partial<Cirugia>) {
    if (!ids || ids.length === 0) return;

    // Use a larger chunk size for efficiency, Supabase can handle it
    const chunkSize = 200;
    const chunks = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    try {
      const allUpdatedData: Cirugia[] = [];
      
      // Process chunks in groups of 5 to avoid overwhelming the browser/server
      const concurrentLimit = 5;
      for (let i = 0; i < chunks.length; i += concurrentLimit) {
        const group = chunks.slice(i, i + concurrentLimit);
        const results = await Promise.all(group.map(chunk => 
          this.supabase.client
            .from('cirugias')
            .update(updates)
            .in('id', chunk)
            .select()
        ));

        for (const { data, error } of results) {
          if (error) throw error;
          if (data) allUpdatedData.push(...data);
        }
      }

      if (allUpdatedData.length > 0) {
        const updatedMap = new Map(allUpdatedData.map(d => [String((d as Cirugia).id), d]));
        this.cirugias.update(current => 
          current.map(c => {
            const updated = updatedMap.get(String(c.id));
            return updated ? { ...c, ...updated } : c;
          })
        );
      }
    } catch (error) {
      console.error('Error updating multiple cirugias:', error);
      throw error;
    }
  }
}

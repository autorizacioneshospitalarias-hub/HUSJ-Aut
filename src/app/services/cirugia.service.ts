import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Cirugia, SupabaseCirugia } from '../models/cirugia';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class CirugiaService {
  private supabase = inject(SupabaseService);
  private zone = inject(NgZone);
  cirugias = signal<Cirugia[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  recentlyUpdatedIds = signal<Set<string>>(new Set());

  constructor() {
    this.iniciarRealtime();
  }

  markAsUpdated(id: string) {
    this.recentlyUpdatedIds.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });
    setTimeout(() => {
      this.recentlyUpdatedIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(id);
        return newSet;
      });
    }, 45000);
  }

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
      
      const cirugiasConId = (data || []).map((c: SupabaseCirugia) => ({ 
        ...c, 
        id: String(c.id || crypto.randomUUID()),
        authorization: c.authorization || c.Authorization || null,
        auditLiquidation: c.auditLiquidation || c.AuditLiquidation || null
      }));
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
      
      return (data || []).map((c: SupabaseCirugia) => ({ 
        ...c, 
        id: String(c.id || crypto.randomUUID()),
        authorization: c.authorization || c.Authorization || null,
        auditLiquidation: c.auditLiquidation || c.AuditLiquidation || null
      }));
    } catch (error) {
      console.error('Error fetching cirugias by ingreso:', error);
      return [];
    }
  }

  async loadCirugias() {
    console.log('Iniciando loadCirugias...');
    this.cargando.set(true);
    this.error.set(null);
    
    try {
      const { data, error } = await this.supabase.client
        .from('cirugias')
        .select('*')
        .order('date', { ascending: false })
        .limit(10000);
      
      if (error) throw error;
      
      const cirugiasConId = (data || []).map((c: SupabaseCirugia) => ({ 
        ...c, 
        id: String(c.id || crypto.randomUUID()),
        authorization: c.authorization || c.Authorization || null,
        auditLiquidation: c.auditLiquidation || c.AuditLiquidation || null
      }));
      this.cirugias.set(cirugiasConId);
      
      this.iniciarRealtime();
    } catch (error: unknown) {
      console.error('Error cargando cirugías:', error);
      const message = error instanceof Error ? error.message : 'Error de red o conexión';
      this.error.set(message);
    } finally {
      this.cargando.set(false);
    }
  }

  private channel: any;

  iniciarRealtime() {
    if (this.channel) return;

    this.channel = this.supabase.client
      .channel('cirugias_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cirugias' },
        (payload) => {
          this.handleRealtimePayload(payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status for cirugias:', status);
      });
  }

  private normalizeSupabaseData(data: any): any {
    if (!data) return data;
    const normalized = { ...data };
    if ('Authorization' in normalized && normalized.Authorization !== undefined) {
      normalized.authorization = normalized.Authorization;
    }
    if ('AuditLiquidation' in normalized && normalized.AuditLiquidation !== undefined) {
      normalized.auditLiquidation = normalized.AuditLiquidation;
    }
    return normalized;
  }

  private handleRealtimePayload(payload: any) {
    this.zone.run(() => {
      if (payload.eventType === 'INSERT') {
        const newRecord = this.normalizeSupabaseData(payload.new);
        newRecord.id = String(newRecord.id);
        
        // Only add if it matches the current search query exactly like the DB search
        const query = this.searchQuery().trim();
        if (!query || query.length < 3) {
          return; // Do not add if there is no active search
        }

        const isNumeric = /^\d+$/.test(query);
        const qLower = query.toLowerCase();
        let matches = false;

        if (isNumeric) {
          matches = newRecord.admissionNumber === query || 
                    newRecord.cups === query || 
                    newRecord.orNumber === query;
        } else {
          matches = (newRecord.patientName?.toLowerCase().includes(qLower)) ||
                    (newRecord.procedure?.toLowerCase().includes(qLower)) ||
                    (newRecord.specialty?.toLowerCase().includes(qLower)) ||
                    (newRecord.surgeon?.toLowerCase().includes(qLower)) ||
                    (newRecord.admissionNumber?.toLowerCase().includes(qLower)) ||
                    (newRecord.cups?.toLowerCase().includes(qLower));
        }

        if (!matches) return;

        this.cirugias.update(current => [newRecord as Cirugia, ...current]);
        this.markAsUpdated(newRecord.id);
      } else if (payload.eventType === 'UPDATE') {
        const updatedRecord = this.normalizeSupabaseData(payload.new);
        updatedRecord.id = String(updatedRecord.id);
        
        this.cirugias.update(current => {
          // Only update if the record is already in the current list
          const exists = current.some(c => c.id === updatedRecord.id);
          if (!exists) return current;
          return current.map(c => c.id === updatedRecord.id ? { ...c, ...updatedRecord } : c);
        });
        this.markAsUpdated(updatedRecord.id);
      } else if (payload.eventType === 'DELETE') {
        const deletedId = String(payload.old.id);
        this.cirugias.update(current => current.filter(c => c.id !== deletedId));
      }
    });
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
        const normalizedData = this.normalizeSupabaseData(data);
        normalizedData.id = String(normalizedData.id);
        this.cirugias.update(current => 
          current.map(c => c.id === id ? { ...c, ...normalizedData } : c)
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
      const allUpdatedData: any[] = [];
      
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
        const updatedMap = new Map(allUpdatedData.map(d => {
          const normalized = this.normalizeSupabaseData(d);
          normalized.id = String(normalized.id);
          return [normalized.id, normalized];
        }));
        
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

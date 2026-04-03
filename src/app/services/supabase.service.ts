import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qdzblswougtmsgtozire.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  get client() {
    return this.supabase;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async uploadFile(file: File, path: string) {
    const { data, error } = await this.supabase.storage
      .from('soportes')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    if (error) throw error;
    return data;
  }

  getPublicUrl(path: string) {
    const { data } = this.supabase.storage
      .from('soportes')
      .getPublicUrl(path);
    return data.publicUrl;
  }
}

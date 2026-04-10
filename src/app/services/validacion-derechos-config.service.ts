import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ValidacionDerechosConfigService {
  diasValidacion = signal<number>(3); // Default to 3 days
  private platformId = inject(PLATFORM_ID);
  private supabase = inject(SupabaseService);
  private readonly CONFIG_KEY = 'dias_validacion_derechos';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
      this.loadFromSupabase();
    }
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.CONFIG_KEY);
    if (stored) {
      try {
        this.diasValidacion.set(Number(stored));
      } catch (e) {
        console.error('Error parsing dias_validacion_derechos from localStorage', e);
      }
    }
  }

  private async loadFromSupabase() {
    const data = await this.supabase.getConfig(this.CONFIG_KEY);
    if (data !== null && !isNaN(Number(data))) {
      this.diasValidacion.set(Number(data));
      localStorage.setItem(this.CONFIG_KEY, String(data));
    }
  }

  async setDias(dias: number) {
    this.diasValidacion.set(dias);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CONFIG_KEY, String(dias));
    }
    await this.supabase.setConfig(this.CONFIG_KEY, dias);
  }
}

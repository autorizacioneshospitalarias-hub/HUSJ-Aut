import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class GiroCamaConfigService {
  ignorarMismaCama = signal<boolean>(true);
  ignorarMismaArea = signal<boolean>(true);
  private platformId = inject(PLATFORM_ID);
  private supabase = inject(SupabaseService);
  private readonly CONFIG_KEY_CAMA = 'giro_cama_ignorar_misma_cama';
  private readonly CONFIG_KEY_AREA = 'giro_cama_ignorar_misma_area';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
      this.loadFromSupabase();
    }
  }

  private loadFromStorage() {
    const storedCama = localStorage.getItem(this.CONFIG_KEY_CAMA);
    if (storedCama) {
      try {
        this.ignorarMismaCama.set(JSON.parse(storedCama));
      } catch (e) {
        console.error('Error parsing giro_cama_ignorar_misma_cama from localStorage', e);
      }
    }
    const storedArea = localStorage.getItem(this.CONFIG_KEY_AREA);
    if (storedArea) {
      try {
        this.ignorarMismaArea.set(JSON.parse(storedArea));
      } catch (e) {
        console.error('Error parsing giro_cama_ignorar_misma_area from localStorage', e);
      }
    }
  }

  private async loadFromSupabase() {
    const dataCama = await this.supabase.getConfig(this.CONFIG_KEY_CAMA);
    if (dataCama !== null) {
      this.ignorarMismaCama.set(Boolean(dataCama));
      localStorage.setItem(this.CONFIG_KEY_CAMA, JSON.stringify(Boolean(dataCama)));
    }
    const dataArea = await this.supabase.getConfig(this.CONFIG_KEY_AREA);
    if (dataArea !== null) {
      this.ignorarMismaArea.set(Boolean(dataArea));
      localStorage.setItem(this.CONFIG_KEY_AREA, JSON.stringify(Boolean(dataArea)));
    }
  }

  async toggleIgnorarMismaCama() {
    const newValue = !this.ignorarMismaCama();
    this.ignorarMismaCama.set(newValue);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CONFIG_KEY_CAMA, JSON.stringify(newValue));
    }
    await this.supabase.setConfig(this.CONFIG_KEY_CAMA, newValue);
  }

  async toggleIgnorarMismaArea() {
    const newValue = !this.ignorarMismaArea();
    this.ignorarMismaArea.set(newValue);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CONFIG_KEY_AREA, JSON.stringify(newValue));
    }
    await this.supabase.setConfig(this.CONFIG_KEY_AREA, newValue);
  }
}

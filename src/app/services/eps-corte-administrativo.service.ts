import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class EpsCorteAdministrativoService {
  epsCorteAdministrativo = signal<string[]>([]);
  private platformId = inject(PLATFORM_ID);
  private supabase = inject(SupabaseService);
  private readonly CONFIG_KEY = 'eps_corte_administrativo';

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
        this.epsCorteAdministrativo.set(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing eps_corte_administrativo from localStorage', e);
      }
    }
  }

  private async loadFromSupabase() {
    const data = await this.supabase.getConfig(this.CONFIG_KEY);
    if (data && Array.isArray(data)) {
      this.epsCorteAdministrativo.set(data);
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(data));
    }
  }

  private async saveToStorage() {
    const value = this.epsCorteAdministrativo();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(value));
    }
    await this.supabase.setConfig(this.CONFIG_KEY, value);
  }

  toggleEps(eps: string) {
    const current = this.epsCorteAdministrativo();
    if (current.includes(eps)) {
      this.epsCorteAdministrativo.set(current.filter(e => e !== eps));
    } else {
      this.epsCorteAdministrativo.set([...current, eps]);
    }
    this.saveToStorage();
  }

  isCorteAdministrativo(eps: string): boolean {
    if (!eps) return false;
    return this.epsCorteAdministrativo().includes(eps);
  }
}

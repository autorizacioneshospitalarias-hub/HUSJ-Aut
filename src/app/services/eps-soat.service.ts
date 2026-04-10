import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class EpsSoatService {
  epsSoat = signal<string[]>([]);
  private platformId = inject(PLATFORM_ID);
  private supabase = inject(SupabaseService);
  private readonly CONFIG_KEY = 'eps_soat';

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
        this.epsSoat.set(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing eps_soat from localStorage', e);
      }
    }
  }

  private async loadFromSupabase() {
    const data = await this.supabase.getConfig(this.CONFIG_KEY);
    if (data && Array.isArray(data)) {
      this.epsSoat.set(data);
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(data));
    }
  }

  private async saveToStorage() {
    const value = this.epsSoat();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(value));
    }
    await this.supabase.setConfig(this.CONFIG_KEY, value);
  }

  toggleEps(eps: string) {
    const current = this.epsSoat();
    if (current.includes(eps)) {
      this.epsSoat.set(current.filter(e => e !== eps));
    } else {
      this.epsSoat.set([...current, eps]);
    }
    this.saveToStorage();
  }

  isSoat(eps: string): boolean {
    if (!eps) return false;
    const epsTrimmed = eps.trim().toUpperCase();
    return this.epsSoat().some(e => e.trim().toUpperCase() === epsTrimmed);
  }
}

import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class EpsGiroCamaService {
  epsGiroCama = signal<string[]>([]);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('eps_giro_cama');
    if (stored) {
      try {
        this.epsGiroCama.set(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing eps_giro_cama from localStorage', e);
      }
    }
  }

  private saveToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('eps_giro_cama', JSON.stringify(this.epsGiroCama()));
    }
  }

  toggleEps(eps: string) {
    const current = this.epsGiroCama();
    if (current.includes(eps)) {
      this.epsGiroCama.set(current.filter(e => e !== eps));
    } else {
      this.epsGiroCama.set([...current, eps]);
    }
    this.saveToStorage();
  }

  isGiroCama(eps: string): boolean {
    if (!eps) return false;
    const epsTrimmed = eps.trim().toUpperCase();
    return this.epsGiroCama().some(e => e.trim().toUpperCase() === epsTrimmed);
  }
}

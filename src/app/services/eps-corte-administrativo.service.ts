import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class EpsCorteAdministrativoService {
  epsCorteAdministrativo = signal<string[]>([]);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('eps_corte_administrativo');
    if (stored) {
      try {
        this.epsCorteAdministrativo.set(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing eps_corte_administrativo from localStorage', e);
      }
    }
  }

  private saveToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('eps_corte_administrativo', JSON.stringify(this.epsCorteAdministrativo()));
    }
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

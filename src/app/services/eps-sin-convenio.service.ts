import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class EpsSinConvenioService {
  epsSinConvenio = signal<string[]>([]);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('eps_sin_convenio');
    if (stored) {
      try {
        this.epsSinConvenio.set(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing eps_sin_convenio from localStorage', e);
      }
    }
  }

  private saveToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('eps_sin_convenio', JSON.stringify(this.epsSinConvenio()));
    }
  }

  toggleEps(eps: string) {
    const current = this.epsSinConvenio();
    if (current.includes(eps)) {
      this.epsSinConvenio.set(current.filter(e => e !== eps));
    } else {
      this.epsSinConvenio.set([...current, eps]);
    }
    this.saveToStorage();
  }

  isSinConvenio(eps: string): boolean {
    if (!eps) return false;
    const epsTrimmed = eps.trim().toUpperCase();
    return this.epsSinConvenio().some(e => e.trim().toUpperCase() === epsTrimmed);
  }
}

import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AreaAgrupacionService {
  // Stores areas explicitly set to Urgencias
  customUrgencias = signal<string[]>([]);
  // Stores areas explicitly set to Hospitalización
  customHospitalizacion = signal<string[]>([]);
  
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    const storedUrgencias = localStorage.getItem('custom_urgencias');
    if (storedUrgencias) {
      try {
        this.customUrgencias.set(JSON.parse(storedUrgencias));
      } catch (e) {
        console.error('Error parsing custom_urgencias', e);
      }
    }

    const storedHosp = localStorage.getItem('custom_hospitalizacion');
    if (storedHosp) {
      try {
        this.customHospitalizacion.set(JSON.parse(storedHosp));
      } catch (e) {
        console.error('Error parsing custom_hospitalizacion', e);
      }
    }
  }

  private saveToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('custom_urgencias', JSON.stringify(this.customUrgencias()));
      localStorage.setItem('custom_hospitalizacion', JSON.stringify(this.customHospitalizacion()));
    }
  }

  setAsUrgencias(area: string) {
    const trimmed = area.trim();
    if (!trimmed) return;
    
    this.customHospitalizacion.update(list => list.filter(a => a !== trimmed));
    
    if (!this.customUrgencias().includes(trimmed)) {
      this.customUrgencias.update(list => [...list, trimmed]);
    }
    this.saveToStorage();
  }

  setAsHospitalizacion(area: string) {
    const trimmed = area.trim();
    if (!trimmed) return;
    
    this.customUrgencias.update(list => list.filter(a => a !== trimmed));
    
    if (!this.customHospitalizacion().includes(trimmed)) {
      this.customHospitalizacion.update(list => [...list, trimmed]);
    }
    this.saveToStorage();
  }

  getAreaGroup(area: string): 'Urgencias' | 'Hospitalización' {
    if (!area) return 'Hospitalización';
    const trimmed = area.trim();
    
    // 1. Check explicit overrides
    if (this.customUrgencias().includes(trimmed)) {
      return 'Urgencias';
    }
    if (this.customHospitalizacion().includes(trimmed)) {
      return 'Hospitalización';
    }
    
    // 2. Default logic
    const areaLower = trimmed.toLowerCase();
    const isUrgencias = areaLower.includes('camilla') || areaLower.includes('urgencias');
    return isUrgencias ? 'Urgencias' : 'Hospitalización';
  }
}

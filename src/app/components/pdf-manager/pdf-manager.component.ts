import { Component, input, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase.service';
import { ConsolidadoService, ConsolidadoRecord } from '../../services/consolidado.service';

@Component({
  selector: 'app-pdf-manager',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex items-center gap-2">
      @if (record()['pdf']) {
        <a [href]="getPublicUrl(record()['pdf']?.toString() || '')" target="_blank" class="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 text-[10px] font-medium transition-colors">
          <mat-icon class="text-[14px] w-4 h-4">picture_as_pdf</mat-icon>
          Ver PDF
        </a>
        <button (click)="fileInput.click()" class="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors" title="Reemplazar PDF">
          <mat-icon class="text-[14px] w-4 h-4">edit</mat-icon>
        </button>
      } @else {
        <button (click)="fileInput.click()" [disabled]="uploading()" class="flex items-center gap-1 text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[10px] font-medium transition-colors disabled:opacity-50">
          @if (uploading()) {
            <mat-icon class="animate-spin text-[14px] w-4 h-4">refresh</mat-icon>
            Subiendo...
          } @else {
            <mat-icon class="text-[14px] w-4 h-4">upload_file</mat-icon>
            Subir PDF
          }
        </button>
      }
      <input type="file" #fileInput class="hidden" accept="application/pdf" (change)="onFileSelected($event)">
    </div>
  `
})
export class PdfManagerComponent {
  record = input.required<ConsolidadoRecord>();
  uploading = signal(false);
  private supabaseService = inject(SupabaseService);
  private consolidadoService = inject(ConsolidadoService);

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    try {
      const path = `${this.record()['id']}/${Date.now()}_${file.name}`;
      await this.supabaseService.uploadFile(file, path);
      await this.consolidadoService.updateRegistro(this.record()['id'] as string, { pdf: path });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error al subir el archivo.');
    } finally {
      this.uploading.set(false);
    }
  }

  getPublicUrl(path: string) {
    return this.supabaseService.getPublicUrl(path);
  }
}

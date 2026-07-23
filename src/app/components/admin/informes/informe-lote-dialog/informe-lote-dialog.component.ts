import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface IglesiaLote { id: number; nombre: string; }

export interface InformeLoteData {
  titulo: string;
  iglesias: IglesiaLote[];
  /** Genera y descarga el PDF de una iglesia. El diálogo lo invoca por cada iglesia marcada. */
  generarUno: (iglesiaId: number) => Promise<void>;
}

@Component({
  selector: 'app-informe-lote-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatProgressBarModule
  ],
  templateUrl: './informe-lote-dialog.component.html',
  styleUrls: ['./informe-lote-dialog.component.css']
})
export class InformeLoteDialogComponent {
  seleccion = new Set<number>();
  generando = false;
  terminado = false;
  progreso = 0;
  total = 0;
  actual = '';
  errores: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<InformeLoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InformeLoteData
  ) {}

  get todasMarcadas(): boolean {
    return this.data.iglesias.length > 0 && this.seleccion.size === this.data.iglesias.length;
  }

  get algunaMarcada(): boolean {
    return this.seleccion.size > 0 && !this.todasMarcadas;
  }

  toggle(id: number, checked: boolean): void {
    if (checked) this.seleccion.add(id);
    else this.seleccion.delete(id);
  }

  toggleTodas(checked: boolean): void {
    this.seleccion.clear();
    if (checked) this.data.iglesias.forEach(i => this.seleccion.add(i.id));
  }

  async generar(): Promise<void> {
    if (this.generando || this.seleccion.size === 0) return;
    const ids = this.data.iglesias.filter(i => this.seleccion.has(i.id));
    this.generando = true;
    this.terminado = false;
    this.errores = [];
    this.total = ids.length;
    this.progreso = 0;

    for (const ig of ids) {
      this.actual = ig.nombre;
      try {
        await this.data.generarUno(ig.id);
      } catch (e) {
        this.errores.push(ig.nombre);
      }
      this.progreso++;
    }

    this.generando = false;
    this.terminado = true;
    this.actual = '';
  }
}

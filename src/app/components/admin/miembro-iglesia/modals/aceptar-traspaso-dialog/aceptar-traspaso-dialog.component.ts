import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AceptarTraspasoData {
  miembroNombre: string;
  miembroCi?: string | number | null;
  miembroCargo?: string;
  iglesiaOrigenNombre: string;
  pastorOrigen?: string;
  iglesiaDestinoNombre: string;
  motivoTraspaso?: string;
  fechaSolicitud?: Date | string | null;
  /** Carta ya adjuntada antes, si la hubiera. */
  uriCartaTraspaso?: string;
}

export interface AceptarTraspasoResultado {
  aceptar: true;
  carta: File | null;
}

/**
 * Confirmación de aceptación de un traspaso.
 *
 * Se acepta y se adjunta la foto de la carta firmada en un mismo paso, que es
 * como ocurre en la práctica: el pastor recibe la carta en papel y en ese
 * momento da el alta del miembro.
 */
@Component({
  selector: 'app-aceptar-traspaso-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './aceptar-traspaso-dialog.component.html',
  styleUrls: ['./aceptar-traspaso-dialog.component.css']
})
export class AceptarTraspasoDialogComponent {

  archivo: File | null = null;
  nombreArchivo = '';
  errorArchivo = '';

  /** El backend admite hasta 10MB por archivo (spring.servlet.multipart.max-file-size). */
  private readonly MAX_BYTES = 10 * 1024 * 1024;

  constructor(
    public dialogRef: MatDialogRef<AceptarTraspasoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AceptarTraspasoData
  ) { }

  seleccionarArchivo(event: any) {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return;

    if (file.size > this.MAX_BYTES) {
      this.errorArchivo = 'El archivo no debe superar los 10 MB.';
      this.quitarArchivo();
      return;
    }

    this.errorArchivo = '';
    this.archivo = file;
    this.nombreArchivo = file.name;
  }

  quitarArchivo() {
    this.archivo = null;
    this.nombreArchivo = '';
  }

  /** Quita el prefijo "Pastor: " que agregan las vistas para mostrarlo en pantalla. */
  get pastorOrigenLimpio(): string {
    const valor = (this.data.pastorOrigen || '').replace(/^pastor:\s*/i, '').trim();
    return valor && !/por asignar/i.test(valor) ? valor : '';
  }

  get fechaSolicitudTexto(): string {
    if (!this.data.fechaSolicitud) return '';
    const fecha = new Date(this.data.fechaSolicitud);
    return isNaN(fecha.getTime()) ? '' : fecha.toLocaleDateString('es-ES');
  }

  aceptar() {
    const resultado: AceptarTraspasoResultado = { aceptar: true, carta: this.archivo };
    this.dialogRef.close(resultado);
  }
}

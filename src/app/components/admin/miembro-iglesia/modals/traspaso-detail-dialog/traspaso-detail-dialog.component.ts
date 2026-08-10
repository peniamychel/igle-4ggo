import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImageUrlPipe } from '../../../../../shared/pipes/image-url.pipe';

/**
 * Detalle de una solicitud de traspaso.
 *
 * Se abre al hacer clic en la tarjeta: reúne los datos de la solicitud y muestra
 * la carta adjunta, con vista previa cuando es una imagen.
 */
@Component({
  selector: 'app-traspaso-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ImageUrlPipe],
  templateUrl: './traspaso-detail-dialog.component.html',
  styleUrls: ['./traspaso-detail-dialog.component.css']
})
export class TraspasoDetailDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<TraspasoDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  get estado(): string {
    return (this.data?.estadoTraspaso || 'PENDIENTE').toUpperCase();
  }

  get estadoTexto(): string {
    switch (this.estado) {
      case 'ACEPTADO': return 'Aceptado';
      case 'RECHAZADO': return 'Rechazado';
      case 'CANCELADO': return 'Cancelado';
      default: return 'Pendiente';
    }
  }

  get estadoClase(): string {
    return this.estado.toLowerCase();
  }

  /** La carta puede ser una foto o un PDF; solo la imagen se previsualiza. */
  get cartaEsImagen(): boolean {
    const uri = (this.data?.uriCartaTraspaso || '').toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/.test(uri);
  }

  limpiarPastor(valor?: string): string {
    const nombre = (valor || '').replace(/^pastor:\s*/i, '').trim();
    return nombre && !/por asignar/i.test(nombre) ? nombre : '';
  }

  formatearFecha(valor: any): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? '' : fecha.toLocaleDateString('es-ES');
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MiembroIglesiaService } from '../../../../../core/services/miembro-iglesia.service';
import { IglesiaService } from '../../../../../core/services/iglesia.service';
import { Miembro } from '../../../../../core/models/miembro.model';
import { Iglesia } from '../../../../../core/models/iglesia.model';
import { MiembroIglesia } from '../../../../../core/models/miembro-iglesia.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-miembro-iglesia-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './miembro-iglesia-detail.component.html',
  styleUrls: ['./miembro-iglesia-detail.component.css']
})
export class MiembroIglesiaDetailComponent implements OnInit {
  historialIglesias: Array<{
    miembroIglesia: MiembroIglesia;
    iglesia: Iglesia;
    iglesiaDestino?: Iglesia;
  }> = [];

  constructor(
    private miembroIglesiaService: MiembroIglesiaService,
    private iglesiaService: IglesiaService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<MiembroIglesiaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { miembro: Miembro; iglesia: Iglesia }
  ) {}

  ngOnInit() {
    this.loadHistorial();
  }

  loadHistorial() {
    if (!this.data.miembro.id) return;
    this.miembroIglesiaService.getHistorialMiembro(this.data.miembro.id).subscribe(response => {
      const miembroIglesias = response.datos;

      this.iglesiaService.getIglesias().subscribe(iglesiasResponse => {
        this.historialIglesias = miembroIglesias.map(mi => ({
          miembroIglesia: mi,
          iglesia: iglesiasResponse.datos.find(i => i.id === mi.iglesiaId)!,
          iglesiaDestino: mi.iglesiaDestinoId ? iglesiasResponse.datos.find(i => i.id === mi.iglesiaDestinoId) : undefined
        }));
      });
    });
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('No se pudo obtener el contexto 2d del canvas'));
        }
      };
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen: ' + url));
      };
      img.src = url;
    });
  }

  generatePDF(): void {
    try {
      const doc = new jsPDF();
      const logoUrl = 'logo.png';
      
      this.loadImage(logoUrl).then(base64Logo => {
        this.buildPDF(doc, base64Logo);
      }).catch(err => {
        console.warn('No se pudo cargar el logo, generando PDF sin logo:', err);
        this.buildPDF(doc, null);
      });
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error al generar PDF', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
    }
  }

  buildPDF(doc: jsPDF, base64Logo: string | null): void {
    const primaryColor: [number, number, number] = [127, 11, 133]; // #7F0B85
    let y = 20;

    if (base64Logo) {
      doc.addImage(base64Logo, 'PNG', 14, 12, 18, 18);
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Movimiento Cristiano Misionero Maranatha', 36, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Historial Oficial de Membresía y Congregaciones', 36, 26);
      y = 35;
    } else {
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Movimiento Cristiano Misionero Maranatha', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Historial Oficial de Membresía y Congregaciones', 14, 26);
      y = 32;
    }

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL MIEMBRO', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const col1X = 14;
    const col2X = 110;

    doc.text(`Nombre Completo: ${this.data.miembro.nombre} ${this.data.miembro.apellido}`, col1X, y);
    doc.text(`Cédula de Identidad (CI): ${this.data.miembro.ci || 'Sin CI'}`, col2X, y);
    y += 6;

    doc.text(`Fecha de Conversión: ${this.formatDate(this.data.miembro.fechaConvercion)}`, col1X, y);
    doc.text(`Contacto/Celular: ${this.data.miembro.celular || 'No registrado'}`, col2X, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('HISTORIAL DE CONGREGACIONES Y TRASLADOS', 14, y);
    y += 4;

    const tableColumn = ['N°', 'Congregación / Iglesia', 'Dirección', 'Fecha Ingreso', 'Estado', 'Detalles de Traslado'];
    const tableRows = this.historialIglesias.map((item, index) => {
      let statusText = 'Anterior';
      if (item.miembroIglesia.estado && !item.miembroIglesia.estadoTraspaso) {
        statusText = 'Actual';
      } else if (item.miembroIglesia.estado && item.miembroIglesia.estadoTraspaso === 'PENDIENTE') {
        statusText = 'Traspaso Pendiente';
      } else if (!item.miembroIglesia.estado && item.miembroIglesia.estadoTraspaso === 'ACEPTADO') {
        statusText = 'Traspasado';
      } else if (item.miembroIglesia.estado && item.miembroIglesia.estadoTraspaso === 'RECHAZADO') {
        statusText = 'Traspaso Rechazado';
      }

      let detailsText = '-';
      if (item.iglesiaDestino) {
        detailsText = `Destino: ${item.iglesiaDestino.nombre}`;
        if (item.miembroIglesia.motivoTraspaso) {
          detailsText += `\nMotivo: ${item.miembroIglesia.motivoTraspaso}`;
        }
      }

      return [
        (index + 1).toString(),
        item.iglesia.nombre,
        item.iglesia.direccion || 'Sin dirección',
        this.formatDate(item.miembroIglesia.fecha),
        statusText,
        detailsText
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 42 }
      },
      margin: { left: 14, right: 14 }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Reporte emitido el ${new Date().toLocaleDateString('es-ES')} - Movimiento Cristiano Misionero Maranatha`,
        14,
        287
      );
      doc.text(`Página ${i} de ${totalPages}`, 180, 287);
    }

    const cleanFileName = `Historial_${this.data.miembro.nombre}_${this.data.miembro.apellido}`.replace(/\s+/g, '_');
    doc.save(`${cleanFileName}.pdf`);
    this.snackBar.open('Historial PDF generado exitosamente', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
  }
}

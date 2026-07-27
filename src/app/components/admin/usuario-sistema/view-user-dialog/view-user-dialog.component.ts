import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '../../../../core/models/user.model';
import { RolesPipe } from '../../../../core/pipes/roles.pipe';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { AccionDto } from '../../../../core/models/interfaces/servicio.interface';

@Component({
  selector: 'app-view-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    RolesPipe,
    ImageUrlPipe
  ],
  templateUrl: './view-user-dialog.component.html',
  styleUrls: ['./view-user-dialog.component.css']
})
export class ViewUserDialogComponent {
  private avatarColors = [
    '#7c4dff', '#651fff', '#6200ea', '#e91e63',
    '#2196f3', '#00bcd4', '#009688', '#4caf50',
    '#ff9800', '#ff5722', '#795548', '#607d8b'
  ];

  constructor(
    public dialogRef: MatDialogRef<ViewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  getInitials(): string {
    const name = this.user.name?.charAt(0) || '';
    const apellidos = this.user.apellidos?.charAt(0) || '';
    return (name + apellidos).toUpperCase() || this.user.username.charAt(0).toUpperCase();
  }

  getAvatarColor(): string {
    const index = this.user.username.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getAccionesAgrupadas(): { servicioCodigo: string; acciones: AccionDto[] }[] {
    const acciones: AccionDto[] = this.user.acciones || [];
    const map = new Map<string, AccionDto[]>();

    acciones.forEach((a: AccionDto) => {
      const sCodigo = a.servicioCodigo || 'SISTEMA';
      if (!map.has(sCodigo)) {
        map.set(sCodigo, []);
      }
      map.get(sCodigo)!.push(a);
    });

    const result: { servicioCodigo: string; acciones: AccionDto[] }[] = [];
    map.forEach((accs, key) => {
      result.push({ servicioCodigo: key, acciones: accs });
    });
    return result;
  }

  downloadPdf(): void {
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [124, 77, 255];
      const darkColor: [number, number, number] = [30, 41, 59];

      // 1. Encabezado Institucional
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(124, 77, 255);
      doc.text('MOVIMIENTO CRISTIANO MISIONERO MARANATHA', 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('FICHA TÉCNICA DE USUARIO Y PERMISOS DEL SISTEMA', 14, 27);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 33);

      // Línea divisoria
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.8);
      doc.line(14, 37, 196, 37);

      // 2. Información de la Cuenta
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(124, 77, 255);
      doc.text('1. Datos de la Cuenta de Usuario', 14, 45);

      const userRows = [
        ['Nombre Completo', `${this.user.name || ''} ${this.user.apellidos || ''}`.trim() || 'N/A'],
        ['Nombre de Usuario', `@${this.user.username}`],
        ['Correo Electrónico', this.user.email || 'Sin correo registrado'],
        ['Iglesia / Sede Asignada', this.user.iglesiaNombre || 'Administración Central'],
        ['Estado de la Cuenta', this.user.estado ? 'ACTIVO' : 'INACTIVO'],
        ['Roles / Cargos Asignados', (this.user.roles || []).map(r => r.nombre || r.name).join(', ') || 'Sin roles']
      ];

      autoTable(doc, {
        head: [['Parámetro', 'Detalle de Configuración']],
        body: userRows,
        startY: 49,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 12;

      // 3. Permisos y Acciones Autorizadas por Módulo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(124, 77, 255);
      doc.text('2. Resumen de Acciones Autorizadas por Servicio (RBAC)', 14, currentY);

      const grupos = this.getAccionesAgrupadas();

      if (grupos.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Este usuario no posee acciones de autorización asignadas.', 14, currentY + 6);
      } else {
        const accionesRows: string[][] = [];
        grupos.forEach(grupo => {
          grupo.acciones.forEach(accion => {
            accionesRows.push([
              grupo.servicioCodigo,
              accion.nombre || 'N/A',
              accion.authorityCode || accion.codigo || 'N/A'
            ]);
          });
        });

        autoTable(doc, {
          head: [['Servicio / Módulo', 'Acción Permitida', 'Código de Permiso (Authority)']],
          body: accionesRows,
          startY: currentY + 4,
          theme: 'grid',
          headStyles: { fillColor: darkColor, textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8.5, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 75 },
            2: { fontStyle: 'bold', cellWidth: 55 }
          }
        });
      }

      // Pie de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text(`Igle4 — Sistema de Gestión Eclesiástica | Página ${i} de ${pageCount}`, 14, 287);
      }

      const fileName = `Ficha_Usuario_${this.user.username}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error al generar el PDF de usuario:', error);
    }
  }
}

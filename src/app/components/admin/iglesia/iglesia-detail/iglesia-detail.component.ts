import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { MiembroService } from '../../../../core/services/miembro.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { HasPrivilegioDirective } from '../../../../core/directives/has-privilegio.directive';
import { IglesiaEditComponent } from '../iglesia-edit/iglesia-edit.component';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-iglesia-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    ImageUrlPipe,
    HasPrivilegioDirective
  ],
  templateUrl: './iglesia-detail.component.html',
  styleUrls: ['./iglesia-detail.component.css']
})
export class IglesiaDetailComponent implements OnInit {
  map: any;
  loadingHistory = true;
  miembros: Miembro[] = [];
  cargosHistory: Cargo[] = [];
  tiposCargo: TipoCargo[] = [];
  hasChanges = false;

  constructor(
    public dialogRef: MatDialogRef<IglesiaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia,
    private miembroService: MiembroService,
    private cargoService: CargoService,
    private tipoCargoService: TipoCargoService,
    private dialog: MatDialog,
    private iglesiaService: IglesiaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  openEditDialog() {
    const editRef = this.dialog.open(IglesiaEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: this.data
    });

    editRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close({ edited: true, data: result });
      }
    });
  }

  closeDialog() {
    this.dialogRef.close(this.hasChanges ? { toggled: true } : null);
  }

  toggleEstado() {
    if (this.data.id) {
      this.iglesiaService.toggleEstado(this.data.id).subscribe({
        next: (result) => {
          this.data.estado = !this.data.estado;
          this.hasChanges = true;
          this.snackBar.open('Estado modificado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cambiar el estado', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  deleteIglesia() {
    if (!this.data.id) return;

    if (this.miembros.length > 0 || this.cargosHistory.length > 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'No se puede eliminar la iglesia',
          message: `
            <div style="font-size: 0.93rem; line-height: 1.6; color: #1a1f36;">
              <p>Esta iglesia tiene dependencias activas registradas en el sistema. Para poder eliminarla, debe realizar primero el siguiente procedimiento:</p>
              <ol style="padding-left: 20px; margin-top: 10px; margin-bottom: 12px;">
                <li style="margin-bottom: 6px;"><strong>Miembros:</strong> Reasignar o eliminar los miembros vinculados (actualmente: <b style="color: var(--primary-color);">${this.miembros.length} miembros</b>).</li>
                <li><strong>Obreros/Cargos:</strong> Finalizar o eliminar las designaciones (actualmente: <b style="color: var(--primary-color);">${this.cargosHistory.length} cargos</b>).</li>
              </ol>
              <p style="color: #ba1a1a; font-weight: 700; margin-top: 14px;">Por razones de integridad de datos, no es posible proceder hasta que estas dependencias estén en 0.</p>
            </div>
          `,
          confirmText: 'Entendido',
          cancelText: '',
          type: 'danger'
        }
      });
      return;
    }

    // Si tiene 0 dependencias directas de Miembros/Obreros, advertir sobre Ofrendas, Activos y Eventos
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: '¿Confirmar eliminación?',
        message: `
          <div style="font-size: 0.93rem; line-height: 1.6; color: #1a1f36;">
            <p>Está a punto de eliminar la iglesia <strong>${this.data.nombre}</strong> de forma permanente.</p>
            <p style="margin-top: 10px; font-weight: 600;">Procedimiento de verificación recomendado antes de confirmar:</p>
            <ul style="padding-left: 20px; margin-top: 8px; margin-bottom: 12px;">
              <li style="margin-bottom: 4px;">Verificar que no existan <strong>Ofrendas</strong> registradas a nombre de esta iglesia.</li>
              <li style="margin-bottom: 4px;">Verificar que no existan <strong>Bienes o Activos</strong> a nombre de esta iglesia.</li>
              <li>Verificar que no tenga <strong>Eventos</strong> programados en la iglesia.</li>
            </ul>
            <p style="color: #ba1a1a; font-weight: 700; margin-top: 14px;">Esta acción es irreversible y podría fallar si existen registros relacionados. ¿Desea proceder?</p>
          </div>
        `,
        confirmText: 'Eliminar definitivamente',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    confirmRef.afterClosed().subscribe(res => {
      if (res === true) {
        this.iglesiaService.deleteIglesia(this.data.id!).subscribe({
          next: () => {
            this.snackBar.open('Iglesia eliminada exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close(true); // Retorna true para refrescar listado
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Error al eliminar: verifique que no existan dependencias adicionales de ofrendas o activos.', 'Cerrar', {
              duration: 5000
            });
          }
        });
      }
    });
  }

  onTabChange(event: any) {
    // Tab index 1 is 'Ubicación'
    if (event.index === 1 && this.data.latitud && this.data.longitud) {
      if (!this.map) {
        this.loadMap();
      } else {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 50);
      }
    }
  }

  loadMap() {
    if (this.data && this.data.latitud && this.data.longitud) {
      setTimeout(() => {
        this.loadLeaflet().then(L => {
          this.initMap(L, this.data.latitud!, this.data.longitud!);
        }).catch(err => {
          console.error('Error al cargar Leaflet:', err);
        });
      }, 50);
    }
  }

  loadHistory() {
    if (!this.data.id) {
      this.loadingHistory = false;
      return;
    }

    this.loadingHistory = true;

    forkJoin({
      miembros: this.miembroService.getMiembros(),
      tiposCargo: this.tipoCargoService.getTipoCargos(),
      cargos: this.cargoService.getCargos()
    }).subscribe({
      next: (res) => {
        this.tiposCargo = res.tiposCargo.datos || [];
        
        // Filtrar miembros pertenecientes a esta iglesia
        const allMiembros = res.miembros.datos || [];
        this.miembros = allMiembros.filter((m: Miembro) => m.iglesiaNombre === this.data.nombre);

        // Filtrar cargos pertenecientes a esta iglesia
        const allCargos = res.cargos.datos || [];
        this.cargosHistory = allCargos
          .filter((c: Cargo) => c.iglesiaId === this.data.id)
          .map((c: Cargo) => {
            return {
              ...c,
              tipoCargoDto: this.tiposCargo.find(tc => tc.id === c.rolCargoId),
              miembroDto: allMiembros.find((m: Miembro) => m.id === c.idMiembro)
            };
          })
          .sort((a: Cargo, b: Cargo) => {
            // Vigentes primero, luego fechaInicio descendente
            if (a.estado && !b.estado) return -1;
            if (!a.estado && b.estado) return 1;
            return new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
          });

        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  loadLeaflet(): Promise<any> {
    if ((window as any).L) {
      return Promise.resolve((window as any).L);
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve((window as any).L);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  initMap(L: any, lat: number, lng: number) {
    const coords: [number, number] = [lat, lng];
    this.map = L.map('map-container-detail').setView(coords, 14);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google',
      maxZoom: 20
    });

    streetLayer.addTo(this.map);

    const baseMaps = {
      "Mapa (Calles)": streetLayer,
      "Satélite": satelliteLayer
    };

    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(this.map);

    L.marker(coords).addTo(this.map);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
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
          reject(new Error('No se pudo obtener el contexto del canvas'));
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
      
      const promises: Promise<string | null>[] = [
        this.loadImage(logoUrl).catch(err => {
          console.warn('No se pudo cargar el logo, generando PDF sin logo:', err);
          return null;
        })
      ];

      if (this.data.latitud && this.data.longitud) {
        const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.data.latitud},${this.data.longitud}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(gmapsUrl)}`;
        promises.push(
          this.loadImage(qrUrl).catch(err => {
            console.warn('No se pudo cargar el código QR de ubicación:', err);
            return null;
          })
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      Promise.all(promises).then(([base64Logo, base64QR]) => {
        this.buildPDF(doc, base64Logo, base64QR);
      }).catch(err => {
        console.error('Error al cargar recursos del PDF:', err);
        this.buildPDF(doc, null, null);
      });
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error al generar PDF', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
    }
  }

  buildPDF(doc: jsPDF, base64Logo: string | null, base64QR: string | null): void {
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
      doc.text('Ficha Técnica e Historial de la Iglesia / Congregación', 36, 26);
      y = 35;
    } else {
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Movimiento Cristiano Misionero Maranatha', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Ficha Técnica e Historial de la Iglesia / Congregación', 14, 26);
      y = 32;
    }

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS GENERALES DE LA IGLESIA', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const col1X = 14;
    const col2X = 110;

    doc.text(`Nombre de la Iglesia: ${this.data.nombre}`, col1X, y);
    doc.text(`Estado: ${this.data.estado ? 'Activa / Operando' : 'Inactiva / Cerrada'}`, col2X, y);
    y += 6;

    doc.text(`Dirección: ${this.data.direccion || 'Sin dirección registrada'}`, col1X, y);
    doc.text(`Teléfono: ${this.data.telefono || 'Sin teléfono registrado'}`, col2X, y);
    y += 6;

    doc.text(`Fecha de Fundación: ${this.formatDate(this.data.fechaFundacion)}`, col1X, y);
    if (base64QR) {
      doc.text('Escanear Ubicación:', col2X, y);
      doc.addImage(base64QR, 'PNG', col2X + 38, y - 4, 18, 18);
      y += 18;
    } else {
      doc.text(`Ubicación Coordenadas: No registrada`, col2X, y);
      y += 10;
    }

    // Sección 2: Membresía
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Miembros de la iglesia (${this.miembros.length})`, 14, y);
    y += 4;

    const miembrosColumns = ['N°', 'Nombre Completo', 'Cédula de Identidad (CI)', 'Celular', 'Estado'];
    const miembrosRows = this.miembros.map((miembro, index) => [
      (index + 1).toString(),
      `${miembro.nombre} ${miembro.apellido}`,
      miembro.ci || 'Sin CI',
      miembro.celular || 'Sin celular',
      miembro.estado ? 'Activo' : 'Inactivo'
    ]);

    autoTable(doc, {
      head: [miembrosColumns],
      body: miembrosRows,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [11, 133, 127] }, // Teal as per standard
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 27 }
      },
      margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    // Sección 3: Cargos/Designaciones
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`HISTORIAL DE DESIGNACIONES / CARGOS (${this.cargosHistory.length})`, 14, y);
    y += 4;

    const cargosColumns = ['N°', 'Cargo / Función', 'Obrero / Responsable', 'Fecha Inicio', 'Fecha Fin', 'Estado'];
    const cargosRows = this.cargosHistory.map((cargo, index) => [
      (index + 1).toString(),
      cargo.tipoCargoDto?.nombre || 'Cargo Desconocido',
      this.getMiembroNombreCompleto(cargo.miembroDto),
      this.formatDate(cargo.fechaInicio),
      cargo.fechaFin ? this.formatDate(cargo.fechaFin) : 'Presente (Vigente)',
      cargo.estado ? 'Vigente' : 'Desvinculado'
    ]);

    autoTable(doc, {
      head: [cargosColumns],
      body: cargosRows,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [11, 133, 127] }, // Teal as per standard
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 }
      },
      margin: { left: 14, right: 14 }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Ficha Oficial de la Iglesia - Emitido el ${new Date().toLocaleDateString('es-ES')} - Movimiento Cristiano Misionero Maranatha`,
        14,
        287
      );
      doc.text(`Página ${i} de ${totalPages}`, 180, 287);
    }

    const cleanFileName = `Ficha_Iglesia_${this.data.nombre}`.replace(/\s+/g, '_');
    doc.save(`${cleanFileName}.pdf`);
    this.snackBar.open('Ficha PDF generada exitosamente', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
  }
}

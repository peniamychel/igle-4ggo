import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { forkJoin } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Miembro } from '../../../../core/models/miembro.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { MiembroIglesia } from '../../../../core/models/miembro-iglesia.model';
import { ResponsableEvento } from '../../../../core/models/responsable-evento.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { CargoService } from '../../../../core/services/cargo.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { ResponsableEventoService } from '../../../../core/services/responsable-evento.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-detail',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatExpansionModule,
    ImageUrlPipe
  ],
  templateUrl: './miembro-detail.component.html',
  styleUrls: ['./miembro-detail.component.css']
})
export class MiembroDetailComponent implements OnInit {
  showImagePreview = false;
  loadingHistory = true;
  
  cargosHistory: Cargo[] = [];
  trasladosHistory: MiembroIglesia[] = [];
  eventosHistory: ResponsableEvento[] = [];
  
  iglesias: Iglesia[] = [];
  tiposCargo: TipoCargo[] = [];

  constructor(
    public dialogRef: MatDialogRef<MiembroDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Miembro,
    private cargoService: CargoService,
    private miembroIglesiaService: MiembroIglesiaService,
    private responsableEventoService: ResponsableEventoService,
    private iglesiaService: IglesiaService,
    private tipoCargoService: TipoCargoService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  downloadPdf() {
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [127, 11, 133]; // purple
      const accentColor: [number, number, number] = [11, 133, 127]; // teal
      
      // Logo y Nombre de la Iglesia
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(127, 11, 133);
      doc.text('MOVIMIENTO CRISTIANO MISIONERO MARANATHA', 14, 20);
      
      // Subtítulo con formato personalizado si tiene cargo
      const activeCargo = this.cargosHistory.find(c => c.estado);
      let memberHeaderSubtitle = '';
      if (activeCargo) {
        const cargoName = activeCargo.tipoCargoDto?.nombre || 'Obrero';
        let prefix = 'Ficha de';
        const nameLower = cargoName.toLowerCase();
        if (nameLower.startsWith('pastor') || nameLower.startsWith('lider') || nameLower.startsWith('director') || nameLower.startsWith('encargado')) {
          prefix = 'Ficha del';
        } else if (nameLower.startsWith('pastora') || nameLower.startsWith('directora') || nameLower.startsWith('encargada')) {
          prefix = 'Ficha de la';
        } else {
          prefix = `Ficha de ${cargoName}`;
        }

        if (prefix.startsWith('Ficha de ') && prefix !== 'Ficha de') {
          memberHeaderSubtitle = `${prefix}: ${this.data.nombre} ${this.data.apellido}`;
        } else {
          memberHeaderSubtitle = `${prefix} ${cargoName}: ${this.data.nombre} ${this.data.apellido}`;
        }
      } else {
        memberHeaderSubtitle = `Ficha de Miembro: ${this.data.nombre} ${this.data.apellido}`;
      }

      doc.setFontSize(13);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(memberHeaderSubtitle, 14, 28);
      
      // Línea divisoria
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 32, 196, 32);
      
      // Fecha
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString('es-ES')}`, 145, 28);

      // --- 1. DATOS PERSONALES Y MEMBRESÍA ---
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(127, 11, 133);
      doc.text('1. Datos Personales y Membresía', 14, 40);

      const personalColumn = ['Dato', 'Información'];
      const personalRows = [
        ['Nombre Completo', `${this.data.nombre} ${this.data.apellido}`],
        ['Cédula de Identidad (CI)', this.data.ci || 'Sin CI'],
        ['Fecha de Nacimiento', this.formatDate(this.data.fechaNac)],
        ['Sexo', this.data.sexo || 'No especificado'],
        ['Celular', this.data.celular || 'Sin celular'],
        ['Dirección', this.data.direccion || 'Sin dirección'],
        ['Lugar de Conversión', this.data.lugarConvercion || 'No especificado'],
        ['Fecha de Conversión', this.formatDate(this.data.fechaConvercion)],
        ['Estado de Membresía', this.data.estado ? 'Activo' : 'Inactivo'],
        ['Observaciones', this.data.detalles || 'Ninguna']
      ];

      autoTable(doc, {
        head: [personalColumn],
        body: personalRows,
        startY: 44,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 12;

      // --- 2. HISTORIAL DE DESIGNACIONES (CARGOS) ---
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(127, 11, 133);
      doc.text('2. Historial de Designaciones / Cargos', 14, currentY);

      if (this.cargosHistory.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('No registra cargos ni designaciones.', 14, currentY + 6);
        currentY += 12;
      } else {
        const cargosColumn = ['Cargo/Ministerio', 'Iglesia', 'Desde', 'Hasta', 'Estado'];
        const cargosRows = this.cargosHistory.map(c => [
          c.tipoCargoDto?.nombre || 'Cargo Desconocido',
          c.iglesiaDto?.nombre || 'Sin Iglesia',
          this.formatDate(c.fechaInicio),
          c.fechaFin ? this.formatDate(c.fechaFin) : 'Presente (Vigente)',
          c.estado ? 'Vigente' : 'Desvinculado'
        ]);

        autoTable(doc, {
          head: [cargosColumn],
          body: cargosRows,
          startY: currentY + 4,
          theme: 'grid',
          headStyles: { fillColor: accentColor },
          styles: { fontSize: 8.5 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      // --- 3. TRASLADOS E IGLESIA ---
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(127, 11, 133);
      doc.text('3. Historial de Membresías y Traslados', 14, currentY);

      if (this.trasladosHistory.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('No registra traslados de iglesia.', 14, currentY + 6);
        currentY += 12;
      } else {
        const trasladosColumn = ['Iglesia Origen', 'Iglesia Destino', 'Motivo', 'Fecha', 'Estado'];
        const trasladosRows = this.trasladosHistory.map(t => [
          this.getIglesiaNombre(t.iglesiaId),
          t.iglesiaDestinoId ? this.getIglesiaNombre(t.iglesiaDestinoId) : '-',
          t.motivoTraspaso || '-',
          this.formatDate(t.fecha),
          this.getTrasladoEstadoLabel(t)
        ]);

        autoTable(doc, {
          head: [trasladosColumn],
          body: trasladosRows,
          startY: currentY + 4,
          theme: 'grid',
          headStyles: { fillColor: accentColor },
          styles: { fontSize: 8.5 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      // --- 4. RESPONSABLE DE EVENTOS ---
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(127, 11, 133);
      doc.text('4. Historial de Eventos Organizados', 14, currentY);

      if (this.eventosHistory.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('No ha sido responsable de eventos.', 14, currentY + 6);
      } else {
        const eventosColumn = ['Nombre del Evento', 'Ubicación', 'Fecha Inicio', 'Fecha Fin', 'Estado'];
        const eventosRows = this.eventosHistory.map(e => [
          e.eventoDto?.nombre || 'Sin nombre',
          e.eventoDto?.ubicacion || 'No especificada',
          this.formatDate(e.eventoDto?.fechaInicio),
          this.formatDate(e.eventoDto?.fechaFin),
          e.estado ? 'Vigente' : 'Inactivo'
        ]);

        autoTable(doc, {
          head: [eventosColumn],
          body: eventosRows,
          startY: currentY + 4,
          theme: 'grid',
          headStyles: { fillColor: accentColor },
          styles: { fontSize: 8.5 }
        });
      }

      doc.save(`Ficha_Historial_${this.data.nombre}_${this.data.apellido}.pdf`);
    } catch (e) {
      console.error('Error generating member history PDF:', e);
    }
  }

  getTrasladoEstadoLabel(t: MiembroIglesia): string {
    if (t.estadoTraspaso) {
      switch (t.estadoTraspaso.toUpperCase()) {
        case 'PENDIENTE': return 'TRASLADADO PENDIENTE';
        case 'ACEPTADO': return 'TRASLADADO';
        case 'RECHAZADO': return 'ANULADO';
        case 'OBSERVADO': return 'OBSERVADO';
        default: return t.estadoTraspaso.toUpperCase();
      }
    }
    return t.estado ? 'VIGENTE' : 'INACTIVO';
  }

  loadHistory() {
    if (!this.data.id) return;
    this.loadingHistory = true;

    forkJoin({
      iglesias: this.iglesiaService.getIglesias(),
      tiposCargo: this.tipoCargoService.getTipoCargos(),
      cargos: this.cargoService.getCargos(),
      traslados: this.miembroIglesiaService.getHistorialMiembro(this.data.id),
      responsabilidades: this.responsableEventoService.getResponsables()
    }).subscribe({
      next: (res) => {
        this.iglesias = res.iglesias.datos || [];
        this.tiposCargo = res.tiposCargo.datos || [];
        
        // 1. Cargos del miembro (Obreros)
        const allCargos = res.cargos.datos || [];
        this.cargosHistory = allCargos
          .filter((c: Cargo) => c.idMiembro === this.data.id)
          .map((c: Cargo) => {
            return {
              ...c,
              iglesiaDto: this.iglesias.find(i => i.id === c.iglesiaId),
              tipoCargoDto: this.tiposCargo.find(tc => tc.id === c.rolCargoId)
            };
          })
          .sort((a: Cargo, b: Cargo) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());

        // 2. Historial de traslados/membresías
        const trasladosList = res.traslados.datos || [];
        this.trasladosHistory = trasladosList
          .sort((a: MiembroIglesia, b: MiembroIglesia) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // 3. Responsabilidades de eventos
        const cargosIds = this.cargosHistory.map(c => c.id);
        const allResponsabilidades = res.responsabilidades.datos || [];
        this.eventosHistory = allResponsabilidades
          .filter((r: ResponsableEvento) => cargosIds.includes(r.cargoId) || r.cargoDto?.idMiembro === this.data.id)
          .sort((a: ResponsableEvento, b: ResponsableEvento) => {
            const dateA = a.eventoDto?.fechaInicio ? new Date(a.eventoDto.fechaInicio).getTime() : 0;
            const dateB = b.eventoDto?.fechaInicio ? new Date(b.eventoDto.fechaInicio).getTime() : 0;
            return dateB - dateA;
          });

        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  getProfilePhoto(): string | null {
    return this.data?.uriFoto || null;
  }

  toggleImagePreview(): void {
    this.showImagePreview = !this.showImagePreview;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getIglesiaNombre(id: number | null | undefined): string {
    if (!id) return '-';
    return this.iglesias.find(i => i.id === id)?.nombre || 'Sin Iglesia';
  }

  hasActiveCargo(): boolean {
    return this.cargosHistory.some(c => c.estado);
  }

  hasActiveTraslado(): boolean {
    return this.trasladosHistory.some(t => t.estado && !t.estadoTraspaso);
  }

  hasPendienteTraslado(): boolean {
    return this.trasladosHistory.some(t => t.estado && t.estadoTraspaso === 'PENDIENTE');
  }

  hasActiveEvento(): boolean {
    return this.eventosHistory.some(e => e.estado);
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cargo } from '../../../../core/models/cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { MiembroIglesia } from '../../../../core/models/miembro-iglesia.model';
import { ResponsableEvento } from '../../../../core/models/responsable-evento.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';
import { MiembroService } from '../../../../core/services/miembro.service';
import { CargoService } from '../../../../core/services/cargo.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { ResponsableEventoService } from '../../../../core/services/responsable-evento.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { TipoCargoService } from '../../../../core/services/tipo-cargo.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-cargo-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatExpansionModule, MatTooltipModule, ImageUrlPipe],
  templateUrl: './cargo-detail.component.html',
  styleUrls: ['./cargo-detail.component.css']
})
export class CargoDetailComponent implements OnInit {
  showImagePreview = false;
  loadingHistory = true;
  miembro: Miembro | undefined;
  
  cargosHistory: Cargo[] = [];
  trasladosHistory: MiembroIglesia[] = [];
  eventosHistory: ResponsableEvento[] = [];
  
  iglesias: Iglesia[] = [];
  tiposCargo: TipoCargo[] = [];

  constructor(
    public dialogRef: MatDialogRef<CargoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Cargo,
    private miembroService: MiembroService,
    private cargoService: CargoService,
    private miembroIglesiaService: MiembroIglesiaService,
    private responsableEventoService: ResponsableEventoService,
    private iglesiaService: IglesiaService,
    private tipoCargoService: TipoCargoService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const miembroId = this.data.idMiembro || this.data.miembroDto?.id;
    if (!miembroId) {
      this.loadingHistory = false;
      return;
    }

    this.loadingHistory = true;

    forkJoin({
      miembro: this.miembroService.getMiembroById(miembroId),
      iglesias: this.iglesiaService.getIglesias(),
      tiposCargo: this.tipoCargoService.getTipoCargos(),
      cargos: this.cargoService.getCargos(),
      traslados: this.miembroIglesiaService.getHistorialMiembro(miembroId),
      responsabilidades: this.responsableEventoService.getResponsables()
    }).subscribe({
      next: (res) => {
        this.miembro = res.miembro.datos;
        this.iglesias = res.iglesias.datos || [];
        this.tiposCargo = res.tiposCargo.datos || [];
        
        // 1. Cargos del miembro (Obreros)
        const allCargos = res.cargos.datos || [];
        this.cargosHistory = allCargos
          .filter((c: Cargo) => c.idMiembro === miembroId)
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
          .filter((r: ResponsableEvento) => (r.cargoId && cargosIds.includes(r.cargoId)) || r.cargoDto?.idMiembro === miembroId)
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

  getObreroFichaTitle(): string {
    const cargoName = this.data.tipoCargoDto?.nombre || 'Obrero';
    const isDesvinculado = !this.data.estado;
    if (isDesvinculado) {
      return 'Ficha del Obrero';
    }
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
      return prefix;
    } else {
      return `${prefix} ${cargoName}`;
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

  getIglesiaNombre(id: number | null | undefined): string {
    if (!id) return '-';
    return this.iglesias.find(i => i.id === id)?.nombre || 'Sin Iglesia';
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro) return 'N/A';
    return `${miembro.nombre} ${miembro.apellido}`;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  downloadPdf() {
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [127, 11, 133]; // purple
      const accentColor: [number, number, number] = [11, 133, 127]; // teal
      
      const targetMiembro = this.miembro || this.data.miembroDto;
      if (!targetMiembro) return;

      // Logo y Nombre de la Iglesia
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(127, 11, 133);
      doc.text('MOVIMIENTO CRISTIANO MISIONERO MARANATHA', 14, 20);
      
      // Título y subtítulo
      const titlePart = this.getObreroFichaTitle();
      const memberHeaderSubtitle = `${titlePart}: ${targetMiembro.nombre} ${targetMiembro.apellido}`;

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
        ['Nombre Completo', `${targetMiembro.nombre} ${targetMiembro.apellido}`],
        ['Cédula de Identidad (CI)', targetMiembro.ci || 'Sin CI'],
        ['Fecha de Nacimiento', this.formatDate(targetMiembro.fechaNac)],
        ['Sexo', targetMiembro.sexo || 'No especificado'],
        ['Celular', targetMiembro.celular || 'Sin celular'],
        ['Dirección', targetMiembro.direccion || 'Sin dirección'],
        ['Lugar de Conversión', targetMiembro.lugarConvercion || 'No especificado'],
        ['Fecha de Conversión', this.formatDate(targetMiembro.fechaConvercion)],
        ['Estado de Membresía', targetMiembro.estado ? 'Activo' : 'Inactivo'],
        ['Observaciones', targetMiembro.detalles || 'Ninguna']
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

      doc.save(`Ficha_Historial_${targetMiembro.nombre}_${targetMiembro.apellido}.pdf`);
    } catch (e) {
      console.error('Error generating member history PDF:', e);
    }
  }

  getProfilePhoto(): string | null {
    return this.miembro?.uriFoto || null;
  }

  toggleImagePreview(): void {
    this.showImagePreview = !this.showImagePreview;
  }

  getRealTraslados(): MiembroIglesia[] {
    return this.trasladosHistory.filter(t => 
      !!t.iglesiaDestinoId || !!t.estadoTraspaso || !!t.motivoTraspaso || !!t.fechaTraspaso
    );
  }

  getIglesiaActualNombre(): string {
    const targetMiembro = this.miembro || this.data.miembroDto;
    if (targetMiembro?.iglesiaNombre) {
      return targetMiembro.iglesiaNombre;
    }
    const activeMembresia = this.trasladosHistory.find(t => t.estado);
    if (activeMembresia && activeMembresia.iglesiaId) {
      const ig = this.iglesias.find(i => i.id === activeMembresia.iglesiaId);
      if (ig) return ig.nombre;
    }
    const activeCargo = this.cargosHistory.find(c => c.estado);
    if (activeCargo && activeCargo.iglesiaDto) {
      return activeCargo.iglesiaDto.nombre;
    }
    if (this.trasladosHistory.length > 0 && this.trasladosHistory[0].iglesiaId) {
      const ig = this.iglesias.find(i => i.id === this.trasladosHistory[0].iglesiaId);
      if (ig) return ig.nombre;
    }
    return 'Sin iglesia asignada';
  }

  hasActiveCargo(): boolean {
    return this.cargosHistory.some(c => c.estado);
  }

  hasActiveTraslado(): boolean {
    return this.getRealTraslados().some(t => t.estado && !t.estadoTraspaso);
  }

  hasPendienteTraslado(): boolean {
    return this.getRealTraslados().some(t => t.estado && t.estadoTraspaso === 'PENDIENTE');
  }

  hasActiveEvento(): boolean {
    return this.eventosHistory.some(e => e.estado);
  }
}

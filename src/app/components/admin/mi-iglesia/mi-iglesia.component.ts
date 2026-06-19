import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { IglesiaService } from '../../../core/services/iglesia.service';
import { MiembroService } from '../../../core/services/miembro.service';
import { MiembroIglesiaService } from '../../../core/services/miembro-iglesia.service';
import { AuthService } from '../../../core/services/security/auth.service';
import { Iglesia } from '../../../core/models/iglesia.model';
import { Miembro } from '../../../core/models/miembro.model';
import { MiembroIglesia } from '../../../core/models/miembro-iglesia.model';
import { MiembroIglesiaFormTraspasoComponent } from '../miembro-iglesia/modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';
import { MiembroIglesiaDetailComponent } from '../miembro-iglesia/modals/miembro-iglesia-detail/miembro-iglesia-detail.component';
import { MiembroIglesiaFormCrearComponent } from '../miembro-iglesia/modals/miembro-iglesia-form-crear/miembro-iglesia-form.component';
import { MiembroIglesiaCrearMiembroComponent } from './nuevo-miembro-dialog/miembro-iglesia-crear-miembro.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-mi-iglesia',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    ImageUrlPipe
  ],
  templateUrl: './mi-iglesia.component.html',
  styleUrls: ['./mi-iglesia.component.css']
})
export class MiIglesiaComponent implements OnInit {
  displayedColumns: string[] = ['miembro', 'contacto', 'bautismo', 'estado', 'acciones'];
  dataSource: MatTableDataSource<Miembro>;
  
  selectedIglesia?: Iglesia;
  miembrosCount = 0;
  miembroIglesiaRecords: MiembroIglesia[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private authService: AuthService,
    private iglesiaService: IglesiaService,
    private miembroService: MiembroService,
    private miembroIglesiaService: MiembroIglesiaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Miembro>([]);
  }

  ngOnInit() {
    this.initializeIglesiaContext();
    this.setupSortingAccessor();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  initializeIglesiaContext() {
    const activeIglesiaId = this.authService.getCurrentIglesiaId();
    const activeIglesiaNombre = this.authService.getCurrentIglesiaNombre() || '';

    if (activeIglesiaId) {
      this.selectedIglesia = {
        id: activeIglesiaId,
        nombre: activeIglesiaNombre,
        estado: true,
        direccion: '',
        telefono: 0,
        fechaFundacion: new Date()
      };
      
      // Intentamos cargar la dirección de la base de datos si es necesario
      this.iglesiaService.getIglesiaById(activeIglesiaId).subscribe({
        next: (response) => {
          if (response && response.datos) {
            this.selectedIglesia = response.datos;
          }
          this.loadMiembros();
        },
        error: () => {
          this.loadMiembros();
        }
      });
    } else {
      this.snackBar.open('No se ha detectado una iglesia activa en la sesión.', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  loadMiembros() {
    this.miembroIglesiaService.getMisMiembros().subscribe(response => {
      const miembros = response.datos || [];
      miembros.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      this.dataSource.data = miembros;
      this.miembrosCount = miembros.length;
    });

    // Cargar los registros de asignación para la lógica de eliminación/desvinculación
    if (this.selectedIglesia && this.selectedIglesia.id) {
      const currentIglesiaId = this.selectedIglesia.id;
      this.miembroIglesiaService.getMiembrosIglesia().subscribe(response => {
        this.miembroIglesiaRecords = response.datos.filter(mi => mi.iglesiaId === currentIglesiaId && mi.estado);
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addNewMiembro() {
    if (this.selectedIglesia) {
      const dialogRef = this.dialog.open(MiembroIglesiaCrearMiembroComponent, {
        width: '750px',
        data: { iglesia: this.selectedIglesia }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadMiembros();
        }
      });
    }
  }

  hasCargo(miembro: Miembro): boolean {
    return !!miembro.cargoNombre && miembro.cargoNombre.trim().length > 0;
  }

  deleteMiembroAsignacion(miembro: Miembro) {
    if (this.hasCargo(miembro)) {
      this.snackBar.open('No se puede desvincular a un miembro con cargo activo desde esta vista.', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    const record = this.miembroIglesiaRecords.find(mi => mi.miembroId === miembro.id);
    if (!record || !record.id) {
      this.snackBar.open('No se encontró la asignación del miembro', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Está seguro que desea eliminar la asignación?',
        message: `Está a punto de eliminar al miembro <strong>${miembro.nombre} ${miembro.apellido}</strong> de la iglesia <strong>${this.selectedIglesia?.nombre}</strong>.`,
        confirmText: 'Eliminar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.miembroIglesiaService.deleteMiembroIglesia(record.id!).subscribe({
          next: () => {
            this.snackBar.open('Miembro eliminado de la iglesia exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadMiembros();
          },
          error: (err) => {
            const mensajeError = err.error?.message || "Error al eliminar al miembro de la iglesia";
            this.snackBar.open(mensajeError, 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  openMiembroIglesiaDetail(miembro: Miembro) {
    if (this.selectedIglesia) {
      this.dialog.open(MiembroIglesiaDetailComponent, {
        width: '800px',
        data: { miembro, iglesia: this.selectedIglesia }
      });
    }
  }

  openTraspasoDialog(miembro: Miembro) {
    if (this.hasCargo(miembro)) {
      this.snackBar.open('No se puede iniciar el traspaso de un miembro con cargo activo desde esta vista.', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (this.selectedIglesia) {
      const dialogRef = this.dialog.open(MiembroIglesiaFormTraspasoComponent, {
        width: '600px',
        data: { miembro, iglesia: this.selectedIglesia }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadMiembros();
          this.snackBar.open('Traspaso registrado exitosamente', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  exportToExcel() {
    if (!this.selectedIglesia || !this.dataSource.data.length) return;

    const data = this.dataSource.data.map(m => ({
      'Nombre': m.nombre,
      'Apellido': m.apellido,
      'CI': m.ci,
      'Celular': m.celular,
      'Dirección': m.direccion,
      'Fecha Conversión': m.fechaConvercion ? new Date(m.fechaConvercion).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Miembros');
    XLSX.writeFile(wb, `miembros_${this.selectedIglesia.nombre}.xlsx`);
  }

  generatePDF() {
    if (!this.selectedIglesia || !this.dataSource.data.length) return;

    try {
      const doc = new jsPDF();
      const tableColumn = ['Nombre', 'Apellido', 'CI', 'Celular', 'Dirección', 'Fecha Conversión'];
      const tableRows = this.dataSource.data.map(m => [
        m.nombre || '',
        m.apellido || '',
        m.ci || '',
        m.celular || '',
        m.direccion || '',
        m.fechaConvercion ? new Date(m.fechaConvercion).toLocaleDateString() : ''
      ]);

      doc.text(`Lista de Miembros - ${this.selectedIglesia.nombre}`, 14, 15);
      doc.text(`Total Miembros: ${this.miembrosCount}`, 14, 23);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30
      });

      doc.save(`miembros_${this.selectedIglesia.nombre}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      this.snackBar.open('Error al generar el PDF.', 'Cerrar', { duration: 3000 });
    }
  }

  setupSortingAccessor() {
    this.dataSource.sortingDataAccessor = (item: Miembro, property: string) => {
      switch (property) {
        case 'miembro':
          return (item.nombre || '').toLowerCase() + ' ' + (item.apellido || '').toLowerCase();
        case 'contacto':
          return item.celular || '';
        case 'bautismo':
          return item.fechaConvercion ? new Date(item.fechaConvercion).getTime() : 0;
        case 'estado':
          return item.estado ? 'activo' : 'inactivo';
        default:
          return (item as any)[property];
      }
    };
  }

  getAge(fechaNac: Date | string | null | undefined): string {
    if (!fechaNac) return 'Edad desconocida';
    const birth = new Date(fechaNac);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
}

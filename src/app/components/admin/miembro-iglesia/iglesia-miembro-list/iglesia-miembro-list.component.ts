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
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { MiembroService } from '../../../../core/services/miembro.service';
import { MiembroIglesiaService } from '../../../../core/services/miembro-iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { Miembro } from '../../../../core/models/miembro.model';
import { MiembroIglesia } from '../../../../core/models/miembro-iglesia.model';
import {
  MiembroIglesiaFormTraspasoComponent
} from '../modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';
import { MiembroIglesiaDetailComponent } from '../modals/miembro-iglesia-detail/miembro-iglesia-detail.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import * as XLSX from 'xlsx';
import autoTable, { RowInput } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import { MiembroIglesiaFormCrearComponent } from '../modals/miembro-iglesia-form-crear/miembro-iglesia-form.component';

@Component({
  selector: 'app-iglesia-miembro-list',
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
    MatSnackBarModule
  ],
  templateUrl: './iglesia-miembro-list.component.html',
  styleUrls: ['./iglesia-miembro-list.component.css']
})
export class IglesiaMiembroListComponent implements OnInit {


  iglesiaColumns: string[] = ['nombre', 'direccion', 'acciones'];
  miembroColumns: string[] = ['nombre', 'apellido', 'fechaConvercion', 'acciones'];

  iglesiasDataSource: MatTableDataSource<Iglesia>;
  miembrosDataSource: MatTableDataSource<Miembro>;

  selectedIglesia?: Iglesia;
  miembrosCount = 0;

  selectedRowIndex: number | null = null; //numero de la fila seleccionada


  @ViewChild('iglesiaPaginator') iglesiaPaginator!: MatPaginator;
  @ViewChild('miembroPaginator') miembroPaginator!: MatPaginator;
  @ViewChild('iglesiaSort') iglesiaSort!: MatSort;
  @ViewChild('miembroSort') miembroSort!: MatSort;

  constructor(
    private iglesiaService: IglesiaService,
    private miembroService: MiembroService,
    private miembroIglesiaService: MiembroIglesiaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.iglesiasDataSource = new MatTableDataSource<Iglesia>([]);
    this.miembrosDataSource = new MatTableDataSource<Miembro>([]);
  }

  ngOnInit() {
    this.loadIglesias();
    this.loadStoredPaginationSettings();
  }

  ngAfterViewInit() {
    this.iglesiasDataSource.paginator = this.iglesiaPaginator;
    this.iglesiasDataSource.sort = this.iglesiaSort;
    this.miembrosDataSource.paginator = this.miembroPaginator;
    this.miembrosDataSource.sort = this.miembroSort;
  }

  loadStoredPaginationSettings() {
    const iglesiaPageSize = localStorage.getItem('iglesiaPageSize');
    const miembroPageSize = localStorage.getItem('miembroPageSize');

    if (iglesiaPageSize) {
      this.iglesiaPaginator.pageSize = parseInt(iglesiaPageSize, 10);
    }
    if (miembroPageSize) {
      this.miembroPaginator.pageSize = parseInt(miembroPageSize, 10);
    }
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(response => {
      this.iglesiasDataSource.data = response.datos;
    });
  }

  loadMiembros(iglesia: Iglesia) {
    this.selectedIglesia = iglesia;
    this.miembroIglesiaService.getMiembrosIglesia().subscribe(response => {
      const miembroIds = response.datos
        .filter(mi => mi.iglesiaId === iglesia.id && mi.estado)
        .map(mi => mi.miembroId);

      this.miembroService.getMiembros().subscribe(miembrosResponse => {
        const miembros = miembrosResponse.datos.filter(m =>
          miembroIds.includes(m.id!)
        );
        this.miembrosDataSource.data = miembros;
        this.miembrosCount = miembros.length;

      });
    });
  }


  addNewMiembro(iglesia: Iglesia) {
    if (iglesia) {
      this.miembroIglesiaService.addNewMiembro(iglesia);
      const dialogRef = this.dialog.open(MiembroIglesiaFormCrearComponent, {
        width: '600px',
        data: { iglesia }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Si el modal se cerró y el valor es `true`, actualiza la vista
          this.loadMiembros(iglesia);
        }
      });
    }
  }

  applyIglesiaFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.iglesiasDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyMiembroFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.miembrosDataSource.filter = filterValue.trim().toLowerCase();
  }

  onPageSizeChange() {
    localStorage.setItem('iglesiaPageSize', this.iglesiaPaginator.pageSize.toString());
    localStorage.setItem('miembroPageSize', this.miembroPaginator.pageSize.toString());
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
    if (this.selectedIglesia) {
      const dialogRef = this.dialog.open(MiembroIglesiaFormTraspasoComponent, {
        width: '600px',
        data: { miembro, iglesia: this.selectedIglesia }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadMiembros(this.selectedIglesia!);
          this.snackBar.open('Traspaso registrado exitosamente', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  exportToExcel() {
    // Implementation for Excel export
    if (!this.selectedIglesia || !this.miembrosDataSource.data.length) return;

    const data = this.miembrosDataSource.data.map(m => ({
      'Nombre': m.personaDto?.nombre,
      'Apellido': m.personaDto?.apellido,
      'CI': m.personaDto?.ci,
      'Celular': m.personaDto?.celular,
      'Dirección': m.personaDto?.direccion,
      'Fecha Conversión': new Date(m.fechaConvercion!).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Miembros');
    XLSX.writeFile(wb, `miembros_${this.selectedIglesia.nombre}.xlsx`);
  }

  generatePDF2() {
    // Implementation for PDF generation
    if (!this.selectedIglesia || !this.miembrosDataSource.data.length) return;

    const doc = new jsPDF();
    const tableColumn = ['Nombre', 'Apellido', 'CI', 'Celular', 'Dirección', 'Fecha Conversión'];


    const tableRows = this.miembrosDataSource.data.map(m => [
      m.personaDto?.nombre,
      m.personaDto?.apellido,
      m.personaDto?.ci,
      m.personaDto?.celular,
      m.personaDto?.direccion,
      new Date(m.fechaConvercion!).toLocaleDateString()
    ]);

    doc.text(`Lista de Miembros - ${this.selectedIglesia.nombre}`, 14, 15);
    doc.text(`Total Miembros: ${this.miembrosCount}`, 14, 25);

    autoTable(doc, {
      head: [tableColumn],
      // body: tableRows,
      startY: 35
    });

    doc.save(`miembros_${this.selectedIglesia.nombre}.pdf`);
  }

  generatePDF() {
    if (!this.selectedIglesia || !this.miembrosDataSource.data.length) return;

    try {
      if (typeof jsPDF === 'undefined' || typeof autoTable === 'undefined') {
        console.error('jsPDF or autoTable library is missing');
        return;
      }

      const doc = new jsPDF();
      const tableColumn = ['Nombre', 'Apellido', 'CI', 'Celular', 'Dirección', 'Fecha Conversión'];

      const fechaActual = new Date();
      const hora = fechaActual.toLocaleTimeString();  // Hora actual en formato local
      const fecha = fechaActual.toLocaleDateString();


      // Asegurarse de que no haya valores undefined en tableRows
      const tableRows: RowInput[] = this.miembrosDataSource.data.map(m => [
        m.personaDto?.nombre || '',    // Si es undefined, se reemplaza con ''
        m.personaDto?.apellido || '',
        m.personaDto?.ci || '',
        m.personaDto?.celular || '',
        m.personaDto?.direccion || '',
        m.fechaConvercion ? new Date(m.fechaConvercion).toLocaleDateString() : 'N/A'
      ]);

      doc.setFontSize(18);
      doc.text(`Movimiento Cristiano Misionero Maranatha`, 14, 17);
      doc.setFontSize(16)
      doc.text(`Lista de Miembros de la Iglesia - ${this.selectedIglesia.nombre}`, 14, 26);
      doc.setFontSize(12);
      doc.text(`Total Miembros: ${this.miembrosCount}`, 14, 34);
      doc.setFontSize(8);
      doc.text(`Fecha: ${fecha} Hora: ${hora}`, 150, 34);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 35 }
      });

      doc.save(`miembros_${this.selectedIglesia.nombre}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }

}

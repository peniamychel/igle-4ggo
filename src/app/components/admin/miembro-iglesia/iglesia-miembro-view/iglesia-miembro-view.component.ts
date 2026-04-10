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
import { MiembroIglesiaFormTraspasoComponent } from '../modals/miembro-iglesia-form-traspaso/miembro-iglesia-form.component';
import { MiembroIglesiaDetailComponent } from '../modals/miembro-iglesia-detail/miembro-iglesia-detail.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-iglesia-miembro-view',
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
  templateUrl: './iglesia-miembro-view.component.html',
  styleUrls: ['./iglesia-miembro-view.component.css']
})
export class IglesiaMiembroViewComponent implements OnInit {
  iglesiaColumns: string[] = ['nombre', 'direccion', 'acciones'];
  miembroColumns: string[] = ['nombre', 'apellido', 'fechaConvercion', 'acciones'];

  iglesiaDataSource: MatTableDataSource<Iglesia>;
  miembroDataSource: MatTableDataSource<Miembro>;

  selectedIglesia?: Iglesia;
  miembrosCount = 0;

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
    this.iglesiaDataSource = new MatTableDataSource<Iglesia>([]);
    this.miembroDataSource = new MatTableDataSource<Miembro>([]);
    this.loadPageSize();
  }

  ngOnInit() {
    this.loadIglesias();
  }

  ngAfterViewInit() {
    this.iglesiaDataSource.paginator = this.iglesiaPaginator;
    this.iglesiaDataSource.sort = this.iglesiaSort;
    this.miembroDataSource.paginator = this.miembroPaginator;
    this.miembroDataSource.sort = this.miembroSort;
  }

  loadPageSize() {
    const savedSize = localStorage.getItem('tablePageSize');
    if (savedSize) {
      this.iglesiaPaginator.pageSize = parseInt(savedSize, 10);
      this.miembroPaginator.pageSize = parseInt(savedSize, 10);
    }
  }

  savePageSize(event: any) {
    localStorage.setItem('tablePageSize', event.pageSize.toString());
  }

  loadIglesias() {
    this.iglesiaService.getIglesias().subscribe(response => {
      this.iglesiaDataSource.data = response.datos;
    });
  }

  loadMiembros(iglesia: Iglesia) {
    this.selectedIglesia = iglesia;
    this.miembroIglesiaService.getMiembrosIglesia().subscribe(response => {
      const miembroIds = response.datos
        .filter(mi => mi.iglesiaId === iglesia.id && mi.estado)
        .map(mi => mi.miembroId);

      this.miembroService.getMiembros().subscribe(miembrosResponse => {
        const miembros = miembrosResponse.datos.filter(m => miembroIds.includes(m.id!));
        this.miembroDataSource.data = miembros;
        this.miembrosCount = miembros.length;
      });
    });
  }

  applyIglesiaFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.iglesiaDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyMiembroFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.miembroDataSource.filter = filterValue.trim().toLowerCase();
  }

  openMiembroIglesiaDetail(miembro: Miembro) {
    this.dialog.open(MiembroIglesiaDetailComponent, {
      width: '800px',
      data: { miembro, iglesia: this.selectedIglesia }
    });
  }

  openTraspasoDialog(miembro: Miembro) {
    if (!this.selectedIglesia) return;

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

  exportToExcel() {
    if (!this.selectedIglesia || !this.miembroDataSource.data.length) return;

    const data = this.miembroDataSource.data.map(m => ({
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

  generatePDF() {
    if (!this.selectedIglesia || !this.miembroDataSource.data.length) return;

    const doc = new jsPDF();
    const tableColumn = ['Nombre', 'Apellido', 'CI', 'Celular', 'Dirección', 'Fecha Conversión'];
    const tableRows = this.miembroDataSource.data.map(m => [
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
      body: tableRows,
      startY: 35
    });

    doc.save(`miembros_${this.selectedIglesia.nombre}.pdf`);
  }
}

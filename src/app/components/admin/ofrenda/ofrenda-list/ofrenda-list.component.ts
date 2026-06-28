import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Ofrenda, OfrendaResumen } from '../../../../core/models/ofrenda.model';
import { OfrendaService } from '../../../../core/services/ofrenda.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { OfrendaFormComponent } from '../ofrenda-form/ofrenda-form.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/security/auth.service';

@Component({
  selector: 'app-ofrenda-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './ofrenda-list.component.html',
  styleUrls: ['./ofrenda-list.component.css']
})
export class OfrendaListComponent implements OnInit {
  displayedColumns: string[] = ['fechaRecaudacion', 'conceptoDetalle', 'iglesiaNombre', 'tipoMovimiento', 'monto', 'usuarioTesoreroUsername', 'acciones'];
  dataSource: MatTableDataSource<Ofrenda>;

  startDate: string = '';
  endDate: string = '';
  selectedIglesiaId: number | null = null;
  iglesias: Iglesia[] = [];
  isAdmin: boolean = false;

  resumen: OfrendaResumen = { ingresos: 0, egresos: 0, neto: 0 };
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private ofrendaService: OfrendaService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Ofrenda>([]);
    
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(now);
  }

  ngOnInit() {
    this.checkUserRole();
    this.loadIglesias();
    this.loadOfrendas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  checkUserRole() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
  }

  loadIglesias() {
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = Array.isArray(res.datos) ? res.datos : [];
      });
    }
  }

  loadOfrendas() {
    this.ofrendaService.getOfrendasByPeriod(this.startDate, this.endDate).subscribe(res => {
      let data = Array.isArray(res.datos) ? res.datos : [];
      
      // If admin selected a specific church, filter on client side for list
      if (this.isAdmin && this.selectedIglesiaId !== null) {
        data = data.filter(o => o.iglesiaId === this.selectedIglesiaId);
      }

      this.dataSource.data = data;
      this.calculateResumen();
    });
  }

  calculateResumen() {
    const iglesiaParam = (this.isAdmin && this.selectedIglesiaId) ? this.selectedIglesiaId : undefined;
    this.ofrendaService.getResumenPeriodo(this.startDate, this.endDate, iglesiaParam).subscribe(res => {
      if (res.datos) {
        this.resumen = res.datos;
      }
    });
  }

  applyFilters() {
    this.loadOfrendas();
  }

  onSearchChange(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.dataSource.filter = query.trim().toLowerCase();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(OfrendaFormComponent, {
      width: '450px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOfrendas();
        this.snackBar.open('Ofrenda registrada con éxito.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(ofrenda: Ofrenda) {
    const dialogRef = this.dialog.open(OfrendaFormComponent, {
      width: '450px',
      data: { mode: 'edit', ofrenda }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOfrendas();
        this.snackBar.open('Registro de ofrenda actualizado.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteOfrenda(ofrenda: Ofrenda) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar el registro de ${ofrenda.tipoMovimiento} por el monto de Bs. ${ofrenda.monto}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ofrendaService.deleteOfrenda(ofrenda.id!).subscribe(() => {
          this.loadOfrendas();
          this.snackBar.open('Registro eliminado exitosamente.', 'Cerrar', { duration: 3000 });
        });
      }
    });
  }
}

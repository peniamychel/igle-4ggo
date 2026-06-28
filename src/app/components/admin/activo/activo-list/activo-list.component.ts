import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Activo } from '../../../../core/models/activo.model';
import { ActivoService } from '../../../../core/services/activo.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { AuthService } from '../../../../core/services/security/auth.service';
import { ActivoFormComponent } from '../activo-form/activo-form.component';

@Component({
  selector: 'app-activo-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './activo-list.component.html',
  styleUrls: ['./activo-list.component.css']
})
export class ActivoListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'descripcion', 'cantidad', 'estadoConservacion', 'valorEstimado', 'fechaAdquisicion', 'iglesiaNombre', 'acciones'];
  dataSource = new MatTableDataSource<Activo>([]);
  iglesias: Iglesia[] = [];
  selectedIglesiaId: string = 'all';
  isAdmin: boolean = false;
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private activoService: ActivoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.loadActivos();
    this.loadIglesias();
    this.setupFilter();
  }

  setupFilter() {
    this.dataSource.filterPredicate = (data: Activo, filter: string) => {
      const textQuery = this.searchText.trim().toLowerCase();
      const matchesText = !textQuery || (
        (data.nombre || '') + ' ' + (data.descripcion || '')
      ).toLowerCase().includes(textQuery);

      const matchesIglesia = this.selectedIglesiaId === 'all' || 
        data.iglesiaId?.toString() === this.selectedIglesiaId;

      return matchesText && matchesIglesia;
    };
  }

  loadActivos() {
    if (this.isAdmin) {
      this.activoService.getActivos().subscribe(res => {
        this.dataSource.data = Array.isArray(res.datos) ? res.datos : [];
        this.applyFilters();
      });
    } else {
      const iglesiaId = this.authService.getCurrentIglesiaId();
      if (iglesiaId) {
        this.activoService.getActivosByIglesia(iglesiaId).subscribe(res => {
          this.dataSource.data = Array.isArray(res.datos) ? res.datos : [];
          this.applyFilters();
        });
      }
    }
  }

  loadIglesias() {
    if (this.isAdmin) {
      this.iglesiaService.getIglesias().subscribe(res => {
        this.iglesias = Array.isArray(res.datos) ? res.datos.filter(ig => ig.estado) : [];
      });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilters() {
    this.dataSource.filter = '' + Math.random();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;
    this.applyFilters();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ActivoFormComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActivos();
        this.snackBar.open('Activo registrado exitosamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(activo: Activo) {
    const dialogRef = this.dialog.open(ActivoFormComponent, {
      width: '500px',
      data: { mode: 'edit', activo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActivos();
        this.snackBar.open('Activo actualizado exitosamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteActivo(activo: Activo) {
    if (activo.id && confirm(`¿Está seguro que desea eliminar el activo "${activo.nombre}"?`)) {
      this.activoService.deleteActivo(activo.id).subscribe(() => {
        this.loadActivos();
        this.snackBar.open('Activo eliminado exitosamente.', 'Cerrar', { duration: 3000 });
      });
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

import { AfterViewInit, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../core/models/user.model';
import { CreateUserDialogComponent } from '../create-user-dialog/create-user-dialog.component';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';
import { ViewUserDialogComponent } from '../view-user-dialog/view-user-dialog.component';
import { RolesPipe } from '../../../../core/pipes/roles.pipe';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    RolesPipe,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.css']
})
export class UserTableComponent implements OnInit, AfterViewInit {
  allColumns: string[] = ['username', 'name', 'email', 'roles', 'estado', 'actions'];
  displayedColumns: string[] = [...this.allColumns];
  dataSource: MatTableDataSource<User>;
  pageSize = 15;
  pageSizeOptions = [5, 10, 15, 25, 100];
  isSmallScreen = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<User>;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<User>([]);
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const width = window.innerWidth;
    this.isSmallScreen = width < window.outerWidth * 0.5;
    this.updateDisplayedColumns();
  }

  private updateDisplayedColumns() {
    this.displayedColumns = this.isSmallScreen
      ? this.allColumns.filter(col => col !== 'email' && col !== 'roles')
      : this.allColumns;
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadPageSize();

    // Configurar el ordenamiento personalizado
    this.dataSource.sortingDataAccessor = (item: User, property: string) => {
      switch (property) {
        case 'name':
          return `${item.name || ''} ${item.apellidos || ''}`.toLowerCase();
        case 'roles':
          return item.roles.map(role => role.name).join(', ').toLowerCase();
        default:
          return (item as any)[property];
      }
    };

    // Configurar el filtrado personalizado
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchStr = filter.toLowerCase();
      return data.username.toLowerCase().includes(searchStr) ||
        data.email.toLowerCase().includes(searchStr) ||
        (data.name?.toLowerCase() || '').includes(searchStr) ||
        (data.apellidos?.toLowerCase() || '').includes(searchStr) ||
        data.roles.map(role => role.name.toLowerCase()).join(' ').includes(searchStr);
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.dataSource.data = response.datos;
      },
      error: (error) => {
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openViewDialog(user: User): void {
    this.dialog.open(ViewUserDialogComponent, {
      width: '500px',
      data: user
    });
  }

  toggleUserStatus(user: User): void {
    user.estado = !user.estado;
    // Actualizar la vista de la tabla
    this.dataSource.data = [...this.dataSource.data];
  }

  savePageSize(pageSize: number): void {
    localStorage.setItem('userTablePageSize', pageSize.toString());
  }

  private loadPageSize(): void {
    const savedPageSize = localStorage.getItem('userTablePageSize');
    if (savedPageSize) {
      this.pageSize = parseInt(savedPageSize, 10);
    }
  }
}

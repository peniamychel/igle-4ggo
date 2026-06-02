import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
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
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
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
    MatTooltipModule,
    ImageUrlPipe
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.css']
})
export class UserTableComponent implements OnInit, AfterViewInit {
  allColumns: string[] = ['name', 'roles', 'estado', 'actions'];
  displayedColumns: string[] = [...this.allColumns];
  dataSource: MatTableDataSource<User>;
  pagedData: User[] = [];
  pageSize = 15;
  pageSizeOptions = [5, 10, 15, 25, 100];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<User>;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<User>([]);
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
    this.updatePagedData();
    this.paginator.page.subscribe(() => this.updatePagedData());
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchStr = filter.toLowerCase();
      return data.username.toLowerCase().includes(searchStr) ||
        data.email.toLowerCase().includes(searchStr) ||
        (data.name?.toLowerCase() || '').includes(searchStr) ||
        (data.apellidos?.toLowerCase() || '').includes(searchStr) ||
        data.roles.map(role => role.name.toLowerCase()).join(' ').includes(searchStr);
    };
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        const data = [...response.datos];
        data.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.dataSource.data = data;
        this.updatePagedData();
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
    this.updatePagedData();
  }

  onPageChanged(): void {
    this.updatePagedData();
  }

  private updatePagedData(): void {
    const filtered = this.dataSource.filteredData;
    const pageIndex = this.paginator?.pageIndex || 0;
    const size = this.paginator?.pageSize || this.pageSize;
    const start = pageIndex * size;
    this.pagedData = filtered.slice(start, start + size);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'dialog-fullscreen-mobile'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openViewDialog(user: User): void {
    this.dialog.open(ViewUserDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'dialog-fullscreen-mobile'
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

  // Devuelve las iniciales del nombre de usuario
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Genera un color armónico basado en el nombre
  getAvatarColor(name: string): string {
    const colors = [
      '#7c4dff', '#00bfa5', '#ff6d00', '#2979ff',
      '#d500f9', '#00c853', '#ff3d00', '#651fff',
      '#1de9b6', '#f50057', '#304ffe', '#00b0ff'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}

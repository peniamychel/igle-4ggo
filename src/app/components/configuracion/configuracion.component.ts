import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuditTrailComponent } from './audit-trail/audit-trail.component';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/security/auth.service';
import { IglesiaService } from '../../core/services/iglesia.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IglesiaEditComponent } from '../admin/iglesia/iglesia-edit/iglesia-edit.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    AuditTrailComponent,
    ImageUrlPipe
  ],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private iglesiaService = inject(IglesiaService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  isDarkMode = this.themeService.isDarkMode;
  selectedTabIndex = 2; // Pestaña de Bitácora activa por defecto

  isPastor = false;
  iglesiaPastor: any = null;
  loadingIglesia = false;

  ngOnInit() {
    this.isPastor = localStorage.getItem('role') === 'ROLE_PASTOR';
    if (this.isPastor) {
      this.selectedTabIndex = 0; // Default to first tab for pastor
      this.loadPastorChurch();
    }
  }

  loadPastorChurch() {
    const iglesiaId = this.authService.getCurrentIglesiaId();
    if (iglesiaId) {
      this.loadingIglesia = true;
      this.iglesiaService.getIglesiaById(iglesiaId).subscribe({
        next: (res) => {
          this.iglesiaPastor = res.datos;
          this.loadingIglesia = false;
        },
        error: (err) => {
          console.error('Error loading pastor church details', err);
          this.loadingIglesia = false;
        }
      });
    }
  }

  openEditPastorChurch() {
    if (!this.iglesiaPastor) return;

    const dialogRef = this.dialog.open(IglesiaEditComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'dialog-fullscreen-mobile',
      data: this.iglesiaPastor
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPastorChurch();
        this.snackBar.open(`Datos de iglesia actualizados exitosamente`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  setTheme(dark: boolean): void {
    this.themeService.setTheme(dark);
  }
}

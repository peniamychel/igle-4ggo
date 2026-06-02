import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuditTrailComponent } from './audit-trail/audit-trail.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    AuditTrailComponent
  ],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent {
  private themeService = inject(ThemeService);
  
  isDarkMode = this.themeService.isDarkMode;
  selectedTabIndex = 2; // Pestaña de Bitácora activa por defecto

  setTheme(dark: boolean): void {
    this.themeService.setTheme(dark);
  }
}

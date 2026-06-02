import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SidenavComponent} from './shared/sidenav/sidenav.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidenavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'igle-4';
  private themeService = inject(ThemeService); // Inicializa el tema automáticamente
}

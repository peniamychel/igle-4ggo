import { Component, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {PersonaService} from '../../core/services/persona.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: true,
  imports: [
    AsyncPipe,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ]
})
export class DashboardComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private http = inject(HttpClient);
  private personaService = inject(PersonaService)

  constructor() {
  }

  users$ = this.personaService.getPersonas();
  //users$ = this.http.get<UsuarioResponse>(this.apiUrl);

  totalUsers$ = this.users$.pipe(
    map(response => response.datos.length)
  );

  activeUsers$ = this.users$.pipe(
    map(response => response.datos.filter(u => u.estado).length)
  );

  // admins$ = this.users$.pipe(
  //   map(response => response.datos.filter(u => u.roles.some(r => r.name === 'ADMIN')).length)
  // );
  //
  // tesoreros$ = this.users$.pipe(
  //   map(response => response.datos.filter(u => u.roles.some(r => r.name === 'TESORERO')).length)
  // );

  /** Basado en el tamaño de pantalla, cambia de layout estándar a una columna por fila */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Total Usuarios', cols: 1, rows: 1 },
          { title: 'Usuarios Activos', cols: 1, rows: 1 },
          { title: 'Administradores', cols: 1, rows: 1 },
          { title: 'Tesoreros', cols: 1, rows: 1 }
        ];
      }

      return [
        { title: 'Total Usuarios', cols: 2, rows: 1 },
        { title: 'Usuarios Activos', cols: 1, rows: 1 },
        { title: 'Administradores', cols: 1, rows: 2 },
        { title: 'Tesoreros', cols: 1, rows: 1 }
      ];
    })
  );
}

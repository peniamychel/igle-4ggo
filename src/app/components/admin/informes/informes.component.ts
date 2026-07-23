import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { InformeMiembrosComponent } from './informe-miembros/informe-miembros.component';
import { InformeOfrendasComponent } from './informe-ofrendas/informe-ofrendas.component';
import { InformeEventosComponent } from './informe-eventos/informe-eventos.component';
import { InformeInventarioComponent } from './informe-inventario/informe-inventario.component';
import { InformeCertificadosComponent } from './informe-certificados/informe-certificados.component';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    InformeMiembrosComponent,
    InformeOfrendasComponent,
    InformeEventosComponent,
    InformeInventarioComponent,
    InformeCertificadosComponent
  ],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent {}

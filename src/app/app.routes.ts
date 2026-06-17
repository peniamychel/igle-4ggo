import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { MiembroListComponent } from './components/admin/miembro/miembro-list/miembro-list.component';
import { IglesiaListComponent } from './components/admin/iglesia/iglesia-list/iglesia-list.component';
import { IglesiaMiembroListComponent } from './components/admin/miembro-iglesia/iglesia-miembro-list/iglesia-miembro-list.component';
import { ChartsComponent } from './components/graficos/charts/charts.component';
import { authGuard } from './core/guards/auth.guard';
import { UserTableComponent } from './components/admin/usuario-sistema/user-table/user-table.component';
import { TipoCargoListComponent } from './components/admin/tipo-cargo/tipo-cargo-list/tipo-cargo-list.component';
import { CargoListComponent } from './components/admin/cargo/cargo-list/cargo-list.component';
import { PrivilegioListComponent } from './components/admin/privilegio/privilegio-list/privilegio-list.component';
import { adminGuard } from './core/guards/admin.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { SidenavComponent } from './shared/sidenav/sidenav.component';
import { privilegioGuard } from './core/guards/privilegio.guard';
import { TipoEventoListComponent } from './components/admin/tipo-evento/tipo-evento-list/tipo-evento-list.component';
import { TipoCertificadoListComponent } from './components/admin/tipo-certificado/tipo-certificado-list/tipo-certificado-list.component';
import { EventoListComponent } from './components/admin/evento/evento-list/evento-list.component';
import { CertificadoListComponent } from './components/admin/certificado/certificado-list/certificado-list.component';
import { ResponsableEventoListComponent } from './components/admin/responsable-evento/responsable-evento-list/responsable-evento-list.component';
import { ParticipacionEventoListComponent } from './components/admin/participacion-evento/participacion-evento-list/participacion-evento-list.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { LoginPageComponent } from './components/auth/login-page/login-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginPageComponent,
    title: 'Iniciar Sesión',
  },
  {
    path: '',
    component: SidenavComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        component: DashboardComponent,
        title: 'Inicio',
      },
      {
        path: 'miembro',
        component: MiembroListComponent,
        title: 'Miembro',
        canActivate: [privilegioGuard]
      },

      {
        path: 'iglesia',
        component: IglesiaListComponent,
        title: 'Iglesia',
        canActivate: [privilegioGuard]
      },
      {
        path: 'miembroiglesia',
        component: IglesiaMiembroListComponent,
        title: 'Iglesia',
        canActivate: [privilegioGuard]
      },
      {
        path: 'graficoiglesias',
        component: ChartsComponent,
        title: 'Grafico',
        canActivate: [privilegioGuard]
      },
      {
        path: 'tipocargo',
        component: TipoCargoListComponent,
        title: 'Tipo Ministerio',
        canActivate: [privilegioGuard]
      },
      {
        path: 'obreros',
        component: CargoListComponent,
        title: 'Obreros',
        canActivate: [privilegioGuard]
      },
      {
        path: 'cargo',
        redirectTo: 'obreros',
        pathMatch: 'full'
      },
      {
        path: 'cambios-iglesia',
        component: DashboardComponent,
        title: 'Cambios Iglesia',
        canActivate: [privilegioGuard]
      },
      {
        path: 'solicitudes',
        component: DashboardComponent,
        title: 'Solicitudes',
        canActivate: [privilegioGuard]
      },
      {
        path: 'tipoevento',
        component: TipoEventoListComponent,
        title: 'Tipos de Evento',
        canActivate: [privilegioGuard]
      },
      {
        path: 'eventos',
        component: EventoListComponent,
        title: 'Eventos',
        canActivate: [privilegioGuard]
      },
      {
        path: 'bautizos',
        component: DashboardComponent,
        title: 'Bautizos',
        canActivate: [privilegioGuard]
      },
      {
        path: 'talleres',
        component: DashboardComponent,
        title: 'Talleres',
        canActivate: [privilegioGuard]
      },
      {
        path: 'tipocertificado',
        component: TipoCertificadoListComponent,
        title: 'Tipos de Certificado',
        canActivate: [privilegioGuard]
      },
      {
        path: 'certificados',
        component: CertificadoListComponent,
        title: 'Certificados',
        canActivate: [privilegioGuard]
      },
      {
        path: 'responsable-evento',
        component: ResponsableEventoListComponent,
        title: 'Responsables de Evento',
        canActivate: [privilegioGuard]
      },
      {
        path: 'participacion-evento',
        component: ParticipacionEventoListComponent,
        title: 'Participaciones de Evento',
        canActivate: [privilegioGuard]
      },
      {
        path: 'ofrendas',
        component: DashboardComponent,
        title: 'Ofrendas',
        canActivate: [privilegioGuard]
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        title: 'Perfil',
      },
      {
        path: 'configuracion',
        component: ConfiguracionComponent,
        title: 'Configuración',
      },
      {
        path: 'privilegios',
        component: PrivilegioListComponent,
        title: 'Privilegios',
        canActivate: [adminGuard]
      },
      {
        path: 'usuariosistema',
        component: UserTableComponent,
        title: 'Usuario Sistema',
        canActivate: [adminGuard]
      },
    ]
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}

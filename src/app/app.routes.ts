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

import { SolicitudListComponent } from './components/admin/miembro-iglesia/solicitud-list/solicitud-list.component';
import { MiIglesiaComponent } from './components/admin/mi-iglesia/mi-iglesia.component';
import { NoAutorizadoComponent } from './components/auth/no-autorizado/no-autorizado.component';

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
        path: 'no-autorizado',
        component: NoAutorizadoComponent,
        title: 'Acceso Restringido',
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
        component: IglesiaMiembroListComponent,
        title: 'Cambios Iglesia',
        canActivate: [privilegioGuard]
      },
      {
        path: 'solicitudes',
        component: SolicitudListComponent,
        title: 'Solicitudes',
        canActivate: [privilegioGuard]
      },
      {
        path: 'mi-iglesia',
        component: MiIglesiaComponent,
        title: 'Mi Iglesia',
        canActivate: [authGuard]
      },
      {
        path: 'eventos',
        component: EventoListComponent,
        title: 'Eventos',
        canActivate: [privilegioGuard]
      },
      {
        path: 'tipoevento',
        redirectTo: 'eventos',
        pathMatch: 'full'
      },
      {
        path: 'bautizos',
        redirectTo: 'eventos',
        pathMatch: 'full'
      },
      {
        path: 'talleres',
        redirectTo: 'eventos',
        pathMatch: 'full'
      },
      {
        path: 'responsable-evento',
        redirectTo: 'eventos',
        pathMatch: 'full'
      },
      {
        path: 'participacion-evento',
        redirectTo: 'eventos',
        pathMatch: 'full'
      },
      {
        path: 'certificados',
        component: CertificadoListComponent,
        title: 'Certificados',
        canActivate: [privilegioGuard]
      },
      {
        path: 'tipocertificado',
        redirectTo: 'certificados',
        pathMatch: 'full'
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
        redirectTo: 'usuariosistema',
        pathMatch: 'full'
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

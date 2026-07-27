import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { MiembroListComponent } from './components/admin/miembro/miembro-list/miembro-list.component';
import { IglesiaListComponent } from './components/admin/iglesia/iglesia-list/iglesia-list.component';
import { IglesiaMiembroListComponent } from './components/admin/miembro-iglesia/iglesia-miembro-list/iglesia-miembro-list.component';
import { authGuard } from './core/guards/auth.guard';
import { UserTableComponent } from './components/admin/usuario-sistema/user-table/user-table.component';
import { TipoCargoListComponent } from './components/admin/tipo-cargo/tipo-cargo-list/tipo-cargo-list.component';
import { CargoListComponent } from './components/admin/cargo/cargo-list/cargo-list.component';
import { PrivilegioListComponent } from './components/admin/privilegio/privilegio-list/privilegio-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { SidenavComponent } from './shared/sidenav/sidenav.component';
import { privilegioGuard } from './core/guards/privilegio.guard';
import { TipoEventoListComponent } from './components/admin/tipo-evento/tipo-evento-list/tipo-evento-list.component';
import { EventoListComponent } from './components/admin/evento/evento-list/evento-list.component';
import { CertificadoListComponent } from './components/admin/certificado/certificado-list/certificado-list.component';
import { ResponsableEventoListComponent } from './components/admin/responsable-evento/responsable-evento-list/responsable-evento-list.component';
import { ParticipacionEventoListComponent } from './components/admin/participacion-evento/participacion-evento-list/participacion-evento-list.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { LoginPageComponent } from './components/auth/login-page/login-page.component';

import { MiIglesiaComponent } from './components/admin/mi-iglesia/mi-iglesia.component';
import { NoAutorizadoComponent } from './components/auth/no-autorizado/no-autorizado.component';
import { OfrendaListComponent } from './components/admin/ofrenda/ofrenda-list/ofrenda-list.component';
import { ActivoListComponent } from './components/admin/activo/activo-list/activo-list.component';
import { ColaboradoresComponent } from './components/admin/colaboradores/colaboradores.component';
import { AyudaComponent } from './components/ayuda/ayuda.component';


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
        path: 'mi-iglesia',
        component: MiIglesiaComponent,
        title: 'Mis Miembros',
        canActivate: [privilegioGuard]
      },
      {
        path: 'colaboradores',
        component: ColaboradoresComponent,
        title: 'Colaboradores',
        canActivate: [privilegioGuard]
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
        path: 'ofrendas',
        component: OfrendaListComponent,
        title: 'Ofrendas',
        canActivate: [privilegioGuard]
      },
      {
        path: 'activos',
        component: ActivoListComponent,
        title: 'Inventario',
        canActivate: [privilegioGuard]
      },
      {
        path: 'informes',
        loadComponent: () => import('./components/admin/informes/informes.component').then(m => m.InformesComponent),
        title: 'Informes',
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
        path: 'ayuda',
        component: AyudaComponent,
        title: 'Ayuda',
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
        canActivate: [privilegioGuard]
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

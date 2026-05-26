import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { InicioComponent } from './components/inicio/inicio.component';
import { PersonaListComponent } from './components/admin/persona/persona-list/persona-list.component';
import { MiembroListComponent } from './components/admin/miembro/miembro-list/miembro-list.component';
import { IglesiaListComponent } from './components/admin/iglesia/iglesia-list/iglesia-list.component';
import { IglesiaMiembroListComponent } from './components/admin/miembro-iglesia/iglesia-miembro-list/iglesia-miembro-list.component';
import { ChartsComponent } from './components/graficos/charts/charts.component';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './components/auth/login2/login.component';
import { UserTableComponent } from './components/admin/usuario-sistema/user-table/user-table.component';
import { TipoCargoListComponent } from './components/admin/tipo-cargo/tipo-cargo-list/tipo-cargo-list.component';
import { CargoListComponent } from './components/admin/cargo/cargo-list/cargo-list.component';
import { PrivilegioListComponent } from './components/admin/privilegio/privilegio-list/privilegio-list.component';
import { adminGuard } from './core/guards/admin.guard';
import { encIglesiaGuard } from './core/guards/enc-iglesia.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { SidenavComponent } from './shared/sidenav/sidenav.component';
import { privilegioGuard } from './core/guards/privilegio.guard';

export const routes: Routes = [
  {
    path: '',
    component: SidenavComponent,
    children: [
      {
        path: '',
        component: DashboardComponent,
        title: 'Inicio',
      },
      {
        path: 'miembro',
        component: MiembroListComponent,
        title: 'Mimembro',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'persona',
        component: PersonaListComponent,
        title: 'Persona',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'iglesia',
        component: IglesiaListComponent,
        title: 'Iglesia',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'miembroiglesia',
        component: IglesiaMiembroListComponent,
        title: 'Iglesia',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'graficoiglesias',
        component: ChartsComponent,
        title: 'Grafico',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'tipocargo',
        component: TipoCargoListComponent,
        title: 'Tipo de Cargo',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'cargo',
        component: CargoListComponent,
        title: 'Cargos Miembros',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'pastores',
        component: CargoListComponent,
        title: 'Pastores',
        data: { filterRole: 'pastor' },
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'encargados',
        component: CargoListComponent,
        title: 'Encargados',
        data: { filterRole: 'encargado' },
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'lideres',
        component: CargoListComponent,
        title: 'Líderes',
        data: { filterRole: 'lider' },
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'cambios-iglesia',
        component: DashboardComponent,
        title: 'Cambios Iglesia',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'solicitudes',
        component: DashboardComponent,
        title: 'Solicitudes',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'eventos',
        component: DashboardComponent,
        title: 'Eventos',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'bautizos',
        component: DashboardComponent,
        title: 'Bautizos',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'talleres',
        component: DashboardComponent,
        title: 'Talleres',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'certificados',
        component: DashboardComponent,
        title: 'Certificados',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'ofrendas',
        component: DashboardComponent,
        title: 'Ofrendas',
        canActivate: [authGuard, privilegioGuard]
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        title: 'Perfil',
        canActivate: [authGuard]
      },
      {
        path: 'configuracion',
        component: DashboardComponent,
        title: 'Configuración',
        canActivate: [authGuard]
      },
      {
        path: 'privilegios',
        component: PrivilegioListComponent,
        title: 'Privilegios',
        canActivate: [authGuard, adminGuard]
      },
      {
        path: 'usuariosistema',
        component: UserTableComponent,
        title: 'Usuario Sistema',
        canActivate: [authGuard, adminGuard]
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

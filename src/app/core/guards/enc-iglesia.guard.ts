import { CanActivateFn } from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/security/auth.service';

export const encIglesiaGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  return authService.isAuth() ;
  // return false;
};


// PARA USAR VARIOS GUARDS
// export const multiGuard: CanActivateFn = (route, state) => {
//   const authGuard = inject(AuthGuard);
//   const permisosGuard = inject(PermisosGuard);
//   const extrasGuard = inject(ExtrasGuard);
//
//   const path = route.routeConfig?.path;
//
//   // Definir qué guards deben aplicarse según el path
//   switch (path) {
//     case 'miembro':
//       return authGuard(route, state) && permisosGuard(route, state) && extrasGuard(route, state);
//     case 'persona':
//       return authGuard(route, state);
//     case 'iglesia':
//       return authGuard(route, state) && permisosGuard(route, state);
//     default:
//       return true;
//   }
// };

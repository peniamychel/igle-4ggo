import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/security/auth.service';
import { ROUTE_VIEW_MAP } from '../constants/privilegios.constants';

/**
 * Guard de autorización por privilegio de VISUALIZACIÓN.
 *
 * Usa el mapa único {@link ROUTE_VIEW_MAP} (ruta → `Ver <Entidad>`) en lugar
 * del fuzzy matching anterior. Así menú y guard consultan la misma fuente y
 * nunca se contradicen.
 *
 * Reglas:
 *  1. ADMIN → bypass, acceso total.
 *  2. Ruta no listada en el mapa (p. ej. `/inicio`, `/perfil`) → acceso libre
 *     para autenticados (el `authGuard` de la ruta padre ya validó el token).
 *  3. Ruta listada → exige el privilegio `Ver <Entidad>` correspondiente.
 *     Si el usuario no lo tiene → redirige a `/`.
 */
export const privilegioGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Admin: acceso total.
  if (authService.isLoggedRolAdmin()) {
    return true;
  }

  // 2. Resolver la ruta.
  const path = route.routeConfig?.path;
  if (!path) {
    return true;
  }
  if (path === 'activos') {
    const role = localStorage.getItem('role');
    const isAuthorized = role === 'ROLE_PASTOR' || role === 'ROLE_ENCARGADO_IGLESIA' || role === 'ROLE_DIACONO';
    if (isAuthorized) {
      return true;
    } else {
      router.navigate(['/no-autorizado']);
      return false;
    }
  }

  // Rutas de servicios globales estrictamente reservadas para el Administrador
  const globalRoutes = [
    'miembro',
    'obreros',
    'cargo',
    'iglesia',
    'miembroiglesia',
    'tipocargo',
    'usuariosistema',
    'bitacora'
  ];

  if (globalRoutes.includes(path)) {
    router.navigate(['/no-autorizado']);
    return false;
  }

  // 3. Privilegio requerido para VER la página.
  const requerido = ROUTE_VIEW_MAP[path];
  if (!requerido) {
    // Ruta pública: no requiere privilegio de visualización.
    return true;
  }

  // 4. ¿El usuario lo tiene?
  if (authService.hasPrivilegio(requerido)) {
    return true;
  }

  // 5. Sin privilegio: al inicio.
  router.navigate(['/']);
  return false;
};

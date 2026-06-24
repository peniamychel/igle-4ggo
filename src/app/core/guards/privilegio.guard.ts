import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/security/auth.service';

/**
 * Mapeo explícito ruta → nombre exacto del privilegio en la BD.
 * Usar nombres exactos evita el matching frágil por keywords.
 * Rutas sin entrada en este mapa son accesibles a cualquier usuario autenticado.
 */
const ROUTE_PRIVILEGE_MAP: Record<string, string> = {
  'miembro':           'Gestionar Miembros',
  'iglesia':           'Gestionar Iglesias',
  'miembroiglesia':    'Gestionar MiembroIglesia',
  'cambios-iglesia':   'Gestionar Iglesias',
  'graficoiglesias':   'Gestionar Iglesias',
  'tipocargo':         'Gestionar Obreros',
  'obreros':           'Gestionar Obreros',
  'cargo':             'Gestionar Obreros',
  'solicitudes':       'Gestionar Miembros',
  'eventos':           'Gestionar Eventos',
  'tipoevento':        'Gestionar Eventos',
  'bautizos':          'Gestionar Eventos',
  'talleres':          'Gestionar Eventos',
  'responsable-evento':'Gestionar Eventos',
  'participacion-evento': 'Gestionar Eventos',
  'certificados':      'Gestionar Eventos',
  'tipocertificado':   'Gestionar Eventos',
  'ofrendas':          'Gestionar Ofrendas',
  'privilegios':       'Gestionar Privilegios',
  'usuariosistema':    'Gestionar Usuarios',
};

export const privilegioGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Admins tienen acceso a todo
  if (authService.isLoggedRolAdmin()) {
    return true;
  }

  // Obtener ruta actual
  const path = route.routeConfig?.path;
  if (!path) return true;

  // Si la ruta no requiere privilegio específico, permitir
  const requiredPrivilege = ROUTE_PRIVILEGE_MAP[path];
  if (!requiredPrivilege) return true;

  // Obtener privilegios del usuario desde localStorage
  const storedPrivilegios = localStorage.getItem('privilegios');
  if (!storedPrivilegios) {
    router.navigate(['/no-autorizado']);
    return false;
  }

  let userPrivileges: string[] = [];
  try {
    userPrivileges = JSON.parse(storedPrivilegios);
  } catch (e) {
    router.navigate(['/no-autorizado']);
    return false;
  }

  // Comparación exacta con el privilegio requerido
  const hasPrivilege = userPrivileges.includes(requiredPrivilege);

  if (hasPrivilege) {
    return true;
  } else {
    router.navigate(['/no-autorizado']);
    return false;
  }
};

/**
 * Fuente ÚNICA de verdad para el mapeo ruta ↔ privilegio de visualización.
 *
 * Modelo de privilegios de 2 niveles:
 *   - `Ver <Entidad>`     → deja ENTRAR a la página del módulo (guard + sidenav).
 *   - `Escribir <Entidad>`→ habilita los botones de acción dentro (directiva
 *                           `*appHasPrivilegio` en las plantillas).
 *
 * Los nombres de privilegio DEBEN coincidir EXACTAMENTE con `privilegio.nombre`
 * en la BD (ver `api-iglesia/database/migracion-privilegios.sql`). Si no coinciden
 * (casing, acentos), `hasAuthority` / `includes` fallan silenciosamente.
 *
 * Cualquier ruta nueva con control de privilegio DEBE registrarse acá. Tanto el
 * `privilegioGuard` como el `SidenavComponent` importan este mismo mapa, de modo
 * que menú y guard nunca se contradicen.
 *
 * Rutas NO listadas (p. ej. `/inicio`, `/perfil`, `/configuracion`, `/mi-iglesia`)
 * son públicas para cualquier usuario autenticado y no requieren privilegio.
 */
export const ROUTE_VIEW_MAP: Readonly<Record<string, string>> = {
  // --- Miembros ---
  'miembro':              'Ver Miembros',
  'solicitudes':          'Ver Miembros',
  // --- Iglesias ---
  'iglesia':              'Ver Iglesias',
  'cambios-iglesia':      'Ver MiembroIglesia',
  'graficoiglesias':      'Ver Iglesias',
  // --- MiembroIglesia (membresías) ---
  'miembroiglesia':       'Ver MiembroIglesia',
  // --- Cargos (Obreros) ---
  'cargo':                'Ver Cargos',
  'obreros':              'Ver Cargos',
  'tipocargo':            'Ver Cargos',
  // --- Eventos ---
  'eventos':              'Ver Eventos',
  'tipoevento':           'Ver Eventos',
  'responsable-evento':   'Ver Eventos',
  'participacion-evento': 'Ver Eventos',
  // --- Certificados ---
  'certificados':         'Ver Certificados',
  'tipocertificado':      'Ver Certificados',
  // --- Usuarios ---
  'usuariosistema':       'Ver Usuarios',
  // --- Privilegios ---
  'privilegios':          'Ver Privilegios',
  // --- Ofrendas (módulo futuro, sin backend todavía) ---
  'ofrendas':             'Ver Ofrendas',
};

/**
 * Privilegio requerido para ACCIONES de escritura por ruta de módulo.
 * Se usa como fallback en componentes que conocen su ruta pero no su entidad.
 * Preferir invocar la directiva con el privilegio literal en cada plantilla.
 */
export const ROUTE_WRITE_MAP: Readonly<Record<string, string>> = {
  'miembro':              'Escribir Miembros',
  'solicitudes':          'Escribir MiembroIglesia', // aceptar/rechazar traspasos
  'iglesia':              'Escribir Iglesias',
  'cambios-iglesia':      'Escribir MiembroIglesia',
  'miembroiglesia':       'Escribir MiembroIglesia',
  'cargo':                'Escribir Cargos',
  'obreros':              'Escribir Cargos',
  'tipocargo':            'Escribir Cargos',
  'eventos':              'Escribir Eventos',
  'tipoevento':           'Escribir Eventos',
  'responsable-evento':   'Escribir Eventos',
  'participacion-evento': 'Escribir Eventos',
  'certificados':         'Escribir Certificados',
  'tipocertificado':      'Escribir Certificados',
  'usuariosistema':       'Escribir Usuarios',
  'privilegios':          'Escribir Privilegios',
  'ofrendas':             'Escribir Ofrendas',
};

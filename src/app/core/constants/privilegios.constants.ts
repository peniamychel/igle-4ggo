/**
 * Fuente ÚNICA de verdad para el mapeo de ruta a la autoridad del SERVICIO.
 *
 * Modelo SERVICIO:ACCION:
 *   - `SERVICIO:VER` → permite navegar a la ruta del módulo (guard + sidenav).
 *   - `SERVICIO:<ACCION>` → autoriza acciones específicas de escritura o gestión.
 */
export const ROUTE_VIEW_MAP: Readonly<Record<string, string>> = {
  // --- Miembros ---
  'miembro':              'MIEMBROS:VER',
  'mi-iglesia':           'MIEMBROS:VER',
  'solicitudes':          'MIEMBROS:VER',
  // --- Iglesias ---
  'iglesia':              'IGLESIAS:VER',
  'cambios-iglesia':      'IGLESIAS:VER',
  'graficoiglesias':      'IGLESIAS:VER',
  // --- MiembroIglesia (membresías) ---
  'miembroiglesia':       'MIEMBROS:VER',
  // --- Cargos (Obreros) ---
  'cargo':                'OBREROS:VER',
  'obreros':              'OBREROS:VER',
  'colaboradores':        'OBREROS:VER',
  'tipocargo':            'OBREROS:VER',
  // --- Eventos ---
  'eventos':              'EVENTOS:VER',
  'tipoevento':           'EVENTOS:VER',
  'responsable-evento':   'EVENTOS:VER',
  'participacion-evento': 'EVENTOS:VER',
  // --- Certificados ---
  'certificados':         'CERTIFICADOS:VER',
  'tipocertificado':      'CERTIFICADOS:VER',
  // --- Usuarios ---
  'usuariosistema':       'USUARIOS:VER',
  'privilegios':          'USUARIOS:VER',
  'servicios':            'USUARIOS:VER',
  // --- Dashboard & Bitácora ---
  'dashboard':            'DASHBOARD:VER',
  'bitacora':             'BITACORA:VER',
  // --- Ofrendas ---
  'ofrendas':             'OFRENDAS:VER',
};

export const ROUTE_WRITE_MAP: Readonly<Record<string, string>> = {
  'ofrendas':             'OFRENDAS:CREAR',
  'miembro':              'MIEMBROS:EDITAR',
  'mi-iglesia':           'MIEMBROS:EDITAR',
  'solicitudes':          'MIEMBROS:EDITAR',
  'iglesia':              'IGLESIAS:EDITAR',
  'cambios-iglesia':      'IGLESIAS:EDITAR',
  'miembroiglesia':       'MIEMBROS:EDITAR',
  'cargo':                'OBREROS:DESIGNAR',
  'obreros':              'OBREROS:DESIGNAR',
  'colaboradores':        'OBREROS:DESIGNAR',
  'tipocargo':            'OBREROS:EDITAR',
  'eventos':              'EVENTOS:EDITAR',
  'tipoevento':           'EVENTOS:EDITAR',
  'responsable-evento':   'EVENTOS:EDITAR',
  'participacion-evento': 'EVENTOS:EDITAR',
  'certificados':         'CERTIFICADOS:GENERAR',
  'tipocertificado':      'CERTIFICADOS:GENERAR',
  'usuariosistema':       'USUARIOS:EDITAR',
  'privilegios':          'USUARIOS:EDITAR',
  'servicios':            'USUARIOS:EDITAR',
};

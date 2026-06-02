import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface AuditLog {
  id: number;
  usuario: string;
  username: string;
  rol: string;
  accion: 'Acceso' | 'Creación' | 'Modificación' | 'Eliminación' | 'Exportación' | 'Advertencia';
  detalle: string;
  fecha: Date;
  ip: string;
  dispositivo: string;
  estado: 'SUCCESS' | 'WARNING' | 'FAILED';
  metadatos: string; // JSON String for advanced details
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  
  // Datos simulados de alta calidad sobre actividades de gestión de iglesia
  private mockLogs: AuditLog[] = [
    {
      id: 1,
      usuario: 'Mychel Peña',
      username: 'admin',
      rol: 'ADMIN',
      accion: 'Acceso',
      detalle: 'Inicio de sesión exitoso en el sistema',
      fecha: new Date(Date.now() - 1000 * 60 * 8), // hace 8 minutos
      ip: '190.167.45.122',
      dispositivo: 'Chrome (124.0) - Windows 11',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        sesionId: 'sess_9837482910',
        metodoAutenticacion: 'JWT Bearer Token',
        mfaUtilizado: false,
        duracionToken: '8 horas',
        resolucionPantalla: '1920x1080',
        idiomaNavegador: 'es-ES'
      }, null, 2)
    },
    {
      id: 2,
      usuario: 'Mychel Peña',
      username: 'admin',
      rol: 'ADMIN',
      accion: 'Modificación',
      detalle: 'Actualizó los privilegios del rol ENCARGADO_IGLESIA',
      fecha: new Date(Date.now() - 1000 * 60 * 25), // hace 25 minutos
      ip: '190.167.45.122',
      dispositivo: 'Chrome (124.0) - Windows 11',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        moduloModificado: 'Privilegios',
        rolAfectado: 'ENCARGADO_IGLESIA',
        cambios: {
          previos: ['Ver Iglesias', 'Ver Miembros'],
          nuevos: ['Ver Iglesias', 'Ver Miembros', 'Gestionar Miembros', 'Ver Eventos']
        },
        motivo: 'Ajuste de permisos para encargado de sucursal'
      }, null, 2)
    },
    {
      id: 3,
      usuario: 'Juan Carlos Gómez',
      username: 'jc.gomez',
      rol: 'TESORERO',
      accion: 'Creación',
      detalle: 'Registró una nueva ofrenda general - Iglesia Central ($12,500.00 MXN)',
      fecha: new Date(Date.now() - 1000 * 60 * 45), // hace 45 minutos
      ip: '186.6.112.54',
      dispositivo: 'Safari (17.4) - macOS Sonoma',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        categoria: 'Ofrenda Dominical',
        monto: 12500.00,
        moneda: 'MXN',
        metodoPago: 'Efectivo',
        comprobanteAdjunto: false,
        iglesiaId: 1,
        sucursal: 'Templo Central Maranatha'
      }, null, 2)
    },
    {
      id: 4,
      usuario: 'Ana María Restrepo',
      username: 'ana.restrepo',
      rol: 'ENCARGADO_IGLESIA',
      accion: 'Creación',
      detalle: 'Agregó una nueva persona al registro: Samuel David Torres',
      fecha: new Date(Date.now() - 1000 * 60 * 120), // hace 2 horas
      ip: '190.84.152.9',
      dispositivo: 'Firefox (125.0) - Ubuntu Linux',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        nombre: 'Samuel David',
        apellidos: 'Torres Ruiz',
        email: 'samuel.torres@gmail.com',
        telefono: '+52 55 4321 8765',
        direccion: 'Av. de las Fuentes #456, Col. Pedregal',
        fechaNacimiento: '1995-08-14'
      }, null, 2)
    },
    {
      id: 5,
      usuario: 'Ana María Restrepo',
      username: 'ana.restrepo',
      rol: 'ENCARGADO_IGLESIA',
      accion: 'Modificación',
      detalle: 'Promovió a Samuel David Torres a Miembro Activo',
      fecha: new Date(Date.now() - 1000 * 60 * 135), // hace 2 horas 15 min
      ip: '190.84.152.9',
      dispositivo: 'Firefox (125.0) - Ubuntu Linux',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        personaId: 45,
        nombre: 'Samuel David Torres Ruiz',
        iglesiaId: 3,
        iglesiaNombre: 'Maranatha Sur',
        fechaConversion: '2025-11-20',
        bautizado: true,
        fechaBautizo: '2026-02-15'
      }, null, 2)
    },
    {
      id: 6,
      usuario: 'Mychel Peña',
      username: 'admin',
      rol: 'ADMIN',
      accion: 'Exportación',
      detalle: 'Exportó padrón completo de Miembros a formato Excel (.xlsx)',
      fecha: new Date(Date.now() - 1000 * 60 * 240), // hace 4 horas
      ip: '190.167.45.122',
      dispositivo: 'Chrome (124.0) - Windows 11',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        formato: 'Excel (.xlsx)',
        registrosExportados: 342,
        filtrosAplicados: {
          estado: 'Activos',
          iglesia: 'Todas'
        },
        tamanoArchivoBytes: 45892,
        destinoDescarga: 'Local Browser'
      }, null, 2)
    },
    {
      id: 7,
      usuario: 'Desconocido',
      username: 'admin_test',
      rol: 'Ninguno',
      accion: 'Advertencia',
      detalle: 'Intento fallido de inicio de sesión (Contraseña incorrecta)',
      fecha: new Date(Date.now() - 1000 * 60 * 360), // hace 6 horas
      ip: '201.244.18.99',
      dispositivo: 'Edge (123.0) - Windows 10',
      estado: 'FAILED',
      metadatos: JSON.stringify({
        usuarioIngresado: 'admin_test',
        errorAutenticacion: 'Invalid credentials',
        intentosConsecutivosIp: 3,
        bloqueoIpTemporal: false,
        geolocalizacionAproximada: 'Ciudad de México, MX'
      }, null, 2)
    },
    {
      id: 8,
      usuario: 'Carlos Eduardo Mendoza',
      username: 'carlos.mendoza',
      rol: 'ENCARGADO_EVENTO',
      accion: 'Creación',
      detalle: 'Creó el evento "Taller Metropolitano de Liderazgo 2026"',
      fecha: new Date(Date.now() - 1000 * 60 * 1440), // hace 1 día
      ip: '187.190.222.14',
      dispositivo: 'Chrome Mobile (124.0) - Android 14',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        nombreEvento: 'Taller Metropolitano de Liderazgo 2026',
        tipoEventoId: 2,
        tipoEventoNombre: 'Taller',
        fechaInicio: '2026-06-15T09:00:00Z',
        fechaFin: '2026-06-17T18:00:00Z',
        capacidadMaxima: 150,
        lugar: 'Centro de Convenciones Maranatha'
      }, null, 2)
    },
    {
      id: 9,
      usuario: 'Mychel Peña',
      username: 'admin',
      rol: 'ADMIN',
      accion: 'Eliminación',
      detalle: 'Eliminó registro de pre-inscripción duplicado (ID: #108)',
      fecha: new Date(Date.now() - 1000 * 60 * 1800), // hace 1.2 días
      ip: '190.167.45.122',
      dispositivo: 'Chrome (124.0) - Windows 11',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        tablaAfectada: 'participacion_evento',
        registroId: 108,
        camposEliminados: {
          personaId: 88,
          nombrePersona: 'Luis Alberto Ortiz',
          eventoId: 4,
          eventoNombre: 'Campamento de Jóvenes 2026'
        },
        motivo: 'Duplicidad detectada en el formulario de registro en línea'
      }, null, 2)
    },
    {
      id: 10,
      usuario: 'Juan Carlos Gómez',
      username: 'jc.gomez',
      rol: 'TESORERO',
      accion: 'Exportación',
      detalle: 'Exportó informe trimestral financiero a PDF',
      fecha: new Date(Date.now() - 1000 * 60 * 2880), // hace 2 días
      ip: '186.6.112.54',
      dispositivo: 'Safari Mobile (17.4) - iOS iPadOS',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        documento: 'Reporte Financiero Q1 2026',
        formato: 'PDF (A4)',
        totalIngresosGenerales: 145890.00,
        totalEgresosGenerales: 92400.00,
        balanceNeto: 53490.00,
        firmadoDigitalmente: true
      }, null, 2)
    },
    {
      id: 11,
      usuario: 'System Daemon',
      username: 'system',
      rol: 'Ninguno',
      accion: 'Advertencia',
      detalle: 'Expiración automática de tokens de sesión inactivos (42 tokens purgados)',
      fecha: new Date(Date.now() - 1000 * 60 * 3200), // hace 2.2 días
      ip: '127.0.0.1',
      dispositivo: 'System / Background Job',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        tareaCron: 'PurgaSesionesInactivasJob',
        tokensExpirados: 42,
        tiempoInactividadConfigurado: '30 minutos',
        liberacionMemoriaBytes: 184500
      }, null, 2)
    },
    {
      id: 12,
      usuario: 'Carlos Eduardo Mendoza',
      username: 'carlos.mendoza',
      rol: 'ENCARGADO_EVENTO',
      accion: 'Modificación',
      detalle: 'Modificó cupo del evento "Campamento de Jóvenes" de 100 a 120 personas',
      fecha: new Date(Date.now() - 1000 * 60 * 4320), // hace 3 días
      ip: '187.190.222.14',
      dispositivo: 'Chrome Mobile (124.0) - Android 14',
      estado: 'SUCCESS',
      metadatos: JSON.stringify({
        eventoId: 4,
        nombreEvento: 'Campamento de Jóvenes 2026',
        campoModificado: 'capacidadMaxima',
        valorPrevio: 100,
        valorNuevo: 120,
        razón: 'Alta demanda y ampliación de cabañas en el lugar del campamento'
      }, null, 2)
    }
  ];

  constructor() {}

  /**
   * Obtiene todos los logs con un retraso simulado de red para realismo
   */
  getLogs(): Observable<AuditLog[]> {
    return of([...this.mockLogs]).pipe(delay(300));
  }

  /**
   * Obtiene logs filtrados por parámetros
   * @param query búsqueda libre en usuario, detalle, IP
   * @param accion tipo de acción (Filtro)
   * @param dias rango de tiempo en días
   */
  getFilteredLogs(query?: string, accion?: string, dias?: number): Observable<AuditLog[]> {
    return this.getLogs().pipe(
      map(logs => {
        let result = logs;

        // Filtro de días
        if (dias && dias > 0) {
          const limite = new Date(Date.now() - 1000 * 60 * 60 * 24 * dias);
          result = result.filter(log => new Date(log.fecha) >= limite);
        }

        // Filtro de acción
        if (accion && accion !== 'TODOS') {
          result = result.filter(log => log.accion.toLowerCase() === accion.toLowerCase());
        }

        // Búsqueda de texto libre
        if (query && query.trim() !== '') {
          const q = query.toLowerCase().trim();
          result = result.filter(log => 
            log.usuario.toLowerCase().includes(q) ||
            log.username.toLowerCase().includes(q) ||
            log.rol.toLowerCase().includes(q) ||
            log.detalle.toLowerCase().includes(q) ||
            log.ip.includes(q) ||
            log.dispositivo.toLowerCase().includes(q)
          );
        }

        return result;
      })
    );
  }

  /**
   * Obtiene estadísticas agregadas de los logs para las tarjetas del dashboard
   */
  getStats(): Observable<{ totalEventos: number; iniciosSesion: number; advertencias: number }> {
    return this.getLogs().pipe(
      map(logs => {
        const totalEventos = logs.length;
        const iniciosSesion = logs.filter(l => l.accion === 'Acceso' && l.estado === 'SUCCESS').length;
        const advertencias = logs.filter(l => l.accion === 'Advertencia' || l.estado === 'FAILED').length;
        return { totalEventos, iniciosSesion, advertencias };
      })
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private http = inject(HttpClient);

  /**
   * Obtiene todos los logs reales del backend
   */
  getLogs(): Observable<AuditLog[]> {
    return this.http.get<any>(`${environment.apiUrl}/api/bitacora/v1/findall`).pipe(
      map(res => {
        const list = res.datos || [];
        return list.map((dto: any) => this.mapToAuditLog(dto));
      })
    );
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

  /**
   * Mapea un DTO de Bitacora del backend al modelo AuditLog del frontend
   */
  private mapToAuditLog(dto: any): AuditLog {
    let mappedAccion: 'Acceso' | 'Creación' | 'Modificación' | 'Eliminación' | 'Exportación' | 'Advertencia' = 'Acceso';
    const acc = dto.accion ? dto.accion.toUpperCase() : '';
    
    if (acc.includes('CREAR') || acc.includes('CLONAR')) {
      mappedAccion = 'Creación';
    } else if (acc.includes('MODIFICAR') || acc.includes('EDITAR') || acc.includes('SUBIR') || acc.includes('TRASPASO')) {
      mappedAccion = 'Modificación';
    } else if (acc.includes('ELIMINAR') || acc.includes('BORRAR')) {
      mappedAccion = 'Eliminación';
    } else if (acc.includes('IMPORT') || acc.includes('EXPORT')) {
      mappedAccion = 'Exportación';
    } else if (acc.includes('ADVERTENCIA') || acc.includes('FALLO') || acc.includes('FAILED')) {
      mappedAccion = 'Advertencia';
    }
    
    const isFailed = acc.includes('FAIL') || acc.includes('FALLO') || (dto.descripcion && dto.descripcion.toLowerCase().includes('fallido'));

    return {
      id: dto.id,
      usuario: dto.userFullName || dto.username || 'Sistema',
      username: dto.username || 'system',
      rol: dto.usuarioId ? 'Usuario Registrado' : 'Sistema',
      accion: mappedAccion,
      detalle: dto.descripcion,
      fecha: new Date(dto.fecha),
      ip: dto.ipAddress || '127.0.0.1',
      dispositivo: 'Navegador Web (Web App)',
      estado: isFailed ? 'FAILED' : 'SUCCESS',
      metadatos: JSON.stringify({
        modulo: dto.modulo,
        accionOriginal: dto.accion,
        usuarioId: dto.usuarioId,
        fechaCompleta: dto.fecha
      }, null, 2)
    };
  }
}

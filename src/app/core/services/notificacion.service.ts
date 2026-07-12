import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificacionBadge {
  traspasos: number;
  eventos: number;
  total: number;
}

export interface NotificacionBadgeResponse {
  success: boolean;
  message: string;
  datos: NotificacionBadge;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/api/notificaciones/v1`;

  constructor(private http: HttpClient) {
  }

  getBadge(iglesiaId?: number): Observable<NotificacionBadgeResponse> {
    const params: { [param: string]: string } = {};
    if (iglesiaId) {
      params['iglesiaId'] = iglesiaId.toString();
    }
    return this.http.get<NotificacionBadgeResponse>(`${this.apiUrl}/badge`, { params });
  }
}

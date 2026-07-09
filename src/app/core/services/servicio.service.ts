import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServicioDto, AccionDto } from '../models/interfaces/servicio.interface';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {

  private apiUrl = `${environment.apiUrl}/api/servicios/v1`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServicioDto[]> {
    return this.http.get<ServicioDto[]>(`${this.apiUrl}/findall`);
  }

  getById(id: number): Observable<ServicioDto> {
    return this.http.get<ServicioDto>(`${this.apiUrl}/showbyid/${id}`);
  }

  getAllAcciones(): Observable<AccionDto[]> {
    return this.http.get<AccionDto[]>(`${this.apiUrl}/acciones/findall`);
  }

  getAccionesByRolCargo(rolCargoId: number): Observable<AccionDto[]> {
    return this.http.get<AccionDto[]>(`${this.apiUrl}/rol-cargo/${rolCargoId}/acciones`);
  }

  addAccionToRolCargo(rolCargoId: number, accionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rol-cargo/${rolCargoId}/add-accion/${accionId}`, {});
  }

  removeAccionFromRolCargo(rolCargoId: number, accionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rol-cargo/${rolCargoId}/remove-accion/${accionId}`);
  }
}

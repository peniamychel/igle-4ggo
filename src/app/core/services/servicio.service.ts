import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ServicioDto, AccionDto } from '../models/interfaces/servicio.interface';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {

  private apiUrl = `${environment.apiUrl}/api/servicios/v1`;

  // Catalogos de servicios/acciones: practicamente estaticos (semilla del sistema),
  // se cachean para toda la sesion.
  private serviciosCache$?: Observable<ServicioDto[]>;
  private accionesCache$?: Observable<AccionDto[]>;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServicioDto[]> {
    if (!this.serviciosCache$) {
      this.serviciosCache$ = this.http.get<ServicioDto[]>(`${this.apiUrl}/findall`).pipe(
        catchError(err => { this.serviciosCache$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.serviciosCache$;
  }

  getById(id: number): Observable<ServicioDto> {
    return this.http.get<ServicioDto>(`${this.apiUrl}/showbyid/${id}`);
  }

  getAllAcciones(): Observable<AccionDto[]> {
    if (!this.accionesCache$) {
      this.accionesCache$ = this.http.get<AccionDto[]>(`${this.apiUrl}/acciones/findall`).pipe(
        catchError(err => { this.accionesCache$ = undefined; return throwError(() => err); }),
        shareReplay(1)
      );
    }
    return this.accionesCache$;
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

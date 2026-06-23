import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrivilegioDto, PrivilegioResponse } from '../models/interfaces/privilegio.interface';

@Injectable({
  providedIn: 'root'
})
export class PrivilegioService {
  private apiUrl = `${environment.apiUrl}/api/privilegios/v1`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PrivilegioDto[]> {
    return this.http.get<PrivilegioDto[]>(`${this.apiUrl}/findall`);
  }

  getById(id: number): Observable<PrivilegioDto> {
    return this.http.get<PrivilegioDto>(`${this.apiUrl}/showbyid/${id}`);
  }

  create(dto: PrivilegioDto): Observable<PrivilegioDto> {
    return this.http.post<PrivilegioDto>(`${this.apiUrl}/create`, dto);
  }

  update(id: number, dto: PrivilegioDto): Observable<PrivilegioDto> {
    return this.http.put<PrivilegioDto>(`${this.apiUrl}/update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getPrivilegiosByRolCargo(rolCargoId: number): Observable<PrivilegioResponse[]> {
    return this.http.get<PrivilegioResponse[]>(`${this.apiUrl}/rol-cargo/${rolCargoId}/privilegios`);
  }

  addPrivilegioToRolCargo(rolCargoId: number, privilegioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rol-cargo/${rolCargoId}/add/${privilegioId}`, {});
  }

  removePrivilegioFromRolCargo(rolCargoId: number, privilegioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rol-cargo/${rolCargoId}/remove/${privilegioId}`);
  }
}

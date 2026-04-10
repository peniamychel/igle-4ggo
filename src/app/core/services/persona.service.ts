import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Persona, PersonaResponse} from '../models/persona.model';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private apiUrl = `${environment.apiUrl}/api/persona/v1`;

  constructor(private http: HttpClient) {
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getPersonas(): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.apiUrl}/findall`, {headers: this.getHeaders()});
  }

  getPersonaById(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/showbyid/${id}`, {headers: this.getHeaders()});
  }

  createPersona(persona: Persona): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, persona, {headers: this.getHeaders()});
  }

  updatePersonax(persona: Persona): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, persona, {headers: this.getHeaders()});
  }

// Actualización parcial de datos base// Actualización parcial de datos base
  updatePersona(id: number, changes: Partial<Persona>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, changes, {headers: this.getHeaders()});
  }

  toggleEstado(persona: Persona): Observable<any> {

    const changes: Partial<Persona> = {
      estado: !persona.estado
    };

    const changesx = { estado: !persona.estado };
    return this.updatePersona(persona.id!, changesx);
  }

  personaNoMiembro(): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.apiUrl}/personanomiembro`, {headers: this.getHeaders()});
  }

  buscarCi(ci: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/showbyci/${ci}`, {headers: this.getHeaders()});
  }

  uploadUserPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData, {headers: this.getHeaders()});
  }
}

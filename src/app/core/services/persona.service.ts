import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Persona, PersonaResponse } from '../models/persona.model';

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

  /**
   * Obtiene todas las personas
   * @returns lista de personas
   */
  getPersonas(): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.apiUrl}/findall`, { headers: this.getHeaders() });
  }

  /**
   * Obtiene una persona por id
   * @param id id de la persona
   * @returns persona encontrada
   */
  getPersonaById(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/showbyid/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Crea una persona
   * @param persona persona a crear
   * @returns persona creada
   */
  createPersona(persona: Persona): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, persona, { headers: this.getHeaders() });
  }

  /**
   * Actualiza una persona
   * @param persona persona a actualizar
   * @returns persona actualizada
   */
  updatePersonax(persona: Persona): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, persona, { headers: this.getHeaders() });
  }

  /**
   * Actualiza una persona
   * @param id id de la persona a actualizar
   * @param changes datos de persona a actualizar
   * @returns persona actualizada
   */
  updatePersona(id: number, changes: Partial<Persona>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, changes, { headers: this.getHeaders() });
  }

  /**
   * Cambia el estado de una persona
   * @param persona persona a cambiar el estado
   * @returns persona actualizada
   */
  toggleEstado(persona: Persona): Observable<any> {

    const changes: Partial<Persona> = {
      estado: !persona.estado
    };

    const changesx = { estado: !persona.estado };
    return this.updatePersona(persona.id!, changesx);
  }

  /**
   * Busca personas que no son miembros de la iglesia
   * @returns lista de personas que no son miembros
   */
  personaNoMiembro(): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.apiUrl}/personanomiembro`, { headers: this.getHeaders() });
  }

  /**
   * Busca una persona por ci
   * @param ci ci de la persona
   * @returns persona encontrada
   */
  buscarCi(ci: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/showbyci/${ci}`, { headers: this.getHeaders() });
  }

  /**
   * Sube la foto de una persona
   * @param id id de la persona
   * @param file archivo a subir
   * @returns persona actualizada
   */
  uploadUserPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData, { headers: this.getHeaders() });
  }
}

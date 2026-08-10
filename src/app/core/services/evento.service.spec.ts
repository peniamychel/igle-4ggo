import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { EventoService } from './evento.service';
import { environment } from '../../../environments/environment';

/**
 * archivar()/desarchivar() son dos métodos casi idénticos que pegan a rutas
 * DISTINTAS con el mismo id — el tipo de par donde copiar-pegar mal deja a
 * uno llamando la ruta del otro sin que TypeScript lo detecte (ambos
 * devuelven Observable<any> con la misma firma). cloneYearEvents() es además
 * el endpoint marcado en la revisión de seguridad del backend como
 * susceptible al 500-en-vez-de-400 si algún parámetro llega undefined.
 */
describe('EventoService', () => {
  let service: EventoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/evento/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EventoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('archivar / desarchivar: rutas distintas, no deben confundirse', () => {

    it('archivar pega a /archivar/:id', () => {
      service.archivar(7).subscribe();
      const req = httpMock.expectOne(`${base}/archivar/7`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('desarchivar pega a /desarchivar/:id, NO a /archivar/:id', () => {
      service.desarchivar(7).subscribe();
      const req = httpMock.expectOne(`${base}/desarchivar/7`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  it('getEventos y getEventosArchivados usan rutas distintas', () => {
    service.getEventos().subscribe();
    const r1 = httpMock.expectOne(`${base}/findall`);
    expect(r1.request.method).toBe('GET');
    r1.flush({});

    service.getEventosArchivados().subscribe();
    const r2 = httpMock.expectOne(`${base}/archivados`);
    expect(r2.request.method).toBe('GET');
    r2.flush({});
  });

  describe('cloneYearEvents', () => {

    it('construye la URL con from y to como query params', () => {
      service.cloneYearEvents(2025, 2026).subscribe();
      const req = httpMock.expectOne(`${base}/clonar?from=2025&to=2026`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('es un POST con body vacío, no lleva los años en el body', () => {
      service.cloneYearEvents(2025, 2026).subscribe();
      const req = httpMock.expectOne(`${base}/clonar?from=2025&to=2026`);
      expect(req.request.body).toEqual({});
      req.flush({});
    });
  });

  it('createEvento: POST con el evento como body', () => {
    const evento = { nombre: 'Retiro' };
    service.createEvento(evento as any).subscribe();
    const req = httpMock.expectOne(`${base}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(evento);
    req.flush({});
  });

  it('deleteEvento: DELETE con el id en la ruta', () => {
    service.deleteEvento(3).subscribe();
    const req = httpMock.expectOne(`${base}/delete/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});

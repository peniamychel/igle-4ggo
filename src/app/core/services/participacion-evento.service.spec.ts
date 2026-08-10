import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ParticipacionEventoService } from './participacion-evento.service';
import { environment } from '../../../environments/environment';

/**
 * toggleEstado() y toggleEntregado() son dos PUT casi idénticos (mismo id,
 * mismo body vacío) a rutas distintas con consecuencias muy distintas: uno
 * activa/desactiva la participación, el otro marca la entrega del
 * certificado. registrarEntrega() es el único punto que asienta libro y
 * folio — se verifica la forma exacta del body porque el backend lo consume
 * como objeto, no como parámetros sueltos.
 */
describe('ParticipacionEventoService', () => {
  let service: ParticipacionEventoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/participacion-evento/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ParticipacionEventoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('toggleEstado vs toggleEntregado: rutas distintas, no deben confundirse', () => {

    it('toggleEstado pega a /estado/:id', () => {
      service.toggleEstado(9).subscribe();
      const req = httpMock.expectOne(`${base}/estado/9`);
      expect(req.request.method).toBe('PUT');
      req.flush(true);
    });

    it('toggleEntregado pega a /entregado/:id, NO a /estado/:id', () => {
      service.toggleEntregado(9).subscribe();
      const req = httpMock.expectOne(`${base}/entregado/9`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('registrarEntrega', () => {

    it('manda certificadoId, numeroLibro y numeroFolio en el body, con esos nombres exactos', () => {
      service.registrarEntrega(9, 42, 'Libro I', 'Folio 12').subscribe();

      const req = httpMock.expectOne(`${base}/entregar/9`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        certificadoId: 42,
        numeroLibro: 'Libro I',
        numeroFolio: 'Folio 12'
      });
      req.flush({});
    });
  });

  it('createParticipacion: POST con la participación como body', () => {
    const participacion = { miembroId: 1 };
    service.createParticipacion(participacion as any).subscribe();
    const req = httpMock.expectOne(`${base}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(participacion);
    req.flush({});
  });

  it('deleteParticipacion: DELETE con el id en la ruta', () => {
    service.deleteParticipacion(9).subscribe();
    const req = httpMock.expectOne(`${base}/delete/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});

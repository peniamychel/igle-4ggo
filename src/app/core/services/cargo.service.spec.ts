import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CargoService } from './cargo.service';
import { environment } from '../../../environments/environment';

/**
 * Sobre todo importa toggleEstado(): fechaFin es un query param opcional
 * construido a mano, y es el mismo patrón de omisión-por-falsy que ya mostró
 * un caso límite real en miembro.service (importExcel con iglesiaId=0).
 */
describe('CargoService', () => {
  let service: CargoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/cargo/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CargoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('toggleEstado', () => {

    it('sin fechaFin, el query param no se agrega', () => {
      service.toggleEstado(1).subscribe();
      const req = httpMock.expectOne(`${base}/estado/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(true);
    });

    it('con fechaFin, se agrega como query param sin encodear (fechas yyyy-MM-dd no lo necesitan)', () => {
      service.toggleEstado(1, '2026-03-15').subscribe();
      const req = httpMock.expectOne(`${base}/estado/1?fechaFin=2026-03-15`);
      expect(req.request.urlWithParams).toContain('fechaFin=2026-03-15');
      req.flush(false);
    });
  });

  describe('otros endpoints', () => {

    it('getCargos y getMisColaboradores usan rutas distintas', () => {
      service.getCargos().subscribe();
      const r1 = httpMock.expectOne(`${base}/findall`);
      expect(r1.request.method).toBe('GET');
      r1.flush({});

      service.getMisColaboradores().subscribe();
      const r2 = httpMock.expectOne(`${base}/mis-colaboradores`);
      expect(r2.request.method).toBe('GET');
      r2.flush({});
    });

    it('createCargo: POST con el cargo como body', () => {
      const cargo = { rolCargoId: 1 };
      service.createCargo(cargo).subscribe();
      const req = httpMock.expectOne(`${base}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(cargo);
      req.flush({});
    });

    it('uploadActaAsignacion y uploadActaDeslindacion van a rutas distintas, ambos multipart', () => {
      const file = new File(['x'], 'acta.pdf');

      service.uploadActaAsignacion(5, file).subscribe();
      const r1 = httpMock.expectOne(`${base}/5/acta-asignacion`);
      expect((r1.request.body as FormData).get('file')).toBe(file);
      r1.flush({});

      service.uploadActaDeslindacion(5, file).subscribe();
      const r2 = httpMock.expectOne(`${base}/5/acta-deslindacion`);
      expect((r2.request.body as FormData).get('file')).toBe(file);
      r2.flush({});
    });

    it('deleteCargo: DELETE con el id en la ruta', () => {
      service.deleteCargo(5).subscribe();
      const req = httpMock.expectOne(`${base}/delete/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});

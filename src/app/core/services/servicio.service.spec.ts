import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ServicioService } from './servicio.service';
import { environment } from '../../../environments/environment';

/**
 * Caso distinto a los demás cachés del proyecto: acá NO hay ningún
 * create/update/delete — el catálogo de servicios/acciones es semilla del
 * sistema y el comentario dice "se cachean para toda la sesión". No existe
 * invalidateCache() porque no hay nada que lo dispare. Lo que hay que probar
 * es que los dos cachés (servicios, acciones) son independientes entre sí y
 * que ninguno queda "envenenado" tras un error de red.
 */
describe('ServicioService', () => {
  let service: ServicioService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/servicios/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ServicioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll: comparte una sola petición entre suscriptores', () => {
    service.getAll().subscribe();
    service.getAll().subscribe();

    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getAllAcciones: caché INDEPENDIENTE del de getAll, con su propia ruta', () => {
    service.getAllAcciones().subscribe();
    service.getAllAcciones().subscribe();

    const req = httpMock.expectOne(`${base}/acciones/findall`);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    // Confirma que pedir el otro catálogo sí sale por HTTP: son cachés separados.
    service.getAll().subscribe();
    httpMock.expectOne(`${base}/findall`).flush([]);
  });

  it('un error en getAll no afecta al caché de getAllAcciones', () => {
    service.getAll().subscribe({ error: () => {} });
    httpMock.expectOne(`${base}/findall`).error(new ProgressEvent('network error'));

    service.getAllAcciones().subscribe();
    const req = httpMock.expectOne(`${base}/acciones/findall`);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    // El de getAllAcciones queda cacheado normalmente: una segunda llamada no pide de nuevo.
    service.getAllAcciones().subscribe();
    httpMock.expectNone(`${base}/acciones/findall`);
  });

  it('tras un error, getAll sí vuelve a pedir en el siguiente intento', () => {
    service.getAll().subscribe({ error: () => {} });
    httpMock.expectOne(`${base}/findall`).error(new ProgressEvent('network error'));

    service.getAll().subscribe();
    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('las operaciones sobre rol-cargo no pasan por ningún caché ni lo tocan', () => {
    service.getAll().subscribe();
    httpMock.expectOne(`${base}/findall`).flush([]);

    service.addAccionToRolCargo(1, 5).subscribe();
    httpMock.expectOne(`${base}/rol-cargo/1/add-accion/5`).flush({});

    service.removeAccionFromRolCargo(1, 5).subscribe();
    httpMock.expectOne(`${base}/rol-cargo/1/remove-accion/5`).flush({});

    // El catálogo sigue cacheado: no hay razón para invalidarlo (no cambia el
    // catálogo de servicios en sí, sólo qué acciones tiene un rol).
    let peticionesPendientes = 0;
    service.getAll().subscribe(() => peticionesPendientes++);
    httpMock.expectNone(`${base}/findall`);
    expect(peticionesPendientes).toBe(1); // llegó el valor cacheado, sincrónico
  });
});

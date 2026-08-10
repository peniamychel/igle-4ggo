import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PrivilegioService } from './privilegio.service';
import { environment } from '../../../environments/environment';

/**
 * getAll() cachea el catálogo de privilegios. Lo que hay que fijar es la
 * DECISIÓN explícita del comentario en el servicio: asignar o quitar un
 * privilegio de un rol (addPrivilegioToRolCargo/removePrivilegioFromRolCargo)
 * NO invalida el caché, porque eso no cambia el catálogo en sí — sólo
 * create/update/delete lo hacen. Sin un test, alguien podría "corregir" esa
 * asimetría pensando que es un bug, cuando es la decisión documentada.
 */
describe('PrivilegioService', () => {
  let service: PrivilegioService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/privilegios/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PrivilegioService);
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

  it('tras un error, el caché se limpia y el siguiente intento vuelve a pedir', () => {
    service.getAll().subscribe({ error: () => {} });
    httpMock.expectOne(`${base}/findall`).error(new ProgressEvent('network error'));

    service.getAll().subscribe();
    const req = httpMock.expectOne(`${base}/findall`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create/update/delete SÍ invalidan el caché del catálogo', () => {
    const llenar = () => {
      service.getAll().subscribe();
      httpMock.expectOne(`${base}/findall`).flush([]);
    };
    const confirmarInvalidado = () => {
      service.getAll().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    };

    llenar();
    service.create({ nombre: 'Ver Miembros' } as any).subscribe();
    httpMock.expectOne(`${base}/create`).flush({});
    confirmarInvalidado();

    service.update(1, { nombre: 'Ver Miembros' } as any).subscribe();
    httpMock.expectOne(`${base}/update/1`).flush({});
    confirmarInvalidado();

    service.delete(1).subscribe();
    httpMock.expectOne(`${base}/delete/1`).flush(null);
    confirmarInvalidado();
  });

  it('HALLAZGO DOCUMENTADO: asignar/quitar un privilegio de un rol NO invalida el caché (a propósito)', () => {
    // Ver el comentario en privilegio.service.ts: asignar/quitar no cambia el
    // catálogo de privilegios en sí (sólo la relación rol↔privilegio), así que
    // no hay razón para invalidar. Si este test empieza a fallar porque
    // alguien agregó invalidateCache() acá, es una decisión a confirmar, no
    // un arreglo obvio.
    service.getAll().subscribe();
    httpMock.expectOne(`${base}/findall`).flush([]);

    service.addPrivilegioToRolCargo(1, 5).subscribe();
    httpMock.expectOne(`${base}/rol-cargo/1/add/5`).flush({});

    service.removePrivilegioFromRolCargo(1, 5).subscribe();
    httpMock.expectOne(`${base}/rol-cargo/1/remove/5`).flush({});

    // El caché sigue tibio: pedirlo de nuevo NO debe generar una petición nueva.
    let peticionesPendientes = 0;
    service.getAll().subscribe(() => peticionesPendientes++);
    httpMock.expectNone(`${base}/findall`);
    expect(peticionesPendientes).toBe(1); // llegó el valor cacheado, sincrónico
  });

  it('getPrivilegiosByRolCargo no pasa por ningún caché', () => {
    service.getPrivilegiosByRolCargo(3).subscribe();
    const req = httpMock.expectOne(`${base}/rol-cargo/3/privilegios`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});

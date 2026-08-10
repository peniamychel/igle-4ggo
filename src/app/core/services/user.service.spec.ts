import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

/**
 * getUserByNameForToken() es el único método de este servicio con lógica
 * propia: desestructura la respuesta para SACAR el password antes de
 * devolverla. Es sensible a seguridad — si alguien reordena el objeto
 * devuelto sin querer y el password vuelve a colarse, no se nota a simple
 * vista en el componente que lo consume (queda ahí en memoria, quizás en el
 * estado de un formulario). El test verifica la ausencia de la clave, no
 * sólo el resto de los campos.
 */
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/usuario/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getUserByNameForToken', () => {

    it('quita el password de la respuesta antes de devolverla', (done) => {
      service.getUserByNameForToken().subscribe(user => {
        expect('password' in user).toBeFalse();
        expect(user.username).toBe('carlos');
        done();
      });

      httpMock.expectOne(`${base}/findbyusername`).flush({
        datos: { id: 1, username: 'carlos', email: 'c@x.com', password: 'hash-secreto', roles: [] }
      });
    });

    it('mapea roles usando nombreRol, con fallback a nombre y luego a name', (done) => {
      service.getUserByNameForToken().subscribe(user => {
        expect(user.roles).toEqual(['ROLE_PASTOR', 'Tesorero', 'Diacono']);
        done();
      });

      httpMock.expectOne(`${base}/findbyusername`).flush({
        datos: {
          id: 1, username: 'carlos', password: 'x',
          roles: [{ nombreRol: 'ROLE_PASTOR' }, { nombre: 'Tesorero' }, { name: 'Diacono' }]
        }
      });
    });

    it('sin roles en la respuesta, devuelve un array vacío, no undefined', (done) => {
      service.getUserByNameForToken().subscribe(user => {
        expect(user.roles).toEqual([]);
        done();
      });

      httpMock.expectOne(`${base}/findbyusername`).flush({
        datos: { id: 1, username: 'carlos', password: 'x' }
      });
    });

    it('conserva sólo los campos declarados, no todo lo que venga en datos', (done) => {
      service.getUserByNameForToken().subscribe(user => {
        expect(Object.keys(user).sort()).toEqual(
          ['apellidos', 'email', 'id', 'name', 'roles', 'uriFoto', 'username'].sort()
        );
        done();
      });

      httpMock.expectOne(`${base}/findbyusername`).flush({
        datos: {
          id: 1, username: 'carlos', password: 'x', email: 'c@x.com',
          name: 'Carlos', apellidos: 'Perez', uriFoto: 'foto.jpg',
          campoInesperadoDelBackend: 'no debería aparecer', roles: []
        }
      });
    });
  });

  describe('otros endpoints: verbo, ruta y body', () => {

    it('getAllUsers: GET a /findall', () => {
      service.getAllUsers().subscribe();
      const req = httpMock.expectOne(`${base}/findall`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('createUser: POST con el DTO como body', () => {
      const dto = { username: 'carlos' } as any;
      service.createUser(dto).subscribe();
      const req = httpMock.expectOne(`${base}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('changePassword y resetPassword pegan a rutas DISTINTAS (uno exige currentPassword, el otro no)', () => {
      service.changePassword({ currentPassword: 'x', newPassword: 'y' } as any).subscribe();
      const req1 = httpMock.expectOne(`${base}/change-password`);
      expect(req1.request.method).toBe('PUT');
      req1.flush({});

      service.resetPassword({ id: 1, newPassword: 'y' } as any).subscribe();
      const req2 = httpMock.expectOne(`${base}/reset-password`);
      expect(req2.request.method).toBe('PUT');
      req2.flush({});
    });

    it('uploadUserPhoto: POST multipart bajo la clave "file"', () => {
      const file = new File(['x'], 'foto.jpg');
      service.uploadUserPhoto(3, file).subscribe();

      const req = httpMock.expectOne(`${base}/3/foto`);
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush({});
    });

    it('deleteUser: DELETE con el id en la ruta', () => {
      service.deleteUser(3).subscribe();
      const req = httpMock.expectOne(`${base}/delete/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});

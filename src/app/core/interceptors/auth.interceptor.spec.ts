import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/security/auth.service';

/**
 * El interceptor toca TODAS las peticiones de la app. Sus dos trabajos:
 * adjuntar el Bearer y cerrar sesión cuando el token ya no sirve.
 *
 * La distinción que más importa: un 401/403 desloguea, pero un 500 NO. Si esa
 * rama se ensancha por accidente, cualquier error del servidor echaría al
 * usuario en medio de su trabajo; si se angosta, un token revocado seguiría
 * pareciendo válido.
 */
describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const URL = '/api/cualquier-cosa';

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService',
      ['getToken', 'isTokenExpired', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => httpMock.verify());

  // ───────────────────────── adjuntar el token ─────────────────────────

  it('sin token: la petición sale sin cabecera Authorization', () => {
    authService.getToken.and.returnValue(null);

    http.get(URL).subscribe();

    const req = httpMock.expectOne(URL);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('sin token NO consulta la expiración ni desloguea', () => {
    // Un usuario anónimo pidiendo un recurso público no debe disparar logout.
    authService.getToken.and.returnValue(null);

    http.get(URL).subscribe();
    httpMock.expectOne(URL).flush({});

    expect(authService.isTokenExpired).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('token vigente: adjunta "Bearer <token>"', () => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(false);

    http.get(URL).subscribe();

    const req = httpMock.expectOne(URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  // ───────────────────────── token expirado ─────────────────────────

  it('token expirado: desloguea, redirige a / y NO llega a salir la petición', (done) => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(true);

    http.get(URL).subscribe({
      next: () => done.fail('no debería emitir'),
      error: (e: Error) => {
        expect(e.message).toBe('Token expirado');
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      }
    });

    // Que no haya petición pendiente confirma que se cortó antes de la red:
    // el afterEach con httpMock.verify() fallaría si hubiese quedado alguna.
    httpMock.expectNone(URL);
  });

  // ───────────────────────── respuestas de error ─────────────────────────

  it('401: desloguea y redirige', (done) => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(false);

    http.get(URL).subscribe({
      error: (e: HttpErrorResponse) => {
        expect(e.status).toBe(401);
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      }
    });

    httpMock.expectOne(URL).flush('No autorizado', { status: 401, statusText: 'Unauthorized' });
  });

  it('403: también desloguea y redirige', (done) => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(false);

    http.get(URL).subscribe({
      error: () => {
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      }
    });

    httpMock.expectOne(URL).flush('Prohibido', { status: 403, statusText: 'Forbidden' });
  });

  it('500: propaga el error pero NO desloguea (un fallo del servidor no es sesión inválida)', (done) => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(false);

    http.get(URL).subscribe({
      error: (e: HttpErrorResponse) => {
        expect(e.status).toBe(500);
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne(URL).flush('Boom', { status: 500, statusText: 'Server Error' });
  });

  it('404 tampoco desloguea', (done) => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(false);

    http.get(URL).subscribe({
      error: () => {
        expect(authService.logout).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne(URL).flush('No existe', { status: 404, statusText: 'Not Found' });
  });

  it('400 (validación) tampoco: el usuario debe poder corregir el formulario sin perder la sesión', (done) => {
    authService.getToken.and.returnValue('abc123');
    authService.isTokenExpired.and.returnValue(false);

    http.post(URL, {}).subscribe({
      error: () => {
        expect(authService.logout).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne(URL).flush('Datos inválidos', { status: 400, statusText: 'Bad Request' });
  });
});

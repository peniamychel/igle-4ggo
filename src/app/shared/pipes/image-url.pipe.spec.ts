import { ImageUrlPipe } from './image-url.pipe';
import { environment } from '../../../environments/environment';

/**
 * Este pipe decide la URL de CADA imagen de la app (fotos de miembros,
 * iglesias, activos, actas, cartas de traspaso). Sus ramas son fáciles de
 * romper sin darse cuenta porque el síntoma es una imagen rota, no un error.
 *
 * El caso que más importa: los valores "vacíos disfrazados" (`/uploads/miembros`
 * a secas, o cualquier ruta terminada en `/`) tienen que dar cadena vacía y no
 * una URL a un directorio, que es lo que produce el ícono roto.
 */
describe('ImageUrlPipe', () => {
  let pipe: ImageUrlPipe;

  beforeEach(() => {
    pipe = new ImageUrlPipe();
  });

  it('se instancia', () => {
    expect(pipe).toBeTruthy();
  });

  describe('valores que deben resolver a cadena vacía', () => {

    it('null, undefined o cadena vacía', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform('')).toBe('');
    });

    it('una ruta de directorio (termina en /) no debe generar URL', () => {
      expect(pipe.transform('/uploads/miembros/')).toBe('');
      expect(pipe.transform('miembros/')).toBe('');
    });

    it('los directorios base sin archivo tampoco', () => {
      // Son el "vacío disfrazado" que manda el backend cuando no hay foto.
      expect(pipe.transform('/uploads/miembros')).toBe('');
      expect(pipe.transform('/uploads/personas')).toBe('');
    });
  });

  describe('URLs que ya vienen completas: se devuelven tal cual', () => {

    it('http y https no se tocan', () => {
      expect(pipe.transform('http://otro.com/foto.jpg')).toBe('http://otro.com/foto.jpg');
      expect(pipe.transform('https://otro.com/foto.jpg')).toBe('https://otro.com/foto.jpg');
    });

    it('los data: URI tampoco (previews en memoria al recortar una imagen)', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
      expect(pipe.transform(dataUri)).toBe(dataUri);
    });
  });

  describe('rutas relativas: se les antepone el apiUrl', () => {

    it('una ruta absoluta del servidor se respeta y sólo se le antepone el host', () => {
      expect(pipe.transform('/uploads/miembros/foto.jpg'))
        .toBe(`${environment.apiUrl}/uploads/miembros/foto.jpg`);
    });

    it('los prefijos conocidos van bajo /uploads/', () => {
      const prefijos = ['activos', 'iglesias', 'miembros', 'cargos', 'cartas-traspaso'];
      for (const p of prefijos) {
        expect(pipe.transform(`${p}/archivo.jpg`))
          .withContext(`prefijo ${p}/`)
          .toBe(`${environment.apiUrl}/uploads/${p}/archivo.jpg`);
      }
    });

    it('un nombre suelto (sin prefijo) cae en /uploads/personas/', () => {
      expect(pipe.transform('foto.jpg'))
        .toBe(`${environment.apiUrl}/uploads/personas/foto.jpg`);
    });

    it('un prefijo NO listado también cae en personas/, no se pierde', () => {
      // Documenta el comportamiento actual: si mañana se agrega una carpeta
      // nueva en el backend y no se la registra acá, sus imágenes se van a
      // buscar a /uploads/personas/ y no van a aparecer.
      expect(pipe.transform('certificados/cert1.jpg'))
        .toBe(`${environment.apiUrl}/uploads/personas/certificados/cert1.jpg`);
    });
  });
});

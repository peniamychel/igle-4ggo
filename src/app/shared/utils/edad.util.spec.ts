import { calcularEdad, grupoEtario, grupoEtarioDeFecha } from './edad.util';

/**
 * Lógica pura de los informes: no necesita TestBed ni DOM.
 *
 * Lo que más importa acá son los bordes de los grupos etarios (12/13, 17/18,
 * 30/31), porque un `<=` mal puesto mueve gente de categoría en TODOS los
 * informes a la vez y nadie lo nota: el PDF igual se genera y los números
 * igual suman.
 */
describe('edad.util', () => {

  /** Fecha de nacimiento que da exactamente `edad` años HOY (cumpleaños ya pasado). */
  function nacidoHaceExactamente(edad: number): Date {
    const d = new Date();
    d.setFullYear(d.getFullYear() - edad);
    return d;
  }

  describe('calcularEdad', () => {

    it('devuelve null si no hay fecha (null, undefined o cadena vacía)', () => {
      expect(calcularEdad(null)).toBeNull();
      expect(calcularEdad(undefined)).toBeNull();
      expect(calcularEdad('')).toBeNull();
    });

    it('devuelve null si la fecha es inválida, no NaN', () => {
      // Importa que sea null y no NaN: NaN se propagaría silencioso a los
      // gráficos y rompería las sumas sin lanzar error.
      expect(calcularEdad('no-es-una-fecha')).toBeNull();
    });

    it('calcula la edad cuando el cumpleaños de este año YA pasó', () => {
      const hoy = new Date();
      // 30 años, cumplidos ayer.
      const nacimiento = new Date(hoy.getFullYear() - 30, hoy.getMonth(), hoy.getDate() - 1);
      expect(calcularEdad(nacimiento)).toBe(30);
    });

    it('resta un año cuando el cumpleaños de este año TODAVÍA no llegó', () => {
      const hoy = new Date();
      // Nació hace 30 años pero cumple mañana: hoy todavía tiene 29.
      const nacimiento = new Date(hoy.getFullYear() - 30, hoy.getMonth(), hoy.getDate() + 1);
      expect(calcularEdad(nacimiento)).toBe(29);
    });

    it('devuelve 0 para alguien nacido hoy, no null', () => {
      expect(calcularEdad(new Date())).toBe(0);
    });

    it('acepta la fecha como string ISO, no sólo como Date', () => {
      const nacimiento = nacidoHaceExactamente(25);
      const iso = `${nacimiento.getFullYear()}-01-01`;
      expect(calcularEdad(iso)).toBeGreaterThanOrEqual(24);
    });

    it('devuelve null si la fecha es futura (edad negativa)', () => {
      const futuro = new Date();
      futuro.setFullYear(futuro.getFullYear() + 5);
      expect(calcularEdad(futuro)).toBeNull();
    });
  });

  describe('grupoEtario: bordes exactos de cada categoría', () => {

    it('null si la edad es null', () => {
      expect(grupoEtario(null)).toBeNull();
    });

    it('Niños: 0 a 12 inclusive', () => {
      expect(grupoEtario(0)).toBe('Niños');
      expect(grupoEtario(12)).toBe('Niños');
    });

    it('Adolescentes: 13 a 17 inclusive', () => {
      expect(grupoEtario(13)).toBe('Adolescentes');
      expect(grupoEtario(17)).toBe('Adolescentes');
    });

    it('Jóvenes: 18 a 30 inclusive', () => {
      expect(grupoEtario(18)).toBe('Jóvenes');
      expect(grupoEtario(30)).toBe('Jóvenes');
    });

    it('Adultos: 31 en adelante', () => {
      expect(grupoEtario(31)).toBe('Adultos');
      expect(grupoEtario(90)).toBe('Adultos');
    });

    it('ningún borde queda sin categoría ni cae en dos a la vez', () => {
      for (let edad = 0; edad <= 100; edad++) {
        expect(grupoEtario(edad)).withContext(`edad ${edad}`).not.toBeNull();
      }
    });
  });

  describe('grupoEtarioDeFecha', () => {

    it('compone calcularEdad + grupoEtario', () => {
      expect(grupoEtarioDeFecha(nacidoHaceExactamente(10))).toBe('Niños');
      expect(grupoEtarioDeFecha(nacidoHaceExactamente(15))).toBe('Adolescentes');
      expect(grupoEtarioDeFecha(nacidoHaceExactamente(25))).toBe('Jóvenes');
      expect(grupoEtarioDeFecha(nacidoHaceExactamente(50))).toBe('Adultos');
    });

    it('propaga el null de una fecha ausente o inválida', () => {
      expect(grupoEtarioDeFecha(null)).toBeNull();
      expect(grupoEtarioDeFecha('no-es-una-fecha')).toBeNull();
    });
  });
});

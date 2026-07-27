/**
 * Utilidades de edad para los informes.
 * Grupos etarios (decisión del proyecto):
 *   Niños 0-12, Adolescentes 13-17, Jóvenes 18-30, Adultos 31+.
 */

export type GrupoEtario = 'Niños' | 'Adolescentes' | 'Jóvenes' | 'Adultos';

export const GRUPOS_ETARIOS: GrupoEtario[] = ['Niños', 'Adolescentes', 'Jóvenes', 'Adultos'];

/** Edad en años a partir de la fecha de nacimiento. Devuelve null si no hay fecha válida. */
export function calcularEdad(fechaNac: Date | string | null | undefined): number | null {
  if (!fechaNac) return null;
  const nacimiento = new Date(fechaNac);
  if (isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad >= 0 ? edad : null;
}

/** Clasifica una edad en su grupo etario. Devuelve null si la edad es null. */
export function grupoEtario(edad: number | null): GrupoEtario | null {
  if (edad === null) return null;
  if (edad <= 12) return 'Niños';
  if (edad <= 17) return 'Adolescentes';
  if (edad <= 30) return 'Jóvenes';
  return 'Adultos';
}

/** Grupo etario directamente desde la fecha de nacimiento. */
export function grupoEtarioDeFecha(fechaNac: Date | string | null | undefined): GrupoEtario | null {
  return grupoEtario(calcularEdad(fechaNac));
}

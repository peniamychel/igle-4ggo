// Entorno de desarrollo.
//
// PENDIENTE: crear environment.prod.ts y configurar fileReplacements en
// angular.json para que el build de producción use la URL real de la API.
// Hoy `ng build` (default: production) usa este archivo y apunta a localhost,
// lo que rompe cualquier deploy a producción.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8092'
};

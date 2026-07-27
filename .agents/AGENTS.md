# Reglas y Estándares del Frontend (Navegación y Autorización)

Este archivo define el comportamiento de navegación dinámica y control de accesos del frontend.

---

## 1. Navegación Dinámica y Etiquetas del Menú

Las opciones de menú lateral (`Sidenav`) deben adaptarse dinámicamente al tipo de rol conectado:
* Si es **ADMIN (Administrador Supremo)**: Las rutas principales apuntan a vistas globales (ej. `/miembro` -> "Miembros", `/obreros` -> "Obreros", `/iglesia` -> "Iglesias").
* Si es **Cualquier otro rol (Local)**: Las rutas apuntan a sus contrapartes locales y cambian sus nombres de forma amigable (ej. `/mi-iglesia` -> "Miembros", `/colaboradores` -> "Colaboradores").

La lógica de reetiquetado y mapeo está centralizada en el método `updateFilteredMenuItems()` de `SidenavComponent`.

---

## 2. Protección de Rutas Globales (Guards)

Las rutas de servicios globales están estrictamente reservadas para el Administrador Supremo. 
* **Regla de Bloqueo:** El guard de privilegios `privilegioGuard` contiene una lista de `globalRoutes` (ej. `'miembro'`, `'obreros'`, `'cargo'`, `'iglesia'`, `'miembroiglesia'`, `'tipocargo'`, `'usuariosistema'`, `'bitacora'`).
* Cualquier intento de acceso directo por URL a estas rutas globales por parte de un no-administrador debe ser interceptado y redirigido a `/no-autorizado`.

---

## 3. Mapeo Único de Privilegios

La fuente única de verdad para el mapeo de rutas Angular a autoridades del backend es la constante `ROUTE_VIEW_MAP` y `ROUTE_WRITE_MAP` en `privilegios.constants.ts`. Todo componente que implemente guards o validación de botones debe validar contra este mapeo para asegurar coherencia.

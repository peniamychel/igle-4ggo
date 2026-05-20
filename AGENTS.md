# AGENTS.md — Igle4 (Gestión de Iglesia)

## Stack

- **Framework:** Angular 18.2 standalone components
- **UI:** Angular Material 18.2
- **Charts:** ngx-charts 20.5 + angular-google-charts 16
- **HTTP:** HttpClient con interceptor Bearer token
- **Build:** Angular CLI 18.2
- **Test:** Jasmine 5 + Karma 6 (`npm test`)
- **No linter** configurado

## Arquitectura

```
main.ts → bootstrapApplication(AppComponent)
  └─ AppComponent → <router-outlet>
       └─ SidenavComponent (shell responsive, rutas hijas)
            └─ List components (tabla + MatDialog CRUD)
```

- Sin NgModules (excepto `AppRoutingModule` legacy)
- Sin lazy loading — todo eager
- Sin NgRx — solo BehaviorSubject en auth
- API base: `http://localhost:8092`

## Convenciones de código

### Estructura de archivos
```
feature/
  feature-list/          ← página principal (tabla)
  feature-create/        ← diálogo de creación
  feature-edit/          ← diálogo de edición
  feature-detail/        ← diálogo de solo lectura
```

### Nomenclatura
- **Archivos:** `kebab-case.type.ts` (ej. `persona.service.ts`, `auth.guard.ts`)
- **Clases:** PascalCase (`PersonaListComponent`)
- **Interfaces:** PascalCase (`PersonaResponse`, `LoginRequest`)
- **Funciones guard/interceptor:** camelCase (`authGuard`, `authInterceptor`)
- **Observables:** sufijo `$` (`users$`, `totalUsers$`)
- **Selectores:** `app-<nombre>` en kebab-case
- **Selectores de entrada de tabla:** `input` (template variable)

### Componentes
- `standalone: true` siempre
- `imports` array explícito con cada MaterialModule
- **CRUD mediante MatDialog** (no rutas separadas)
- Template: ReactiveForms con FormBuilder
- Diálogos: `width: '900px'`, `maxWidth: '95vw'`, `panelClass: 'dialog-fullscreen-mobile'`
- Diálogo de confirmación: `ConfirmDialogComponent` con `MAT_DIALOG_DATA`
- Notificaciones: `MatSnackBar` con duración 3000ms y clase `success-snackbar`

### Servicios
- `providedIn: 'root'`
- URL: `` `${environment.apiUrl}/api/<entity>/v1` ``
- Método `getHeaders()` privado con token de localStorage (aunque el interceptor ya lo hace)
- Métodos HTTP REST:
  - `findall` (GET)
  - `showbyid/{id}` (GET)
  - `create` (POST)
  - `update` (PUT)
  - `estado/{id}` (PATCH toggle)

### Modelos
- Interfaces (no clases)
- En `core/models/`, con subcarpeta `interfaces/` para DTOs compartidos
- Campos comunes: `id`, `estado` (boolean activo), `createdAt`, `updatedAt`
- Response wrapper: `{ message, datos, nombreModelo }` o `{ success, message, datos, nombreModelo }`

### Guards e Interceptors
- Guards como funciones `CanActivateFn` con `inject()`
- Interceptor como `HttpInterceptorFn`
- Token en localStorage: `auth_token`, `user_data`, `role`, `nombreuser`, `datosUsuario`

### Inyección de dependencias
- Mixto: algunos usan constructor `private`, otros `inject()`. Mantener consistencia dentro del mismo archivo.

## Rutas principales

| Ruta | Componente | Guard |
|---|---|---|
| `/` | DashboardComponent | — |
| `/persona` | PersonaListComponent | authGuard |
| `/miembro` | MiembroListComponent | authGuard |
| `/iglesia` | IglesiaListComponent | authGuard |
| `/miembroiglesia` | IglesiaMiembroListComponent | authGuard |
| `/cargo` | CargoListComponent | authGuard |
| `/tipocargo` | TipoCargoListComponent | authGuard |
| `/usuariosistema` | UserTableComponent | authGuard + adminGuard |

Varias rutas son placeholder (DashboardComponent): cambios-iglesia, solicitudes, eventos, bautizos, etc.

## Comandos

- `npm start` — servidor dev en :4200
- `npm run build` — build producción
- `npm test` — tests con Karma
- `npm run watch` — build dev con watch

## Roles del sistema

- `ADMIN` — acceso total
- `ENCARGADO_IGLESIA` — gestión de iglesia
- `ENCARGADO_EVENTO` — eventos
- `TESORERO` — finanzas

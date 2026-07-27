import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface HelpStep {
  text: string;
  icon?: string;
}

export interface HelpTopic {
  question: string;
  icon: string;
  steps: HelpStep[];
  tip?: string;
}

export interface HelpSection {
  label: string;
  icon: string;
  topics: HelpTopic[];
}

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.css']
})
export class AyudaComponent {
  sections: HelpSection[] = [
    {
      label: 'General',
      icon: 'home',
      topics: [
        {
          question: '¿Cómo iniciar sesión?',
          icon: 'login',
          steps: [
            { text: 'Abra el navegador e ingrese la dirección de la aplicación.', icon: 'open_in_browser' },
            { text: 'Ingrese su correo electrónico y contraseña en el formulario de acceso.', icon: 'email' },
            { text: 'Haga clic en el botón "Iniciar Sesión".', icon: 'touch_app' },
            { text: 'Si tiene múltiples congregaciones asignadas, seleccione la que desea administrar.', icon: 'church' }
          ],
          tip: 'Si olvidó su contraseña, contacte al administrador del sistema para restablecerla.'
        },
        {
          question: '¿Cómo navegar por el sistema?',
          icon: 'menu',
          steps: [
            { text: 'Use el menú lateral izquierdo para acceder a los diferentes módulos.', icon: 'menu' },
            { text: 'En dispositivos móviles, toque el ícono de menú (☰) en la barra superior para expandir el menú.', icon: 'smartphone' },
            { text: 'El módulo activo se resalta en el menú lateral con un color diferente.', icon: 'highlight' },
            { text: 'Muchos módulos agrupan sus funciones extra en un botón "Herramientas" y las acciones de cada fila en el menú de tres puntos (⋮).', icon: 'more_vert' }
          ]
        },
        {
          question: '¿Cómo cambiar entre modo claro y oscuro?',
          icon: 'dark_mode',
          steps: [
            { text: 'Localice el ícono de luna/sol (🌙/☀️) en la barra superior derecha.', icon: 'wb_sunny' },
            { text: 'Haga clic en él para alternar entre modo claro y modo oscuro.', icon: 'touch_app' },
            { text: 'El sistema guardará su preferencia automáticamente.', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo cambiar de congregación?',
          icon: 'swap_horiz',
          steps: [
            { text: 'Haga clic en su nombre o foto de perfil en la barra superior derecha.', icon: 'account_circle' },
            { text: 'En el menú desplegable, seleccione "Cambiar Congregación".', icon: 'church' },
            { text: 'Elija la congregación deseada de la lista.', icon: 'list' },
            { text: 'La vista se actualizará mostrando los datos de la nueva congregación.', icon: 'refresh' }
          ],
          tip: 'Esta opción solo aparece si tiene asignadas múltiples congregaciones.'
        },
        {
          question: '¿Qué significan los roles del sistema?',
          icon: 'badge',
          steps: [
            { text: 'ADMIN: Administrador global. Ve todas las iglesias y configura el sistema. En módulos como Inventario es solo de consulta y debe elegir una iglesia para ver sus datos.', icon: 'admin_panel_settings' },
            { text: 'PASTOR: Líder de una congregación local. Gestiona (crea, edita y elimina) miembros, eventos, ofrendas e inventario de SU iglesia.', icon: 'person' },
            { text: 'ENCARGADO DE IGLESIA: Rol similar al Pastor, con permisos de gestión sobre su congregación.', icon: 'manage_accounts' },
            { text: 'TESORERO: Acceso principalmente al módulo de Ofrendas y recursos financieros.', icon: 'monetization_on' },
            { text: 'DIÁCONO: Acceso al módulo de Inventario y bienes de la iglesia.', icon: 'inventory_2' }
          ],
          tip: 'Una iglesia debe tener primero un Pastor o Encargado asignado (módulo Obreros) para poder registrar miembros y demás datos.'
        }
      ]
    },
    {
      label: 'Miembros',
      icon: 'people',
      topics: [
        {
          question: '¿Cómo registrar un nuevo miembro? (Crear)',
          icon: 'person_add',
          steps: [
            { text: 'Navegue a "Miembros" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en el botón "Nuevo Miembro" (parte superior derecha).', icon: 'add_circle' },
            { text: 'Complete el formulario: nombre, apellido, CI, fecha de nacimiento, celular, sexo y dirección.', icon: 'edit' },
            { text: 'Registre los datos de conversión (fecha, lugar, interventores) si los tiene.', icon: 'volunteer_activism' },
            { text: 'Opcionalmente, adjunte una fotografía del miembro.', icon: 'photo_camera' },
            { text: 'Haga clic en "Guardar". El miembro queda vinculado a su iglesia activa.', icon: 'save' }
          ],
          tip: 'Los campos marcados con * son obligatorios. El CI no puede repetirse en el sistema.'
        },
        {
          question: '¿Cómo editar los datos de un miembro? (Editar)',
          icon: 'edit',
          steps: [
            { text: 'En "Miembros", busque el miembro con la barra de búsqueda.', icon: 'search' },
            { text: 'Abra el menú de tres puntos (⋮) al final de su fila.', icon: 'more_vert' },
            { text: 'Seleccione "Editar".', icon: 'edit' },
            { text: 'Modifique los campos necesarios en el formulario.', icon: 'tune' },
            { text: 'Haga clic en "Guardar" para confirmar los cambios.', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo eliminar un miembro? (Eliminar)',
          icon: 'delete',
          steps: [
            { text: 'En "Miembros", ubique al miembro en la lista.', icon: 'search' },
            { text: 'Abra el menú de tres puntos (⋮) de su fila.', icon: 'more_vert' },
            { text: 'Seleccione "Eliminar" (en rojo).', icon: 'delete' },
            { text: 'Confirme la acción en el diálogo de confirmación.', icon: 'check_circle' }
          ],
          tip: 'Requiere el privilegio "Escribir Miembros". Si el miembro tiene historial (certificados, cargos), considere revisarlo antes de eliminar.'
        },
        {
          question: '¿Cómo importar muchos miembros desde Excel? (Plantilla)',
          icon: 'upload_file',
          steps: [
            { text: 'En "Miembros", abra el botón "Herramientas".', icon: 'tune' },
            { text: 'Haga clic en "Descargar Plantilla Excel" y complete una fila por miembro.', icon: 'download' },
            { text: 'Respete las columnas (CI, Nombre, Apellido, Fecha Nacimiento, Celular, Sexo, etc.). El administrador además indica la iglesia por su nombre exacto.', icon: 'table_chart' },
            { text: 'Vuelva a "Herramientas" y elija "Importar desde Excel", luego seleccione el archivo.', icon: 'upload' },
            { text: 'Al finalizar verá un informe de miembros importados y omitidos (con el motivo).', icon: 'fact_check' }
          ],
          tip: 'Se omiten filas con CI repetido o sin datos obligatorios; el resto se importa igualmente.'
        },
        {
          question: '¿Cómo traspasar un miembro a otra iglesia?',
          icon: 'swap_horiz',
          steps: [
            { text: 'En "Miembros", abra el menú (⋮) del miembro y elija "Traspasar" (o use el módulo "Cambios Iglesia").', icon: 'swap_horiz' },
            { text: 'Seleccione la iglesia destino.', icon: 'church' },
            { text: 'Confirme el envío. El traspaso queda "Pendiente" hasta que el pastor destino lo apruebe.', icon: 'pending' }
          ],
          tip: 'Mientras esté Pendiente, el miembro no aparece en los reportes de ninguna iglesia.'
        },
        {
          question: '¿Cómo generar el directorio o carnets de miembros?',
          icon: 'contact_page',
          steps: [
            { text: 'En "Miembros", abra el botón "Herramientas".', icon: 'tune' },
            { text: 'Elija "Descargar Directorio PDF" para el listado, o la opción de carnets para las credenciales.', icon: 'picture_as_pdf' }
          ]
        }
      ]
    },
    {
      label: 'Obreros',
      icon: 'work',
      topics: [
        {
          question: '¿Qué es el módulo Obreros?',
          icon: 'groups',
          steps: [
            { text: 'Registra los cargos ministeriales de los miembros: Pastor, Encargado de Iglesia, Diácono, Tesorero, Líder de Jóvenes, etc.', icon: 'badge' },
            { text: 'Un mismo miembro puede tener un cargo asignado a una iglesia con fechas de vigencia.', icon: 'event_available' },
            { text: 'Una iglesia necesita un Pastor o Encargado asignado aquí para poder tener miembros y operar.', icon: 'church' }
          ]
        },
        {
          question: '¿Cómo asignar un cargo a un obrero? (Crear)',
          icon: 'add_circle',
          steps: [
            { text: 'Navegue a "Obreros" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "Nuevo Cargo".', icon: 'add_circle' },
            { text: 'Seleccione el miembro y el tipo de cargo ministerial.', icon: 'person' },
            { text: 'Indique la fecha de inicio y, si corresponde, un detalle o el acta de asignación.', icon: 'edit' },
            { text: 'Haga clic en "Guardar" para confirmar la asignación.', icon: 'save' }
          ],
          tip: 'Requiere el privilegio "Escribir Cargos".'
        },
        {
          question: '¿Cómo editar un cargo? (Editar)',
          icon: 'edit',
          steps: [
            { text: 'En "Obreros", abra el menú (⋮) del cargo.', icon: 'more_vert' },
            { text: 'Seleccione "Editar" (disponible solo en cargos activos).', icon: 'edit' },
            { text: 'Ajuste el tipo de cargo, fechas o detalle y guarde.', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo dar de baja a un obrero? (Desvincular / Eliminar)',
          icon: 'person_remove',
          steps: [
            { text: 'En "Obreros", abra el menú (⋮) del cargo.', icon: 'more_vert' },
            { text: 'Seleccione "Desvincular" para finalizar el cargo del obrero.', icon: 'person_remove' },
            { text: 'Confirme la acción. El cargo queda inactivo y deja de contar como vigente.', icon: 'check_circle' }
          ],
          tip: 'Desvincular no borra el historial: registra el fin del cargo ministerial.'
        },
        {
          question: '¿Cómo administrar los tipos de cargo ministerial?',
          icon: 'category',
          steps: [
            { text: 'En "Obreros", haga clic en el botón "Tipos de Ministerio".', icon: 'category' },
            { text: 'Revise, cree o edite los cargos ministeriales disponibles (Pastor, Diácono, Tesorero, etc.).', icon: 'edit' }
          ]
        }
      ]
    },
    {
      label: 'Eventos',
      icon: 'event',
      topics: [
        {
          question: '¿Cómo crear un nuevo evento? (Crear)',
          icon: 'event',
          steps: [
            { text: 'Navegue a "Eventos" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "Nuevo Evento".', icon: 'add_circle' },
            { text: 'Complete el nombre, tipo de evento, fechas de inicio y fin, ubicación y alcance.', icon: 'edit' },
            { text: 'Marque la casilla "Generar certificado" si el evento entregará certificados; se creará automáticamente su certificado en el módulo Certificaciones.', icon: 'workspace_premium' },
            { text: 'Opcionalmente asigne responsables del evento.', icon: 'person_add' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ],
          tip: 'Requiere el privilegio "Escribir Eventos".'
        },
        {
          question: '¿Cómo editar un evento? (Editar)',
          icon: 'edit',
          steps: [
            { text: 'En "Eventos", abra el menú (⋮) de la fila del evento.', icon: 'more_vert' },
            { text: 'Seleccione "Editar" y ajuste los datos necesarios.', icon: 'edit' },
            { text: 'Puede activar la generación de certificado si aún no la tenía.', icon: 'workspace_premium' },
            { text: 'Guarde los cambios.', icon: 'save' }
          ],
          tip: 'Si el evento ya tiene un certificado creado, no se puede quitar esa opción (el formulario lo indica).'
        },
        {
          question: '¿Cómo eliminar o archivar un evento? (Eliminar / Archivar)',
          icon: 'delete',
          steps: [
            { text: 'En "Eventos", abra el menú (⋮) del evento.', icon: 'more_vert' },
            { text: 'Use "Eliminar" para borrarlo definitivamente.', icon: 'delete' },
            { text: 'Solo se puede eliminar si NO tiene certificados ni participantes; si los tiene, aparece un aviso explicando por qué no se permite.', icon: 'block' },
            { text: 'Como alternativa, use "Archivar evento" para retirarlo de la lista activa sin borrar su información.', icon: 'archive' }
          ],
          tip: 'Los eventos archivados se pueden restaurar desde Herramientas → "Eventos archivados".'
        },
        {
          question: '¿Qué opciones ofrece el botón "Herramientas" de Eventos?',
          icon: 'tune',
          steps: [
            { text: 'Calendario anual: vista de calendario con los eventos por fecha y color según su tipo.', icon: 'calendar_month' },
            { text: 'Tipos de evento: administrar las categorías (Bautismo, Talleres, Evangelismo, etc.).', icon: 'category' },
            { text: 'Responsables: gestionar los responsables de los eventos.', icon: 'groups' },
            { text: 'Participaciones: ver y registrar la participación de los miembros en los eventos.', icon: 'how_to_reg' },
            { text: 'Eventos archivados: consultar y restaurar eventos previamente archivados.', icon: 'unarchive' }
          ]
        }
      ]
    },
    {
      label: 'Certificaciones',
      icon: 'workspace_premium',
      topics: [
        {
          question: '¿Cómo se crea un certificado?',
          icon: 'auto_awesome',
          steps: [
            { text: 'Los certificados ya NO se crean manualmente desde este módulo.', icon: 'info' },
            { text: 'Se generan automáticamente al crear (o editar) un evento con la casilla "Generar certificado" marcada.', icon: 'event' },
            { text: 'Cada certificado creado aparece en la lista "Gestión de Certificados".', icon: 'list' }
          ],
          tip: 'Si necesita un certificado nuevo, primero cree su evento con la opción de certificado activada.'
        },
        {
          question: '¿Qué significa la columna "Diseño" (Pendiente / Diseñado)?',
          icon: 'palette',
          steps: [
            { text: 'Pendiente: al certificado aún le falta diseñar su plantilla; todavía no se puede imprimir.', icon: 'schedule' },
            { text: 'Diseñado: la plantilla ya está lista y el certificado puede imprimirse o descargarse.', icon: 'check_circle' }
          ]
        },
        {
          question: '¿Cómo diseñar la plantilla de un certificado?',
          icon: 'design_services',
          steps: [
            { text: 'En "Certificaciones", abra el menú (⋮) del certificado.', icon: 'more_vert' },
            { text: 'Seleccione "Diseñar Plantilla".', icon: 'design_services' },
            { text: 'Configure el diseño (fondo, textos, posición de los datos) y guarde.', icon: 'save' },
            { text: 'El estado del diseño pasará de "Pendiente" a "Diseñado".', icon: 'check_circle' }
          ]
        },
        {
          question: '¿Cómo imprimir o descargar un certificado?',
          icon: 'picture_as_pdf',
          steps: [
            { text: 'Haga clic en la fila del certificado (o menú ⋮ → "Imprimir").', icon: 'print' },
            { text: 'Se abrirá la vista previa del certificado.', icon: 'visibility' },
            { text: 'Descárguelo en PDF desde esa vista.', icon: 'picture_as_pdf' }
          ],
          tip: 'Solo es posible imprimir si la plantilla ya está "Diseñada".'
        },
        {
          question: '¿Cómo editar, anular o eliminar un certificado?',
          icon: 'edit',
          steps: [
            { text: 'Abra el menú (⋮) del certificado.', icon: 'more_vert' },
            { text: '"Editar": ajusta los datos del certificado.', icon: 'edit' },
            { text: 'La opción de estado permite anular/activar el certificado.', icon: 'toggle_on' },
            { text: '"Eliminar" (en rojo): lo borra definitivamente.', icon: 'delete' }
          ]
        },
        {
          question: '¿Cómo verificar la validez de un certificado?',
          icon: 'verified',
          steps: [
            { text: 'En "Certificaciones", haga clic en "Verificar Certificado".', icon: 'verified' },
            { text: 'Escanee el código QR o ingrese el código único del certificado.', icon: 'qr_code_scanner' },
            { text: 'El sistema mostrará si el certificado es válido y sus datos.', icon: 'fact_check' }
          ]
        }
      ]
    },
    {
      label: 'Ofrendas',
      icon: 'monetization_on',
      topics: [
        {
          question: '¿Cómo registrar un ingreso (ofrenda o diezmo)? (Crear)',
          icon: 'add_circle',
          steps: [
            { text: 'Navegue a "Ofrendas" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "Registrar Ingreso".', icon: 'add_circle' },
            { text: 'Indique el concepto (ofrenda, diezmo, misiones, etc.), la fecha y el monto en Bs.', icon: 'edit' },
            { text: 'Opcionalmente añada un detalle.', icon: 'notes' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo registrar un egreso (gasto)? (Crear)',
          icon: 'remove_circle',
          steps: [
            { text: 'En "Ofrendas", haga clic en "Registrar Egreso".', icon: 'remove_circle' },
            { text: 'Indique el concepto del gasto (luz, agua, alquiler, materiales…), la fecha y el monto.', icon: 'edit' },
            { text: 'Guarde. El egreso se descuenta del flujo de caja.', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo editar o eliminar un movimiento? (Editar / Eliminar)',
          icon: 'edit',
          steps: [
            { text: 'Abra la pestaña "Ingresos y Egresos Detallados" (o expanda un mes en "Ingresos por Mes").', icon: 'list' },
            { text: 'Ubique el movimiento y abra el menú (⋮) de su fila.', icon: 'more_vert' },
            { text: 'Elija "Editar" para corregirlo o "Eliminar" (en rojo) para borrarlo.', icon: 'edit' }
          ]
        },
        {
          question: '¿Cómo generar reportes de ofrendas?',
          icon: 'bar_chart',
          steps: [
            { text: 'En "Ofrendas", abra la pestaña "Impresión de Informes".', icon: 'analytics' },
            { text: 'En "Configurar Parámetros del Reporte", elija el rango de fechas y filtros.', icon: 'date_range' },
            { text: 'Genere el informe en PDF o Excel.', icon: 'picture_as_pdf' }
          ],
          tip: 'El administrador puede generar el informe para varias iglesias a la vez (un archivo por sede).'
        }
      ]
    },
    {
      label: 'Inventario',
      icon: 'inventory_2',
      topics: [
        {
          question: '¿Cómo funciona el módulo por rol?',
          icon: 'info',
          steps: [
            { text: 'Pastor / Encargado: ve la pestaña "Registro de Bienes" y puede crear, editar, dar de baja y eliminar bienes de SU iglesia.', icon: 'edit' },
            { text: 'Administrador: ve la pestaña "Gestión Bienes" en modo solo lectura; primero debe seleccionar una iglesia para ver su inventario.', icon: 'visibility' }
          ],
          tip: 'El administrador no registra ni modifica bienes; solo consulta y genera informes.'
        },
        {
          question: '¿Cómo registrar un bien o activo? (Crear)',
          icon: 'add_box',
          steps: [
            { text: 'Navegue a "Inventario" y ubíquese en la pestaña "Registro de Bienes".', icon: 'menu' },
            { text: 'Haga clic en "Nuevo Activo".', icon: 'add_circle' },
            { text: 'Complete el nombre, código (se autogenera), descripción, cantidad y valor estimado.', icon: 'edit' },
            { text: 'Seleccione el estado de conservación: Bueno, Regular o Malo, y la fecha de adquisición.', icon: 'star_rate' },
            { text: 'Opcionalmente adjunte una fotografía del bien y haga clic en "Guardar".', icon: 'photo_camera' }
          ]
        },
        {
          question: '¿Cómo editar, eliminar o dar de baja un bien?',
          icon: 'edit',
          steps: [
            { text: 'En "Registro de Bienes", ubique el bien y use las acciones de su fila (o menú de acciones).', icon: 'more_vert' },
            { text: 'Editar (lápiz ✏️): modifica los datos del bien.', icon: 'edit' },
            { text: 'Dar de baja (archivo 📦 naranja): marca el bien como "BAJA" y lo excluye de los reportes activos; confirme en el diálogo.', icon: 'archive' },
            { text: 'Eliminar (🗑️): lo borra definitivamente.', icon: 'delete' }
          ],
          tip: 'Un bien dado de baja se puede reactivar con el ícono verde ✅ que aparece en su lugar. Estas acciones son exclusivas del Pastor/Encargado.'
        },
        {
          question: '¿Cómo imprimir el código único de uno o varios bienes?',
          icon: 'qr_code_2',
          steps: [
            { text: 'En "Registro de Bienes", marque la casilla de selección de los bienes que desea imprimir.', icon: 'check_box' },
            { text: 'Aparecerá el botón "Imprimir códigos (N)" junto al selector; haga clic en él.', icon: 'print' },
            { text: 'Se abrirá un modal con la vista previa de las etiquetas (no el diálogo de impresión del navegador).', icon: 'visibility' },
            { text: 'Haga clic en "Descargar PDF": todos los códigos seleccionados salen en un solo PDF.', icon: 'picture_as_pdf' }
          ],
          tip: 'Cada bien también tiene su acción individual de imprimir código, que abre el mismo modal de vista previa.'
        },
        {
          question: '¿Cómo generar el informe de inventario en PDF?',
          icon: 'summarize',
          steps: [
            { text: 'En "Inventario", abra la pestaña "Informes de Inventario".', icon: 'analytics' },
            { text: 'Si es administrador, seleccione primero la iglesia (no hay informe consolidado de todas).', icon: 'church' },
            { text: 'Use "Vista previa" para ver el informe en un modal y descargarlo desde ahí.', icon: 'visibility' },
            { text: 'O use el menú "Herramientas": Descargar PDF, Exportar a Excel o Limpiar filtros.', icon: 'tune' },
            { text: 'El administrador puede usar "Varias iglesias" para generar un PDF por cada sede.', icon: 'print' }
          ],
          tip: 'El informe cuenta la cantidad de BIENES por estado (no suma las unidades de cada bien).'
        }
      ]
    },
    {
      label: 'Informes',
      icon: 'assessment',
      topics: [
        {
          question: '¿Qué es el módulo Informes?',
          icon: 'insights',
          steps: [
            { text: 'Es un módulo dedicado para configurar y descargar reportes con gráficos de la iglesia.', icon: 'bar_chart' },
            { text: 'Tiene 5 pestañas: Miembros, Ofrendas, Eventos, Inventario y Certificaciones.', icon: 'tab' },
            { text: 'El Pastor/Encargado ve solo su iglesia; el Administrador puede elegir una iglesia o el consolidado.', icon: 'church' }
          ]
        },
        {
          question: '¿Cómo generar un informe con gráficos en PDF?',
          icon: 'picture_as_pdf',
          steps: [
            { text: 'Navegue a "Informes" y abra la pestaña del área deseada.', icon: 'menu' },
            { text: 'En la barra de configuración, ajuste los filtros (y la iglesia, si es administrador).', icon: 'tune' },
            { text: 'Revise la previsualización con los gráficos y tablas.', icon: 'visibility' },
            { text: 'Haga clic en "Descargar PDF" para obtener el informe con los gráficos incrustados.', icon: 'picture_as_pdf' }
          ]
        },
        {
          question: '¿Qué gráficos incluye cada pestaña?',
          icon: 'donut_large',
          steps: [
            { text: 'Miembros: crecimiento en el tiempo, género (hombres/mujeres) y grupos etarios (niños, adolescentes, jóvenes, adultos).', icon: 'groups' },
            { text: 'Ofrendas: ingresos por mes y resumen económico.', icon: 'payments' },
            { text: 'Eventos: participación por tipo de evento.', icon: 'event' },
            { text: 'Inventario: bienes por estado de conservación.', icon: 'inventory_2' },
            { text: 'Certificaciones: certificados por tipo de evento.', icon: 'workspace_premium' }
          ]
        },
        {
          question: '¿Cómo imprimir informes de varias iglesias a la vez? (Solo ADMIN)',
          icon: 'print',
          steps: [
            { text: 'En la pestaña deseada, haga clic en "Varias iglesias".', icon: 'print' },
            { text: 'Marque en la lista las iglesias de las que quiere el informe.', icon: 'checklist' },
            { text: 'Inicie la generación; una barra de progreso irá creando un PDF por cada iglesia seleccionada.', icon: 'hourglass_top' }
          ],
          tip: 'Se genera un archivo PDF por sede, con el mismo tipo de informe de la pestaña activa.'
        }
      ]
    },
    {
      label: 'Iglesias',
      icon: 'church',
      topics: [
        {
          question: '¿Cómo ver el listado de iglesias?',
          icon: 'list',
          steps: [
            { text: 'Navegue a "Iglesias" en el menú lateral.', icon: 'menu' },
            { text: 'Verá la lista de las iglesias registradas en el sistema.', icon: 'church' },
            { text: 'Haga clic en el ícono de ojo 👁️ para ver los detalles de una iglesia.', icon: 'visibility' }
          ],
          tip: 'Solo el Administrador ve todas las iglesias; los pastores ven únicamente su congregación.'
        },
        {
          question: '¿Cómo registrar una nueva iglesia? (Solo ADMIN)',
          icon: 'add_business',
          steps: [
            { text: 'Con rol ADMIN, navegue a "Iglesias".', icon: 'admin_panel_settings' },
            { text: 'Haga clic en "Nueva Iglesia".', icon: 'add_circle' },
            { text: 'Complete los datos: nombre, dirección, teléfono y ubicación.', icon: 'edit' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ],
          tip: 'Recuerde asignar luego un Pastor o Encargado a la iglesia (módulo Obreros) para que pueda operar.'
        }
      ]
    },
    {
      label: 'Sistema',
      icon: 'settings',
      topics: [
        {
          question: '¿Cómo editar mi perfil y foto?',
          icon: 'manage_accounts',
          steps: [
            { text: 'Haga clic en su nombre en la barra superior y seleccione "Mi Perfil" (o vaya a "Perfil" en el menú).', icon: 'account_circle' },
            { text: 'Haga clic en el botón de edición (lápiz ✏️).', icon: 'edit' },
            { text: 'Modifique su nombre, apellido y datos personales.', icon: 'person' },
            { text: 'Para cambiar la foto, haga clic sobre la imagen actual y seleccione una nueva.', icon: 'photo_camera' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo acceder a la configuración del sistema?',
          icon: 'tune',
          steps: [
            { text: 'Navegue a "Configuración" en el menú lateral.', icon: 'settings' },
            { text: 'Encontrará opciones de auditoría, plantillas y preferencias del sistema.', icon: 'tune' }
          ],
          tip: 'Algunas opciones están disponibles solo para ciertos roles.'
        },
        {
          question: '¿Cómo gestionar usuarios del sistema? (Solo ADMIN)',
          icon: 'switch_account',
          steps: [
            { text: 'Con rol ADMIN, navegue a "Administración → Usuarios Sistema".', icon: 'admin_panel_settings' },
            { text: 'Verá la lista de todos los usuarios registrados.', icon: 'list' },
            { text: 'Use "Nuevo Usuario" para crear cuentas de acceso.', icon: 'person_add' },
            { text: 'Asigne el rol y las iglesias correspondientes a cada usuario.', icon: 'church' },
            { text: 'Use el ícono de llave 🔑 para gestionar sus privilegios.', icon: 'key' }
          ]
        },
        {
          question: '¿Cómo asignar privilegios a un usuario? (Solo ADMIN)',
          icon: 'key',
          steps: [
            { text: 'En "Usuarios Sistema", haga clic en el ícono de privilegios del usuario.', icon: 'key' },
            { text: 'Se abrirá el panel de privilegios con las acciones por módulo.', icon: 'grid_view' },
            { text: 'Active o desactive los permisos de Ver, Crear, Editar y Eliminar por módulo.', icon: 'check_box' },
            { text: 'Los cambios se guardan automáticamente al activar/desactivar cada permiso.', icon: 'save' }
          ],
          tip: 'El Administrador tiene todos los privilegios por defecto y no puede modificarse.'
        }
      ]
    }
  ];

  searchQuery: string = '';
  filteredTopics: HelpTopic[] = [];

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchQuery = query;
    if (!query) {
      this.filteredTopics = [];
      return;
    }

    const results: HelpTopic[] = [];
    this.sections.forEach(section => {
      section.topics.forEach(topic => {
        const questionMatch = topic.question.toLowerCase().includes(query);
        const stepsMatch = topic.steps.some(step => step.text.toLowerCase().includes(query));
        const tipMatch = topic.tip ? topic.tip.toLowerCase().includes(query) : false;

        if (questionMatch || stepsMatch || tipMatch) {
          results.push(topic);
        }
      });
    });
    this.filteredTopics = results;
  }
}

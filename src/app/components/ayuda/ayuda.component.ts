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
            { text: 'Use el botón "Atrás" del navegador o los breadcrumbs para regresar.', icon: 'arrow_back' }
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
            { text: 'ADMIN: Administrador global con acceso a todas las iglesias y configuraciones del sistema.', icon: 'admin_panel_settings' },
            { text: 'PASTOR: Líder de una congregación local. Gestiona miembros, eventos, ofrendas e inventario de su iglesia.', icon: 'person' },
            { text: 'ENCARGADO DE IGLESIA: Rol similar al Pastor con permisos de gestión local.', icon: 'manage_accounts' },
            { text: 'TESORERO: Acceso principalmente al módulo de Ofrendas y recursos financieros.', icon: 'monetization_on' },
            { text: 'DIÁCONO: Acceso al módulo de Inventario y bienes de la iglesia.', icon: 'inventory_2' }
          ]
        }
      ]
    },
    {
      label: 'Miembros',
      icon: 'people',
      topics: [
        {
          question: '¿Cómo registrar un nuevo miembro?',
          icon: 'person_add',
          steps: [
            { text: 'Navegue a "Miembros" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en el botón "+ Nuevo Miembro" en la parte superior derecha.', icon: 'add_circle' },
            { text: 'Complete el formulario con los datos personales: nombre, cédula, fecha de nacimiento, teléfono.', icon: 'edit' },
            { text: 'Opcionalmente, adjunte una fotografía del miembro.', icon: 'photo_camera' },
            { text: 'Haga clic en "Guardar" para registrar el miembro.', icon: 'save' }
          ],
          tip: 'Todos los campos marcados con * son obligatorios.'
        },
        {
          question: '¿Cómo editar los datos de un miembro?',
          icon: 'edit',
          steps: [
            { text: 'Navegue a "Miembros" en el menú lateral.', icon: 'menu' },
            { text: 'Busque el miembro usando la barra de búsqueda o desplazándose por la lista.', icon: 'search' },
            { text: 'Haga clic en el ícono de lápiz ✏️ (Editar) en la fila del miembro.', icon: 'edit' },
            { text: 'Modifique los campos necesarios en el formulario.', icon: 'tune' },
            { text: 'Haga clic en "Guardar" para confirmar los cambios.', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo buscar y filtrar miembros?',
          icon: 'search',
          steps: [
            { text: 'En el módulo "Miembros", utilice la barra de búsqueda en la parte superior.', icon: 'search' },
            { text: 'Escriba el nombre, cédula o cualquier dato del miembro para filtrar en tiempo real.', icon: 'keyboard' },
            { text: 'La tabla se actualizará mostrando solo los miembros que coincidan con la búsqueda.', icon: 'filter_list' },
            { text: 'Para limpiar el filtro, borre el texto de búsqueda o presione la "X".', icon: 'clear' }
          ]
        },
        {
          question: '¿Cómo traspasar un miembro a otra iglesia?',
          icon: 'swap_horiz',
          steps: [
            { text: 'Navegue a "Cambios Iglesia" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "+ Nuevo Traspaso".', icon: 'add_circle' },
            { text: 'Seleccione el miembro que desea traspasar de la lista.', icon: 'person' },
            { text: 'Seleccione la iglesia destino.', icon: 'church' },
            { text: 'Confirme el envío. El miembro quedará en estado "Pendiente" hasta que el pastor destino apruebe.', icon: 'pending' }
          ],
          tip: 'El miembro no aparecerá en los reportes de ninguna iglesia mientras esté en estado Pendiente.'
        },
        {
          question: '¿Cómo aprobar solicitudes de traspaso entrantes?',
          icon: 'mark_email_unread',
          steps: [
            { text: 'Recibirá una notificación (campana 🔔) en la barra superior cuando haya solicitudes pendientes.', icon: 'notifications' },
            { text: 'Haga clic en la notificación o navegue a "Solicitudes" en el menú.', icon: 'menu' },
            { text: 'Revise los datos del miembro que solicita el traspaso.', icon: 'visibility' },
            { text: 'Haga clic en "Aprobar" para aceptar o "Rechazar" para denegar el traspaso.', icon: 'check_circle' }
          ]
        },
        {
          question: '¿Cómo ver los miembros de mi iglesia? (Mis Miembros)',
          icon: 'people_alt',
          steps: [
            { text: 'Navegue a "Mis Miembros" en el menú lateral.', icon: 'menu' },
            { text: 'Verá el listado completo de miembros activos de su congregación.', icon: 'list' },
            { text: 'Puede filtrar por nombre o usar las opciones de paginación.', icon: 'filter_list' }
          ],
          tip: 'Este módulo solo muestra los miembros de su iglesia activa actual.'
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
            { text: 'Verá la lista de todas las iglesias registradas en el sistema.', icon: 'church' },
            { text: 'Haga clic en el ícono de ojo 👁️ para ver los detalles de una iglesia.', icon: 'visibility' }
          ],
          tip: 'Solo el Administrador puede ver todas las iglesias. Los pastores ven únicamente su congregación.'
        },
        {
          question: '¿Cómo registrar una nueva iglesia? (Solo ADMIN)',
          icon: 'add_business',
          steps: [
            { text: 'Con rol ADMIN, navegue a "Iglesias" en el menú lateral.', icon: 'admin_panel_settings' },
            { text: 'Haga clic en "+ Nueva Iglesia".', icon: 'add_circle' },
            { text: 'Complete los datos: nombre, dirección, pastor asignado.', icon: 'edit' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo gestionar los obreros y cargos ministeriales?',
          icon: 'work',
          steps: [
            { text: 'Navegue a "Obreros" en el menú lateral.', icon: 'menu' },
            { text: 'Verá el listado de todos los obreros con sus cargos ministeriales.', icon: 'list' },
            { text: 'Use el botón "+ Nuevo Cargo" para asignar un cargo ministerial a un miembro.', icon: 'add_circle' },
            { text: 'Seleccione el miembro, el tipo de cargo y las fechas de vigencia.', icon: 'edit' },
            { text: 'Haga clic en "Guardar" para confirmar la asignación.', icon: 'save' }
          ]
        }
      ]
    },
    {
      label: 'Eventos',
      icon: 'event',
      topics: [
        {
          question: '¿Cómo crear un nuevo evento?',
          icon: 'event',
          steps: [
            { text: 'Navegue a "Eventos" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "+ Nuevo Evento".', icon: 'add_circle' },
            { text: 'Complete el nombre, tipo de evento, fecha, hora y lugar.', icon: 'edit' },
            { text: 'Opcionalmente, asigne responsables del evento.', icon: 'person_add' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo usar el calendario de eventos?',
          icon: 'calendar_month',
          steps: [
            { text: 'En el módulo "Eventos", cambie a la vista de calendario usando los tabs o botones de vista.', icon: 'calendar_month' },
            { text: 'Navegue entre meses usando las flechas del calendario.', icon: 'chevron_right' },
            { text: 'Haga clic en un día para ver los eventos de esa fecha.', icon: 'touch_app' },
            { text: 'Los eventos se muestran con colores según su tipo (nacional, local, aniversario).', icon: 'palette' }
          ]
        },
        {
          question: '¿Cómo emitir un certificado?',
          icon: 'workspace_premium',
          steps: [
            { text: 'Navegue a "Certificaciones" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "+ Nuevo Certificado".', icon: 'add_circle' },
            { text: 'Seleccione el tipo de certificado (Bautismo, Dedicación, etc.).', icon: 'list' },
            { text: 'Seleccione el miembro para quien se emite el certificado.', icon: 'person' },
            { text: 'Complete la fecha y el pastor certificante.', icon: 'edit' },
            { text: 'Haga clic en "Generar PDF" para descargar el certificado.', icon: 'picture_as_pdf' }
          ],
          tip: 'Puede personalizar el diseño del certificado en el módulo de Configuración.'
        }
      ]
    },
    {
      label: 'Recursos',
      icon: 'inventory_2',
      topics: [
        {
          question: '¿Cómo registrar una ofrenda o diezmo?',
          icon: 'monetization_on',
          steps: [
            { text: 'Navegue a "Ofrendas" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en "+ Nueva Ofrenda".', icon: 'add_circle' },
            { text: 'Seleccione el tipo (ofrenda, diezmo, etc.), la fecha y el monto en Bs.', icon: 'edit' },
            { text: 'Opcionalmente añada una descripción o concepto.', icon: 'notes' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo generar reportes de ofrendas?',
          icon: 'bar_chart',
          steps: [
            { text: 'En el módulo "Ofrendas", diríjase al tab "Informes".', icon: 'analytics' },
            { text: 'Seleccione el rango de fechas y los filtros deseados.', icon: 'date_range' },
            { text: 'Haga clic en "Generar PDF" o "Exportar Excel".', icon: 'picture_as_pdf' }
          ]
        },
        {
          question: '¿Cómo registrar un bien o activo del inventario?',
          icon: 'add_box',
          steps: [
            { text: 'Navegue a "Inventario" en el menú lateral.', icon: 'menu' },
            { text: 'En la pestaña "Registro de Bienes", haga clic en "+ Nuevo Activo".', icon: 'add_circle' },
            { text: 'Complete el nombre, código, descripción, cantidad y valor estimado.', icon: 'edit' },
            { text: 'Seleccione el estado de conservación: Bueno, Regular o Malo.', icon: 'star_rate' },
            { text: 'Opcionalmente adjunte una fotografía del bien.', icon: 'photo_camera' },
            { text: 'Haga clic en "Guardar".', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo dar de baja un activo?',
          icon: 'archive',
          steps: [
            { text: 'En el módulo "Inventario", localice el bien en la tabla.', icon: 'search' },
            { text: 'Haga clic en el ícono naranja de archivo 📦 en la columna "Acciones".', icon: 'archive' },
            { text: 'Confirme la acción en el diálogo de confirmación.', icon: 'check_circle' },
            { text: 'El bien quedará marcado como "BAJA" y se excluirá de los reportes activos.', icon: 'do_not_disturb' }
          ],
          tip: 'Puede reactivar un bien dado de baja haciendo clic en el ícono verde ✅ que aparece en su lugar.'
        },
        {
          question: '¿Cómo generar el reporte de inventario en PDF?',
          icon: 'picture_as_pdf',
          steps: [
            { text: 'En el módulo "Inventario", diríjase al tab "Informes de Inventario".', icon: 'analytics' },
            { text: 'Seleccione la iglesia (si es administrador) o verá automáticamente la suya.', icon: 'church' },
            { text: 'Haga clic en "Exportar PDF" para descargar el informe formal.', icon: 'picture_as_pdf' },
            { text: 'El PDF incluye el membrete, resumen de estados y listado de bienes sin columna sede.', icon: 'description' }
          ],
          tip: 'Solo se puede imprimir una iglesia a la vez. El Administrador debe seleccionar la iglesia antes de exportar.'
        },
        {
          question: '¿Cómo imprimir el código único de un bien?',
          icon: 'print',
          steps: [
            { text: 'Localice el bien en la tabla del módulo "Inventario".', icon: 'search' },
            { text: 'Haga clic en el ícono violeta de impresora 🖨️ en la columna "Acciones".', icon: 'print' },
            { text: 'Se abrirá una ventana de impresión con el código único del bien.', icon: 'open_in_new' },
            { text: 'Confirme la impresión en su navegador.', icon: 'check' }
          ]
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
            { text: 'Haga clic en su nombre en la barra superior y seleccione "Mi Perfil".', icon: 'account_circle' },
            { text: 'O navegue directamente a "Perfil" en el menú lateral.', icon: 'menu' },
            { text: 'Haga clic en el botón de edición (lápiz ✏️).', icon: 'edit' },
            { text: 'Modifique su nombre, apellido y otros datos personales.', icon: 'person' },
            { text: 'Para cambiar la foto, haga clic sobre la imagen actual y seleccione una nueva.', icon: 'photo_camera' },
            { text: 'Haga clic en "Guardar" para confirmar los cambios.', icon: 'save' }
          ]
        },
        {
          question: '¿Cómo acceder a la configuración del sistema?',
          icon: 'tune',
          steps: [
            { text: 'Navegue a "Configuración" en el menú lateral.', icon: 'settings' },
            { text: 'Encontrará opciones de auditoría, plantillas y preferencias del sistema.', icon: 'tune' }
          ],
          tip: 'Algunas opciones de configuración están disponibles solo para ciertos roles.'
        },
        {
          question: '¿Cómo gestionar usuarios del sistema? (Solo ADMIN)',
          icon: 'switch_account',
          steps: [
            { text: 'Con rol ADMIN, navegue a "Administración → Usuarios Sistema".', icon: 'admin_panel_settings' },
            { text: 'Verá la lista de todos los usuarios registrados.', icon: 'list' },
            { text: 'Use "+ Nuevo Usuario" para crear cuentas de acceso.', icon: 'person_add' },
            { text: 'Asigne el rol y las iglesias correspondientes a cada usuario.', icon: 'church' },
            { text: 'Use el ícono de llave 🔑 para gestionar los privilegios del usuario.', icon: 'key' }
          ]
        },
        {
          question: '¿Cómo asignar privilegios a un usuario? (Solo ADMIN)',
          icon: 'key',
          steps: [
            { text: 'En "Usuarios Sistema", haga clic en el ícono de privilegios del usuario.', icon: 'key' },
            { text: 'Se abrirá el panel de privilegios con las acciones disponibles por módulo.', icon: 'grid_view' },
            { text: 'Active o desactive los permisos de Ver, Crear, Editar y Eliminar por módulo.', icon: 'check_box' },
            { text: 'Los cambios se guardan automáticamente al activar/desactivar cada permiso.', icon: 'save' }
          ],
          tip: 'El Administrador tiene todos los privilegios por defecto y no puede ser modificado.'
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

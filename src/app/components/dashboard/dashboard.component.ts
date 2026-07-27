import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/security/auth.service';
import { MiembroService } from '../../core/services/miembro.service';
import { IglesiaService } from '../../core/services/iglesia.service';
import { EventoService } from '../../core/services/evento.service';
import { TipoEventoService } from '../../core/services/tipo-evento.service';
import { MiembroIglesiaService } from '../../core/services/miembro-iglesia.service';
import { UserService } from '../../core/services/user.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { ParticipacionEventoService } from '../../core/services/participacion-evento.service';
import { Evento } from '../../core/models/evento.model';
import { Certificado } from '../../core/models/certificado.model';
import { Iglesia } from '../../core/models/iglesia.model';
import { EventoCalendarioComponent } from '../admin/evento/evento-calendario/evento-calendario.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxChartsModule,
    RouterLink,
    EventoCalendarioComponent
  ]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private miembroService = inject(MiembroService);
  private iglesiaService = inject(IglesiaService);
  private eventoService = inject(EventoService);
  private tipoEventoService = inject(TipoEventoService);
  private miembroIglesiaService = inject(MiembroIglesiaService);
  private userService = inject(UserService);
  private certificadoService = inject(CertificadoService);
  private participacionService = inject(ParticipacionEventoService);

  isAdmin = false;
  isPastor = false;
  currentChurchName = 'Mi Iglesia';
  currentChurchId: number | null = null;
  currentDate = '';
  canViewEvents = false;
  canViewIglesias = false;

  // Selector de iglesia (para Admin)
  iglesias: Iglesia[] = [];
  selectedIglesiaId: any = 'all';

  // Caches de datos reales
  allMembersCache: any[] = [];
  allEventsCache: Evento[] = [];
  allCertificadosCache: Certificado[] = [];
  allParticipacionesCache: any[] = [];

  // KPIs
  totalMembers = 0;
  totalChurches = 0;
  totalUsers = 0;
  totalCertificados = 0;
  entregadosCertificados = 0;
  pendientesCertificados = 0;
  totalEventsMonth = 0;

  // Recent Activity Tabs
  activeTab: 'traspasos' | 'certificados' = 'traspasos';
  pendingTraspasosCount = 0;

  // Actividad reciente unificada (certificados + eventos + traspasos)
  recentActivities: any[] = [];
  activityLimit = 10;
  activityOptions = [10, 20, 30];

  // Dynamic lists
  recentTraspasos: any[] = [];
  recentCertificados: any[] = [];
  upcomingEvents: any[] = [];

  // Chart datasets
  membresiaGrowthData: any[] = [];
  eventosTipoData: any[] = [];
  // Mapa id->nombre de tipos de evento (el backend solo envía tipoEventoId en la lista)
  private tiposEventoMap = new Map<number, string>();

  // Selector de escala del gráfico de crecimiento de membresía
  growthRange: 'semana' | 'mes' | '1a' | '2a' | '3a' | '5a' = 'mes';
  growthRangeOptions = [
    { value: 'semana', label: 'Por semana' },
    { value: 'mes', label: 'Por mes' },
    { value: '1a', label: '1 año' },
    { value: '2a', label: '2 años' },
    { value: '3a', label: '3 años' },
    { value: '5a', label: '5 años' }
  ];
  private growthMembers: any[] = [];
  topIglesiasData: any[] = [];
  certificadosEmitidosData: any[] = [];

  // ngx-charts configurations (adaptativas según pantalla)
  viewArea: [number, number] = [500, 240];
  viewDonut: [number, number] = [220, 220];
  viewHorizontalBar: [number, number] = [500, 240];
  viewGroupedBar: [number, number] = [500, 240];

  purpleScheme: any = { domain: ['#7c4dff'] };
  donutScheme: any = { domain: ['#7c4dff', '#00bfa5', '#ff6d00', '#d500f9', '#00c853'] };
  certificatesScheme: any = { domain: ['#7c4dff', '#00bfa5'] };

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateChartDimensions();
  }

  updateChartDimensions(): void {
    const screenWidth = window.innerWidth;
    if (screenWidth < 600) {
      const chartWidth = Math.max(screenWidth - 72, 260);
      this.viewArea = [chartWidth, 200];
      this.viewHorizontalBar = [chartWidth, 200];
      this.viewGroupedBar = [chartWidth, 200];
      this.viewDonut = [180, 180];
    } else if (screenWidth < 992) {
      const chartWidth = Math.max(screenWidth - 96, 340);
      this.viewArea = [chartWidth, 220];
      this.viewHorizontalBar = [chartWidth, 220];
      this.viewGroupedBar = [chartWidth, 220];
      this.viewDonut = [200, 200];
    } else {
      this.viewArea = [500, 240];
      this.viewHorizontalBar = [500, 240];
      this.viewGroupedBar = [500, 240];
      this.viewDonut = [220, 220];
    }
  }

  ngOnInit(): void {
    this.updateChartDimensions();
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.isPastor = !this.isAdmin;
    this.currentChurchId = this.authService.getCurrentIglesiaId();
    this.currentChurchName = this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia';

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateObj = new Date();
    this.currentDate = dateObj.toLocaleDateString('es-ES', options);
    this.currentDate = this.currentDate.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    this.canViewEvents = this.authService.hasPrivilegio('Ver Eventos');
    this.canViewIglesias = this.authService.hasPrivilegio('Ver Iglesias');

    this.loadAllData();
  }

  /** Nombre del tipo de evento: se resuelve por id desde el mapa de tipos. */
  private nombreTipoEvento(e: any): string {
    if (e?.tipoEventoId != null && this.tiposEventoMap.has(e.tipoEventoId)) {
      return this.tiposEventoMap.get(e.tipoEventoId)!;
    }
    return e?.tipoEventoDto?.nombre || 'Sin tipo';
  }

  loadAllData(): void {
    const obs: any = {};

    if (this.canViewIglesias) {
      obs.iglesias = this.iglesiaService.getIglesias();
    }
    if (this.canViewEvents) {
      obs.eventos = this.eventoService.getEventos();
      obs.tiposEvento = this.tipoEventoService.getTipoEventos();
    }
    if (this.authService.hasPrivilegio('Ver Miembros')) {
      obs.miembros = this.miembroService.getMiembros();
    }
    if (this.authService.hasPrivilegio('Ver Certificados')) {
      obs.certificados = this.certificadoService.getCertificados();
    }
    // El endpoint de participaciones exige el privilegio de eventos (EVENTOS:VER).
    if (this.authService.hasPrivilegio('Ver Certificados') && this.authService.hasPrivilegio('Ver Eventos')) {
      obs.participaciones = this.participacionService.getParticipaciones();
    }
    if (this.isAdmin) {
      obs.users = this.userService.getAllUsers();
    }

    if (Object.keys(obs).length === 0) {
      this.loadTopIglesiasChart();
      this.loadMembersData();
      this.processMetricsAndCharts();
      return;
    }

    forkJoin(obs).subscribe({
      next: (results: any) => {
        if (results.iglesias && results.iglesias.datos) {
          this.iglesias = results.iglesias.datos.filter((i: Iglesia) => i.estado);
          this.totalChurches = this.isAdmin ? this.iglesias.length : 1;
        } else {
          this.totalChurches = 1;
        }

        if (results.users && results.users.datos) {
          this.totalUsers = results.users.datos.length;
        }

        if (results.miembros && results.miembros.datos) {
          this.allMembersCache = results.miembros.datos;
        }

        if (results.tiposEvento && results.tiposEvento.datos) {
          this.tiposEventoMap.clear();
          results.tiposEvento.datos.forEach((t: any) => {
            if (t.id != null) this.tiposEventoMap.set(t.id, t.nombre);
          });
        }

        if (results.eventos && results.eventos.datos) {
          this.allEventsCache = results.eventos.datos;
        } else {
          this.allEventsCache = [];
        }

        if (results.certificados && results.certificados.datos) {
          this.allCertificadosCache = results.certificados.datos;
        }

        if (results.participaciones && results.participaciones.datos) {
          this.allParticipacionesCache = results.participaciones.datos;
        } else {
          this.allParticipacionesCache = [];
        }

        this.loadTopIglesiasChart();
        this.loadMembersData();
        this.processMetricsAndCharts();
      },
      error: (err) => console.error('Error cargando datos del dashboard:', err)
    });
  }

  onIglesiaChange(): void {
    this.loadMembersData();
    this.processMetricsAndCharts();
  }

  loadMembersData(): void {
    if (!this.isAdmin) {
      // Usuario Local: Cargar miembros asignados a la iglesia del usuario autenticado
      this.miembroIglesiaService.getMisMiembros().subscribe({
        next: (res) => {
          const miembros = res.datos || [];
          this.totalMembers = miembros.length;
          this.buildMembresiaGrowthChart(miembros);
        },
        error: (err) => {
          console.error('Error cargando miembros locales:', err);
          this.totalMembers = 0;
          this.buildMembresiaGrowthChart([]);
        }
      });
    } else if (this.selectedIglesiaId === 'all') {
      // Admin Global: Cargar todos los miembros
      this.miembroService.getMiembros().subscribe({
        next: (res) => {
          const miembros = res.datos || [];
          this.totalMembers = miembros.length;
          this.buildMembresiaGrowthChart(miembros);
        },
        error: (err) => {
          console.error('Error cargando miembros globales:', err);
          this.totalMembers = 0;
          this.buildMembresiaGrowthChart([]);
        }
      });
    } else {
      // Admin Filtrado: Cargar miembros de la iglesia seleccionada
      const idIglesia = Number(this.selectedIglesiaId);
      this.miembroIglesiaService.getMiembrosPorIglesia(idIglesia).subscribe({
        next: (res) => {
          const miembros = res.datos || [];
          this.totalMembers = miembros.length;
          this.buildMembresiaGrowthChart(miembros);
        },
        error: (err) => {
          console.error('Error cargando miembros por iglesia:', err);
          this.totalMembers = 0;
          this.buildMembresiaGrowthChart([]);
        }
      });
    }
  }

  processMetricsAndCharts(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentChurchNum = this.currentChurchId ? Number(this.currentChurchId) : null;
    const selectedChurchNum = (this.selectedIglesiaId !== 'all') ? Number(this.selectedIglesiaId) : null;
    const targetChurchId = !this.isAdmin ? currentChurchNum : selectedChurchNum;

    // 2. Filtrar eventos
    let filteredEvents = [...this.allEventsCache];
    if (targetChurchId) {
      filteredEvents = filteredEvents.filter(e => !e.iglesiaId || Number(e.iglesiaId) === targetChurchId);
    }

    this.totalEventsMonth = filteredEvents.filter(e => {
      if (!e.fechaInicio) return false;
      const d = new Date(e.fechaInicio);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    this.upcomingEvents = filteredEvents
      .filter(e => e.fechaInicio && new Date(e.fechaInicio) >= now)
      .map(e => ({
        id: e.id,
        nombre: e.nombre,
        ubicacion: e.ubicacion || 'Templo Central',
        tipo: this.nombreTipoEvento(e),
        fechaInicio: new Date(e.fechaInicio!),
        participantes: null
      }))
      .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime())
      .slice(0, 4);

    // Donut chart
    const tiposMap = new Map<string, number>();
    filteredEvents.forEach(e => {
      const tipoNombre = this.nombreTipoEvento(e);
      tiposMap.set(tipoNombre, (tiposMap.get(tipoNombre) || 0) + 1);
    });

    const totalEvt = filteredEvents.length || 1;
    this.eventosTipoData = Array.from(tiposMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: `${Math.round((value / totalEvt) * 100)}%`
    }));

    if (this.eventosTipoData.length === 0) {
      this.eventosTipoData = [
        { name: 'Sin eventos', value: 1, percentage: '100%' }
      ];
    }

    // 3. Certificados: emitidos vs entregados se cuentan a nivel de PARTICIPACIÓN
    // (cada participante en un evento con certificado activo). La entrega vive en
    // participacion_evento.entregado (no en certificado.estado).
    let filteredCerts = [...this.allCertificadosCache];
    if (this.allParticipacionesCache.length > 0) {
      const eventosConCertificado = new Set<number>(
        filteredCerts.filter(c => c.estado !== false && c.eventoId != null).map(c => c.eventoId)
      );
      const certParticipaciones = this.allParticipacionesCache.filter(
        p => p?.eventoId != null && eventosConCertificado.has(p.eventoId)
      );
      this.totalCertificados = certParticipaciones.length;
      this.entregadosCertificados = certParticipaciones.filter(p => p.entregado === true).length;
      this.pendientesCertificados = this.totalCertificados - this.entregadosCertificados;
    } else {
      // Fallback (sin acceso a participaciones): conteo de certificados registrados.
      this.totalCertificados = filteredCerts.length;
      this.entregadosCertificados = filteredCerts.filter(c => c.estado === true).length;
      this.pendientesCertificados = this.totalCertificados - this.entregadosCertificados;
    }

    this.recentCertificados = filteredCerts.slice(0, 4).map((c: any) => ({
      id: c.id,
      miembroNombre: c.miembroDto ? `${c.miembroDto.nombre} ${c.miembroDto.apellido}` : (c.eventoDto?.nombre || 'Certificado Emitido'),
      ci: c.miembroDto?.ci || 'S/N',
      evento: c.motivoCertificado || c.lugarEmision || 'Emisión Registrada',
      estado: c.estado ? 'ENTREGADO' : 'PENDIENTE',
      fecha: c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : 'Reciente'
    }));

    // 4. Traspasos pendientes
    if (targetChurchId) {
      this.miembroIglesiaService.getSolicitudesPendientes(targetChurchId).subscribe({
        next: (res) => {
          if (res && res.datos) {
            this.recentTraspasos = res.datos.map((item: any) => ({
              id: item.id,
              miembroNombre: item.miembroNombre || 'Miembro',
              ci: item.ci || 'S/N',
              iglesiaOrigen: item.iglesiaNombre || 'Origen',
              iglesiaDestino: this.currentChurchName,
              motivo: item.motivoTraspaso || 'Cambio de filial',
              estado: 'PENDIENTE',
              fecha: item.fechaTraspaso ? new Date(item.fechaTraspaso).toLocaleDateString('es-ES') : 'Reciente',
              fechaSort: item.fechaTraspaso ? new Date(item.fechaTraspaso).getTime() : Date.now()
            }));
            this.pendingTraspasosCount = this.recentTraspasos.length;
            this.buildRecentActivities();
          }
        }
      });
    }

    this.buildRecentActivities();
  }

  /** Actividad reciente unificada: certificados + eventos + traspasos, ordenada por fecha desc. */
  buildRecentActivities(): void {
    const acts: any[] = [];

    // Certificados emitidos
    for (const c of this.allCertificadosCache as any[]) {
      const d = c.createdAt ? new Date(c.createdAt) : null;
      acts.push({
        type: 'certificado',
        icon: 'workspace_premium',
        iconClass: 'teal-bg',
        titulo: c.eventoDto?.nombre || c.motivoCertificado || 'Certificado emitido',
        descripcion: c.motivoCertificado || 'Certificado del evento',
        estado: c.estado ? 'Activo' : 'Inactivo',
        estadoClass: c.estado ? 'delivered' : 'pending',
        fecha: d ? d.toLocaleDateString('es-ES') : 'Reciente',
        fechaSort: d ? d.getTime() : 0
      });
    }

    // Eventos registrados
    for (const e of this.allEventsCache as any[]) {
      const d = e.createdAt ? new Date(e.createdAt) : (e.fechaInicio ? new Date(e.fechaInicio) : null);
      acts.push({
        type: 'evento',
        icon: 'event',
        iconClass: 'blue-bg',
        titulo: e.nombre || 'Evento',
        descripcion: this.nombreTipoEvento(e) + (e.ubicacion ? ' · ' + e.ubicacion : ''),
        estado: null,
        fecha: d ? d.toLocaleDateString('es-ES') : 'Reciente',
        fechaSort: d ? d.getTime() : 0
      });
    }

    // Traspasos pendientes (accionables)
    for (const t of this.recentTraspasos) {
      acts.push({
        type: 'traspaso',
        icon: 'swap_horiz',
        iconClass: 'purple-bg',
        titulo: t.miembroNombre,
        descripcion: `${t.iglesiaOrigen} → ${t.iglesiaDestino}`,
        estado: t.estado,
        estadoClass: 'pending',
        fecha: t.fecha,
        fechaSort: t.fechaSort ?? Date.now(),
        accionable: true,
        raw: t
      });
    }

    acts.sort((a, b) => (b.fechaSort || 0) - (a.fechaSort || 0));
    this.recentActivities = acts;
  }

  get actividadesVisibles(): any[] {
    return this.recentActivities.slice(0, this.activityLimit);
  }

  setActivityLimit(n: number): void {
    this.activityLimit = n;
  }

  loadTopIglesiasChart(): void {
    if (!this.canViewIglesias) return;
    this.miembroIglesiaService.datosGrafico(6).subscribe({
      next: (res) => {
        if (res && res.datos && res.datos.length > 0) {
          this.topIglesiasData = res.datos.map((item: any) => ({
            name: item.nombre,
            value: item.valor
          }));
        }
      },
      error: (err) => console.error('Error cargando datos grafico iglesias', err)
    });
  }

  buildMembresiaGrowthChart(members: any[]): void {
    this.growthMembers = Array.isArray(members) ? members : [];
    this.rebuildGrowthChart();
  }

  onGrowthRangeChange(): void {
    this.rebuildGrowthChart();
  }

  /**
   * Crecimiento ACUMULADO de miembros según la escala elegida. Agrupa por la fecha
   * de alta (createdAt): por semana, por mes o por año según el rango.
   */
  private rebuildGrowthChart(): void {
    const now = new Date();
    let unit: 'week' | 'month' | 'year';
    let count: number;
    switch (this.growthRange) {
      case 'semana': unit = 'week'; count = 12; break;
      case 'mes': unit = 'month'; count = 12; break;
      case '1a': unit = 'month'; count = 12; break;
      case '2a': unit = 'month'; count = 24; break;
      case '3a': unit = 'month'; count = 36; break;
      case '5a': unit = 'year'; count = 5; break;
      default: unit = 'month'; count = 12;
    }

    // Cubetas (inicio + etiqueta), de la más antigua a la más reciente.
    const buckets: { start: Date; label: string }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      buckets.push(this.bucketFor(now, unit, i));
    }
    const windowStart = buckets[0].start;

    // Cuenta las altas por cubeta; las anteriores a la ventana forman la base acumulada.
    let baseline = 0;
    const counts = new Array(count).fill(0);
    for (const m of this.growthMembers) {
      const d = m?.createdAt ? new Date(m.createdAt) : null;
      if (!d || isNaN(d.getTime()) || d < windowStart) { baseline++; continue; }
      let idx = 0;
      for (let b = 0; b < buckets.length; b++) {
        if (d >= buckets[b].start) idx = b; else break;
      }
      counts[idx]++;
    }

    let running = baseline;
    const series = buckets.map((b, i) => {
      running += counts[i];
      return { name: b.label, value: running };
    });

    this.membresiaGrowthData = [{ name: 'Membresía', series }];
  }

  /** Inicio y etiqueta de la cubeta que está `back` periodos antes de la actual. */
  private bucketFor(now: Date, unit: 'week' | 'month' | 'year', back: number): { start: Date; label: string } {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (unit === 'year') {
      const y = now.getFullYear() - back;
      return { start: new Date(y, 0, 1), label: String(y) };
    }
    if (unit === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const soloMes = this.growthRange === 'mes' || this.growthRange === '1a';
      const label = soloMes ? months[d.getMonth()] : `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      return { start: d, label };
    }
    // semana: lunes de la semana correspondiente
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const lunesOffset = (d.getDay() + 6) % 7; // 0 = lunes
    d.setDate(d.getDate() - lunesOffset - back * 7);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { start: d, label };
  }

  aprobarTraspaso(traspaso: any): void {
    this.miembroIglesiaService.aceptarTraspaso(traspaso.id).subscribe({
      next: () => this.removeTraspaso(traspaso.id),
      error: () => this.removeTraspaso(traspaso.id)
    });
  }

  rechazarTraspaso(traspaso: any): void {
    this.miembroIglesiaService.rechazarTraspaso(traspaso.id).subscribe({
      next: () => this.removeTraspaso(traspaso.id),
      error: () => this.removeTraspaso(traspaso.id)
    });
  }

  private removeTraspaso(id: number): void {
    this.recentTraspasos = this.recentTraspasos.filter(t => t.id !== id);
    this.pendingTraspasosCount = this.recentTraspasos.length;
    this.buildRecentActivities();
  }
}

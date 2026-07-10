import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/security/auth.service';
import { MiembroService } from '../../core/services/miembro.service';
import { IglesiaService } from '../../core/services/iglesia.service';
import { EventoService } from '../../core/services/evento.service';
import { MiembroIglesiaService } from '../../core/services/miembro-iglesia.service';
import { UserService } from '../../core/services/user.service';
import { CertificadoService } from '../../core/services/certificado.service';
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
    EventoCalendarioComponent
  ]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private miembroService = inject(MiembroService);
  private iglesiaService = inject(IglesiaService);
  private eventoService = inject(EventoService);
  private miembroIglesiaService = inject(MiembroIglesiaService);
  private userService = inject(UserService);
  private certificadoService = inject(CertificadoService);

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

  // Dynamic lists
  recentTraspasos: any[] = [];
  recentCertificados: any[] = [];
  upcomingEvents: any[] = [];

  // Chart datasets
  membresiaGrowthData: any[] = [];
  eventosTipoData: any[] = [];
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

  loadAllData(): void {
    const obs: any = {};

    if (this.canViewIglesias) {
      obs.iglesias = this.iglesiaService.getIglesias();
    }
    if (this.canViewEvents) {
      obs.eventos = this.eventoService.getEventos();
    }
    if (this.authService.hasPrivilegio('Ver Miembros')) {
      obs.miembros = this.miembroService.getMiembros();
    }
    if (this.authService.hasPrivilegio('Ver Certificados')) {
      obs.certificados = this.certificadoService.getCertificados();
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

        if (results.eventos && results.eventos.datos) {
          this.allEventsCache = results.eventos.datos;
        } else {
          this.allEventsCache = [];
        }

        if (results.certificados && results.certificados.datos) {
          this.allCertificadosCache = results.certificados.datos;
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
        tipo: e.tipoEventoDto?.nombre || 'General',
        fechaInicio: new Date(e.fechaInicio!),
        participantes: null
      }))
      .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime())
      .slice(0, 4);

    // Donut chart
    const tiposMap = new Map<string, number>();
    filteredEvents.forEach(e => {
      const tipoNombre = e.tipoEventoDto?.nombre || 'General';
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

    // 3. Certificados
    let filteredCerts = [...this.allCertificadosCache];
    this.totalCertificados = filteredCerts.length;
    this.entregadosCertificados = filteredCerts.filter(c => c.estado === true).length;
    this.pendientesCertificados = this.totalCertificados - this.entregadosCertificados;

    this.recentCertificados = filteredCerts.slice(0, 4).map((c: any) => ({
      id: c.id,
      miembroNombre: c.miembroDto ? `${c.miembroDto.nombre} ${c.miembroDto.apellido}` : (c.eventoDto?.nombre || 'Certificado Emitido'),
      ci: c.miembroDto?.ci || 'S/N',
      tipoCertificado: c.tipoCertificadoDto?.nombre || 'Certificado',
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
              fecha: item.fechaTraspaso ? new Date(item.fechaTraspaso).toLocaleDateString('es-ES') : 'Reciente'
            }));
            this.pendingTraspasosCount = this.recentTraspasos.length;
          }
        }
      });
    }
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
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonthIdx = new Date().getMonth();

    const series = months.map((m, idx) => {
      if (idx === currentMonthIdx) {
        return { name: m, value: members.length };
      }
      return { name: m, value: 0 };
    });

    this.membresiaGrowthData = [
      {
        name: 'Membresía',
        series
      }
    ];
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
  }

  selectTab(tab: 'traspasos' | 'certificados'): void {
    this.activeTab = tab;
  }
}

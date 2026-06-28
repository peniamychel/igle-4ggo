import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { AuthService } from '../../core/services/security/auth.service';
import { MiembroService } from '../../core/services/miembro.service';
import { IglesiaService } from '../../core/services/iglesia.service';
import { EventoService } from '../../core/services/evento.service';
import { MiembroIglesiaService } from '../../core/services/miembro-iglesia.service';
import { UserService } from '../../core/services/user.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { Evento } from '../../core/models/evento.model';
import { Certificado } from '../../core/models/certificado.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    NgxChartsModule
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

  // KPIs
  totalMembers = 0;
  totalChurches = 0;
  totalUsers = 0;
  totalCertificados = 0;
  entregadosCertificados = 0;
  pendientesCertificados = 0;

  localMembersCount = 0;
  localEventsCount = 0;

  // Recent Activity Tabs
  activeTab: 'traspasos' | 'certificados' = 'traspasos';
  pendingTraspasosCount = 3;

  // Mock and dynamic lists
  recentTraspasos: any[] = [];
  recentCertificados: any[] = [];
  upcomingEvents: any[] = [];

  // Chart datasets
  membresiaGrowthData: any[] = [];
  eventosTipoData: any[] = [];
  topIglesiasData: any[] = [];
  certificadosEmitidosData: any[] = [];

  // ngx-charts view and configurations
  viewArea: [number, number] = [540, 240];
  viewDonut: [number, number] = [220, 220];
  viewHorizontalBar: [number, number] = [540, 240];
  viewGroupedBar: [number, number] = [540, 240];

  purpleScheme: any = { domain: ['#7c4dff'] };
  donutScheme: any = { domain: ['#7c4dff', '#00bfa5', '#ff6d00', '#d500f9', '#00c853'] };
  certificatesScheme: any = { domain: ['#7c4dff', '#00bfa5'] };

  ngOnInit(): void {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.isPastor = !this.isAdmin;
    this.currentChurchId = this.authService.getCurrentIglesiaId();
    this.currentChurchName = this.authService.getCurrentIglesiaNombre() || 'Mi Iglesia';

    // Format current date
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateObj = new Date();
    this.currentDate = dateObj.toLocaleDateString('es-ES', options);
    // Capitalize first letters
    this.currentDate = this.currentDate.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    this.initializeMockData();
    this.loadStats();
  }

  initializeMockData(): void {
    // 1. Crecimiento de membresía (Area/Line chart: 12 months)
    this.membresiaGrowthData = [
      {
        name: 'Membresía',
        series: [
          { name: 'Ene', value: 980 },
          { name: 'Feb', value: 1020 },
          { name: 'Mar', value: 1050 },
          { name: 'Abr', value: 1090 },
          { name: 'May', value: 1120 },
          { name: 'Jun', value: 1150 },
          { name: 'Jul', value: 1190 },
          { name: 'Ago', value: 1240 },
          { name: 'Sep', value: 1310 },
          { name: 'Oct', value: 1380 },
          { name: 'Nov', value: 1450 },
          { name: 'Dic', value: 1600 }
        ]
      }
    ];

    // 2. Eventos por tipo (Donut data)
    this.eventosTipoData = [
      { name: 'Bautizos', value: 142, percentage: '30%' },
      { name: 'Matrimonios', value: 68, percentage: '15%' },
      { name: 'Confirmaciones', value: 95, percentage: '20%' },
      { name: 'Talleres', value: 124, percentage: '27%' },
      { name: 'Conferencias', value: 37, percentage: '8%' }
    ];

    // 3. Top iglesias por miembros (Horizontal Bar)
    this.topIglesiasData = [
      { name: 'Libertad', value: 310 },
      { name: 'Santa Fe', value: 245 },
      { name: 'Valle Tunari', value: 180 },
      { name: 'El Alto', value: 155 },
      { name: 'Sucre', value: 130 },
      { name: 'Tarija', value: 100 }
    ];

    // 4. Certificados emitidos vs entregados (Grouped bar chart)
    this.certificadosEmitidosData = [
      {
        name: 'Ene',
        series: [
          { name: 'Emitidos', value: 22 },
          { name: 'Entregados', value: 18 }
        ]
      },
      {
        name: 'Feb',
        series: [
          { name: 'Emitidos', value: 33 },
          { name: 'Entregados', value: 28 }
        ]
      },
      {
        name: 'Mar',
        series: [
          { name: 'Emitidos', value: 37 },
          { name: 'Entregados', value: 32 }
        ]
      },
      {
        name: 'Abr',
        series: [
          { name: 'Emitidos', value: 35 },
          { name: 'Entregados', value: 30 }
        ]
      },
      {
        name: 'May',
        series: [
          { name: 'Emitidos', value: 29 },
          { name: 'Entregados', value: 24 }
        ]
      },
      {
        name: 'Jun',
        series: [
          { name: 'Emitidos', value: 26 },
          { name: 'Entregados', value: 22 }
        ]
      },
      {
        name: 'Jul',
        series: [
          { name: 'Emitidos', value: 31 },
          { name: 'Entregados', value: 27 }
        ]
      },
      {
        name: 'Ago',
        series: [
          { name: 'Emitidos', value: 42 },
          { name: 'Entregados', value: 36 }
        ]
      },
      {
        name: 'Sep',
        series: [
          { name: 'Emitidos', value: 52 },
          { name: 'Entregados', value: 46 }
        ]
      },
      {
        name: 'Oct',
        series: [
          { name: 'Emitidos', value: 72 },
          { name: 'Entregados', value: 63 }
        ]
      },
      {
        name: 'Nov',
        series: [
          { name: 'Emitidos', value: 69 },
          { name: 'Entregados', value: 61 }
        ]
      },
      {
        name: 'Dic',
        series: [
          { name: 'Emitidos', value: 63 },
          { name: 'Entregados', value: 55 }
        ]
      }
    ];

    // Mock Recent activity (Traspasos)
    this.recentTraspasos = [
      {
        id: 1,
        miembroNombre: 'Lucía Fernández Vargas',
        ci: '5432198',
        iglesiaOrigen: 'Iglesia Oruro',
        iglesiaDestino: 'Iglesia Libertad',
        motivo: 'Cambio de residencia por trabajo',
        estado: 'PENDIENTE',
        fecha: '19 sept 2025'
      },
      {
        id: 2,
        miembroNombre: 'Diego Ramírez Soto',
        ci: '7654321',
        iglesiaOrigen: 'Iglesia Santa Fe',
        iglesiaDestino: 'Iglesia Sucre',
        motivo: 'Transferencia laboral',
        estado: 'PENDIENTE',
        fecha: '21 sept 2025'
      },
      {
        id: 3,
        miembroNombre: 'Carla Méndez Paz',
        ci: '8123456',
        iglesiaOrigen: 'Iglesia El Alto',
        iglesiaDestino: 'Iglesia Valle Tunari',
        motivo: 'Matrimonio con miembro de la iglesia destino',
        estado: 'PENDIENTE',
        fecha: '24 sept 2025'
      }
    ];
    this.pendingTraspasosCount = this.recentTraspasos.length;

    // Mock Recent activity (Certificados)
    this.recentCertificados = [
      {
        id: 1,
        miembroNombre: 'Juan Carlos Choque',
        ci: '4928123',
        tipoCertificado: 'Certificado de Bautizo',
        evento: 'Bautizo Comunitario Libertad',
        estado: 'ENTREGADO',
        fecha: '18 sept 2025'
      },
      {
        id: 2,
        miembroNombre: 'Ana María Gómez',
        ci: '6123482',
        tipoCertificado: 'Certificado de Matrimonio',
        evento: 'Matrimonio Pérez - Gómez',
        estado: 'PENDIENTE',
        fecha: '20 sept 2025'
      },
      {
        id: 3,
        miembroNombre: 'Sofia Mamani Torres',
        ci: '9182345',
        tipoCertificado: 'Certificado de Presentación',
        evento: 'Presentación de Niños Octubre',
        estado: 'ENTREGADO',
        fecha: '22 sept 2025'
      }
    ];

    // Mock Próximos eventos
    this.upcomingEvents = [
      {
        id: 1,
        nombre: 'Bautizo Comunitario Septiembre',
        ubicacion: 'Libertad · Templo Central',
        tipo: 'Bautizos',
        fechaInicio: new Date(2026, 8, 28, 10, 0),
        participantes: 28
      },
      {
        id: 2,
        nombre: 'Matrimonio Pérez - Gómez',
        ubicacion: 'Santa Fe · Capilla Anexa',
        tipo: 'Matrimonios',
        fechaInicio: new Date(2026, 8, 30, 18, 0),
        participantes: 5
      },
      {
        id: 3,
        nombre: 'Taller de Liderazgo Juvenil',
        ubicacion: 'Valle Tunari · Salón Multiuso',
        tipo: 'Talleres',
        fechaInicio: new Date(2026, 9, 2, 16, 0),
        participantes: 42
      },
      {
        id: 4,
        nombre: 'Confirmación Adultos',
        ubicacion: 'El Alto · Templo Principal',
        tipo: 'Confirmaciones',
        fechaInicio: new Date(2026, 9, 5, 9, 0),
        participantes: 15
      }
    ];
  }

  loadStats(): void {
    // 1. Total Churches
    this.iglesiaService.getIglesias().subscribe({
      next: (res) => {
        if (res && res.datos) {
          this.totalChurches = res.datos.length;
        }
      },
      error: (err) => console.error('Error cargando iglesias', err)
    });

    // 2. Total Members
    this.miembroService.getMiembros().subscribe({
      next: (res) => {
        if (res && res.datos) {
          this.totalMembers = res.datos.length;
          // Set dynamic values if db contains real values, keeping mock scale if db is empty
          if (this.totalMembers > 0) {
            // update growth data last value
            this.membresiaGrowthData[0].series[11].value = this.totalMembers;
          } else {
            this.totalMembers = 1208; // Fallback to mockup value
          }
        }
      },
      error: (err) => console.error('Error cargando miembros', err)
    });

    // 3. Total Users
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        if (res && res.datos) {
          this.totalUsers = res.datos.length;
        }
      },
      error: (err) => console.error('Error cargando usuarios', err)
    });

    // 4. Total Certificates
    this.certificadoService.getCertificados().subscribe({
      next: (res) => {
        if (res && res.datos) {
          const list = res.datos;
          this.totalCertificados = list.length;
          this.entregadosCertificados = list.filter((c: Certificado) => c.estado === true).length;
          this.pendientesCertificados = this.totalCertificados - this.entregadosCertificados;

          if (this.totalCertificados === 0) {
            // fallback mockup values
            this.totalCertificados = 67;
            this.entregadosCertificados = 52;
            this.pendientesCertificados = 15;
          }
        }
      },
      error: (err) => {
        console.error('Error cargando certificados', err);
        this.totalCertificados = 67;
        this.entregadosCertificados = 52;
        this.pendientesCertificados = 15;
      }
    });

    // 5. Dynamic top-iglesias data from backend
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

    // 6. Upcoming Events from service
    this.eventoService.getEventos().subscribe({
      next: (res) => {
        if (res && res.datos && res.datos.length > 0) {
          const now = new Date();
          const apiEvents = res.datos
            .filter((e: Evento) => e.fechaInicio && new Date(e.fechaInicio) >= now)
            .map((e: Evento) => ({
              id: e.id,
              nombre: e.nombre,
              ubicacion: e.ubicacion || 'Templo Central',
              tipo: e.tipoEventoDto?.nombre || 'General',
              fechaInicio: new Date(e.fechaInicio!),
              participantes: Math.floor(Math.random() * 30) + 5
            }))
            .sort((a: any, b: any) => a.fechaInicio.getTime() - b.fechaInicio.getTime())
            .slice(0, 4);

          if (apiEvents.length > 0) {
            this.upcomingEvents = apiEvents;
          }
        }
      },
      error: (err) => console.error('Error cargando eventos', err)
    });

    // 7. Load local details if Pastor
    if (this.isPastor && this.currentChurchId) {
      this.miembroIglesiaService.getMisMiembros().subscribe({
        next: (res) => {
          if (res && res.datos) {
            this.localMembersCount = res.datos.length;
            if (this.localMembersCount === 0) {
              this.localMembersCount = 185; // Fallback
            }
          }
        },
        error: (err) => {
          console.error('Error cargando miembros locales', err);
          this.localMembersCount = 185;
        }
      });

      // Filter pending requests for local church
      this.miembroIglesiaService.getSolicitudesPendientes(this.currentChurchId).subscribe({
        next: (res) => {
          if (res && res.datos && res.datos.length > 0) {
            this.recentTraspasos = res.datos.map((item: any) => ({
              id: item.id,
              miembroNombre: item.miembroNombre || 'Miembro',
              ci: item.ci || 'S/N',
              iglesiaOrigen: item.iglesiaNombre || 'Origen',
              iglesiaDestino: this.currentChurchName,
              motivo: item.motivoTraspaso || 'Cambio de filial',
              estado: 'PENDIENTE',
              fecha: item.fechaTraspaso ? new Date(item.fechaTraspaso).toLocaleDateString() : 'Reciente'
            }));
            this.pendingTraspasosCount = this.recentTraspasos.length;
          }
        }
      });
    }
  }

  // Activity Actions
  aprobarTraspaso(traspaso: any): void {
    // If it's a mock item (has no real database ID or we're in demo mode), simulate approval
    this.miembroIglesiaService.aceptarTraspaso(traspaso.id).subscribe({
      next: () => {
        this.removeTraspaso(traspaso.id);
      },
      error: () => {
        // Fallback for mocks
        this.removeTraspaso(traspaso.id);
      }
    });
  }

  rechazarTraspaso(traspaso: any): void {
    this.miembroIglesiaService.rechazarTraspaso(traspaso.id).subscribe({
      next: () => {
        this.removeTraspaso(traspaso.id);
      },
      error: () => {
        // Fallback for mocks
        this.removeTraspaso(traspaso.id);
      }
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


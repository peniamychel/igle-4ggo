import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EventoService } from '../../../../core/services/evento.service';
import { IglesiaService } from '../../../../core/services/iglesia.service';
import { AuthService } from '../../../../core/services/security/auth.service';
import { Evento } from '../../../../core/models/evento.model';
import { Iglesia } from '../../../../core/models/iglesia.model';
import { EventoDetailComponent } from '../evento-detail/evento-detail.component';

interface CalendarDay {
  date: Date | null;
  dayNumber: number | null;
  isToday: boolean;
  events: any[];
}

@Component({
  selector: 'app-evento-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './evento-calendario.component.html',
  styleUrls: ['./evento-calendario.component.css']
})
export class EventoCalendarioComponent implements OnInit {
  currentDate = new Date();
  currentMonthName: string = '';
  daysInMonth: CalendarDay[] = [];
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  events: Evento[] = [];
  iglesias: Iglesia[] = [];
  isAdmin: boolean = false;

  // Filters
  showGeneral = true;
  showLocal = true;
  showAnniversaries = true;

  constructor(
    private eventoService: EventoService,
    private iglesiaService: IglesiaService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isLoggedRolAdmin();
    this.loadDataAndGenerate();
  }

  loadDataAndGenerate() {
    this.eventoService.getEventos().subscribe(resEventos => {
      const rawEvents = Array.isArray(resEventos.datos) ? resEventos.datos : [];
      if (!this.isAdmin) {
        const currentChurchId = this.authService.getCurrentIglesiaId();
        this.events = rawEvents.filter(e => !e.iglesiaId || e.iglesiaId === currentChurchId);
      } else {
        this.events = rawEvents;
      }
      
      this.iglesiaService.getIglesias().subscribe(resIglesias => {
        this.iglesias = Array.isArray(resIglesias.datos) ? resIglesias.datos : [];
        this.generateCalendar();
      });
    });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.currentMonthName = this.currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const tempDays: CalendarDay[] = [];
    const today = new Date();

    // Fill blank days before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      tempDays.push({ date: null, dayNumber: null, isToday: false, events: [] });
    }

    // Fill days of the month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;

      const dayEvents = this.getEventsForDate(date);
      tempDays.push({
        date,
        dayNumber: i,
        isToday,
        events: dayEvents
      });
    }

    this.daysInMonth = tempDays;
  }

  getEventsForDate(date: Date): any[] {
    const list: any[] = [];
    const dayStr = date.getDate();
    const monthStr = date.getMonth();
    const yearStr = date.getFullYear();

    // 1. Map standard events
    this.events.forEach(e => {
      if (e.fechaInicio) {
        const start = new Date(e.fechaInicio);
        if (start.getDate() === dayStr && start.getMonth() === monthStr && start.getFullYear() === yearStr) {
          const isGeneral = e.alcance === 'GENERAL' || !e.iglesiaId;
          
          if (isGeneral && this.showGeneral) {
            list.push({ type: 'GENERAL', label: e.nombre, color: '#1976d2', obj: e });
          } else if (!isGeneral && this.showLocal) {
            list.push({ type: 'LOCAL', label: e.nombre, color: '#2e7d32', obj: e });
          }
        }
      }
    });

    // 2. Map church anniversaries
    if (this.showAnniversaries) {
      this.iglesias.forEach(ig => {
        if (ig.fechaFundacion) {
          const fund = new Date(ig.fechaFundacion);
          // Anniversary is the same month and day, regardless of year
          if (fund.getDate() === dayStr && fund.getMonth() === monthStr) {
            list.push({ type: 'ANIVERSARIO', label: `Aniversario de ${ig.nombre}`, color: '#ff8f00', obj: ig });
          }
        }
      });
    }

    return list;
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  today() {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  onFilterChange() {
    this.generateCalendar();
  }

  clonarGestion() {
    const currentYear = new Date().getFullYear();
    const targetYear = currentYear + 1;
    
    if (confirm(`¿Desea clonar todos los aniversarios y eventos anuales de la gestión ${currentYear} a la gestión ${targetYear}?`)) {
      this.eventoService.cloneYearEvents ? this.eventoService.cloneYearEvents(currentYear, targetYear).subscribe(() => {
        this.snackBar.open(`Eventos clonados con éxito para el año ${targetYear}.`, 'Cerrar', { duration: 3000 });
        this.loadDataAndGenerate();
      }) : null;
    }
  }

  onEventClick(event: MouseEvent, ev: any) {
    event.stopPropagation();
    if (ev.type === 'ANIVERSARIO') {
      const fundDate = ev.obj.fechaFundacion ? new Date(ev.obj.fechaFundacion).toLocaleDateString('es-ES') : 'N/A';
      this.snackBar.open(`⛪ Aniversario de ${ev.obj.nombre} - Fundada el ${fundDate}`, 'Entendido', { duration: 5000 });
    } else {
      this.dialog.open(EventoDetailComponent, {
        width: '600px',
        data: ev.obj
      });
    }
  }
}

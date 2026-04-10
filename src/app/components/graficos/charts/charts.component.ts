import {Component, inject, OnInit} from '@angular/core';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CommonModule} from '@angular/common';
import {ChartType, GoogleChartsModule} from 'angular-google-charts';
import {MiembroIglesiaService} from '../../../core/services/miembro-iglesia.service';
import {Iglesia} from '../../../core/models/iglesia.model';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    GoogleChartsModule
  ],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit {

  private miembroIglesiaService: MiembroIglesiaService = inject(MiembroIglesiaService);

  // single: any[];
  view: [number, number] = [500, 300];

  // options
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = false;
  legendTitle: string = '';
  showDataLabel: boolean = true;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  yAxisLabel: string = 'Iglesias';
  showYAxisLabel: boolean = true;
  xAxisLabel: string = 'Número de miembros';

  colorScheme: any = {
    domain: ['#165ede', '#d91b3f', '#79146f', '#258798']
  };

  constructor() {
    Object.assign(this.single);
    this.datosGrafico();
  }

  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }

  single = [
    {
      "name": "Libertad",
      "value": 300
    },
    {
      "name": "Santa Fe",
      "value": 234
    },
    {
      "name": "Valle Tunari",
      "value": 123
    }
  ];


  chart = {
    type: ChartType.PieChart,
    data: [] as any[], // Inicializar con array vacío
    columns: ['Task', 'Hours per Day'],
    options: {
      title: '',
      is3D: true,
      width: 500, // Ancho explícito
      height: 300  // Alto explícito
    }
  };

  ngOnInit() {
    // Simulación de carga de datos
    this.chart.data = [
      ['Libertad', 300],
      ['Santa Fe', 234],
      ['Valle Tunari', 123]
    ];
    this.datosGrafico();
  }


  datosGrafico() {
    this.miembroIglesiaService.datosGrafico(3)
      // Llena el grafico con google charts
      .subscribe(response => {
        this.chart.data = response.datos
          .map((item: any) => [item.nombre, item.valor]);

        // console.log(this.chart.data);

        // llena el grafico con chart NGXcharts
        this.single = response.datos.map((item: any) => ({
          name: item.nombre,
          value: item.valor
        }));
      });
  }
}

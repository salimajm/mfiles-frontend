import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { MfilesService } from '../../services/mfiles.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit  {
 
  authToken: string = '';
  baseUrl: string = '';
  stats: { label: string, count: number }[] = [];
  propertyDefId!: number;
  projectId!: number;

  constructor(private mfilesService: MfilesService) {}

  ngOnInit(): void {
    this.authToken = JSON.parse(localStorage.getItem('authToken') || '""');
    this.baseUrl = localStorage.getItem('baseUrl') || '';
    this.loadPieChart();
    this.loadLineChart();
    this.loadStats();

  }

 
 
  
  loadStats(): void {
    forkJoin({
      objectTypes: this.mfilesService.getObjectTypes(this.authToken, this.baseUrl),
      documents: this.mfilesService.getDocuments(this.authToken, this.baseUrl),
      classes: this.mfilesService.getClasses(this.authToken, this.baseUrl)
    }).subscribe(({ objectTypes, documents, classes }) => {
      console.log(documents)
      this.stats = [
        { label: 'Object Types', count: objectTypes.length },
        { label: 'Documents', count: documents.Items?.length || 0 },
        { label: 'Classes', count: classes.length }
      ];
      
    });
  }
  

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Documents par projet',
      backgroundColor: [
        '#4f46e5', // indigo
        '#22c55e', // green
        '#eab308', // yellow
        '#f97316', // orange
        '#ef4444', // red
        '#06b6d4', // cyan
        '#8b5cf6', // violet
      ],
      borderColor: '#1f2937',
      borderWidth: 1
    }]
  };
  

  // Pie chart - Types d’objet
  pieChartLabels: string[] = [];
  pieChartData: number[] = [];

  // Line chart - Documents (fictif si pas de date)
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Documents sur période' }]
  };



 
  loadPieChart(): void {
    this.mfilesService.getObjectTypes(this.authToken, this.baseUrl).subscribe((types: any[]) => {
      
      this.pieChartLabels = types.map(t => t.Name);
      this.pieChartData = types.map(t => t.ID); // à remplacer par un `Count` s’il existe
    });
  }

  loadLineChart(): void {
    this.mfilesService.getDocuments(this.authToken, this.baseUrl).subscribe((docs: any[]) => {
      // Fictif car pas de champ date précisé dans ton API
      const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
      const data = [5, 15, 8, 20, docs.length];

      this.lineChartData = {
        labels,
        datasets: [{
          data,
          label: 'Documents mensuels simulés',
          backgroundColor: 'rgba(59, 130, 246, 0.5)', // bleu clair
          borderColor: '#3b82f6',
          fill: true,
          tension: 0.3
        }]
      };
      
    });
  }
}

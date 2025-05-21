// src/app/app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // For reactive forms
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';  // Import HttpClientModule here
import { LoginComponent } from './components/login/login.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LayoutComponent } from './components/layout/layout.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ProfileComponent } from './components/profile/profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PieController,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { ExportWidgetComponent } from './components/export-widget/export-widget.component';
import { ShareDialogComponent } from './components/share-dialog/share-dialog.component';
import { DocumentsComponent } from './components/documents/documents.component';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PieController,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProjectsComponent,
    SidebarComponent,
    LayoutComponent,
    ChatbotComponent,
    ProfileComponent,
    DashboardComponent,
    ExportWidgetComponent,
    ShareDialogComponent,
    DocumentsComponent
  ],
  imports: [
    BaseChartDirective,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxDocViewerModule,
    HttpClientModule  
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 

  providers: [ 
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

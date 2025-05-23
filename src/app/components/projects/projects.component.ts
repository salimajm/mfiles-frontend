import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MfilesService } from '../../services/mfiles.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatbotService } from '../../services/chatbot.service';
import { HttpEvent, HttpEventType } from '@angular/common/http'; // Assure-toi d'importer ça !
import { ToastComponent } from '../toast/toast.component';

interface Tab {
  id: string;
  label: string;
  icon?: string; // icon est optionnel
}


@Component({
  selector: 'app-projects',
  standalone: false,
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']

})
export class ProjectsComponent implements OnInit {
@ViewChild('toast') toastComponent!: ToastComponent;

 @Input() authToken: string = '';
  @Input() baseUrl: string = '';
  @Input() selectedDocument: any;

  @Output() objectTypeChanged = new EventEmitter<number>();
  @Output() projectSelected = new EventEmitter<any>();
  @Output() documentSelected = new EventEmitter<any>();

  objectTypes: any[] = [];
  selectedObjectTypeId: number | null = null;
  selectedProjectId: number | undefined;
  projects: any[] = [];
  documents: any;
  loading = false;
selectedTab: Tab = { id: 'metadata', label: 'Metadata', icon: '🗂️' };
  showAllMetadata = false;
  constructor(private mfilesService: MfilesService) {}

  ngOnInit(): void {
      this.authToken = JSON.parse(localStorage.getItem('authToken') || '""');
    this.baseUrl = localStorage.getItem('baseUrl') || '';
    this.getObjectTypes();
  }
 showCustomToast(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
  this.toastComponent.title = title;
  this.toastComponent.message = message;
  this.toastComponent.type = type;
  this.toastComponent.visible = true;
  setTimeout(() => this.toastComponent.visible = false, 3000);
}

  tabs: Tab[] = [
    { id: 'metadata', label: 'Metadata', icon: '🗂️' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'filters', label: 'Filters', icon: '🔎' },
    { id: 'aiinfo', label: 'M‑Files BOT', icon: '🤖' }
  ];

changeTab(tab: Tab) {
  this.selectedTab = tab;
}

 getObjectTypes(): void {
    this.mfilesService.getObjectTypes(this.authToken, this.baseUrl).subscribe({
      next: (data) => {
        this.showCustomToast('Types d\'objets chargés', 'Sélectionnez un type pour afficher les projets.', 'info');
        this.objectTypes = data || [];
      },
      error: (err) => {
        this.showCustomToast('Erreur', 'Impossible de charger les types d\'objets.', 'error');
      }
    });
  }

  onObjectTypeChange(): void {
    const selected = this.objectTypes.find(t => t.ID === this.selectedObjectTypeId);
    if (!this.selectedObjectTypeId) return;

    this.mfilesService.getProjectsByObjectType(this.authToken, this.baseUrl, this.selectedObjectTypeId).subscribe({
      next: (data) => {
        this.projects = data.Items || [];
        this.selectedProjectId = undefined;
        this.documents = null;
        this.objectTypeChanged.emit(this.selectedObjectTypeId!);
                this.showCustomToast('Projets chargés', 'Sélectionnez un projet pour afficher ses documents.', 'info');

      },
      error: (err) => {
        this.showCustomToast('Erreur', 'Échec de récupération des projets.', 'error');
      }
    });
  }

  onProjectChange(): void {
    if (!this.selectedProjectId) return;

    this.loading = true;

    this.mfilesService.getProjectDocumentsById(this.authToken, this.baseUrl, 1060, this.selectedProjectId).subscribe({
      next: (response) => {
        this.documents = response;
        this.loading = false;
        this.projectSelected.emit(this.selectedProjectId);
                this.showCustomToast('Documents chargés', 'Cliquez sur un document pour afficher ses détails.', 'success');

      },
      error: (err) => {
        this.loading = false;
        this.showCustomToast('Erreur', 'Impossible de charger les documents.', 'error');

      }
    });
  }

selectDocument(doc: any): void {
  const objectId = doc.ObjVer?.ID;
  const objectType = doc.ObjVer?.Type;

  if (!objectId || objectType === undefined) {
    console.error("Document sélectionné invalide");
    return;
  }

  // Important : désactiver double clic
  if (this.selectedDocument?.ObjVer?.ID === objectId && this.selectedDocument?.metadata) {
    return;
  }

  this.mfilesService.getFormattedMetadata(this.authToken, this.baseUrl, objectType, objectId).subscribe({
    next: (metadata) => {
      doc.metadata = Object.entries(metadata);
      this.selectedDocument = doc;
      this.documentSelected.emit(doc);
              this.showCustomToast('Document prêt', 'M-Files BOT est maintenant disponible.', 'success');

    },
    error: (err) => {
        this.showCustomToast('Erreur', 'Impossible de charger les métadonnées.', 'error');
    }
  });
}


  getFileIcon(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'fas fa-file text-gray';
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-blue';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel text-green';
      case 'pdf':
        return 'fas fa-file-pdf text-red';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint';
      default:
        return 'fas fa-file text-gray';
    }
  }
 
}

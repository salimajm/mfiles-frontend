import { Component, HostListener, OnInit } from '@angular/core';
import { MfilesService } from '../../services/mfiles.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  public allDocuments: any[] = [];
  public projects: any[] = [];
  selectedTab!: { id: string; label: string; icon: string; };
  applyFilter() {
    throw new Error('Method not implemented.');
  }
  username!: string; // ✅ AJOUT ICI
  isUserMenuOpen: boolean = false;

  isSidebarCollapsed = false;
  searchQuery: string = '';
  filters = {
    type: ''
  };
  authToken: string = '';
  baseUrl: string = '';

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('username');
    this.authToken = JSON.parse(localStorage.getItem('authToken') || '""');
    this.baseUrl = localStorage.getItem('baseUrl') || '';
    if (storedUsername) {
      this.username = storedUsername;
    }
    
  }
  searchResults: any[] = [];
  constructor(private searchService: MfilesService) { }
  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const clickedInside = (event.target as HTMLElement).closest('.nav-item');
    if (!clickedInside) {
      this.isUserMenuOpen = false;
    }
  }

  clearFilters() {
    this.filters = { type: '' };
  }
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    if (sidebar && content) {
      sidebar.classList.toggle('active');
      content.classList.toggle('active');
    }
  }
  logout() {
    localStorage.removeItem('authToken');

    localStorage.clear();
    location.href = '/login'; // ou this.router.navigate(['/login']);
  }
  profile() {
    location.href = '/profile'; // ou this.router.navigate(['/login']);
  }
  public searchSuggestions: any[] = [];
  public selectedProjectId: number | null = null;
  public selectedDocument: any;

  onSearchInput() {
    const query = this.searchQuery?.toLowerCase().trim();
    if (!query) {
      this.searchSuggestions = [];
      return;
    }

    const docs = (this.allDocuments || []).filter((doc: any) =>
      doc.Title?.toLowerCase().includes(query)
    ).map((doc: any) => ({
      Title: doc.Title,
      ID: doc.ObjVer?.ID,
      Type: 'Document',
      icon: this.getFileIcon(doc.Title)
    }));
    console.log('✅ Résultats documents correspondants :', docs);

    const projets = (this.projects || []).filter((p: any) =>
      p.Title?.toLowerCase().includes(query)
    ).map((p: any) => ({
      Title: p.Title,
      ID: p.ObjVer.ID,
      Type: 'Projet',
      icon: 'fas fa-folder'
    }));
    console.log('✅ Résultats projets correspondants :', projets);

    this.searchSuggestions = [...docs, ...projets].slice(0, 10);
    console.log('📋 Suggestions affichées :', this.searchSuggestions);

  }

  public selectedObjectTypeId: number | null = null;

 selectSuggestion(suggestion: any) {
  this.searchQuery = suggestion.Title;
  this.searchSuggestions = [];
  console.log('🎯 Suggestion sélectionnée :', suggestion);
  console.log('👉 Type sélectionné :', suggestion.Type);

  if (suggestion.Type === 'Document') {
    // 1. Sélectionner le type d'objet "Document"
    this.selectedObjectTypeId = 0; // 🔁 adapte si l'ID réel est différent

    // 2. Sélectionner le document
    this.selectDocumentById(suggestion.ID);

    // 3. Chercher si le document est lié à un projet
    const projectValue = this.getMetadataValueFromDoc(suggestion.ID, 'Projet');
    if (projectValue && projectValue.ID !== undefined) {
      this.selectedProjectId = projectValue.ID;

   this.allDocuments.forEach(doc => {
  const projMeta = this.getMetadataValueFromDoc(doc.ID, 'Projet');
  if (projMeta) {
    console.log(`🧾 Doc "${doc.Title}" est lié au projet :`, projMeta);
  }
});


      // 📄 Afficher automatiquement le premier document du projet
      this.selectedDocument = this.documents.Items[0];

      console.log('📁 Projet lié au document (filtrage local) :', projectValue);
    }

    // 4. Afficher l'onglet métadonnées ou aperçu automatiquement
    this.selectedTab = { id: 'preview', label: 'Aperçu', icon: '📄' };
  }

  else if (suggestion.Type === 'Projet') {
    // 1. Sélectionner le type d'objet "Projet"
    this.selectedObjectTypeId = 105; // 🔁 adapte selon ton objectType pour Projet

    // 2. Sélectionner le projet
    this.selectedProjectId = suggestion.ID;

    // 🔁 FILTRAGE LOCAL DES DOCUMENTS PAR PROJET
    this.documents = {
      Items: this.allDocuments.filter(doc => {
        const project = this.getMetadataValueFromDoc(doc.ID, 'Projet');
        return project?.ID === this.selectedProjectId;
      })
    };

    // 📄 Afficher automatiquement le premier document si disponible
    this.selectedDocument = this.documents.Items[0];
    this.selectedTab = { id: 'metadata', label: 'Métadonnées', icon: '🗂️' };
  }
console.log('🧪 Documents liés localement au projet', this.selectedProjectId, ':', this.documents.Items);

  console.log('✅ Document sélectionné (si type = Document) :', this.selectedDocument);
  console.log('✅ Projet sélectionné (si type = Projet), ID :', this.selectedProjectId);
}


getMetadataValueFromDoc(docId: number, propertyName: string): any {
  const doc = this.allDocuments.find(d => d.ID === docId || d.ObjVer?.ID === docId);
  if (!doc || !doc.Properties) return null;

  const prop = doc.Properties.find((p: any) =>
    p.Def?.Name?.toLowerCase() === propertyName.toLowerCase()
  );

  const val = prop?.Value;

  if (!val) return null;

  // Cas 1 : valeur directe avec ID
  if (val.ID !== undefined) return val;

  // Cas 2 : valeur lookup
  if (val.Lookup?.Item !== undefined) return { ID: val.Lookup.Item, DisplayValue: val.Lookup.DisplayValue };

  return null;
}


selectDocumentById(id: number) {
  const doc = this.allDocuments.find((d: any) => d.ID === id || d.ObjVer?.ID === id);
  if (doc) {
    this.selectedDocument = doc;
    this.documents = { Items: [doc] }; // 👈 affiche le document dans la liste de gauche aussi
    console.log('✅ Document sélectionné (si type = Document) :', this.selectedDocument);
  }
}



  getFileIcon(title: string): string {
    const ext = title?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'fas fa-file-pdf';
      case 'doc':
      case 'docx': return 'fas fa-file-word';
      case 'xls':
      case 'xlsx': return 'fas fa-file-excel';
      case 'ppt':
      case 'pptx': return 'fas fa-file-powerpoint';
      default: return 'fas fa-file-alt';
    }
  }

  performSearch() {
    // Tu peux ici filtrer, rediriger, ou afficher un message
    console.log('Recherche soumise pour :', this.searchQuery);

    // Optionnel : simuler un clic sur la première suggestion
    if (this.searchSuggestions.length > 0) {
      this.selectSuggestion(this.searchSuggestions[0]);
    }
  }

  public documents: any = { Items: [] }; // pour qu'il n'y ait pas d'erreur HTML au démarrage

 getDocumentsByProject() {
  const propertyDefId = 105;

  if (this.selectedProjectId) {
    this.searchService.getProjectDocumentsById(this.authToken, this.baseUrl, propertyDefId, this.selectedProjectId)
      .subscribe({
        next: (response) => {
          const docs = response.Items || response;
          this.documents = { Items: docs };
          console.log('📄 Documents du projet :', docs);

          if (docs.length > 0) {
            this.selectedDocument = docs[0]; // 👈 affiche automatiquement le 1er doc
            this.selectedTab = { id: 'metadata', label: 'Métadonnées', icon: '🗂️' };
          }
        },
        error: (error) => {
          console.error('❌ Erreur chargement documents par projet', error);
        }
      });
  console.log('➡️ Appel getProjectDocumentsById avec :', {
  token: this.authToken,
  baseUrl: this.baseUrl,
  projectId: this.selectedProjectId,
  propertyDefId: propertyDefId
});

    }
}
trackByDocId(index: number, doc: any): number {
  return doc?.ID ?? doc?.ObjVer?.ID ?? index;
}

}

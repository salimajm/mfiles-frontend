import { Component } from '@angular/core';
import { MfilesService } from '../../services/mfiles.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-documents',
  standalone: false,
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {
  documents: any[] = [];
  authToken: string = '';
  baseUrl: string = '';
  selectedDocument: any;
  showMetadataPopup = false;
  metadataEntries: [string, string][] = [];
  previewUrl: SafeResourceUrl | null = null;
  rawBlobUrl: string | null = null;
  loading = false;
  loadingProgress = 0;
  errorMessage = '';
  isOfficeType = false;
  isDocumentOpen = false;
  currentPage = 1;
  itemsPerPage = 7;
  totalItems = 0;
  searchText: string = '';

  constructor(
    private mfilesService: MfilesService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
this.authToken = localStorage.getItem('authToken') || '';
    this.baseUrl = localStorage.getItem('baseUrl') || '';
    if (this.authToken && this.baseUrl) {
      this.fetchAllDocuments(this.currentPage);
    } else {
      console.error('authToken ou baseUrl manquant.');
    }
  }

  fetchAllDocuments(page: number): void {
    this.mfilesService.getDocumentsPaginated(this.authToken, this.baseUrl, page, this.itemsPerPage)
      .subscribe({
        next: (res) => {
          this.documents = res?.Items || [];
this.totalItems = res?.TotalCount || 0;
          this.currentPage = page;
        },
        error: (err) => {
          console.error('Erreur récupération documents:', err);
        }
      });

  }


  getFileExtension(title: string): string {
    const parts = title.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  getFileIcon(name: string): string {
    if (!name) return 'bi bi-file-earmark-fill text-secondary';
    const ext = name.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'pdf': return 'bi bi-file-earmark-pdf-fill text-danger';
      case 'doc':
      case 'docx': return 'bi bi-file-earmark-word-fill text-primary';
      case 'xls':
      case 'xlsx': return 'bi bi-file-earmark-excel-fill text-success';
      case 'ppt':
      case 'pptx': return 'bi bi-file-earmark-ppt-fill text-warning';
      case 'txt': return 'bi bi-file-earmark-text-fill text-muted';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'bi bi-file-earmark-image-fill text-secondary';
      default: return 'bi bi-file-earmark-fill text-secondary';
    }
  }

  openDocumentForPreview(objectId: number, version: number): void {
    if (!objectId || !version) {
      console.error('[Preview] Erreur : objectId ou version manquants');
      return;
    }

    this.loading = true;
    this.loadingProgress = 0;
    this.errorMessage = '';
    this.previewUrl = null;
    this.rawBlobUrl = null;
    this.isOfficeType = false;
    this.isDocumentOpen = false;

    const headers = new HttpHeaders({
      'X-Authentication': this.authToken,
      'Base-Url': this.baseUrl
    });

    const progressInterval = setInterval(() => {
      if (this.loadingProgress < 90) {
        this.loadingProgress += 5;
      }
    }, 300);

    this.mfilesService.convertToPdf(objectId, version, headers).subscribe({
      next: (res: any) => {
        clearInterval(progressInterval);
        this.loadingProgress = 100;

        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.pdfUrl);
        this.rawBlobUrl = res.originalUrl;
        this.isOfficeType = true;
        this.isDocumentOpen = true;
        this.loading = false;

        window.open(res.pdfUrl, '_blank');
      },
      error: (err) => {
        clearInterval(progressInterval);
        this.errorMessage = err?.error?.message || 'Erreur lors de la conversion en PDF.';
        this.loading = false;
        console.error('❌ Preview Error:', this.errorMessage);
      }
    });
  }

  downloadDocument(doc: any): void {
    this.mfilesService.downloadDocument(this.authToken, this.baseUrl, doc.ObjVer.ID, doc.ObjVer.Version)
      .subscribe(event => {
        if (event.type === HttpEventType.Response) {
          const blob = event.body as Blob;
          const link = document.createElement('a');
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          link.download = doc.Title;
          link.click();
          URL.revokeObjectURL(blobUrl);
        }
      });
  }

  showMetadata(doc: any): void {
    this.selectedDocument = doc;
    this.mfilesService.getFormattedMetadata(this.authToken, this.baseUrl, doc.ObjVer.Type, doc.ObjVer.ID)
      .subscribe({
        next: metadata => {
          this.metadataEntries = Object.entries(metadata || {});
          this.showMetadataPopup = true;
        },
        error: err => {
          console.error('Erreur chargement metadata:', err);
        }
      });
  }

  closeMetadata(): void {
    this.showMetadataPopup = false;
    this.metadataEntries = [];
  }

  filteredDocuments(): any[] {
    if (!this.documents) return [];

    if (!this.searchText.trim()) return this.documents;

    return this.documents.filter((doc) =>
      (doc.Files?.[0]?.Name || doc.EscapedTitleWithID || '')
        .toLowerCase()
        .includes(this.searchText.toLowerCase())
    );
  }

  totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }


  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.fetchAllDocuments(page);
    }
  }
}

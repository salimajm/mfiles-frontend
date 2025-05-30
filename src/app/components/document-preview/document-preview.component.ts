import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MfilesService } from '../../services/mfiles.service';

@Component({
  selector: 'app-document-preview',
  standalone: false,
  templateUrl: './document-preview.component.html',
  styleUrl: './document-preview.component.css'
})
export class DocumentPreviewComponent {
@Input() document: any;
  @Input() authToken: string = '';
  @Input () baseUrl: string = '';

  loading = false;
  previewUrl: SafeResourceUrl | null = null;
  rawBlobUrl: string | null = null;
  isOfficeType = false;
  errorMessage = '';
  loadingProgress = 0;
  isDocumentOpen = false;
selectedDocument: any;
  constructor(private sanitizer: DomSanitizer , private http: HttpClient,private mfilesService: MfilesService) {}

  ngOnInit(): void {
    if (this.document) {
      this.openDocumentForPreview(this.document.ObjVer?.ID, this.document.ObjVer?.Version);
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

    this.http.get<{ pdfUrl: string, originalUrl: string }>(
      `http://localhost:5113/api/mfiles/convert/${objectId}/${version}`,
      { headers }
    ).subscribe(
      (res) => {
        clearInterval(progressInterval);
        this.loadingProgress = 100;

        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.pdfUrl);
        this.rawBlobUrl = res.originalUrl;
        this.isOfficeType = true;
        this.isDocumentOpen = true;
        this.loading = false;
      },
      (error) => {
        clearInterval(progressInterval);
        this.errorMessage = error?.error?.message || 'Erreur lors de la conversion en PDF.';
        this.loading = false;
      }
    );
  }


 downloadDocument(objectId: number, version: number, fileName: string): void {
    if (!objectId || !version) {
      console.error('[FRONT] ❌ ObjectId or Version is undefined');
      return;
    }

    console.log(`[FRONT] ✅ Downloading document with ObjectId: ${objectId} and Version: ${version}`);

    this.mfilesService.downloadDocument(this.authToken, this.baseUrl, objectId, version).subscribe(
      (event) => {
        if (event.type === HttpEventType.Response) {
          const blob = event.body as Blob;
          const blobUrl = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'document.pdf'; // Nom du fichier
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            console.log('[FRONT] ℹ️ Blob URL revoked');
          }, 1000);
        }
      },
      (error) => {
        console.error('[FRONT] ❌ Error downloading document:', error);
      }
    );
  }
}

import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError, timestamp } from 'rxjs';
interface LoginRequest {
  Username: string;
  Password: string;
  VaultGuid: string;
  BaseUrl: string;
}
@Injectable({
  providedIn: 'root'
})

export class MfilesService {
  searchFiles: any;
  private apiUrl = 'http://localhost:5113/api/mfiles';
  authToken: any;
  baseUrl: any;
  constructor(private http: HttpClient, private router: Router) { 
    this.authToken = localStorage.getItem('authToken') || '';

    this.baseUrl = localStorage.getItem('baseUrl') || '';}
getProjectsByObjectType(authToken: string, baseUrl: string, objectTypeId: number): Observable<any> {
  const headers = new HttpHeaders({
    'X-Authentication': authToken,
    'Base-Url': baseUrl
  });
  return this.http.get(`${this.apiUrl}/projects/by-objecttype/${objectTypeId}`, { headers });
}
 sendVoice(file: File, model: string = 'deepseek-r1:1.5b'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', model);
    return this.http.post(`${this.apiUrl}/ask-voice`, formData);
  }
 getObjectTypes(authToken: string, baseUrl: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl
    });

    const url = `${this.apiUrl}/objecttypes`;
    return this.http.get(url, { headers });
  }


  login(request: LoginRequest): Observable<any> {
return this.http.post(`${this.apiUrl}/login`, request, {
  responseType: 'text'
});
  }

  getDocuments(authToken: string, baseUrl: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl
    });
    return this.http.get(`${this.apiUrl}/documents`, { headers });
  }
getDocumentsPaginated(authToken: string, baseUrl: string, page: number, pageSize: number): Observable<any> {
  const headers = new HttpHeaders({
    'X-Authentication': authToken,
    'Base-Url': baseUrl
  });

  return this.http.get<any>(
  `${this.apiUrl}/paginatedDocuments?page=${page}&pageSize=${pageSize}&_=${timestamp}`,
  { headers }
);
}




  getProjects(authToken: string, baseUrl: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl
    });
    return this.http.get(`${this.apiUrl}/projects`, { headers });
  }
 

  getClasses(authToken: string, baseUrl: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl
    }); return this.http.get(`${this.apiUrl}/classes`, { headers });
  }

  getProjectDocumentsById(authToken: string, baseUrl: string, propertyDefId: number, projectId: number, ID?: any): Observable<any> {
    const headers = new HttpHeaders()
      .set('X-Authentication', authToken)
      .set('Base-Url', baseUrl);
  
    return this.http.get<any>(
      `${this.apiUrl}/projects/documents-by-id/${propertyDefId}/${projectId}`,
      { headers }
    );
  }
  convertToPdf(objectId: number, version: number, headers: HttpHeaders) {
  return this.http.get<{ pdfUrl: string, originalUrl: string }>(
    `http://localhost:5113/api/mfiles/convert/${objectId}/${version}`,
    { headers }
  );
}


  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('baseUrl');
    console.log('Déconnexion effectuée, redirection en cours...');

    this.http.post(`${this.apiUrl}/logout`, {}).subscribe(
      () => {
        this.router.navigate(['/login']); // Redirection après logout
      },
      (error) => {
        console.error('Erreur de déconnexion, mais on force la redirection', error);
        this.router.navigate(['/login']); // Même en cas d'erreur, on redirige
      }
    );
  }
downloadFromMFiles(objectId: number, version: number): Observable<Blob> {
  const headers = new HttpHeaders({
    'X-Authentication': this.authToken,
    'Base-Url': this.baseUrl
  });

  const url = `http://localhost:5113/api/mfiles/files/${objectId}/${version}/download`;
  return this.http.get(url, {
    headers,
    responseType: 'blob'
  });
}



downloadDocument(token: string, baseUrl: string, id: number, version: number): Observable<HttpEvent<Blob>> {
  const headers = new HttpHeaders({
    'X-Authentication': token
  });

  const url = `/api/objects/0/${id}/${version}/files/0/content`;

  return this.http.get(url, {
    headers,
    responseType: 'blob',
    observe: 'events',
    reportProgress: true
  });
}

  getDocumentMetadata(authToken: string, baseUrl: string, objectType: number, objectId: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl
    });

    const url = `${this.apiUrl}/metadata/${objectType}/${objectId}`;

    return this.http.get(url, { headers });
  }


  getFormattedMetadata(authToken: string, baseUrl: string, objectType: number, objectId: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl
    });

    return this.http.get<any>(`${this.apiUrl}/metadata/formatted/${objectType}/${objectId}`, { headers });
  }
  getDocumentPreview(objectId: number, version: number, authToken: string, baseUrl: string) {
    const headers = new HttpHeaders({
      'X-Authentication': authToken,
      'Base-Url': baseUrl,
      'Accept': 'application/octet-stream'  // Pour recevoir un fichier binaire
    });

    return this.http.get(`${this.apiUrl}/preview/${objectId}/${version}`, {
      headers: headers,
      responseType: 'blob'
    });
  }
}

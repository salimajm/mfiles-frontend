import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RouteConfigLoadStart } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://localhost:8001';  

  constructor(private http: HttpClient) {}
initFileUpload(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post(`${this.apiUrl}/init-files`, formData);
}


initMFiles(document: any) {
  const formData = new FormData();
  formData.append('file', document.file); // ← important que la clé soit 'file'
  return this.http.post(`${this.apiUrl}/init-files`, formData);
}

askQuestion(formData: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}/ask-file-ollama`, formData);
}

  getHistory(): Observable<any[]> {
    const url = `${this.apiUrl}/history`;
    return this.http.get<any[]>(url);
  }
  
}

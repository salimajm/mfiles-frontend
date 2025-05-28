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

updateHistory(chat: any) {
  return this.http.post(`${this.apiUrl}/history/update`, chat);
}
deleteHistory(chat: any) {
  return this.http.post(`${this.apiUrl}/history/delete`, chat);
}

initMFiles(formData: FormData) {
  return this.http.post(`${this.apiUrl}/init-files`, formData);
}

getDocumentMetadata(filename: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/records/${filename}`);
}

askQuestion(formData: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}/ask-file-ollama`, formData);
}

  getHistory(): Observable<any[]> {
    const url = `${this.apiUrl}/history`;
    return this.http.get<any[]>(url);
  }
  
}

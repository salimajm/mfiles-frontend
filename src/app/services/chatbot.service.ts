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
  initFile(document: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', document.file);  // Assurez-vous d'envoyer le bon fichier

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

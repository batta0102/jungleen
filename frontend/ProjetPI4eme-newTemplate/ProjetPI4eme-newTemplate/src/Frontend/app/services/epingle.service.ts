import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class EpingleService {
  private readonly apiUrl = '/api';
  private readonly messagesEndpoint = `${this.apiUrl}/clubMessages`;

  constructor(private http: HttpClient) {}

  // Récupérer les messages épinglés d'un club
  getPinnedMessages(clubId: number): Observable<any[]> {
    const url = `${this.messagesEndpoint}/club/${clubId}/epingles`;
    console.log(`? Chargement des messages épinglés pour le club ${clubId}`);
    console.log(`? URL: ${url}`);
    
    return this.http.get<any[]>(url).pipe(
      tap(messages => {
        console.log(`? Messages épinglés reçus:`, messages);
      }),
      catchError((error: any) => {
        console.error(`? Erreur lors du chargement des messages épinglés:`, error);
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
    );
  }

  // Vérifier si l'utilisateur peut épingler
  canPin(clubId: number): Observable<boolean> {
    const url = `${this.messagesEndpoint}/club/${clubId}/peut-epinger`;
    console.log(`? Vérification des droits d'épinglage pour le club ${clubId}`);
    
    return this.http.get<boolean>(url).pipe(
      tap(response => {
        console.log(`? Droits d'épinglage:`, response);
      }),
      catchError((error: any) => {
        console.error(`? Erreur lors de la vérification des droits:`, error);
        return of(false);
      })
    );
  }

  // Épingler un message
  pinMessage(messageId: number, raison: string): Observable<any> {
    const url = `${this.messagesEndpoint}/${messageId}/epinger`;
    console.log(`? Épinglage du message ${messageId} avec raison: ${raison}`);
    console.log(`? URL complète: ${url}`);
    console.log(`? Corps de la requête:`, { raison });
    
    return this.http.post(url, { raison }).pipe(
      tap(response => {
        console.log(`? Message ${messageId} épinglé avec succès:`, response);
      }),
      catchError((error: any) => {
        console.error(`? Erreur lors de l'épinglage du message ${messageId}:`, error);
        console.error('? Status HTTP:', error.status);
        console.error('? Status Text:', error.statusText);
        console.error('? URL:', error.url);
        console.error('? Headers:', error.headers);
        console.error('? Body:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Désépingler un message
  unpinMessage(messageId: number): Observable<any> {
    const url = `${this.messagesEndpoint}/${messageId}/desepingler`;
    console.log(`? Désépinglage du message ${messageId}`);
    
    return this.http.delete(url).pipe(
      tap(response => {
        console.log(`? Message ${messageId} désépinglé avec succès:`, response);
      }),
      catchError((error: any) => {
        console.error(`? Erreur lors du désépinglage du message ${messageId}:`, error);
        return throwError(() => error);
      })
    );
  }
}

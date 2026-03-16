import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';


export interface Token {
  access_token: string;
  token_type: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  urlApi:string=environment.apiUrl;
  private loginStatus = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<any | null>(null);
currentUser$ = this.currentUserSubject.asObservable();
  constructor(private http: HttpClient) { }
  isLoggedIn(): Observable<boolean> {
    return this.loginStatus.asObservable();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }
  register(logindetails: any): Observable<any> {
    return this.http.post(this.urlApi+"/client/create", logindetails);
  }

  login(user: any): Observable<Token> {
    const formData = new FormData();
    formData.append('username', user.username);
    formData.append('password', user.password);

    return this.http.post<Token>(this.urlApi+`/client/login`, formData).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        //console.log('Token sauvegardé :', response.access_token);
        this.loginStatus.next(true);
        this.currentUser().subscribe(userDetails => {
          //console.log('Détails de l\'utilisateur récupérés :', userDetails);
          localStorage.setItem('user', JSON.stringify(userDetails));
          this.currentUserSubject.next(userDetails);
        }, error => {
          console.error('Erreur lors de la récupération des détails utilisateur :', error);
        });
      })
    );
  }

  currentUser(): Observable<any> {

    const headers = {
        'Authorization': 'Bearer ' + localStorage.getItem('access_token')
      };
      //console.log(headers);

      return this.http.get<any>(this.urlApi+`/client/current`, { headers });
  }

  setLoginStatus(isLoggedIn: boolean, userDetails?: any): void {
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    if (isLoggedIn && userDetails) {
      localStorage.setItem('user', JSON.stringify(userDetails));
    } else {
      localStorage.removeItem('user');
    }
  }
  logout(): void {
    localStorage.removeItem('access_token');
   // localStorage.removeItem('user');
    this.loginStatus.next(false);
  }
  sendPasswordResetLink(email: string) {
    const url = this.urlApi+"/client/su_change_password";
    return this.http.post(url, { email });
  }
  getClientId(): number | null {
    const user = localStorage.getItem('user');
    if (user) {
      const userDetails = JSON.parse(user);
      return userDetails?.id || null; // Assurez-vous que l'ID est présent dans les détails utilisateur
    }
    return null;
  }
}


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  urlApi:string=environment.apiUrl;
  constructor(private http: HttpClient) {}

  getUserInfo(userId: number) {
    return this.http.get(`${this.urlApi}/get/${userId}`);
  }
  updateUser(userData: any) {
    return this.http.post(`${this.urlApi}/edit`, userData);
  }
}

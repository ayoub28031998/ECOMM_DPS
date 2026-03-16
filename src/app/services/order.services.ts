import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  urlApi:string=environment.apiUrl;


  constructor(private http: HttpClient) {}

  getOrders(): Observable<any> {
    return this.http.get(this.urlApi+`/commande/get`);
  }
  getOrderById(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.urlApi}/commande/get_by_id/${orderId}`);
}

  cancelOrder(orderId: number): Observable<any> {
    const url = this.urlApi+`/commande/cancel_commande?id=${orderId}`;
    return this.http.post(url, {});
  }
  getOrdersByClientId(clientId: number): Observable<any> {
    const url = this.urlApi+`/commande/get_by_client_id?id=${clientId}`;
    return this.http.get(url);
  }
  preOrder(commandeObject: any): Observable<any> {
    return this.http.post<any>(this.urlApi+`/commande/pre_commande`, commandeObject);
  }
  Order(commandeObject: any): Observable<any> {
    return this.http.post<any>(this.urlApi+`/commande/create`, commandeObject);
  }
  getpromobycodepromo(codePromo: any): Observable<any> {
    return this.http.get<any>(this.urlApi+`/codepromotion/get_by_code_promo?code_promo=${codePromo}`);
  }
}

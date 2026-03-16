import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Article } from '../models/article';


@Injectable({
  providedIn: 'root'
})
export class CAtegorieService {
  [x: string]: any;
  urlApi:string=environment.apiUrl;


  constructor(private http: HttpClient) { }

  getCategories(): Observable<any> {
    return this.http.get<any>(this.urlApi + "/categorie/website_get");
  }
  getMarques(): Observable<any[]> {
    return this.http.get<any[]>(this.urlApi + "/marque/website_get");
  }
  getMarquesByCategorie(params: { id_categorie?: number; id_sous_categorie?: number; id_sous_sous_categorie?: number }): Observable<any> {
    return this.http.post(this.urlApi +'/marque/get_by_categorie', params);
  }

  getSousCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.urlApi + "/souscategorie/get");
  }

  getSousSousCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.urlApi+"/soussouscategorie/get");
  }
  getArticlesByBrand(requestBody: {
    nbre_page: number;
    nbre_article: number;
    order_by: string;
    search: string;
    id_marque: number;
  }): Observable<any> {
    //console.log(requestBody);

    return this.http.post<Article[]>(this.urlApi+'/article/website_get_pagination_by_marque', requestBody);
  }
  private categorySubject = new BehaviorSubject<any[]>([]); // Stocke les catégories
  categories$ = this.categorySubject.asObservable(); // Observable pour récupérer les catégories
  
  setCategories(categories: any[]): void {
    this.categorySubject.next(categories);
    console.log('📌 Catégories mises à jour:', categories);
  }
}

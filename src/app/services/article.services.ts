import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map} from 'rxjs';
import { Article } from '../models/article';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ArticleService {
    urlApi:string=environment.apiUrl;
    private selectedCategorySubject = new BehaviorSubject<number | null>(null);
    selectedCategory$ = this.selectedCategorySubject.asObservable();

  constructor(private http: HttpClient) { }

  getArticles(): Observable<Article[]> {

    return this.http.get<Article[]>(this.urlApi + '/article/website_get');
  }
  setSelectedCategory(categoryId: number) {
    console.log("setSelectedCategory appelé avec :", categoryId);
    this.selectedCategorySubject.next(categoryId);
    console.log("hazemmmmmmmmmmmmmmm")
  }

  getArticlesPaginated(requestBody: any) {
    return this.http.post<any[]>(this.urlApi+"/article/website_get_not_promo_articles", requestBody);
  }
  filterArticlesByPrice(requestBody: any) {

    return this.http.post<any>(this.urlApi+'/article/website_get_pagination_by_price', requestBody);
  }

  addReview(article: any, reviewData: any): Observable<any> {
    if (!article || !article.id) {
      throw new Error('L\'article doit avoir un ID valide.');
    }

    const payload = {
      article: {
        id: article.id,
        libelle: article.libelle || '',
        prix_ht: article.prix_ht || 0,
        prix_ttc: article.prix_ttc || 0,
        reference: article.reference || '',
        description: article.description || '',
        stock_alert: article.stock_alert || 0,
        stock: article.stock || 0,
        stock_reserve: article.stock_reserve || 0,
        is_website_allowed: article.is_website_allowed || true,
        id_categorie: article.id_categorie || 0,
        id_marque: article.id_marque || 0,
        id_sous_categorie: article.id_sous_categorie || 0,
        id_sous_sous_categorie: article.id_sous_sous_categorie || 0,
        ligne_packs: article.ligne_packs || [],
        pt_ventes: article.pt_ventes || [],
        commandes: article.commandes || [],
        ligne_promotions: article.ligne_promotions || [],
        images: article.images || [],
        ligne_options: article.ligne_options || [],
        reviews: article.reviews || []
      },
      review: {
        note: reviewData.note,
        review: reviewData.review || "" ,
        id_client: reviewData.id_client
      }
    };
    console.log('Payload envoyé au backend :', payload);
    return this.http.post<any>(this.urlApi+"/article/add_review", payload);
  }

  getPackLines(): Observable<any> {
    return this.http.get<any>(this.urlApi+"/pack/get_lignes_packs");
  }

  getArticlesById(id: any): Observable<any> {

    return this.http.get<any>(this.urlApi+`/article/get_by_id?id=${id}`);
  }

  getMarqueById(id: any): Observable<any> {

    return this.http.get<any>(this.urlApi+`/marque/get_by_id?id=${id}`);
  }

  getArticlesByCategory(categoryId: string): Observable<Article[]> {
    return this.getArticles().pipe(
      map((articles: any[]) => {
        return articles.filter((article: { id_categorie: number }) => {
          return article.id_categorie === +categoryId;
        });
      })
    );
  }

  // searchArticles(query: string): Observable<Article> {
  //   const url = this.urlApi+"/article/get_by_id?id=${query}";
  //   console.log('Searching articles with URL:', url);
  //   return this.http.get<Article>(url);
  // }
  searchArticles(requestBody: { search: string; id_categorie: number }): Observable<Article[]> {
    return this.http.post<Article[]>(this.urlApi+'/article/website_get_search_query', requestBody);
  }

  getTotalCount(): Observable<number> {
    return this.http.get<number>(this.urlApi+'/article/website_get_count');
  }

  getArticlesByFilters(requestBody: any): Observable<any> {
    return this.http.post<any>(`${this.urlApi}/article/website_get_pagination_by_feature`, requestBody);
  }
  getPromoArticles(requestPayload: any): Observable<any> {
    return this.http.post(`${this.urlApi}/article/website_get_promo_articles`, requestPayload);
  }
  private articlesSubject = new BehaviorSubject<any[]>([]);
  currentArticles$ = this.articlesSubject.asObservable();

  // Méthode pour récupérer les articles via l'API
  setArticles(articles: any[]) {
    this.articlesSubject.next(articles);
  }
  getDynamicPriceRange(requestBody: any): Observable<any> {
    return this.http.post(`${this.urlApi}/article/website_get_prix_max_min_by_feature`, requestBody);
  }
  private articlesSubjects = new BehaviorSubject<any[]>([]);
  promoArticles$ = this.articlesSubjects.asObservable();

  // Méthode pour récupérer les articles via l'API
  setArticle(articles: any[]) {
    this.articlesSubjects.next(articles);
  }

}

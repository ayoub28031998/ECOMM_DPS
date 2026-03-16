import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleSharingService {
  private articlesSource = new BehaviorSubject<any[]>([]);
  currentArticles = this.articlesSource.asObservable();
  private categoryLabelSource = new BehaviorSubject<string>('');
  currentCategoryLabel = this.categoryLabelSource.asObservable();

  constructor() {}


  setSelectedCategoryLabel(label: string): void {
    this.categoryLabelSource.next(label);
  }
  // Méthode pour partager les articles entre les composants
  setArticles(articles: any[]): void {
    this.articlesSource.next(articles);
  }
}

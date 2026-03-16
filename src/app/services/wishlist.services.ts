import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Article } from '../models/article';


@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistItems: any[] = [];
  private wishlistSubject = new BehaviorSubject<Article[]>(this.getWishlistItems());
  wishlist$ = this.wishlistSubject.asObservable();

  constructor() { }

  getWishlistItems(): Article[] {
    const wishlistString = localStorage.getItem('wishlist');
    return wishlistString ? JSON.parse(wishlistString) : [];
  }

  updateWishlist(wishlist: Article[]): void {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    this.wishlistSubject.next(wishlist);
  }

  addToWishlist(item: any): void {
    const wishlist = this.getWishlistItems();

    // Vérifier si un produit avec le même id ET le même libelle existe déjà
    const exists = wishlist.find(wishlistItem =>
      wishlistItem.id === item.id && wishlistItem.libelle === item.libelle
    );

    if (!exists) {
      wishlist.push(item);
      this.updateWishlist(wishlist);
    }
  }


  removeFromWishlist(productId: number): void {
    const wishlist = this.getWishlistItems().filter(item => item.id !== productId);
    this.updateWishlist(wishlist);
  }

  getWishlistCount(): number {
    return this.getWishlistItems().length;
  }

}

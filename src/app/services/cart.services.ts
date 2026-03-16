import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: any[] = [];
  private storageKey = 'cart';
  private cartSubject = new BehaviorSubject<any[]>(this.getCartItems());
  cart$ = this.cartSubject.asObservable();
  urlApi:string=environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCartKey(): string {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      return `${this.storageKey}_${user.email}`;
    } else {
      return this.storageKey;
    }
  }

  getCartItems(): any[] {
    const cartString = localStorage.getItem(this.getCartKey());
    try {
      const items = cartString ? JSON.parse(cartString) : [];
      console.log('Articles récupérés du localStorage dans getCartItems:', items);
      return items;
    } catch (error) {
      console.error('Erreur lors de la récupération des articles du panier:', error);
      return [];
    }
  }

  updateCart(cart: any[]): void {
    localStorage.setItem(this.getCartKey(), JSON.stringify(cart));
    this.cartSubject.next(cart);
  }

  addToCart(product: any, quantity: number, variant?: any): void {
    const cart = this.getCartItems();

    // Créer un identifiant unique qui combine l'ID du produit et la variante (couleur)
    const variantKey = variant ? `${product.id}_${variant}` : product.id;

    const existingItem = cart.find(cartItem => cartItem.variantKey === variantKey);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const newItem = {
            ...product,
            quantity: quantity,
            variant: variant, // Stocker la variante choisie
            variantKey: variantKey // Clé unique pour identifier cette combinaison produit+variante
        };
        cart.push(newItem);
    }

    this.updateCart(cart);
}


  incrementQuantity(itemId: number): void {
    const cart = this.getCartItems();
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (item) {
      item.quantity += 1;
      this.updateCart(cart);
    }
  }

  decrementQuantity(itemId: number): void {
    const cart = this.getCartItems();
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      this.updateCart(cart);
    }
  }

  removeFromCart(itemId: number, variant?: string): void {
    let cart = this.getCartItems();

    // Filtre selon l'ID et la variante (si spécifiée)
    let updatedCart = cart.filter(item => {
        if (variant) {
            return !(item.id === itemId && item.variant === variant);
        } else {
            return item.id !== itemId;
        }
    });

    this.updateCart(updatedCart);
}

  clearCart(): void {
    localStorage.removeItem(this.getCartKey());
    this.cartSubject.next([]);
  }
  getCartCount(): number {
    return this.getCartItems().reduce((count, item) => count + item.quantity, 0);
  }
  getPromoDetails(code: string): Observable<any> {
    return this.http.get<any>(`${this.urlApi}/codepromotion/get_by_code_promo?code_promo=${code}`);
  }

}

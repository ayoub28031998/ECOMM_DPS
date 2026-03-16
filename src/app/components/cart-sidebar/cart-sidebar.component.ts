import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { CartService } from '../../services/cart.services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-sidebar.component.html',
  styleUrl: './cart-sidebar.component.css'
})
export class CartSidebarComponent {
  @Output() close = new EventEmitter<void>();

  isOpen = true;
  cartItems: any[] = [];

  constructor(private cartService: CartService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.cartService.cart$.subscribe((items) => {
    this.cartItems = items;
  });
}
goToCart() {
  this.router.navigate(['/cart']);
  this.isOpen = false;
}

loadCartItems(): void {
  this.cartItems = this.cartService.getCartItems();
}
removeItem(item: any): void {
  // Pour les produits avec variante
  if (item.variant) {
      this.cartService.removeFromCart(item.id, item.variant);
  }
  // Pour les produits sans variante
  else {
      this.cartService.removeFromCart(item.id);
  }
  this.loadCartItems();
}

  closeSidebar() {
    this.isOpen = false;
    this.close.emit();
  }

  get total(): number {
    const sum = this.cartItems.reduce((sum, item) =>
      sum + item.quantity * (item.promo !== 0 ? (item.prix_final || item.prix) : (item.prix_ttc || item.prix)), 0
    );
    return parseFloat(sum.toFixed(2));
  }

}

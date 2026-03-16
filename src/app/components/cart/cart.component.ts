import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.services';
import { catchError, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { OrderService } from '../../services/order.services';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  subtotal: number = 0;
  discountedSubtotal: number = 0;
  couponCode: string = '';
  couponValue: number | null = null;
  isModalOpen: boolean = false;
  itemToRemove: number | null = null;
  user: any;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private cartService: CartService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private orderservice : OrderService
  ) { }

  ngOnInit(): void {
    this.loadCartItems();

    this.cartService.cart$.subscribe((items) => {
      console.log("Mise à jour du panier - items:", items);
      this.cartItems = items;
      this.calculateSubtotals();
    });
  }

  setBackgroundColor(event: MouseEvent, color: string) {
    const target = event.target as HTMLElement;
    target.style.backgroundColor = color;
  }
  goToCheckout(): void {
    this.router.navigate(['/checkout'], {
      state: {
        user: this.user,
        cartItems: this.cartItems
      }
    }).then(() => {
     //window.location.reload();
    });

  }
  goToProduct(articleId: number, libelle: string): void {
    if (!articleId || !libelle) {
      console.error("Erreur : ID ou libellé manquant !");
      return;
    }
    const formattedLibelle = libelle.toLowerCase().replace(/ /g, '-');
    const url = `/singleproduct/${formattedLibelle}/${articleId}`;
    console.log("Navigating to:", url);
    this.router.navigate([url]);
  }

  loadCartItems(): void {
    this.cartItems = this.cartService.getCartItems();
    this.calculateSubtotals();
    this.getTotalSubtotal();
  }

  calculateSubtotals(): void {
    this.cartItems = this.cartItems.map(item => ({
      ...item,
      subtotal: item.promo !== 0 && item.prix_final
        ? parseFloat((item.prix_final * item.quantity).toFixed(3))
        : item.prix_ttc
          ? parseFloat((item.prix_ttc * item.quantity).toFixed(3))
          : parseFloat((item.prix * item.quantity).toFixed(2))
    }));
    const initialSubtotal = this.getTotalSubtotal();

    if (this.couponValue) {
      this.subtotal = parseFloat((initialSubtotal * (1 - this.couponValue / 100)).toFixed(3));
    } else {
      this.subtotal = initialSubtotal;
    }

    localStorage.setItem('subtotal', this.subtotal.toString());
    console.log("jjjjjjjjjjjjjjjjjj",this.subtotal.toString())
    this.cdr.detectChanges();
  }

  incrementQuantity(itemId: number): void {
    this.cartService.incrementQuantity(itemId);
    this.loadCartItems();
  }

  decrementQuantity(itemId: number): void {
    this.cartService.decrementQuantity(itemId);
    this.loadCartItems();
  }

  getTotalSubtotal(): number {
    return parseFloat(this.cartItems.reduce((total, item) => total + item.subtotal, 0).toFixed(2));
  }


  openModal(itemId: number): void {
    this.isModalOpen = true;
    this.itemToRemove = itemId;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.itemToRemove = null;
  }

  confirmRemove(): void {
    if (this.itemToRemove !== null) {
      this.removeFromCart(this.itemToRemove);
      this.closeModal();
    }
    Swal.fire({
      icon: 'success',
      title: 'Produit supprimé',
      text: 'Le produit a été supprimé de votre panier!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  removeFromCart(itemId: number): void {
    this.cartService.removeFromCart(itemId);
    this.loadCartItems();
  }

  getCouponValue(codePromo: string): Observable<number> {
    return this.orderservice.getpromobycodepromo(codePromo).pipe(
      map(response => {
        if (response && response.valeur) {
          this.couponValue = response.valeur;
          localStorage.setItem('couponCode', this.couponCode);
          localStorage.setItem('couponValue', response.valeur.toString());
          return response.valeur;
        } else {
          throw new Error('Coupon not found');
        }
      }),
      catchError(error => {
        console.error('Error fetching coupon value:', error);
        throw error;
      })
    );
  }

  getDiscountedTotalSubtotal(): number {
    const subtotal = this.getTotalSubtotal();
    const discountedSubtotal = this.couponValue ? subtotal * (1 - this.couponValue / 100) : subtotal;
    return parseFloat(discountedSubtotal.toFixed(2));
  }


  fetchCouponValue() {
    console.log('Méthode fetchCouponValue appelée');
    if (!this.couponCode.trim()) {
      this.errorMessage = 'Veuillez entrer un code promo.';
      this.cdr.detectChanges(); // Force la détection des changements
      return;
    }

    this.cartService.getPromoDetails(this.couponCode).subscribe(
      (promo) => {
        console.log('Réponse API :', promo);
        const today = new Date();
        const endDate = new Date(promo.date_fin);

        console.log('Date actuelle :', today);
        console.log('Date de fin :', endDate);

        if (today > endDate) {
          console.log('Code promo expiré par la date');
          this.errorMessage = 'Ce code promo est expiré (date dépassée).';
          this.couponValue = null;
        } else if (promo.commandes.length >= promo.max_utilisations) {
          console.log('Code promo expiré par le nombre d\'utilisations');
          this.errorMessage = 'Ce code promo a atteint son nombre maximum d\'utilisations.';
          this.couponValue = null;
        } else {
          console.log('Code promo valide');
          this.errorMessage = '';
          this.couponValue = promo.valeur;
          this.calculateSubtotals();
        }
      },
      (error) => {
        console.error('Erreur API :', error);
        this.errorMessage = 'Une erreur est survenue lors de la validation du code promo.';
        this.couponValue = null;
        this.cdr.detectChanges(); // Force la mise à jour
      }
    );
  }



}

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { CartService } from '../../services/cart.services';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CartItem } from '../../models/CartItem';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../services/article.services';
import { catchError, forkJoin, map, Observable } from 'rxjs';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthServiceService } from '../../services/auth-service.service';
import { OrderService } from '../../services/order.services';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, RouterModule,ToastrModule ],

templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  isModalOpen: boolean = false;
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  user: any = {};
  couponCode: string = '';

  commandeObject: any = {};
  commandeFinale:any={}
  confirmationMessage: string = '';
  showGlobalError: boolean = false;

  ListArticles: any;
  selectedPaymentMethod: string = 'cash';

  couponValue: number |  null = null;

  errorMessage: string = '';
  articleLabelsCache: { [key: number]: string } = {};
  userLogin = {
    username: '',
    password: ''
  };
  showLoading = false;

  rememberMe: boolean = false;

  showPassword: boolean = false;

  errors: { [key: string]: string } = {};

  constructor(
    private router: Router,
    private authService: AuthServiceService ,
    private cartService: CartService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private articleService : ArticleService,
    private toastr: ToastrService,
    private orderService:OrderService
  ) {}

  ngOnInit(): void {
    console.log('Utilisateur connecté :', this.isLoggedIn());

    if (!this.isLoggedIn()) {
      console.warn("Utilisateur non connecté. Chargement du panier depuis localStorage...");
      this.loadGuestCartItems(); // Charger le panier pour les invités
  }


    const storedSubtotal = localStorage.getItem('subtotal');
    if (storedSubtotal) {
      this.subtotal = parseFloat(storedSubtotal);
      this.cdr.detectChanges();
    }

    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.user = navigation.extras.state['user'] || {};
      this.cartItems = navigation.extras.state['cartItems'] || [];
    }

    if (!this.user || Object.keys(this.user).length === 0) {
      this.loadUserData();
    }

    this.loadCartItems(); // <---- CHARGEMENT DU PANIER
    console.log('Cart items onInit:', this.cartItems);

    this.cdr.markForCheck();
    this.loadCouponData();
}
loadGuestCartItems(): void {
  const storedCart = localStorage.getItem('cartItems');
  if (storedCart) {
      this.cartItems = JSON.parse(storedCart);
      console.log('Panier invité chargé :', this.cartItems);
  } else {
      this.cartItems = []; // Si aucun panier n'est trouvé
  }
}

  isLoggedIn(): boolean {
    const user = localStorage.getItem('user'); // Vérifie la présence des données utilisateur dans localStorage
    return !!user; // Renvoie true si user existe, sinon false
  }
  login(): void {
    this.showLoading = true;
    console.log(this.userLogin);

    this.authService.login(this.userLogin).subscribe(
      (response) => {
        console.log('User logged in successfully:', response);

        if (this.rememberMe) {
          localStorage.setItem('access_token', response.access_token);
        } else {
          sessionStorage.setItem('access_token', response.access_token);
        }

        // Sauvegarder les informations utilisateur dans localStorage
        this.authService.currentUser().subscribe((user) => {
          localStorage.setItem('user', JSON.stringify(user)); // Sauvegarde l'utilisateur dans localStorage
          this.loadUserData(); // Met à jour les données utilisateur
          this.router.navigate(['/checkout']); // Redirige après la mise à jour
        });
      },
      (error) => {
        console.error('Login failed:', error);
        // Afficher le message d'erreur
        this.errorMessage = 'Nom d’utilisateur ou mot de passe incorrect.';
        this.showLoading = false;
      }
    );
  }




  loadCartItems(): void {
    console.log('Chargement des articles...');
    this.cartItems = this.cartService.getCartItems();
    console.log('Articles récupérés dans loadCartItems:', this.cartItems);

    if (!this.cartItems || this.cartItems.length === 0) {
      console.warn('Aucun article trouvé dans le panier.');
    }

    console.log('Vue mise à jour');
  }

  loadUserData(): void {
    const userString = localStorage.getItem('user');
    if (userString) {
      this.user = JSON.parse(userString);
      console.log('Utilisateur chargé :', this.user);
    } else {
      console.error('Aucun utilisateur trouvé dans le localStorage');
    }
  }

  loadCouponData(): void {
    this.couponCode = localStorage.getItem('couponCode') || '';
    const couponValueString = localStorage.getItem('couponValue');
    this.couponValue = couponValueString ? parseFloat(couponValueString) : null;
  }

  createCommandeObject(): any {
    console.log("🔹 createCommandeObject() appelée !");
    // Vérifier si les informations essentielles sont présentes (invité)
    if (!this.user.nom || !this.user.prenom || !this.user.email || !this.user.telephone || !this.user.address) {
        console.error('Erreur : Informations obligatoires manquantes');
        return null;
    }

    const discount = this.couponValue ? (this.subtotal * this.couponValue) / 100 : 0;
    const finalPrice = this.subtotal - discount;

    const ligneCommande: any[] = [];
    const ligneCommandePack: any[] = [];

    this.cartItems.forEach(item => {
      console.log("🔍 Traitement de l'item :", item);
        const prix_ht_article = item.prix_ht || item.prix / 1.2; // Calcul du prix HT

        if (item.lignes_pack) {
          console.log("✅ Ajout au pack :", { id_pack: item.id, libelle: item.libelle });
            ligneCommandePack.push({
                id_pack: item.id,
                nbr_pack: item.quantity,
                prix_ttc_pack: item.prix,
                prix_ht_pack: prix_ht_article,
                libelle: item.libelle
            });
        } else {
            ligneCommande.push({
                id_article: item.id,
                nbr_article: item.quantity,
                prix_ttc_article: item.promo !== 0 ? item.prix_final : item.prix_ttc,
                prix_ht_article: prix_ht_article,
                libelle: item.libelle,
                  id_variant: item.variant

            });
        }
    });
    console.log("🚀 Contenu de ligneCommandePack :", ligneCommandePack);

    const paymentComment = `Paiement par ${this.selectedPaymentMethod}`;
    const orderComment = this.user.orderNotes ? `${this.user.orderNotes}. ${paymentComment}` : paymentComment || 'No notes';
    console.log("🚀 Contenu de ligneCommandePack avant retour :", JSON.stringify(ligneCommandePack, null, 2));
    const commande = {
      commande: { /* ... */ },
      ligneCommande: ligneCommande,
      ligneCommandePack: ligneCommandePack,
      infoCommande: { /* ... */ }
  };
    console.log("🚀 Contenu final de commandeObject :",commande);
    return {
        commande: {
            status: 1,
            id_user: null, // Si connecté, on met son ID, sinon null
            id_pv: null,
            id_client: this.user.id || null, // Accepter une commande invité
            id_fournisseur: null,
            totalttc_init: this.subtotal,
            remise: discount,
            prix_total: finalPrice,
            commentaire: orderComment,
            is_sell: true,
            code_promo: this.couponCode,
        },
        ligneCommande: ligneCommande,
        ligneCommandePack: ligneCommandePack,
        infoCommande: {
            nom: this.user.nom,
            prenom: this.user.prenom,
            num_tel1: this.user.telephone,
            num_tel2: '',
            email: this.user.email,
            ville: this.user.city,
            region: this.user.region || '',
            adresse: this.user.address,
            code_postal: this.user.code_postal || 0,
        }
    };
}

  updateError(field: string): void {
    if (this.user[field] && this.user[field].trim() !== '') {
      delete this.errors[field]; // Supprimer l'erreur si le champ est rempli
    }
  }


  placeOrder(): void {
    console.log("🔹 Bouton 'Passer la commande' cliqué !");

    if (!this.validateCheckout()) {
        console.warn("❌ Validation du checkout échouée !");
        this.showGlobalError = true;
        return;
    }
    this.showGlobalError = false;
    localStorage.setItem('guestUser', JSON.stringify(this.user));

    console.log("✅ Checkout validé !");

    if (!this.selectedPaymentMethod) {
        console.warn("❌ Aucun mode de paiement sélectionné !");
        return;
    }
    console.log("✅ Mode de paiement sélectionné :", this.selectedPaymentMethod);

    if (!this.user || !this.user.address || !this.user.city || !this.user.zip) {
        this.loadUserData();
    }

    console.log("🔹 User après chargement des données :", this.user);

    if (!this.user || Object.keys(this.user).length === 0) {
      console.error("❌ Erreur : Informations utilisateur manquantes.");
      return;
  }
  console.log("✅ Commande en mode invité ou utilisateur connecté.");

    console.log("✅ Utilisateur chargé avec ID :", this.user.id);

    this.commandeObject = this.createCommandeObject();
    console.log("🔹 Commande générée :", this.commandeObject);

    if (!this.commandeObject) {
        console.error("❌ Erreur lors de la création de l'objet commande. Annulation de la requête.");
        return;
    }

    console.log("✅ Commande avant envoi :", this.commandeObject);

    this.orderService.preOrder(this.commandeObject).subscribe({
        next: (response: any) => {
            console.log("✅ Réponse du serveur :", response);
            this.commandeFinale = response;
            this.commandeObject = {
                ...this.commandeObject,
                ...response,
                ligneCommande: this.commandeObject.ligneCommande,
                ligneCommandePack: this.commandeObject.ligneCommandePack
            };
            if (!this.user.isRegistered) {
              console.log("🔹 Stockage de guestOrderId dans localStorage...");
              localStorage.setItem('guestOrderId', response.id);
          }
            this.showModal('confirmationModal');
        },
        error: (error) => {
            console.error("❌ Erreur API :", error);
        }
    });
}

onAddressChange(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  this.user.address = inputElement.value;
  this.saveUserData();
}

onCityChange(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  this.user.city = inputElement.value;
  this.saveUserData();
}
saveUserData(): void {
  if (!this.user) {
    console.error("Erreur : Aucun utilisateur à sauvegarder !");
    return;
  }
  console.log("📌 Sauvegarde des données utilisateur :", this.user);
  localStorage.setItem('user', JSON.stringify(this.user));
}


  confirmOrder(): void {
    console.log("Commande envoyée :", this.commandeObject);

    this.commandeObject.ligneCommande.forEach((ligne: any) => {
      if (ligne.id_pack) {
        delete ligne.id_article;
      }
    });
    this.orderService.Order(this.commandeFinale).subscribe({
      next: (response : any) => {
        console.log("response", response)
        console.log("jiiiiii")
              console.log("Articles et packs commandés :", this.commandeObject.ligneCommande);

        this.showModal('successModal');
        setTimeout(() => {
          this.closeModal('successModal');
          if (!this.isLoggedIn()) {
            this.router.navigate(['/Home']); // Rediriger vers la page d'accueil
          } // Cacher le modal après 3 secondes
        }, 3000);
        this.clearCart();

      },
      error: (error) => {
        console.error('Error confirming order:', error);
      }
    });

    this.closeModal('confirmationModal');
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  showModal(modalId: string): void {
    this.isModalOpen = true;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeModal(modalId: string): void {
    this.isModalOpen = false;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
    if (modalId === 'successModal') {
      this.router.navigate(['/success']);
    }
  }
  validateCheckout(): boolean {
    this.errors = {}; // Réinitialiser les erreurs avant la validation
    let isValid = true;

    console.log("🔍 Validation du formulaire...");
    console.log("📝 Données utilisateur :", this.user);

        // Prénom
        if (!this.user.prenom || this.user.prenom.trim() === '') {
          this.errors['prenom'] = 'Veuillez remplir ce champ.';
          console.warn("❌ Erreur : Prénom vide !");
          isValid = false;
      }

      // Nom de famille
      if (!this.user.nom || this.user.nom.trim() === '') {
          this.errors['nom'] = 'Veuillez remplir ce champ.';
          console.warn("❌ Erreur : Nom vide !");
          isValid = false;
      }

      // Numéro de téléphone (doit contenir uniquement des chiffres et avoir au moins 10 caractères)
      if (!this.user.telephone || this.user.telephone.trim() === '') {
          this.errors['telephone'] = 'Veuillez remplir ce champ.';
          console.warn("❌ Erreur : Téléphone vide !");
          isValid = false;
      } else if (!/^\d{8,}$/.test(this.user.telephone)) {
          this.errors['telephone'] = 'Veuillez entrer un numéro valide (8 chiffres).';
          console.warn("❌ Erreur : Téléphone invalide !");
          isValid = false;
      }

      // Adresse e-mail (validation format email)
      if (!this.user.email || this.user.email.trim() === '') {
          this.errors['email'] = 'Veuillez remplir ce champ.';
          console.warn("❌ Erreur : Email vide !");
          isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.user.email)) {
          this.errors['email'] = 'Veuillez entrer une adresse e-mail valide.';
          console.warn("❌ Erreur : Email invalide !");
          isValid = false;
      }

    if (!this.user.address || this.user.address.trim() === '') {
        this.errors['address'] = 'Veuillez remplir ce champ.';
        console.warn("❌ Erreur : Adresse vide !");
        isValid = false;
    }
    if (!this.user.city || this.user.city.trim() === '') {
        this.errors['city'] = 'Veuillez remplir ce champ.';
        console.warn("❌ Erreur : Ville vide !");
        isValid = false;
    }

    if (isValid) {
      this.saveUserData(); // Sauvegarde après validation réussie
    }
    console.log("✅ Résultat validation :", isValid);
    return isValid;
}


  goToRegister() {
    this.router.navigate(['/register']);
  }
  getTotalWithShipping(): number {
    const shippingCost = this.subtotal >= 99 ? 0 : 8.000;
    return parseFloat((this.subtotal + shippingCost).toFixed(3));
  }

  getShippingCost(): number {
    return this.subtotal >= 99 ? 0 : 8.000;
  }

  getCouponValue(codePromo: string): Observable<number> {
    return this.orderService.getpromobycodepromo(codePromo).pipe(
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
  getTotalSubtotal(): number {
    return parseFloat(this.cartItems.reduce((total, item) => total + item.subtotal, 0).toFixed(2));
  }

}

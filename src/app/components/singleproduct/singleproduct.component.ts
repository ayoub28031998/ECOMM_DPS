import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.services';
import { CartService } from '../../services/cart.services';
import { WishlistService } from '../../services/wishlist.services';
import { CartItem } from '../../models/CartItem';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-singleproduct',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterModule, FormsModule, CommonModule ],
  templateUrl: './singleproduct.component.html',
  styleUrl: './singleproduct.component.css'
})
export class SingleproductComponent implements OnInit {
  @ViewChild('reviewsTab', { static: false }) reviewsTab!: ElementRef;
@ViewChild('reviewsSection', { static: false }) reviewsSection!: ElementRef;

  articleId: any;
  article: any;
  quantity: number = 1;
  rating: number = 0;  // Valeur de la note
  reviewText: string = '';  // Commentaire du produit
  isLoggedIn: boolean = false;
 displayedImage: string = '';

  selectedTeinte: string = ''; // Libellé de la teinte sélectionnée
  selectedVariant: any; // Va

  constructor(private route: ActivatedRoute,
     private articleservice: ArticleService,
     private authService: AuthServiceService ,
     private wishlist : WishlistService,
     private toastr: ToastrService,
     private cdr: ChangeDetectorRef,
     private cartService :CartService) { }

     ngAfterViewInit() {
      if (this.reviewsTab && this.reviewsSection) {
        console.log('reviewsTab et reviewsSection sont prêtes.');
      } else {
        console.warn('reviewsTab ou reviewsSection ne sont pas encore disponibles.');
      }
    }

    formatText(text: string): string {
      if (!text) return '';
      return text.replace(/\. /g, '.<br>');
  }


     ngOnInit(): void {


      this.authService.isLoggedIn().subscribe((loggedIn: boolean) => {
        this.isLoggedIn = loggedIn;
      });

      console.log("from");

      this.route.params.subscribe(params => {
        const libelle = params['libelle']; // Récupère le libellé
        const articleId = params['id'];
        console.log(articleId);
        if (articleId) {
          this.fetchArticleDetails(articleId);
        } else {
          console.error('Article ID is null');
        }
      });
      this.articleservice.getArticlesById(this.articleId).subscribe((data) => {
        console.log('Article Data:', data);
        this.article = data;
        this.cdr.detectChanges();
      });


      this.articleservice.getArticlesById(this.articleId).subscribe((data) => {
        this.article = data;

        // Sélectionner la première variante par défaut
        if (this.article.variants && this.article.variants.length > 0) {
    this.selectedVariant = this.article.variants[0];  // Par défaut, le 1er variant sélectionné
      // choisir l'image de la 1ère variante
    if (this.selectedVariant.images && this.selectedVariant.images.length > 0) {
      this.displayedImage = this.selectedVariant.images[0].data;  // <-- ici .data
    } else if (this.article.images && this.article.images.length > 0) {
      this.displayedImage = this.article.images[0].data;
    }
  } else if (this.article.images && this.article.images.length > 0) {
    // pas de variantes → image de l'article
    this.displayedImage = this.article.images[0].data;
  }

  console.log("➡ Image affichée au démarrage :", this.displayedImage);

      });
    }
    selectTeinte(variant: any) {
      this.selectedTeinte = variant.libelle;
      this.quantity = 1;

      // Mettre à jour les propriétés de l'article directement
      this.article.libelle = variant.libelle;
      this.article.description = variant.description;
      this.article.plus_details = variant.plus_details;
      this.article.images[0].data = variant.images;
    }


selectVariant(variant: any) {
  this.selectedVariant = variant;
  console.log('➡ Variant sélectionné :', this.selectedVariant);

  if (variant.images && variant.images.length > 0) {
    this.displayedImage = variant.images[0].data;  // <-- on prend .data
  } else if (this.article.images && this.article.images.length > 0) {
    this.displayedImage = this.article.images[0].data; // si dispo
  } else {
    this.displayedImage = ''; // fallback
  }

  console.log("✅ Nouvelle image affichée :", this.displayedImage);
}

onVariantChange() {
  console.log('🔄 Variant changé via select :', this.selectedVariant);
}

    // Méthode pour changer la teinte via la liste déroulante
    onTeinteChange() {
      // Trouver le variant correspondant à la teinte sélectionnée
      const variant = this.article.details_variant.find(
        (variant: { libelle: string; }) => variant.libelle === this.selectedTeinte
      );
      this.quantity = 1;

      if (variant) {
        // Mettre à jour les propriétés de l'article directement
        this.article.libelle = variant.libelle;
        this.article.description = variant.description;
        this.article.plus_details = variant.plus_details;
        this.article.images[0].data = variant.images;


      }
    }
    getTeinteColor(libelle: string): string {
      const variant = this.article.details_variant.find(
        (variant: { libelle: string; }) => variant.libelle === libelle
      );
      return variant ? variant.icon_color : 'transparent'; // Retourne la couleur ou transparent si non trouvé
    }

    isStarFilled(starIndex: number): boolean {
      return starIndex <= Math.round(this.article?.note || 0);
    }

    increaseQuantity(article: any): void {
      this.quantity++; // Incrémente directement la valeur
      this.updateTotalPrice(article);
    }

    // Décrémente la quantité (minimum 1)
    decreaseQuantity(article: any): void {
      if (this.quantity > 1) {
        this.quantity--; // Décrémente si > 1
        this.updateTotalPrice(article);
      }
    }

    // Met à jour le prix total
    updateTotalPrice(article: any): void {
      article.totalPrice = this.quantity * article.prix_ttc;
    }
isStockBlinking: boolean = false;
 addToCart(event: Event, product: any, quantity: number): void {
  let variant = null;

  // ✅ Si le produit a des variants
  if (product.variants?.length > 0) {
    if (!this.selectedVariant) {
      Swal.fire({
        icon: 'error',
        title: 'Couleur manquante',
        text: 'Veuillez sélectionner une couleur avant d\'ajouter au panier',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (this.selectedVariant.stock === 0) {
      event.preventDefault();
      this.isStockBlinking = true;
      setTimeout(() => this.isStockBlinking = false, 1600);
      return;
    }

    // ✅ Produit avec variant → mettre à jour infos
    const selectedVariant = this.selectedVariant;
    const updatedProduct = { ...product };

    if (selectedVariant.images?.length > 0) {
      updatedProduct.images = selectedVariant.images.map((img: string) => ({ data: img }));
    }

    updatedProduct.libelle = `${product.libelle} - ${selectedVariant.libelle}`;
    updatedProduct.description = selectedVariant.description || product.description;
    updatedProduct.plus_details = selectedVariant.plus_details || product.plus_details;
    updatedProduct.selectedColor = selectedVariant.libelle;

    variant = selectedVariant.id;
    this.cartService.addToCart(updatedProduct, quantity, variant);
  }
  // ✅ Produit sans variants → ajouter directement
  else {
    this.cartService.addToCart(product, quantity, variant);
  }

  Swal.fire({
    icon: 'success',
    title: 'Produit ajouté',
    text: 'Le produit a été ajouté à votre panier!',
    timer: 2000,
    showConfirmButton: false,
  });
}


  isPromotionActive(promotion: any): boolean {
    const currentDate = new Date();
    const startDate = new Date(promotion.date_debut);
    const endDate = new Date(promotion.date_fin);
    return currentDate >= startDate && currentDate <= endDate;
  }

  getDiscountedPrice(article: any): number {
    if (article.ligne_promotions && article.ligne_promotions.length > 0) {
      const promotion = article.ligne_promotions[0];
      if (this.isPromotionActive(promotion)) {
        return article.prix_ttc * (1 - promotion.valeur / 100);
      }
    }
    return article.prix_ttc;
  }

  fetchArticleDetails(id: any): void {
    this.articleservice.getArticlesById(id).subscribe((response: any) => {
      this.article = response;
      console.log('Article fetched:', this.article);
      // Sélectionner la première variante par défaut
        if (this.article.variants && this.article.variants.length > 0) {
    this.selectedVariant = this.article.variants[0];  // Par défaut, le 1er variant sélectionné
      // choisir l'image de la 1ère variante
    if (this.selectedVariant.images && this.selectedVariant.images.length > 0) {
      this.displayedImage = this.selectedVariant.images[0].data;  // <-- ici .data
    } else if (this.article.images && this.article.images.length > 0) {
      this.displayedImage = this.article.images[0].data;
    }
  } else if (this.article.images && this.article.images.length > 0) {
    // pas de variantes → image de l'article
    this.displayedImage = this.article.images[0].data;
  }

  console.log("➡ Image affichée au démarrage :", this.displayedImage);



    }, (error: any) => {
      console.error('Error fetching article:', error);
    });
  }
  addToWishlist(product: any): void {
    this.wishlist.addToWishlist(product);
    Swal.fire({
      icon: 'success',
      title: 'Produit ajouté',
      text: 'Le produit a été ajouté à votre wishlist!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  rateProduct(rating: number): void {
    this.rating = rating;
    console.log(`Note sélectionnée : ${this.rating}`);
  }



  submitReview(): void {
    if (this.rating === 0) {
      this.toastr.warning('Veuillez d\'abord sélectionner une note (étoile).', 'Attention', {
        closeButton: true,
        progressBar: true
      });
      return;
    }

    // Récupérer l'utilisateur actuel
    this.authService.currentUser().subscribe(
      (user) => {
        if (!user || !user.id) {
          console.error('Utilisateur non valide ou ID manquant');
          alert('Une erreur s\'est produite. Veuillez vous reconnecter.');
          return;
        }

        const reviewData = {
          note: this.rating,
          review: this.reviewText || "",
          id_client: user.id
        };

        console.log('Données de l\'avis envoyées :', reviewData); // Vérifier les données à envoyer

        this.articleservice.addReview(this.article, reviewData).subscribe(
          (response) => {
            console.log('Avis ajouté avec succès:', response);
            // Réinitialiser les champs après succès
            this.reviewText = "";
            this.rating = 0;
            this.toastr.success('Merci pour votre avis !', 'Succès', {
              closeButton: true,
              progressBar: true
            });
          },
          (error) => {
            console.error('Erreur lors de l\'ajout de l\'avis:', error); // Enregistrer les erreurs du backend
            this.toastr.error('Une erreur s\'est produite. Veuillez réessayer.', 'Erreur', {
              closeButton: true,
              progressBar: true
            });
          }
        );
      },
      (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error); // Enregistrer les erreurs de récupération de l'utilisateur
      }
    );
  }


  getTotalPrice(article: any): number {
    if (!article) {
      return 0;
    }

    const basePrice =
      article.promo !== 0
        ? (article.prix_final || article.prix || 0)
        : (article.prix_ttc || article.prix || 0);

    const quantity = article.quantity || 1;

    return basePrice * quantity;
  }


  getColor(teinte: string): string {
    switch (teinte) {
      case '01 nude wave':
        return '#D19A8B';
      case '02 coton candy':
        return '#E46D8A';
      case '05 berry much':
        return '#B8325B';
      case '07 cherry boom boom':
        return '#A5072C';
      case '11 funky brown':
        return '#8C3B3B';
      default:
        return '#ccc'; // Couleur par défaut
    }
  }

  goToReviews() {
    setTimeout(() => {
      const reviewsTab = document.querySelector('#reviews-tab') as HTMLElement;
      const reviewsSection = document.querySelector('#reviews') as HTMLElement;

      if (reviewsTab && reviewsSection) {
        // Désactiver les autres onglets
        const tabs = document.querySelectorAll('.nav-link');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Activer l'onglet Avis
        reviewsTab.classList.add('active');

        // Désactiver les autres contenus
        const tabContents = document.querySelectorAll('.tab-pane');
        tabContents.forEach(tab => tab.classList.remove('active', 'show'));

        // Activer le contenu Avis
        reviewsSection.classList.add('active', 'show');

        // Défilement fluide vers la section Avis
        reviewsSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          window.scrollBy(0, -210);
        }, 500);
      } else {
        console.error('Les éléments reviews-tab ou reviews ne sont pas trouvés dans le DOM.');
      }
    }, 0);
  }


}


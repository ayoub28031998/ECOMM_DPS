import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ArticleService } from '../services/article.services';
import { CartService } from '../services/cart.services';
import Swal from 'sweetalert2';
import { WishlistService } from '../services/wishlist.services';

@Component({
  selector: 'app-promotion',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterModule, FormsModule, CommonModule ,  DialogModule],
  templateUrl: './promotion.component.html',
  styleUrl: './promotion.component.css'
})
export class PromotionComponent implements OnInit {
  minPrice: number = 10;
  maxPrice: number = 500;
    ListArticles:any[]=[];
  ListArticlesFiltered:any[]=[];
  ListCategories:any[]=[];
  selectedCategoryId: number | null = null; // ID de la catégorie active
  selectedSubCategoryId: number | null = null; // ID de la sous-catégorie active

  nbrArticle:any = 12 ;
loader=false;
selectedArticle: any = null;
affichdetails=false;
Categorie: any[] = [];
filteredCategories: any[] = [];
Marques: any[] = [];
isArticlesLoaded: boolean = false;
selectedPrice: number = 1000;
selectedCategoryLabel: string = 'Boutique';
selectedBrandId: number | null = null;
isFiltered: boolean = false;

activeFilters: { label: string; type: string; value: any }[] = [];

sousSousCategories: any[] = [];
sousCategories: any[] = [];


totalItems: number = 0;
totalPages: number = 0;
currentPage: number = 1;

pages: number[] = [];
searchQuery:any= null;
selectedSousSousCategoryId: number | null = null;



  constructor(private http: HttpClient, private cartService: CartService,  private wishlist : WishlistService, private articleservice: ArticleService ,private changeDetectorRef: ChangeDetectorRef, private router: Router ,  private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.fetchPromoArticles();


  }
  fetchPromoArticles(): void {
    const requestPayload = {
      nbre_page: 1,
      nbre_article: this.nbrArticle,
      order_by: 'id',
      search: '',
      prix_min: 0,
      prix_max: 10000,
      id_marque: null,
      id_categorie: null,
      id_sous_categorie: null,
      id_sous_sous_categorie: null,
    };

    this.articleservice.getPromoArticles(requestPayload).subscribe(
      (response) => {
        this.ListArticles = response; // Liste originale
        this.ListArticlesFiltered = [...this.ListArticles]; // Liste pour filtrage local
        this.totalItems = response[0]?.count || 0;
        console.log("fatmmmmmmmmmma", this.totalItems)
        this.totalPages = Math.ceil(this.totalItems / this.nbrArticle);
        console.log("dhfdsfbgfhs",this.totalPages);
      },
      (error) => {
        console.error('Erreur lors de la récupération des articles promotionnels', error);
      }
    );
  }


onPageChange(page: number): void {
  if (page > 0 && page <= this.totalPages) {
    console.log("Ancienne page :", this.currentPage);

    this.currentPage = page;
    console.log("Nouvelle page :", this.currentPage);

    this.currentPage = page;
      this.applyFilters();
      this.changeDetectorRef.detectChanges();


    window.scrollTo({
      top: 150, // Position haut de la page
      behavior: 'smooth' // Défilement fluide
    });
  }
}

getVisiblePages(): number[] {
  const visiblePages: number[] = [];

  // Ajouter les pages avant et après la page actuelle
  for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(this.totalPages - 1, this.currentPage + 1); i++) {
    visiblePages.push(i);
  }

  return visiblePages;
}

  quantity = 1;
  showDetails(article: any) {
    this.selectedArticle = article;
    console.log(this.selectedArticle);
    this.affichdetails=true;
    console.log("hazemmm")
  }
   addToCart(product: any) {
      this.cartService.addToCart(product,this.quantity);
      this.affichdetails = false;
      Swal.fire({
        icon: 'success',
        title: 'Produit ajouté',
        text: 'Le produit a été ajouté à votre panier!',
        timer: 2000,
        showConfirmButton: false,
      });
    }
    addToWishlist(product: any): void {
      this.wishlist.addToWishlist(product);
      Swal.fire({
        icon: 'success',
        title: 'Produit ajouté',
        text: 'Le produit a été ajouté à votre liste de souhaits!',
        timer: 2000,
        showConfirmButton: false,
      });
    }



increaseQuantity(): void {
  this.quantity++;
}

decreaseQuantity(): void {
  if (this.quantity > 1) {
    this.quantity--;
  }
}


removeFilter(filter: { label: string; type: string; value: any }): void {
  // Remove the selected filter from the activeFilters array
  this.activeFilters = this.activeFilters.filter((f) => f !== filter);

  // Reset corresponding filter criteria based on the type
  if
   (filter.type === 'price') {
    this.minPrice = 0;
    this.maxPrice = 2000;
  }

  // Reapply the remaining filters or reset to the full article list
  if (this.activeFilters.length > 0) {
    this.applyFilters();
  } else {


      console.log('Aucun filtre ou catégorie sélectionné. Chargement de tous les articles.');
      this.clearAllFilters();
    }
  }

  addFilter(type: string, label: string, value: any): void {
    // Supprimer les anciens filtres du même type
    this.activeFilters = this.activeFilters.filter((filter) => filter.type !== type);

    // Ajouter le nouveau filtre
    this.activeFilters.push({ type, label, value });
  }
  clearAllFilters(): void {
    // Réinitialiser tous les filtres actifs sauf l'ID de la sous-catégorie
    this.activeFilters = this.activeFilters.filter((filter) => filter.type === 'category');

   // Réinitialiser la marque sélectionnée
    this.minPrice = 0; // Réinitialiser le prix minimum
    this.maxPrice = 2000; // Réinitialiser le prix maximum
    this.isFiltered = false; // Indique que les filtres sont désactivés

    console.log('Effacement des filtres, sauf la sous-catégorie sélectionnée.');

    // Appliquer les filtres en gardant uniquement la sous-catégorie
    this.applyFilters();
  }

  filterArticlesByPrice(): void {
    this.ListArticlesFiltered = this.ListArticlesFiltered.filter((article) => {
      const price = article.prix_final || article.prix_ttc; // Assurez-vous d'utiliser le prix correct
      return price >= this.minPrice && price <= this.maxPrice;
    });
  }

applyFilters(): void {
  const requestBody = {
    nbre_page: this.currentPage,
    nbre_article: this.nbrArticle,
    order_by: 'id',
    search:  "",
    prix_min: this.minPrice || 0,
    prix_max: this.maxPrice || 2000,
    id_marque:  0,
    id_categorie: 0,
    id_sous_categorie:  0, // Filtrage par sous-catégorie
    id_sous_sous_categorie:  0,
  };

  console.log('Request body pour applyFilters:', requestBody);

  this.loader = true;

  this.articleservice.getPromoArticles(requestBody).subscribe(
    (response) => {
      console.log('Réponse reçue dans applyFilters:', response);

      this.ListArticlesFiltered = response || [];
      this.totalItems = response[0]?.count || 0;
      console.log("fatmmmmmmmmmma", this.totalItems)
      this.totalPages = Math.ceil(this.totalItems / this.nbrArticle);
      console.log("dhfdsfbgfhs",this.totalPages);
      this.loader = false;


      console.log('Articles après application des filtres :', this.ListArticlesFiltered);
    },
    (error) => {
      console.error('Erreur lors de la récupération des articles filtrés :', error);
      this.loader = false;
    }
  );
}

onPriceChange(): void {
  console.log('Prix modifié, application du filtre');
  this.applyPriceFilter();
}
applyPriceFilter(): void {
  console.log(`Filtre de prix appliqué : ${this.minPrice} - ${this.maxPrice}`);

  // Ajouter un filtre actif pour le prix
  const priceLabel = `Prix : ${this.minPrice} - ${this.maxPrice}`;
  this.addFilter('price', priceLabel, { min: this.minPrice, max: this.maxPrice });

  // Appliquer le filtrage localement
  this.applyFilters();
}

navigateToProductDetails(productId: number): void {
  this.router.navigate(['/singleproduct', productId]);
}
}



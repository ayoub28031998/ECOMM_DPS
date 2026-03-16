import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { ArticleService } from '../../services/article.services';
import { CommonModule } from '@angular/common';
import { CAtegorieService } from '../../services/categorie.services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogModule } from 'primeng/dialog';
import { CartService } from '../../services/cart.services';
import { WishlistService } from '../../services/wishlist.services';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ArticleSharingService } from '../../services/article-sharing.service';
import { Article } from '../../models/article';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [HeaderComponent, FooterComponent,CommonModule,DialogModule, FormsModule],
   templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit{

  constructor(
    private articleservice: ArticleService,
    private categorieService: CAtegorieService,
    private articleSharingService: ArticleSharingService,
    private cartService: CartService , private wishlist : WishlistService,private route: ActivatedRoute,
    private router: Router, private categories: CAtegorieService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {}
  nbre_page: number | undefined;

    ListArticles:any[]=[];
  ListArticlesFiltered:any[]=[];
  ListCategories:any[]=[];
  selectedCategoryId: number | null = null; // ID de la catégorie active
  selectedSubCategoryId: number | null = null; // ID de la sous-catégorie active
  minPrice: any;
  maxPrice: any;
  nbrArticle:number=9;
selectedArticle: any = null;
affichdetails=false;
Categorie: any[] = [];
filteredCategories: any[] = [];
Marques: any[] = [];
isArticlesLoaded: boolean = false;
selectedPrice: number = 1000;
selectedCategoryLabel: string = '';
selectedBrandId: number | null = null;
isFiltered: boolean = false;

activeFilters: { label: string; type: string; value: any }[] = [];

sousSousCategories: any[] = [];
sousCategories: any[] = [];

isMarquesVisible: boolean = false;
totalItems: number = 0;
totalPages: number = 0;
currentPage: number = 1;

pages: number[] = [];
searchQuery:any= null;
selectedSousSousCategoryId: number | null = null;
showFilters: boolean = true;
firstLoad: boolean = true;
loader: boolean = true;
minLimit: number = 0;  // Valeur min initiale
maxLimit: number = 100; // Valeur max initiale
articles: any[] = [];
selectedCategorie: string = 'all';



async ngOnInit(): Promise<void> {
  this.selectedCategoryLabel = "Resultats de recherche";
  this.route.queryParams.subscribe(params => {
    let searchTerm = params['q'];
    if (searchTerm) {
      this.applyFilters(searchTerm);
    }
  });



  this.loadDynamicPriceRange();


}

performSearch(query: string) {
  const requestBody = {
    search: query.trim(),
    id_categorie: this.selectedCategorie ? +this.selectedCategorie : 0
  };

  console.log('Performing search with request body:', requestBody);

  this.articleservice.searchArticles(requestBody).subscribe(
    (results: Article[]) => {
      this.articles = results;
      console.log('Search results:', this.articles);
    },
    error => {
      console.error('Error while searching articles:', error);
      this.articles = [];
    }
  );
}


  loadDynamicPriceRange(): void {
    const requestBody = {
      id_marque: this.selectedBrandId || 0,
      id_categorie: this.selectedCategoryId || 0,
      id_sous_categorie: this.selectedSubCategoryId || 0,
      id_sous_sous_categorie: this.selectedSousSousCategoryId || 0,
    };

    this.articleservice.getDynamicPriceRange(requestBody).subscribe(
      (response: any) => {
        if (response && response.prix_min !== undefined && response.prix_max !== undefined) {
          this.minLimit = response.prix_min;
          this.maxLimit = response.prix_max;

          this.minPrice = this.minLimit;
          this.maxPrice = this.maxLimit;
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération des plages de prix :', error);
      }
    );
  }








marqueselected:any={}
catelected:any={}

applyFilters(query: string): void {
  this.route.queryParams.subscribe(params => {
    this.currentPage = params['page'] ? Number(params['page']) : 1;
    console.log("Page actuelle après navigation :", this.currentPage);
  });
  console.log("jjjjjjjjjjjjjjjjjjjjjjjjjj")
  const requestBody = {
    nbre_page: this.currentPage,
    nbre_article: this.nbrArticle,
    order_by: 'id',
    search:  query.trim(),
    prix_min: this.minPrice || 0,
    prix_max: this.maxPrice || 0,
    id_marque: this.selectedBrandId || 0,
    id_categorie: this.selectedCategoryId || 0,
    id_sous_categorie: this.selectedSubCategoryId || 0, // Filtrage par sous-catégorie
    id_sous_sous_categorie: this.selectedSousSousCategoryId || 0,
  };

  console.log('Request body pour applyFilters:', requestBody);



  this.articleservice.getArticlesByFilters(requestBody).subscribe(
    (response: any) => {
      this.articles = response || [];
      console.log("Valeur de count dans response[0] :", response[0]?.count);
      this.totalItems = response[0]?.count || 0;

      console.log("djfkjkjd,kdjgfdgjfdthis", this.totalItems)
      this.totalPages = Math.ceil(this.totalItems / this.nbrArticle);
      console.log("djdjsjdj", this.totalPages)

      console.log('Articles après application des filtres :', this.articles);

this.loader=false
  },
    (error) => {
      console.error('Erreur lors de la récupération des articles filtrés :', error);

    }
  );

}
applyFilterss(): void {
  this.loadDynamicPriceRange();
  this.route.queryParams.subscribe(params => {
    this.currentPage = params['page'] ? Number(params['page']) : 1;
    console.log("Page actuelle après navigation :", this.currentPage);
  });
  console.log("jjjjjjjjjjjjjjjjjjjjjjjjjj")
  const requestBody = {
    nbre_page: this.currentPage,
    nbre_article: this.nbrArticle,
    order_by: 'id',
    search: this.searchQuery || "",
    prix_min: this.minPrice || 0,
    prix_max: this.maxPrice || 2000,
    id_marque: this.selectedBrandId || 0,
    id_categorie: this.selectedCategoryId || 0,
    id_sous_categorie: this.selectedSubCategoryId || 0, // Filtrage par sous-catégorie
    id_sous_sous_categorie: this.selectedSousSousCategoryId || 0,
  };

  console.log('Request body pour applyFilters:', requestBody);



  this.articleservice.getArticlesByFilters(requestBody).subscribe(
    (response: any) => {

      this.ListArticlesFiltered = response || [];
      this.totalItems = response[0]?.count || 0;
      this.totalPages = Math.ceil(this.totalItems / this.nbrArticle);

      console.log('Articles après application des filtres :', this.ListArticlesFiltered);
      this.loader = false;

  },
    (error) => {
      console.error('Erreur lors de la récupération des articles filtrés :', error);
      this.loader = false;
      this.firstLoad = false;
    }
  );

}






applyPriceFilter(): void {
  if (this.minPrice >= this.maxPrice) {
    this.minPrice = this.maxPrice - 1;
  }

  // Empêcher maxPrice de descendre sous minPrice
  if (this.maxPrice <= this.minPrice) {
    this.maxPrice = this.minPrice + 1;
  }
  console.log(`🎯 Filtre de prix appliqué : ${this.minPrice} - ${this.maxPrice}`);

  // Ajouter un filtre actif pour le prix
  const priceLabel = `Prix : ${this.minPrice} - ${this.maxPrice}`;
  this.addFilter('price', priceLabel, { min: this.minPrice, max: this.maxPrice });
  this.route.queryParams.subscribe(params => {
    let searchTerm = params['q']; if (searchTerm) {
      this.applyFilters(searchTerm);
    }
  });


  // Forcer la détection des changements
  this.cdr.detectChanges();
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
onPageChange(page: number): void {
  if (page > 0 && page <= this.totalPages) {
    console.log("Ancienne page :", this.currentPage);

    this.currentPage = page;
    console.log("Nouvelle page :", this.currentPage);
    this.router.navigate([], {
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge'
    });
    this.currentPage = page;



      this.cdr.detectChanges();
    window.scrollTo({
      top: 150, // Position haut de la page
      behavior: 'smooth' // Défilement fluide
    });
  }
}

getVisiblePages(): number[] {
 // console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkk")
  this.route.queryParams.subscribe(params => {
    this.currentPage = params['page'] ? Number(params['page']) : 1;
   // console.log("Page actuelle après navigation :", this.currentPage);
  });
  const visiblePages: number[] = [];

  // Ajouter les pages avant et après la page actuelle
  for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(this.totalPages - 1, this.currentPage + 1); i++) {
    visiblePages.push(i);
  }


  return visiblePages;
}
removeFilter(filter: { label: string; type: string; value: any }): void {
  this.loadDynamicPriceRange();
  // Remove the selected filter from the activeFilters array
  this.activeFilters = this.activeFilters.filter((f) => f !== filter);

  // Reset corresponding filter criteria based on the type
  this.route.queryParams.subscribe(params => {
    let searchTerm = params['q'];
    if (searchTerm) {
      this.performSearch(searchTerm);
    }
  });
  }




selectSubCategory(subCategoryId: number | null): void {
  if (subCategoryId !== null) {
    console.log('Recherche de sous-catégorie avec ID :', subCategoryId);

    // Trouver la sous-catégorie directement dans sousCategories
    const selectedSubCategory = this.sousCategories.find(
      (subCategory) => subCategory.id === subCategoryId
    );

    if (selectedSubCategory) {
      this.selectedCategoryLabel = selectedSubCategory.libelle;
      console.log('Sous-catégorie trouvée. Libellé :', this.selectedCategoryLabel);
      this.selectedSousSousCategoryId = null;
      this.selectedBrandId = null;
    } else {
      console.warn('Sous-catégorie non trouvée pour ID :', subCategoryId);
      this.selectedCategoryLabel = '';
    }
  } else {
    console.log('Aucun ID de sous-catégorie fourni. Libellé par défaut : Boutique.');
    this.selectedCategoryLabel = '';
  }

}




  showDetails(article: any) {
    this.selectedArticle = article;
    console.log(this.selectedArticle);
    this.affichdetails=true;
    console.log("hazemmm")
  }

  quantity = 1;

  increaseQuantity() {
    if (this.quantity < this.selectedArticle?.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
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
  updatePrice() {
    if (this.minPrice > this.maxPrice) {
      this.minPrice = this.maxPrice;
    }
  }




  onPriceChange(): void {
    console.log('Prix modifié, application du filtre');
    this.applyPriceFilter();
  }

  updateMaxPrice() {
    const maxSlider = document.getElementById('maxSlider') as HTMLInputElement;
    if (parseInt(maxSlider.value) <= this.minPrice) {
      this.maxPrice = this.minPrice + 1;
    } else {
      this.maxPrice = parseInt(maxSlider.value);
    }
  }

  deselectBrand()
  {
    this.marqueselected={}
    this.selectedBrandId=null
    this.ListArticlesFiltered=this.ListArticles

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

    // Conserver uniquement l'ID de la sous-catégorie
    // Réinitialiser tous les autres filtres
    this.selectedSousSousCategoryId = null; // Réinitialiser la sous-sous-catégorie
    this.selectedBrandId = null; // Réinitialiser la marque
    this.marqueselected = {}; // Réinitialiser la marque sélectionnée
    this.minPrice = 0; // Réinitialiser le prix minimum
    this.maxPrice = 2000; // Réinitialiser le prix maximum
    this.isFiltered = false; // Indique que les filtres sont désactivés

    console.log('Effacement des filtres, sauf la sous-catégorie sélectionnée.');

    // Appliquer les filtres en gardant uniquement la sous-catégorie
  //  this.applyFilters();
  }



navigateToProductDetails(productId: number): void {
  localStorage.setItem('currentPage', this.currentPage.toString());
  this.router.navigate(['/singleproduct', productId]);
}

scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Ajoute un effet de défilement fluide
  });
}

}

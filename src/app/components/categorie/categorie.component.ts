import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-categorie',
  standalone: true,
  imports: [HeaderComponent, FooterComponent,CommonModule,DialogModule, FormsModule],
  templateUrl: './categorie.component.html',
  styleUrl: './categorie.component.css'
})
export class CategorieComponent implements OnInit{

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
  minPrice: number = 0;
  maxPrice: number = 2000;
    ListArticles:any[]=[];
  ListArticlesFiltered:any[]=[];
  ListCategories:any[]=[];
  selectedCategoryId: number | null = null; // ID de la catégorie active
  selectedSubCategoryId: number | null = null; // ID de la sous-catégorie active

  nbrArticle:any=12;
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
selectedMainCategoryLabel: string = ''; // Pour garder le libellé de la catégorie principale

isMarquesVisible: boolean = false;
isSousCategoriesVisible: boolean = false;
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



async ngOnInit(): Promise<void> {
  this.route.params.subscribe(params => {


    const categoryId = params['id'];
    const categoryLibelle = params['libelle'];
    const subCategoryId = params['subId'];
    const subCategoryLibelle = params['subLibelle'];
      console.log('Paramètres de l\'URL:', params);
      this.currentPage = +params['page'] || 1; // Mettre à jour currentPage à partir de l'URL
this.selectedSubCategoryId = subCategoryId
this.selectedMainCategoryLabel = categoryLibelle;
    this.selectedCategoryId = categoryId;

    console.log('Catégorie sélectionnée:', this.selectedCategoryId);
    if (this.selectedSubCategoryId) {
      const selectedSubCategory = this.sousCategories.find(
        (subCategory) => subCategory.id === this.selectedSubCategoryId
      );

      this.selectedCategoryLabel = subCategoryLibelle ;
      console.log('Libellé mis à jour pour la sous-catégorie :', this.selectedCategoryLabel);}
      else {
        this.articleSharingService.currentCategoryLabel.subscribe(label => {
          if (label) {
            this.selectedCategoryLabel = label;
          }
        });

      }

    // Charger les marques chaque fois que la catégorie change
    this.loadMarquesByCategorie(this.selectedCategoryId ?? undefined);
    this.loadDynamicPriceRange();
    if (this.selectedCategoryId) {
      this.loadSousCategoriesByCategorie(this.selectedCategoryId); // Charger sous-catégories
    }

    // Récupérer immédiatement le libellé sans attendre queryParams


    // Récupérer les articles via le service
    this.articleSharingService.currentArticles.subscribe(articles => {
      if (articles.length > 0) {
        this.currentPage=1;
        this.ListArticlesFiltered = articles;
        this.totalItems = articles[0]?.count || 0;
        this.totalPages = Math.ceil(this.totalItems / this.nbrArticle);
        this.loader = false;
      } else {
        console.error('Aucun article disponible.');
        this.loader = false;
      }
    });
  });
  this.applyFilterss();


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
applyFilterss(): void {
  this.loadDynamicPriceRange();
  this.route.queryParams.subscribe(params => {
    this.currentPage = params['page'] ? Number(params['page']) : 1;
    console.log("Page actuelle après navigation :", this.currentPage);
  });
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


toggleMarquesVisibility() {
  this.isMarquesVisible = !this.isMarquesVisible;
}
toggleSousCategoriesVisibility(): void {
  this.isSousCategoriesVisible = !this.isSousCategoriesVisible;
}

 loadCategories(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.categories.getCategories().subscribe(
      (response: any[]) => {

        this.Categorie = response;
        resolve();
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-catégories :', error);
        reject(error);
      }
    );
  });

}




private updateLabelForCategory(categoryId: number): void {
  if (!this.Categorie || this.Categorie.length === 0) {
    console.warn("Les catégories ne sont pas encore chargées !");
    return;
  }

  const selectedCategory = this.Categorie.find(
    (category) => category.id === categoryId
  );

  if (!selectedCategory) {
    console.warn("Aucune catégorie trouvée avec cet ID :", categoryId);
  }

  this.selectedCategoryLabel = selectedCategory?.libelle || '';
  console.log('Libellé mis à jour pour la catégorie :', this.selectedCategoryLabel);
}


async filterBySearchQuery(searchQuery: string) {
  console.log('Filtering articles by search query:', searchQuery);
  this.loader = true;


    // Filtrer les articles par libellé
     this.ListArticlesFiltered = await this.ListArticles.filter((article) =>
      article.libelle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    this.loader = false;
    console.log('Filtered articles by search query:', this.ListArticlesFiltered);

}




sortProducts(event: any): void {
  const value = event.target.value;
  // Logique pour trier les articles
}
loadMarques(): void {
  this.categorieService.getMarques().subscribe(
    (data) => {
      this.Marques = data; // Stocke les marques dans une variable
    },
    (error) => {
      console.error('Erreur lors du chargement des marques', error);
    }
  );
}



loadMarquesByCategorie(idCategorie?: number): void {
  console.log("ayoub ")
  this.Marques = []; // Réinitialise la liste des marques
  this.cdr.detectChanges(); // Force la détection des changements

  const params: any = {};

  if (idCategorie) {
    params.id_categorie = idCategorie;
  }

  this.categorieService.getMarquesByCategorie(params).subscribe(
    (data) => {
      this.Marques = data;
      console.log("marques", this.Marques);
      this.cdr.detectChanges(); // Force l'interface à se mettre à jour
    },
    (error) => {
      console.error('Erreur lors du chargement des marques', error);
    }
  );
}


marqueselected:any={}
catelected:any={}


applyFiltersss(): void {
  this.currentPage = 1; // Réinitialiser la page active
  const requestBody = {
    nbre_page: 1,// Toujours synchroniser avec la page actuelle
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
      this.cdr.detectChanges();

    },
    (error) => {
      console.error('Erreur lors de la récupération des articles filtrés :', error);
      this.loader = false;
      this.firstLoad = false;
      this.cdr.detectChanges();
    }
  );
}



applyFilters(): void {

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



filtrerParMarque(brandId: number): void {
  this.selectedBrandId = brandId;
  console.log('Marque sélectionnée :', brandId);

  // Trouver la marque correspondante
  const selectedBrand = this.Marques.find((marque) => marque.id === brandId);
  if (selectedBrand) {
    this.addFilter('brand', `Marque : ${selectedBrand.libelle}`, brandId);
  }

this.nbre_page=1;
  this.applyFilters();
  setTimeout(() => this.scrollToTop(), 0); // Remonte la page après le filtrage
}


filtrerArticle(categoryId: number): void {
  this.selectedCategoryId = categoryId;
  console.log('Catégorie sélectionnée :', categoryId);
  this.applyFilters();
}

applyPriceFilter(): void {
  if (this.minPrice >= this.maxPrice) {
    this.minPrice = this.maxPrice - 1;
  }

  // Empêcher maxPrice de descendre sous minPrice
  if (this.maxPrice <= this.minPrice) {
    this.maxPrice = this.minPrice + 1;
  }
  console.log(`Filtre de prix appliqué : ${this.minPrice} - ${this.maxPrice}`);

  // Ajouter un filtre actif pour le prix
  const priceLabel = `Prix : ${this.minPrice} - ${this.maxPrice}`;
  this.addFilter('price', priceLabel, { min: this.minPrice, max: this.maxPrice });

  this.applyFilters();
}



onPageChange(page: number): void {
  if (page > 0 && page <= this.totalPages) {
    console.log("Ancienne page :", this.currentPage);

    this.currentPage = page;
    console.log("Nouvelle page :", this.currentPage);
    this.router.navigate([], {
      queryParams: { categoryId: this.selectedCategoryId, page: this.currentPage },
      queryParamsHandling: 'merge'
    });
    this.currentPage = page;
      this.applyFilters();


      this.cdr.detectChanges();
    window.scrollTo({
      top: 150, // Position haut de la page
      behavior: 'smooth' // Défilement fluide
    });
  }
}
removeFilter(filter: { label: string; type: string; value: any }): void {
  this.loadDynamicPriceRange();

  // Retirer le filtre de la liste active
  this.activeFilters = this.activeFilters.filter((f) => f !== filter);

  // Supprimer les critères associés
  if (filter.type === 'category') {
    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
    this.selectedSousSousCategoryId = null;
  } else if (filter.type === 'brand') {
    this.selectedBrandId = null;
  } else if (filter.type === 'price') {
    this.minPrice = 0;
    this.maxPrice = 2000;
  } else if (filter.type === 'sousSousCategory') {
    this.selectedSousSousCategoryId = null;
  } else if (filter.type === 'subCategory') {
    this.selectedSubCategoryId = null;
    this.updateUrlParams(); // Met à jour l'URL après suppression du filtre
  }


  // ✨ Mettre à jour l'URL après suppression du filtre ✨
  this.updateUrlParams();

  // Reappliquer les filtres si nécessaire
  if (this.activeFilters.length > 0) {
    this.applyFilters();
  } else {
    if (this.selectedCategoryId) {
      this.selectedSubCategoryId = null;
      this.articleSharingService.currentCategoryLabel.subscribe(label => {
        if (label) {
          this.selectedCategoryLabel = label;
        }
      });
      console.log('Retour aux articles de la catégorie sélectionnée.');
      this.applyFilters();
    } else {
      console.log('Aucun filtre ou catégorie sélectionné. Chargement de tous les articles.');
      this.clearAllFilters();
    }
  }
}
updateUrlParams(): void {
  const queryParams: any = {};

  if (this.selectedCategoryId) {
    queryParams.categoryId = this.selectedCategoryId;
  }
  if (this.selectedSubCategoryId) {
    queryParams.SubcategoryId = this.selectedSubCategoryId;
  }

  // 🔥 Ici, on supprime vraiment le paramètre en créant un nouvel objet sans `SubcategoryId` 🔥
  this.router.navigate([], {
    queryParams: queryParams,
    queryParamsHandling: 'merge',
  }).then(() => {
    // 💡 Contournement pour forcer la mise à jour de l'URL
    this.router.navigate([], {
      queryParams: { ...queryParams, SubcategoryId: null }, // Supprime SubcategoryId
      queryParamsHandling: 'merge',
    });
  });
}




async loadSousSousCategoriesBySubCategory(subCategoryId: number): Promise<void> {
  try {
    const response: any[] = await lastValueFrom(this.categories.getSousSousCategories());
    console.log("Toutes les sous-sous-catégories :", response);

    this.sousSousCategories = response.filter(
      (sousSousCategory) => sousSousCategory.id_sous_categorie_mere === subCategoryId
    );

    console.log('Sous-sous-catégories pour la sous-catégorie sélectionnée :', this.sousSousCategories);
  } catch (error) {
    console.error('Erreur lors du chargement des sous-sous-catégories :', error);
  }
}
selectSousSousCategory(sousSousCategoryId: number): void {
  console.log('Sous-sous-catégorie sélectionnée (ID) :', sousSousCategoryId);

  this.selectedSousSousCategoryId = sousSousCategoryId; // Update selection

  // Find the selected sub-sub-category's label
  const selectedSousSousCategory = this.sousSousCategories.find(
    (sousSousCategory) => sousSousCategory.id === sousSousCategoryId
  );

  if (selectedSousSousCategory) {
    this.selectedCategoryLabel = selectedSousSousCategory.libelle;

    // Add the sub-sub-category to active filters
    this.addFilter(
      'sousSousCategory',
      `Sous-sous-catégorie : ${selectedSousSousCategory.libelle}`,
      sousSousCategoryId
    );
  }

  this.applyFilters(); // Apply filters to display relevant articles
}


selectSubCategoryy(subCategoryId: number | null): void {
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


selectSubCategory(subCategoryId: number): void {
  console.log('Sous-catégorie sélectionnée (ID) :', subCategoryId);

  this.selectedSubCategoryId = subCategoryId; // Mise à jour de la sous-catégorie sélectionnée
  this.selectedSousSousCategoryId = null; // Réinitialiser la sous-sous-catégorie sélectionnée

  // Trouver la sous-catégorie sélectionnée
  const selectedSubCategory = this.sousCategories.find(
    (subCategory) => subCategory.id === subCategoryId
  );

  if (selectedSubCategory) {
    this.selectedCategoryLabel = selectedSubCategory.libelle;
    console.log('Libellé mis à jour pour la sous-catégorie :', this.selectedCategoryLabel);

    this.addFilter(
      'sousCategory',
      `Sous-catégorie : ${selectedSubCategory.libelle}`,
      subCategoryId
    );
  }
  const categoryLibelle = this.selectedMainCategoryLabel.replace(/\s+/g, '-').toLowerCase();

  const subCategoryLibelle = selectedSubCategory.libelle.replace(/\s+/g, '-').toLowerCase();

  this.applyFiltersss();
  this.router.navigate(['/categorie', this.selectedCategoryId, categoryLibelle, subCategoryId, subCategoryLibelle], {
    queryParams: { page: this.currentPage },
    queryParamsHandling: 'merge',
  });

  // Appliquer les filtres (la requête sera exécutée pour la page 1 par défaut)
 // this.applyFiltersss();

  console.log('Libellé final après sélection de sous-catégorie :', this.selectedCategoryLabel);
}




getTotalItems(): Promise<void> {
  const requestBody = {
    nbre_page: this.currentPage,
    nbre_article: this.nbrArticle,
    order_by: 'id',
    search: ''
  };

  return new Promise((resolve) => {
    // Appel de l'API pour récupérer les articles paginés
    this.articleservice.getArticlesPaginated(requestBody).subscribe(
      (response: any[]) => {
        // Appel séparé pour récupérer le total des articles
        this.articleservice.getTotalCount().subscribe(
          (total: number) => {
            this.ListArticles = response;

            resolve();
          },
          (error) => {
            console.error("Erreur lors de l'obtention du total des articles:", error);
            resolve();
          }
        );
      },
      (error) => {
        console.error("Erreur lors de l'obtention des articles paginés:", error);
        resolve();
      }
    );
  });
}

onChangeNbrArticle(event: any) {
  this.nbrArticle = +event.target.value;
  this.currentPage = 1;
  // this.load();
}

tous(): void {
  this.isFiltered = false; // Reset filtering flag
  this.selectedCategoryId = null;

  this.ListArticlesFiltered = this.ListArticles;

  this.loader = true;

  setTimeout(() => {
    this.selectedCategoryId = null;
    this.ListArticlesFiltered = this.ListArticles;
    this.loader = false;
  }, 1000);
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

  getCategories(): void {
    this.categories.getCategories().subscribe(
      (response) => {
        console.log('Categories loaded:', response);

        // Stockez les catégories
        this.ListCategories = response.map((categorie: { sous_categories: any }) => ({
          ...categorie,
          sous_categories: categorie.sous_categories || [],
        }));

        // Initialisez sousCategories avec toutes les sous-catégories
        this.sousCategories = this.ListCategories.flatMap((category) => category.sous_categories || []);
        console.log('Sous-catégories chargées :', this.sousCategories); // Vérifiez le contenu ici
      },
      (error) => {
        console.error('Erreur lors du chargement des catégories :', error);
      }
    );
  }
  loadSousCategoriesByCategorie(categoryId: number): void {
    if (!categoryId) {
      console.warn("Aucune catégorie sélectionnée.");
      this.sousCategories = []; // Réinitialiser si aucune catégorie
      return;
    }

    this.categories.getSousCategories().subscribe(
      (response: any[]) => {
        console.log("Toutes les sous-catégories :", response);

        // Vérifie que categoryId est bien un nombre
        const parsedCategoryId = Number(categoryId);

        // ✅ Utilise `id_categorie_mere` pour filtrer
        this.sousCategories = response.filter(
          (sousCategorie) => Number(sousCategorie.id_categorie_mere) === parsedCategoryId
        );

        console.log("Sous-catégories pour la catégorie sélectionnée :", this.sousCategories);
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-catégories :', error);
      }
    );
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
    this.applyFilters();
  }

  filterArticles(): void {
  // Vérifiez si au moins un filtre est actif
  const isAnyFilterActive =
    this.selectedCategoryId !== null ||
    this.selectedBrandId !== null ||
    this.minPrice !== 0 ||
    this.maxPrice !== 2000;

  if (!isAnyFilterActive) {
    // Aucun filtre actif, afficher tous les articles
    this.ListArticlesFiltered = this.ListArticles;
    console.log('Aucun filtre actif. Affichage de tous les articles.');
    return;
  }

  // Appliquer les filtres actifs
  this.ListArticlesFiltered = this.ListArticles.filter((article) => {
    const matchesCategory = this.selectedCategoryId
      ? article.id_categorie === this.selectedCategoryId
      : true;

    const matchesBrand = this.selectedBrandId
      ? article.id_marque === this.selectedBrandId
      : true;

    const matchesPrice =
      article.prix >= this.minPrice && article.prix <= this.maxPrice;

    return matchesCategory && matchesBrand && matchesPrice;
  });

  console.log('Articles après application des filtres :', this.ListArticlesFiltered);
}

getVisiblePages(): number[] {
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
navigateToProductDetails(productId: number): void {
  this.router.navigate(['/singleproduct', productId]);
}
scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Ajoute un effet de défilement fluide
  });
}

}

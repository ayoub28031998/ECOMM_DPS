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
  selector: 'app-shop',
  standalone: true,
  imports: [HeaderComponent, FooterComponent,CommonModule,DialogModule, FormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit{

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
  minPrice: any;
  maxPrice: any;
    ListArticles:any[]=[];
  ListArticlesFiltered:any[]=[];
  ListCategories:any[]=[];
  selectedCategoryId: number | null = null; // ID de la catégorie active
  selectedSubCategoryId: number | null = null; // ID de la sous-catégorie active

  nbrArticle:any=12;
loader=true;
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
minLimit: number = 0;  // Valeur min initiale
maxLimit: number = 100; // Valeur max initiale


async ngOnInit(): Promise<void> {
  this.route.params.subscribe(params => {
    const subSubCategoryId = params['subSubId'];
    const subSubCategoryLibelle = params['subSubLibelle'];
    // 🔹 Gérer la sous-catégorie
    this.selectedSubCategoryId = params['subCategoryId'];
    console.log('Sous-catégorie sélectionnée:', this.selectedSubCategoryId);

    // 🔹 Gérer la sous-sous-catégorie
    this.selectedSousSousCategoryId = subSubCategoryId;
    console.log('Sous-sous-catégorie sélectionnée:', this.selectedSousSousCategoryId);
    this.loadMarquesByCategorie(this.selectedSousSousCategoryId ?? undefined);
     this.loadDynamicPriceRange();

    // ✅ Récupère immédiatement le libellé de la sous-catégorie ou sous-sous-catégorie
    this.articleSharingService.currentCategoryLabel.subscribe(label => {
      if (label) {
        this.selectedCategoryLabel = label;
      }
    });

    // ✅ Récupérer les articles via le service
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

  this.route.queryParams.subscribe(params => {
    const fromHeader = params['fromHeader'];

    // Si la navigation vient du header, on cache les filtres et on les réinitialise
    if (fromHeader) {
      this.showFilters = false;
      this.activeFilters = []; // Réinitialiser les filtres actifs
    } else {
      this.showFilters = true;
    }
  });

  this.route.queryParams.subscribe(async (params) => {
    const marqueId = +params['brandId']; // Récupérer l'ID de la marque


    console.log('Marque sélectionnée (ID) :', marqueId);


    if (marqueId) {
      // Si une marque est sélectionnée
      this.selectedSubCategoryId=null;
      this.selectedSousSousCategoryId=null;
      this.filtrerParMarque(marqueId); // Appliquer le filtre de la marque
    }

  });

  this.applyFilterss();
   // Ensure articles are fetched first
 // this.handleQueryParams();   // Process query parameters and apply filtering
 // this.loadMarques();         // Load brands


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
loadSousCategories(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.categories.getSousCategories().subscribe(
      (response: any[]) => {

        this.sousCategories = response;
        console.log("Sous-catégories chargées :", this.sousCategories);
        resolve();
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-catégories :', error);
        reject(error);
      }
    );
  });
}
 loadCategories(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.categories.getCategories().subscribe(
      (response: any[]) => {

        this.Categorie = response;
        console.log("Catégories chargées :", this.Categorie);
        resolve();
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-catégories :', error);
        reject(error);
      }
    );
  });

}

async loadSousSousCategoriesBySubCategory(subCategoryId: number): Promise<void> {
  try {
    const response: any[] = await lastValueFrom(this.categories.getSousSousCategories());

    this.sousSousCategories = response.filter(
      (sousSousCategory) => sousSousCategory.id_sous_categorie_mere === subCategoryId
    );

    console.log('Sous-sous-catégories pour la sous-catégorie sélectionnée :', this.sousSousCategories);
  } catch (error) {
    console.error('Erreur lors du chargement des sous-sous-catégories :', error);
  }
}


private handleQueryParams(): void {
  this.route.queryParams.subscribe((params) => {
    const categoryId = params['categoryId'] ? +params['categoryId'] : null;
    const subCategoryId = params['subCategoryId'] ? +params['subCategoryId'] : null;
    const sousSousCategoryId = params['sousSousCategoryId'] ? +params['sousSousCategoryId'] : null;

    console.log('Sous-catégorie sélectionnée (ID) :', subCategoryId);
    console.log('Sous-sous-catégorie sélectionnée (ID) :', sousSousCategoryId);

    // Si une sous-sous-catégorie est sélectionnée
    if (sousSousCategoryId) {
      this.selectedSousSousCategoryId = sousSousCategoryId;

      // Vérifier si la sous-sous-catégorie appartient à une autre sous-catégorie
      if (subCategoryId !== null) {
        this.loadSousSousCategoriesBySubCategory(subCategoryId);
this.selectedCategoryId=null;
        // Attendre que les sous-sous-catégories soient chargées avant de mettre à jour le libellé
        setTimeout(() => {
          this.updateLabelForSousSousCategory(sousSousCategoryId);
        }, 500);
      } else {
        this.updateLabelForSousSousCategory(sousSousCategoryId);
      }

      this.applyFilters();
    }
    // Si une sous-catégorie est sélectionnée
    else if (subCategoryId) {
      this.selectedSubCategoryId = subCategoryId;
      console.log("Sous-catégorie sélectionnée (ID) :", this.selectedSubCategoryId);

      const selectedSubCategory = this.sousCategories.find(
        (subCategory) => subCategory.id === subCategoryId
      );

      if (!selectedSubCategory) {
        console.warn('Sous-catégorie non trouvée pour l\'ID sélectionné :', subCategoryId);
        console.log('Sous-catégories disponibles :', this.sousCategories);
      } else {
        console.log('Sous-catégorie trouvée :', selectedSubCategory); // Vérifiez ici si l'objet est bien trouvé
      }
      this.selectedBrandId = null;
      this.selectedCategoryLabel = selectedSubCategory
        ? selectedSubCategory.libelle
        : '';
      console.log('Libellé mis à jour pour la sous-catégorie :', this.selectedCategoryLabel);

      this.applyFilters();
    }
    else if (categoryId) {
      this.selectedCategoryId = categoryId;
      this.selectedSubCategoryId = null;
      this.selectedSousSousCategoryId = null;
      this.updateLabelForCategory(categoryId);
      this.applyFilters();
    // Sinon, afficher le libellé par défaut
    } else {
      this.selectedCategoryLabel = '';
    }
  });
}

private updateLabelForSousSousCategory(sousSousCategoryId: number): void {
  const selectedSousSousCategory = this.sousSousCategories.find(
    (sousSousCategory) => sousSousCategory.id === sousSousCategoryId
  );

  this.selectedCategoryLabel = selectedSousSousCategory
    ? selectedSousSousCategory.libelle
    : '';

  console.log('Libellé mis à jour pour la sous-sous-catégorie :', this.selectedCategoryLabel);
}

private updateLabelForSubCategory(subCategoryId: number): void {
  const selectedSubCategory = this.sousCategories.find(
    (subCategory) => subCategory.id === subCategoryId
  );

  this.selectedCategoryLabel = selectedSubCategory
    ? selectedSubCategory.libelle
    : '';

  console.log('Libellé mis à jour pour la sous-catégorie :', this.selectedCategoryLabel);
}
private updateLabelForCategory(categoryId: number): void {
  if (!this.Categorie || this.Categorie.length === 0) {
    console.warn("Les catégories ne sont pas encore chargées !");
    return;
  }

  console.log("ID de la catégorie reçue :", categoryId);
  console.log("Catégories disponibles :", this.Categorie);

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

// async filtrerArticle(categoryId: number | null, searchQuery: string | null = null): Promise<void> {
//   console.log('Filtrage par catégorie avec ID :', categoryId, 'et recherche avec query :', searchQuery);

//   // Si les articles ne sont pas encore chargés, attendez de les récupérer
//   if (!this.ListArticles.length) {
//     console.warn('Articles not yet loaded. Retry filtering...');
//     await this.getTotalItems(); // Assurez-vous que cette méthode charge les articles dans `this.ListArticles`
//   }

//   this.isFiltered = true; // Indique que le filtrage est actif
//   this.loader = true;
//   this.selectedCategoryId = categoryId; // Mémorise l'ID de la catégorie sélectionnée

//   // Filtrage combiné par catégorie et mot-clé
//   this.ListArticlesFiltered = this.ListArticles.filter((article) => {
//     const matchesCategory = categoryId ? article.id_categorie === categoryId : true;
//     const matchesSearchQuery = searchQuery
//       ? article.libelle.toLowerCase().includes(searchQuery.toLowerCase())
//       : true;

//     return matchesCategory && matchesSearchQuery;
//   });

//   this.loader = false;
//   console.log('Articles filtrés par catégorie et recherche:', this.ListArticlesFiltered);
// }


async filtrerArticleBySubCat(subcategoryId: number | null): Promise<void> {
  console.log('Filtrage par subcategoryId avec ID :', subcategoryId);

  if (!this.ListArticles.length) {
    console.warn('Articles not yet loaded. Retry filtering...');
    await this.getTotalItems();
  }

  this.isFiltered = true; // Mark filtering as active
  this.loader = true;
  this.ListArticlesFiltered = this.ListArticles.filter(
    (article) => article.id_sous_categorie === subcategoryId
  );

  this.loader = false;
  console.log('Articles filtrés par catégorie:', this.ListArticlesFiltered);
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
loadMarquesByCategorie( idSousSousCategorie?: number): void {
  const params: any = {};

  if (idSousSousCategorie) {
    params.id_sous_sous_categorie = idSousSousCategorie;
  }

  this.categorieService.getMarquesByCategorie(params).subscribe(
    (data) => {
      this.Marques = data; // Stocke les marques récupérées
      console.log("marques", this.Marques)
    },
    (error) => {
      console.error('Erreur lors du chargement des marques', error);
    }
  );
}

marqueselected:any={}
catelected:any={}


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
    id_sous_categorie: this.selectedSubCategoryId || 0,
    id_sous_sous_categorie: this.selectedSousSousCategoryId || 0,
  };

  console.log('Request body pour applyFilters:', requestBody);

  this.articleservice.getArticlesByFilters(requestBody).subscribe(
    (response: any) => {

      this.ListArticlesFiltered = response || [];
      this.totalItems = response[0]?.count || 0;
      this.totalPages = Math.ceil(this.totalItems / this.nbrArticle);

      console.log('Articles après application des filtres :', this.ListArticlesFiltered);

  },
    (error) => {
      console.error('Erreur lors de la récupération des articles filtrés :', error);

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


// clearAllFilters(): void {
//   this.selectedBrandId = null;
//   this.selectedCategoryId = null;
//   this.selectedSubCategoryId = null;
//   this.minPrice = 0;
//   this.maxPrice = 2000;
//   this.searchQuery = null;

//   console.log('Tous les filtres ont été réinitialisés.');
//   this.applyFilters();
// }
onPageChange(page: number): void {
  if (page > 0 && page <= this.totalPages) {
    console.log("Ancienne page :", this.currentPage);

    this.currentPage = page;
    console.log("Nouvelle page :", this.currentPage);
    this.router.navigate([], {
      queryParams: { sousSousCategoryId: this.selectedSousSousCategoryId, page: this.currentPage },
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
  // Remove the selected filter from the activeFilters array
  this.activeFilters = this.activeFilters.filter((f) => f !== filter);

  // Reset corresponding filter criteria based on the type
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
  }

  // Reapply the remaining filters or reset to the full article list
  if (this.activeFilters.length > 0) {
    this.applyFilters();
  } else {
    // Check if any category or sub-category filters are still active
    if (this.selectedSousSousCategoryId ) {
      console.log('Retour aux articles de la marque sélectionnée.');
      this.applyFilters();
    } else if (this.selectedSubCategoryId) {
      console.log('Retour aux articles de la sous-catégorie sélectionnée.');
      this.applyFilters();
    } else {
      console.log('Aucun filtre ou catégorie sélectionné. Chargement de tous les articles.');
      this.clearAllFilters();
    }
  }
}


// selectCategory(categoryId: number | null, subCategoryId: number | null): void {
//   this.selectedCategoryId = categoryId;
//   this.selectedSubCategoryId = subCategoryId;

//   if (subCategoryId !== null) {
//     // Trouver la sous-catégorie correspondante
//     const selectedCategory = this.ListCategories.find((category) =>
//       category.sous_categories?.some((subCategory: { id: number; }) => subCategory.id === subCategoryId)
//     );

//     const selectedSubCategory = selectedCategory?.sous_categories.find(
//       (subCategory: { id: number; }) => subCategory.id === subCategoryId
//     );

//     this.selectedCategoryLabel = selectedSubCategory
//       ? selectedSubCategory.libelle
//       : 'Boutique';
//   } else if (categoryId !== null) {
//     // Si une catégorie est sélectionnée sans sous-catégorie
//     const selectedCategory = this.ListCategories.find((category) => category.id === categoryId);
//     this.selectedCategoryLabel = selectedCategory ? selectedCategory.libelle : 'Boutique';
//   } else {
//     // Aucune catégorie sélectionnée
//     this.selectedCategoryLabel = 'Boutique';
//   }
// }
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


// async load(): Promise<void> {
//   console.log('Category ID:', this.selectedCategoryId);
//   console.log('Brand ID:', this.selectedBrandId);

//   // Skip paginated loading if filtering is active
//   if (this.isFiltered) {
//     console.log('Skipping pagination as filtering is active.');
//     //return;
//   }

//   // Load paginated articles
//   const requestBody = {
//     nbre_page: this.currentPage,
//     nbre_article: this.nbrArticle,
//     order_by: 'libelle',
//     search: ''
//   };

//   this.loader = true;

//   this.articleservice.getArticlesPaginated(requestBody).subscribe(
//     (response: any) => {
//       this.ListArticlesFiltered = response.articles || response;
//       this.loader = false;

//       this.cdr.detectChanges(); // Refresh the view
//       console.log('Articles chargés pour la page', this.currentPage, ':', this.ListArticlesFiltered);
//     },
//     (error) => {
//       console.error('Erreur lors du chargement des articles paginés :', error);
//       this.loader = false;
//     }
//   );
// }



// onPageChange(page: number): void {
//   if (page > 0 && page <= this.totalPages) {
//     this.currentPage = page;
//     this.load(); // Charger les articles pour la nouvelle page
//   }
// }




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



  // filtrerArticle(categoryId: number): void {
  //   console.log('Category selected:', categoryId);
  //   this.loader = true;

  //   setTimeout(() => {
  //     this.selectedCategoryId = categoryId;

  //     // Trouver le libellé de la catégorie sélectionnée
  //     const selectedCategory = this.ListCategories.find(categorie => categorie.id === categoryId);
  //     this.selectedCategoryLabel = selectedCategory ? selectedCategory.libelle : 'Boutique';

  //     // Filtrer les articles
  //     this.ListArticlesFiltered = this.ListArticles.filter(a => a.id_categorie == categoryId);
  //     this.loader = false;
  //   }, 1000);
  // }


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


  // applyPriceFilter(): void {
  //   const requestBody = {
  //     nbre_page: this.currentPage,
  //     nbre_article: this.nbrArticle,
  //     order_by: 'libelle',
  //     search: '',
  //     prix_min: this.minPrice,
  //     prix_max: this.maxPrice
  //   };

  //   console.log(`Filtre appliqué avec minPrice: ${this.minPrice} et maxPrice: ${this.maxPrice}`);

  //   // Ajouter le filtre actif pour le prix
  //   const label = `Prix : ${this.minPrice} TND - ${this.maxPrice} TND`;
  //   this.addFilter('price', label, { min: this.minPrice, max: this.maxPrice });

  //   // Appel au service pour filtrer les articles
  //   this.articleservice.filterArticlesByPrice(requestBody).subscribe(
  //     (response: any) => {
  //       this.ListArticlesFiltered = response || []; // Supposons que les articles sont dans une propriété "articles"
  //       console.log('Articles filtrés depuis l\'API :', this.ListArticlesFiltered);
  //     },
  //     (error) => {
  //       console.error('Erreur lors de la récupération des articles filtrés :', error);
  //     }
  //   );
  // }

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


  // selectCategory(categoryId: number | null, subCategoryId: number | null): void {
  //   this.selectedCategoryId = categoryId;
  //   this.selectedSubCategoryId = subCategoryId;

  //   if (categoryId === null && subCategoryId === null) {
  //     this.selectedCategoryLabel = 'Boutique'; // Label par défaut
  //     this.load();
  //   } else if (categoryId !== null && subCategoryId === null) {
  //     const selectedCategory = this.ListCategories.find(category => category.id === categoryId);
  //     this.selectedCategoryLabel = selectedCategory ? selectedCategory.libelle : 'Boutique';
  //       // Ajouter la catégorie comme filtre actif
  //   if (selectedCategory) {
  //     this.addFilter('category', `Catégorie : ${selectedCategory.libelle}`, categoryId);
  //   }
  //     this.filtrerArticle(this.selectedCategoryId);
  //   } else if (subCategoryId !== null) {
  //     const selectedCategory = this.ListCategories.find(category =>
  //       category.sous_categories && category.sous_categories.some((subCat: any) => subCat.id === subCategoryId) // Ajout explicite de "any"
  //     );
  //     const selectedSubCategory = selectedCategory?.sous_categories.find((subCat: any) => subCat.id === subCategoryId); // Ajout explicite de "any"
  //     this.selectedCategoryLabel = selectedSubCategory ? selectedSubCategory.libelle : 'Boutique';
  //     this.filtrerArticleBySubCat(this.selectedSubCategoryId);
  //   }

  //   console.log('Catégorie sélectionnée:', this.selectedCategoryId,
  //               'Sous-catégorie sélectionnée:', this.selectedSubCategoryId,
  //               'Label affiché:', this.selectedCategoryLabel);
  // }



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



  // removeFilter(filter: { label: string; type: string; value: any }): void {
  //   this.activeFilters = this.activeFilters.filter((f) => f !== filter);

  //   // Supprimer l'effet du filtre
  //   if (filter.type === 'category') {
  //     this.selectedCategoryId = null;
  //     this.selectedSubCategoryId = null;
  //   } else if (filter.type === 'brand') {
  //     this.selectedBrandId = null;
  //     this.marqueselected = {};
  //   } else if (filter.type === 'price') {
  //     this.minPrice = 0;
  //     this.maxPrice = 2000;
  //   }

  //   // Réappliquer les filtres restants
  //   if (this.activeFilters.length > 0) {
  //     this.filterArticles();
  //   } else if (this.selectedCategoryId !== null || this.selectedSubCategoryId !== null) {
  //     // Si une catégorie est toujours sélectionnée, réafficher les articles de cette catégorie
  //     if (this.selectedSubCategoryId) {
  //       this.filtrerArticleBySubCat(this.selectedSubCategoryId);
  //     } else {
  //       this.filtrerArticle(this.selectedCategoryId);
  //     }
  //   } else {
  //     // Sinon, réafficher tous les articles
  //     this.ListArticlesFiltered = this.ListArticles;
  //     this.load();
  //   }
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

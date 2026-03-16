import { Component, HostListener, OnInit } from '@angular/core';
import {  ActivatedRoute, NavigationEnd,Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.services';
import { CartService } from '../../services/cart.services';
import { CAtegorieService } from '../../services/categorie.services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../../services/auth-service.service';
import { WishlistService } from '../../services/wishlist.services';

import { CartSidebarComponent } from "../cart-sidebar/cart-sidebar.component";
import { Article } from '../../models/article';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { ArticleSharingService } from '../../services/article-sharing.service';
import { HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule,CommonModule, FormsModule, CartSidebarComponent],
templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  searchQuery: string = '';
  selectedCategorie: string = 'all';
  selectedCategory: any= null;
  selectedSubCategory: any= null;
  selectedSousSousCategory: any= null;
  cartItems: any;
  subtotal: number = 0;
  searchResults: any[] = [];
  listArticles:any[] = [];
  listCategory:any[]=[];
  isLoggedIn = false;
  currentUser: any;
  wishlistCount: number = 0;
  cartCount: number = 0;
  isMenuOpen: boolean = false;
  openSubCategories: { [key: number]: boolean } = {};
  isCartOpen = false;
  showScrollHeader = false;
  sousSousCategories: any[] = [];
  articles: any[] = [];
  showResults: boolean = false;
  isFixed: boolean = false;
  selectedSousSousCategoryId: number | null = null;
  contactMessage: string = '';
  contactIcon: string = ''; // Variable pour stocker l'icône
  messages: { text: string, icon: string }[] = [
    { text: '(+216) 53 122 400', icon: 'fas fa-phone' },
    { text: 'Livraison gratuite dès 99 DT', icon: 'fas fa-truck' } // Icône de livraison
  ];
  currentIndex: number = 0;

  listBrands = [
    { id: 1, libelle: 'Nike' },
    { id: 2, libelle: 'Adidas' },
    { id: 3, libelle: 'Puma' },
    { id: 4, libelle: 'Reebok' },
    { id: 5, libelle: 'Under Armour' }
  ];

  dropdowns: { [key: string]: boolean } = {};
  subDropdowns: { [key: string]: boolean } = {};
  // Marque sélectionnée
  selectedBrand: any = null;
  Marques: any[] = [];
  categories: any[] = [];
  selectedBrandId: number | null = null; // Pour suivre la marque sélectionnée
  searchQuerySubject = new Subject<string>();
  subCategories: any[]= [];
  currentPage: any;


  constructor(
    private router: Router,
    private cartService: CartService,
    private route: ActivatedRoute,
    private articlesService: ArticleService,
    private categoriess: CAtegorieService,
    private articleSharingService: ArticleSharingService,
    private categoryService: CAtegorieService,
    private authService:AuthServiceService,
    private wishlist : WishlistService

  ) { }

   ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
    this.categoryService.categories$.subscribe(categories => {
      this.listCategory = categories;
      console.log('📌 Catégories reçues dans Header:', this.listCategory);
    });
    this.startMessageRotation();
    this.searchQuerySubject.pipe(
      debounceTime(300), // Évite les recherches trop rapides
      distinctUntilChanged(), // Ne recherche que si la requête change
      switchMap((query) => {
        if (query.trim() === '') {
          this.showResults = false;
          this.articles = [];
          return of([]); // Retourne un tableau vide si la requête est vide
        }

        const requestBody = {
          search: query.trim(),
          id_categorie: this.selectedCategorie ? +this.selectedCategorie : 0
        };

        console.log('Performing instant search with request body:', requestBody);

        return this.articlesService.searchArticles(requestBody).pipe(
          catchError((error) => {
            console.error('Error while performing instant search:', error);
            return of([]); // Retourne un tableau vide en cas d'erreur
          })
        );
      })
    ).subscribe((results: Article[]) => {
      this.articles = results;
      this.showResults = this.searchQuery.trim() !== '';
      console.log('Instant search results:', this.articles);
    });
    this.route.queryParams.subscribe(params => {
      const categoryId = params['categoryId'];
      if (categoryId) {
        this.loadArticlesByCategory(categoryId);
      } else {
       // this.loadAllArticles();
      }
    });
    this.checkLoginStatus();

    this.authService.isLoggedIn().subscribe(status => {
      this.isLoggedIn = status;
    });

    this.cartService.cart$.subscribe(cart => {
      this.cartItems = cart;
      this.cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    });

    this.wishlist.wishlist$.subscribe(wishlist => {
      this.wishlistCount = this.wishlist.getWishlistCount();
    });


    this.getCategory();
    this.getSousSousCategories();
    this.loadMarques();
    this.categoryService.getCategories().subscribe((data) => {
      this.categories = data; // Les données doivent inclure le champ `libelle` et `image`
    });
    this.categoriess.getSousCategories().subscribe((data) => {
      this.subCategories = data; // Les données doivent inclure le champ `libelle` et `image`
    });
    this.categoriess.getSousSousCategories().subscribe((data) => {
      this.sousSousCategories = data; // Les données doivent inclure le champ `libelle` et `image`
    });
    this.categoriess.getMarques().subscribe((data) => {
      this.Marques = data; // Les données doivent inclure le champ `libelle` et `image`
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.url;
        document.querySelectorAll('.main-nav .menu li').forEach(element => {
          element.classList.remove('active');
        });
        const activeLink = document.querySelector('.main-nav .menu li a[href="' + currentUrl + '"]');
        if (activeLink) {
          activeLink.parentElement?.classList.add('active');
        }
      }
    });
  }
  hasSousSousCategories(subCategoryId: number): boolean {
    const sousSousCategories = this.getSousSousCategoriesBySubCategory(subCategoryId);
    return sousSousCategories && sousSousCategories.length > 0;
  }
  goToShop(categoryId: number): void {
    this.route.queryParams.subscribe(params => {
      // On récupère la page actuelle depuis les queryParams
      let currentPageFromParams = params['page'] ? Number(params['page']) : 1;

      // Si la marque a changé, on force currentPage à 1
      if (params['categoryId'] && Number(params['categoryId']) !== categoryId) {
        this.currentPage = 1;
      } else {
        this.currentPage = currentPageFromParams;
      }

      console.log("Page actuelle après navigation :", this.currentPage);
    });
    const requestBody = {
      nbre_page: this.currentPage,
      nbre_article: 12,
      order_by: 'id',
      search: '',
      prix_min: 0,
      prix_max: 2000,
      id_categorie: categoryId,
      id_marque: 0,
      id_sous_categorie: 0,
      id_sous_sous_categorie: 0
    };

    // ✅ Active le loader
    this.setFavicon(true);

    this.articlesService.getArticlesByFilters(requestBody).subscribe(
      (response: any) => {
        console.log('Articles récupérés:', response);
        this.articleSharingService.setArticles(response);

        // ✅ Récupère le libellé et l'envoie directement
        const selectedCategory = this.categories.find(cat => cat.id === categoryId);
        const categoryLabel = selectedCategory ? selectedCategory.libelle : '';

        this.articleSharingService.setSelectedCategoryLabel(categoryLabel); // 🚀 On stocke le libellé ici

        this.setFavicon(false); // ✅ Désactiver le loader

        // ✅ Rediriger vers la page catégorie

        this.router.navigate(['/categorie', categoryId, categoryLabel.replace(/\s+/g, '-').toLowerCase()]);

      },
      (error) => {
        console.error('Erreur lors de la récupération des articles :', error);
        this.setFavicon(false);
      }
    );
  }


  private faviconFrames = [
    '/assets/spinner-0.svg',
    '/assets/spinner-90.svg',
    '/assets/spinner-180.svg',
    '/assets/spinner-270.svg'
  ];

  private faviconIndex = 0;
  private faviconInterval: any;

  setFavicon(isLoading: boolean): void {
      if (isLoading) {
          this.faviconInterval = setInterval(() => {
              const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link');
              link.rel = 'icon';
              link.href = this.faviconFrames[this.faviconIndex];
              document.head.appendChild(link);

              // Passe à la frame suivante
              this.faviconIndex = (this.faviconIndex + 1) % this.faviconFrames.length;
          }, 20); // Change d'icône toutes les 200ms pour simuler l'animation
      } else {
          clearInterval(this.faviconInterval);
          const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link');
          link.rel = 'icon';
          link.href = '/assets/img/xo.png';
          document.head.appendChild(link);
      }
  }







  selectSubCategory(subCategoryId: number) {
    this.selectedSubCategory = subCategoryId;
    this.selectedSousSousCategory = null; // Réinitialiser la sous-sous-catégorie
  }

  selectSousSousCategory(subCategoryId: number, sousSousCategoryId: number) {
    this.selectedSubCategory = subCategoryId; // Assure que la sous-catégorie parent reste sélectionnée
    this.selectedSousSousCategory = sousSousCategoryId;
  }
  startMessageRotation() {
    // Initialisation du premier message et icône
    this.contactMessage = this.messages[this.currentIndex].text;
    this.contactIcon = this.messages[this.currentIndex].icon;

    setInterval(() => {
      // Passer au message suivant
      this.currentIndex = (this.currentIndex + 1) % this.messages.length;
      this.contactMessage = this.messages[this.currentIndex].text;
      this.contactIcon = this.messages[this.currentIndex].icon;
    }, 3000); // Change toutes les 3 secondes
  }
  loadMarques(): void {
    this.categoryService.getMarques().subscribe(
      (data) => {
        this.Marques = data;
        console.log("jihen", this.Marques)
      },
      (error) => {
        console.error('Erreur lors du chargement des marques', error);
      }
    );
  }
  toggleDropdown(category: string) {
    this.dropdowns[category] = !this.dropdowns[category];
  }

  toggleSubDropdown(subCategory: string) {
    this.subDropdowns[subCategory] = !this.subDropdowns[subCategory];
  }
  closeDropdown(): void {
    this.selectedCategory = null; // Désélectionne la catégorie
  }
  openMenu() {
    this.isMenuOpen = true;
  }
  navigateToBrand(marque: any): void {
    this.route.queryParams.subscribe(params => {
      // On récupère la page actuelle depuis les queryParams
      let currentPageFromParams = params['page'] ? Number(params['page']) : 1;

      // Si la marque a changé, on force currentPage à 1
      if (params['brandId'] && Number(params['brandId']) !== marque.id) {
        this.currentPage = 1;
      } else {
        this.currentPage = currentPageFromParams;
      }

      console.log("Page actuelle après navigation :", this.currentPage);
    });
    const requestBody = {
      nbre_page: this.currentPage,
      nbre_article: 12,
      order_by: 'id',
      search: '',
      prix_min: 0,
      prix_max: 2000,
      id_categorie: 0,
      id_marque: marque.id, // ✅ Filtrer par marque
      id_sous_categorie: 0,
      id_sous_sous_categorie: 0
    };

    // ✅ Active le loader
    this.setFavicon(true);
    console.log("ayoub", requestBody)
    this.articlesService.getArticlesByFilters(requestBody).subscribe(
      (response: any) => {
        console.log('Articles récupérés pour la marque:', response);
        this.articleSharingService.setArticles(response);

        // ✅ Vérifier les marques disponibles
        console.log('Marques disponibles:', this.Marques);

        // ✅ Trouver le libellé de la marque
        const selectedBrand = this.Marques.find(brand => brand.id === marque.id);
        console.log('Marque sélectionnée:', selectedBrand);

        const brandLabel = selectedBrand ? selectedBrand.libelle : '';
        console.log('Libellé de la marque:', brandLabel);

        // 🚀 Stocker le libellé
        this.articleSharingService.setSelectedCategoryLabel(brandLabel);

        this.setFavicon(false); // ✅ Désactiver le loader

        // ✅ Rediriger vers la page shop
        this.router.navigate(['/marque',marque.id, brandLabel.replace(/\s+/g, '-').toLowerCase()]);

      },
      (error) => {
        console.error('Erreur lors de la récupération des articles pour la marque :', error);
        this.setFavicon(false);
      }
    );

    this.isMenuOpen = false;
  }


  navigateToCategory(categoryId: number) {
    this.router.navigate(['/shop'], { queryParams: { categoryId: categoryId } }).then(() => {
      window.scrollTo(0, 0);
    });
    this.isMenuOpen = false;
  }
  navigateToSubCategory(subCategoryId: number): void {
    this.route.queryParams.subscribe(params => {
      // On récupère la page actuelle depuis les queryParams
      let currentPageFromParams = params['page'] ? Number(params['page']) : 1;

      // Si la marque a changé, on force currentPage à 1
      if (params['subCategoryId'] && Number(params['subCategoryId']) !== subCategoryId) {
        this.currentPage = 1;
      } else {
        this.currentPage = currentPageFromParams;
      }

      console.log("Page actuelle après navigation :", this.currentPage);
    });
    const requestBody = {
      nbre_page: this.currentPage,
      nbre_article: 12,
      order_by: 'id',
      search: '',
      prix_min: 0,
      prix_max: 2000,
      id_categorie: 0,
      id_marque: 0,
      id_sous_categorie: subCategoryId, // ✅ Filtrer par sous-catégorie
      id_sous_sous_categorie: 0
    };

    // ✅ Active le loader
    this.setFavicon(true);
console.log("jihennn",requestBody)
    this.articlesService.getArticlesByFilters(requestBody).subscribe(
      (response: any) => {
        console.log('Articles récupérés:', response);
        this.articleSharingService.setArticles(response);

        // ✅ Log the subCategories
        console.log('Sous-catégories disponibles:', this.subCategories);

        // ✅ Récupère le libellé et l'envoie directement
        const selectedSubCategory = this.subCategories.find(sub => sub.id === subCategoryId);
        console.log('Sous-catégorie sélectionnée:', selectedSubCategory);

        const subCategoryLabel = selectedSubCategory ? selectedSubCategory.libelle : '';
        console.log('Libellé de la sous-catégorie:', subCategoryLabel);

        // 🚀 Stocker le libellé
        this.articleSharingService.setSelectedCategoryLabel(subCategoryLabel);

        this.setFavicon(false); // ✅ Désactiver le loader

        // ✅ Rediriger vers la page sous-catégorie



  console.log('Sous-catégorie sélectionnée:', selectedSubCategory);
  console.log('Libellé formaté pour l’URL:', subCategoryLabel);

  // ✅ Rediriger directement vers l'URL de la sous-catégorie
  this.router.navigate(['/subcategorie', subCategoryId, subCategoryLabel.replace(/\s+/g, '-').toLowerCase()]);


      },
      (error) => {
        console.error('Erreur lors de la récupération des articles :', error);
        this.setFavicon(false);
      }
    );

    this.isMenuOpen = false;
  }
  loadSousCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.categoriess.getSousCategories().subscribe(
        (response: any[]) => {

          this.subCategories = response;
          console.log("Sous-catégories chargées :", this.subCategories);
          resolve();
        },
        (error) => {
          console.error('Erreur lors du chargement des sous-catégories :', error);
          reject(error);
        }
      );
    });
  }


  // navigateToSousSousCategory(sousSousCategoryId: number): void {
  //   // Naviguer vers la page shop avec l'ID de la sous-sous-catégorie dans les paramètres
  //   this.router.navigate(['/shop'], { queryParams: { sousSousCategoryId: sousSousCategoryId } }).then(() => {
  //     window.scrollTo(0, 0); // Défilement vers le haut après navigation
  //   });
  //   this.isMenuOpen = false; // Fermer le menu si nécessaire
  // }
  navigateToSubategory(subCategoryId: number, sousSousCategoryId: number): void {
    console.log('Navigating to sub-category with ID:', subCategoryId);
    console.log('Selected sous-sous-category ID:', sousSousCategoryId);

    // Mémoriser l'ID de la sous-sous-catégorie sélectionnée
    this.selectedSousSousCategoryId = sousSousCategoryId;

    // Naviguer vers la sous-catégorie mère
    this.router.navigate(['/shop'], {
      queryParams: {
        subCategoryId: subCategoryId,
        sousSousCategoryId: sousSousCategoryId
      }
    });
    this.isMenuOpen = false;
  }
// Gestion de l'état des sous-sous-catégories ouvertes
openSousSousCategories: { [key: number]: boolean } = {};

// Vérifie si une sous-sous-catégorie est ouverte
isSousSousCategoryOpen(subCategoryId: number): boolean {
  return this.openSousSousCategories[subCategoryId] || false;
}

// Ouvre/ferme une sous-sous-catégorie
toggleSousSousCategory(subCategoryId: number): void {
  this.openSousSousCategories[subCategoryId] = !this.isSousSousCategoryOpen(subCategoryId);
}
testClick() {
  console.log("L'icône de recherche a été cliquée !");
}

// Récupère les sous-sous-catégories pour une sous-catégorie donnée
navigateToSearchPage() {
  console.log("jfdhfjh")
  if (this.searchQuery && this.searchQuery.trim() !== '') {
    this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
  }
}
// Navigation vers une sous-sous-catégorie
navigateToSousSousCategory(sousSousCategoryId: number): void {
  this.route.queryParams.subscribe(params => {
    // On récupère la page actuelle depuis les queryParams
    let currentPageFromParams = params['page'] ? Number(params['page']) : 1;

    // Si la marque a changé, on force currentPage à 1
    if (params['sousSousCategoryId'] && Number(params['sousSousCategoryId']) !== sousSousCategoryId) {
      this.currentPage = 1;
    } else {
      this.currentPage = currentPageFromParams;
    }

    console.log("Page actuelle après navigation :", this.currentPage);
  });
  const requestBody = {
    nbre_page: 1,
    nbre_article: 12,
    order_by: 'id',
    search: '',
    prix_min: 0,
    prix_max: 2000,
    id_categorie: 0,
    id_marque: 0,
    id_sous_categorie: 0,
    id_sous_sous_categorie: sousSousCategoryId // ✅ Filtrer par sous-sous-catégorie
  };

  // ✅ Active le loader
  this.setFavicon(true);

  this.articlesService.getArticlesByFilters(requestBody).subscribe(
    (response: any) => {
      console.log('Articles récupérés:', response);
      this.articleSharingService.setArticles(response);

      // ✅ Log les sous-sous-catégories
      console.log('Sous-sous-catégories disponibles:', this.sousSousCategories);

      // ✅ Récupérer le libellé et l'envoyer directement
      const selectedSousSousCategory = this.sousSousCategories.find(sousSous => sousSous.id === sousSousCategoryId);
      console.log('Sous-sous-catégorie sélectionnée:', selectedSousSousCategory);

      const sousSousCategoryLabel = selectedSousSousCategory ? selectedSousSousCategory.libelle : '';
      console.log('Libellé de la sous-sous-catégorie:', sousSousCategoryLabel);

      // 🚀 Stocker le libellé
      this.articleSharingService.setSelectedCategoryLabel(sousSousCategoryLabel);

      this.setFavicon(false); // ✅ Désactiver le loader

      // ✅ Rediriger vers la page sous-sous-catégorie

      this.router.navigate(['/shop', sousSousCategoryId,  sousSousCategoryLabel.replace(/\s+/g, '-').toLowerCase()]);
    },
    (error) => {
      console.error('Erreur lors de la récupération des articles :', error);
      this.setFavicon(false);
    }
  );

  this.isMenuOpen = false;
}



  loadArticlesByCategory(categoryId: number): void {
    this.articlesService.getArticlesByCategory(categoryId.toString()).subscribe(
      (articles) => {
        this.articles = articles;
      },
      (error) => {
        console.error('Error loading articles by category:', error);
      }
    );
  }
  showDropdown(category: any): void {
    this.selectedCategory = category;
  }

  hideDropdown(event: MouseEvent): void {
    const target = event.relatedTarget as HTMLElement; // Élément où la souris se déplace
    const dropdownContainer = document.querySelector('.dropdown-container') as HTMLElement;

    // Vérifie si l'élément où la souris se déplace n'est pas dans le conteneur du dropdown
    if (!dropdownContainer.contains(target)) {
      this.selectedCategory = null; // Masque le dropdown
    }
  }


  // loadAllArticles(): void {
  //   this.articlesService.getArticles().subscribe(
  //     (articles) => {
  //       this.articles = articles;
  //     },
  //     (error) => {
  //       console.error('Error loading all articles:', error);
  //     }
  //   );
  // }

  getSousSousCategories(): void {
    this.categoryService.getSousSousCategories().subscribe(
      (response: any[]) => {
        this.sousSousCategories = response;
        console.log('Sous-sous-catégories :', this.sousSousCategories);
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des sous-sous-catégories :', error);
      }
    );
  }
  getSousSousCategoriesBySubCategory(subCategoryId: number): any[] {
    return this.sousSousCategories.filter(
      (sousSousCategory) => sousSousCategory.id_sous_categorie_mere === subCategoryId
    );
  }
  selectCategory(category: any) {
    if (this.selectedCategory === category) {
      // Désélectionne la catégorie si elle est déjà sélectionnée
      this.selectedCategory = null;
    } else if (category === 'marques') {
      // Chargez la liste des marques si la catégorie est "marques"
      this.selectedCategory = {
        libelle: 'Marques',
        sous_categories: this.Marques // Assurez-vous que `listBrands` est défini
      };
    } else {
      // Sélectionne une nouvelle catégorie
      this.selectedCategory = category;
    }
  }


  userMenuOpen = false;
  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }
  @HostListener('document:click', ['$event'])
  closeUserMenu(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false; // Close user menu if clicked outside
    }
  }
  closeUserMenuExplicit() {
    this.userMenuOpen = false;
  }

  splitBrands(brands: any[], columnSize: number): any[][] {
    const result = [];
    for (let i = 0; i < brands.length; i += columnSize) {
      result.push(brands.slice(i, i + columnSize));
    }
    return result;
  }
  expandedSubCategories: { [key: number]: boolean } = {};

  toggleSousSousCategories(subCategoryId: number): void {
    this.expandedSubCategories[subCategoryId] = !this.expandedSubCategories[subCategoryId];
  }

  splitIntoColumns(items: any[], itemsPerColumn: number): any[][] {
    const columns = [];
    for (let i = 0; i < items.length; i += itemsPerColumn) {
      columns.push(items.slice(i, i + itemsPerColumn));
    }
    return columns;
  }


  getIconForCategory(libelle: string): string {
    const normalizedLibelle = libelle
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Trouver la catégorie correspondante dans la liste
    const category = this.categories.find(
      (cat) =>
        cat.libelle
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') === normalizedLibelle
    );

    // Retourner l'URL de l'image ou une valeur par défaut
    return category?.image || 'https://via.placeholder.com/50'; // Image par défaut si aucune correspondance
  }

  getIconForSubCategory(libelle: string): string {
    const normalizedLibelle = libelle
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    switch (normalizedLibelle) {
      case 'Geometrie':
        return 'fas fa-chalkboard';
      case 'azertyuu':
        return 'fas fa-desktop';
      case 'écritures et corrections':
        return 'fas fa-pencil-alt';
      case 'adhésifs, agrafe & découpe':
        return 'fas fa-cut';
      case 'caches & tampons':
        return 'fas fa-stamp';
      default:
        return 'fas fa-box';
    }
  }



  loadCartItems(): void {
    this.cartItems = this.cartService.getCartItems();
    this.calculateSubtotal();
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

  calculateSubtotal(): void {
    this.subtotal = this.cartItems.reduce((acc: any, item: { quantity: any; prix_ttc: any; }) => acc + item.prix_ttc * item.quantity, 0);
  }

  removeFromCart(productId: number) {
    this.cartService.removeFromCart(productId);
    this.cartItems = this.cartService.getCartItems();
  }
  getCategory(): void {
    this.categoryService.getCategories().subscribe(
      (      response: any[]) => {
        this.listCategory = response;
        console.log('Category list:', this.listCategory);
      },
      (      error: any) => {
        console.error('Could not get category:', error);
      }
    );
  }
  // getArticles(): void {
  //   this.articlesService.getArticles().subscribe(
  //     (      response: any[]) => {
  //       this.listArticles = response;
  //       console.log('Articles list:', this.listArticles);
  //     },
  //     (      error: any) => {
  //       console.error('Could not get articles:', error);
  //     }
  //   );
  // }
  goToHome() {
    this.router.navigate(['/Home']);
  }
  goToPacks() {
    this.router.navigate(['/packs']);
  }
  goToPromo() {
    this.router.navigate(['/promotion']);
  }
  goToFavoris() {
    this.router.navigate(['/wishlist']);
  }
  goToContact() {
    this.router.navigate(['/Contact']);
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }
  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }

  // onSearch(event: Event): void {
  //   event.preventDefault();

  //   if (this.searchQuery) {
  //     const article = this.listArticles.find(a => a.libelle.toLowerCase() === this.searchQuery.toLowerCase());

  //     if (article) {
  //       this.router.navigate(['/singleproduct', article.id]);
  //     } else {
  //       console.log('No matching product found');
  //     }
  //   } else {
  //     console.log('Please enter a search query');
  //   }
  // }

  onSearch(event: Event): void {

    event.preventDefault();
    this.showResults = false;
  console.log('Search icon clicked. Hiding instant results.');


    // Cas 1 : Catégorie sélectionnée sans `searchQuery`
    if (this.selectedCategorie && (!this.searchQuery || this.searchQuery.trim() === '')) {
      console.log('Navigating to ShopComponent with category:', this.selectedCategorie);
      this.router.navigate(['/shop'], { queryParams: { categoryId: this.selectedCategorie } });
      return;
    }

    // Cas 3 : Catégorie sélectionnée + `searchQuery` rempli
    else if (this.selectedCategorie && this.searchQuery.trim() !== '') {
      console.log('Fetching articles for category:', this.selectedCategorie, 'and filtering by search query:', this.searchQuery);

      // Redirection vers `/shop` avec les deux paramètres
      this.router.navigate(['/shop'], { queryParams: { categoryId: this.selectedCategorie, query: this.searchQuery } });

      // Récupérez les articles de la catégorie
      this.articlesService.getArticlesByCategory(this.selectedCategorie).subscribe(
        (articlesByCategory: Article[]) => {
          // Appliquez un filtre supplémentaire pour le `searchQuery`
          this.articles = articlesByCategory.filter(article =>
            article.libelle.toLowerCase().includes(this.searchQuery.trim().toLowerCase())
          );

          // Déterminez s'il y a des résultats
          //this.showResults = this.articles.length > 0;

          console.log('Filtered articles:', this.articles);
        },
        (error) => {
          console.error('Error while fetching articles by category:', error);
          this.articles = [];
          this.showResults = false;
        }
      );
      return;
    }

    // Cas 2 : `searchQuery` rempli sans catégorie (Recherche instantanée)
    else if (this.searchQuery.trim() !== '') {
      console.log('Searching with query:', this.searchQuery);
      this.performInstantSearch(); // Assurez-vous que cette méthode est bien définie
      return;
    }

    // Cas par défaut : Aucun filtre ni recherche
    else {
      console.log('No filters or search query provided.');
      this.router.navigate(['/shop']);
    }
  }




  performInstantSearch(): void {
    this.searchQuerySubject.next(this.searchQuery || '');
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
    this.showResults = false;
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.authService.currentUser().subscribe(
        (response) => {
          this.isLoggedIn = true;
          this.currentUser = response;
          console.log(this.currentUser);

        },
        (error) => {
          this.isLoggedIn = false;
          localStorage.removeItem('access_token');
        }
      );
    } else {
      this.isLoggedIn = false;
    }
  }
  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
    localStorage.removeItem('access_token');
    this.isLoggedIn = false;
  }

  ngAfterViewInit(): void {
    const navbarToggler = document.getElementById('navbarToggler');
    const navbarNav = document.getElementById('navbarNav');

    if (navbarToggler && navbarNav) {
      navbarToggler.addEventListener('click', function() {
        if (navbarNav.classList.contains('show')) {
          navbarToggler.classList.add('collapsed');
        } else {
          navbarToggler.classList.remove('collapsed');
        }
      });
    }
  }


  onHoverCategory(category: any): void {
    this.selectedCategory = category;
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  toggleSubCategory(categoryId: number) {
    this.openSubCategories[categoryId] = !this.openSubCategories[categoryId];
  }
  isSubCategoryOpen(categoryId: number): boolean {
    return this.openSubCategories[categoryId] || false;
  }
  toggleCart() {
    console.log("jihen")
    this.isCartOpen = !this.isCartOpen;
    console.log("hazem")
  }
  closeMenu() {
    this.isMenuOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showScrollHeader = scrollPosition > 100;
  }


}

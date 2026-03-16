import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { ArticleService } from '../../services/article.services';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.services';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WishlistService } from '../../services/wishlist.services';
import { CAtegorieService } from '../../services/categorie.services';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { CarouselComponent } from 'ngx-owl-carousel-o';

import Swal from 'sweetalert2';
import { LoadingService } from '../../services/loading.service';
import { lastValueFrom } from 'rxjs';
import { ArticleSharingService } from '../../services/article-sharing.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, FooterComponent,CommonModule,RouterModule,  CarouselModule ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  ListArticles:any[]=[];
  isInWishlist: boolean = false;
  article: any;
  Categorie: any[] = [];
  ListArticlesPromo : any[] = [];
  isDesktop: boolean = true;
  currentPagePromo: number = 0;

  currentPageNouveautes: number = 0;
  currentPage: number = 0; // Page actuelle
itemsPerPage: number = 3; // Nombre d'articles par page
currentImageIndex: number = 0;
scrollContainer: HTMLElement | null = null;
  currentIndex: number = 0;
  Marques: any[] = [];
  carouselOptions: OwlOptions = {
    loop: true,
    margin: 10,
    nav: true,
    dots: false,
    navText: ['<', '>'],
    responsive: {
      0: {
        items: 1,
      },
      600: {
        items: 2,
      },
      1000: {
        items: 3,
      },
    },
  };

  images: string[] = [
    'assets/img/home/1.png',
    'assets/img/home/2.png',
  'assets/img/home/3.png',
  'assets/img/home/4.png',
  'assets/img/home/5.png',
  'assets/img/home/6.png',
  'assets/img/home/7.png',
  'assets/img/home/8.png',
  'assets/img/home/9.png',
  'assets/img/home/10.png',
  'assets/img/home/12.png',
  'assets/img/home/13.png',
  'assets/img/home/14.png',
  ]; // Liste des images


  private isArticlesLoaded: boolean = false;


  @ViewChild('owlElement') owlElement!: CarouselComponent;


  constructor(private articleservice:ArticleService,private cartService: CartService , private wishlist : WishlistService,
    private categories: CAtegorieService, private cdr: ChangeDetectorRef,private router: Router, private loadingService: LoadingService,
        private route: ActivatedRoute,
        private articlesService: ArticleService,
        private articleSharingService: ArticleSharingService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.articleservice.currentArticles$.subscribe(articles => {
      this.ListArticles = articles;
    });
    this.articleservice.promoArticles$.subscribe(articles => {
      this.ListArticlesPromo = articles;
    });
//this.fetchPromoArticles();
    this.checkScreenSize();
    this.loadMarques();

    setInterval(() => {
      this.nextImage();
    }, 3000);
  }

  ngAfterViewInit(): void {
    const marquesContainer = document.getElementById('marques-container');

    if (marquesContainer) {
      marquesContainer.addEventListener('mouseenter', () => {
        marquesContainer.style.animationPlayState = 'paused';
      });

      marquesContainer.addEventListener('mouseleave', () => {
        marquesContainer.style.animationPlayState = 'running';
      });
    }
    this.scrollContainer = document.querySelector('.scroll-container');
  }
  scroll(direction: 'left' | 'right') {
    const amount = 200; // Ajustez la distance de défilement
    if (this.scrollContainer) {
      this.scrollContainer.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  }
  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  async checkScreenSize() {
    this.isDesktop = window.innerWidth > 768; // Ajuste selon ton besoin
    this.itemsPerPage = this.isDesktop ? 3 : 2;
  }
  changePage(direction: string, section: 'produits' | 'nouveautes' | 'promo'): void {
    const maxPages =
      section === 'produits'
        ? Math.ceil(this.ListArticles.length / this.itemsPerPage)
        : section === 'nouveautes'
        ? Math.ceil([...this.ListArticles].reverse().length / this.itemsPerPage)
        : Math.ceil(this.ListArticlesPromo.length / this.itemsPerPage); // Pour les promos

    if (section === 'produits') {
      if (direction === 'next' && this.currentPage < maxPages - 1) {
        this.currentPage++;
      } else if (direction === 'prev' && this.currentPage > 0) {
        this.currentPage--;
      }
    } else if (section === 'nouveautes') {
      if (direction === 'next' && this.currentPageNouveautes < maxPages - 1) {
        this.currentPageNouveautes++;
      } else if (direction === 'prev' && this.currentPageNouveautes > 0) {
        this.currentPageNouveautes--;
      }
    } else if (section === 'promo') {
      if (direction === 'next' && this.currentPagePromo < maxPages - 1) {
        this.currentPagePromo++;
      } else if (direction === 'prev' && this.currentPagePromo > 0) {
        this.currentPagePromo--;
      }
    }
  }

  fetchPromoArticles(): void {
    const requestPayload = {
      nbre_page: 1,
      nbre_article: 9,
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
        this.ListArticlesPromo = [...this.ListArticles]; // Liste pour filtrage local
        console.log("dhddddddddddddd", this.ListArticlesPromo)
      },
      (error) => {
        console.error('Erreur lors de la récupération des articles promotionnels', error);
      }
    );
  }
  changePageN(direction: string): void {
    const maxPages = Math.ceil(this.ListArticles.length / this.itemsPerPage);

    if (direction === 'next' && this.currentPage < maxPages - 1) {
      this.currentPage++;
    } else if (direction === 'prev' && this.currentPage > 0) {
      this.currentPage--;
    }
  }
  get paginatedArticles(): any[] {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.ListArticles.slice(startIndex, endIndex);
  }
  get nouveautesArticles(): any[] {
    const startIndex = this.currentPageNouveautes * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return [...this.ListArticles].reverse().slice(startIndex, endIndex);
  }
    get promoArticles(): any[] {
    const startIndex = this.currentPagePromo * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.ListArticlesPromo.slice(startIndex, endIndex);
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


  prevImage() {
    this.currentImageIndex =
      this.currentImageIndex === 0
        ? this.images.length - 1
        : this.currentImageIndex - 1;
  }

  nextImage() {
    this.currentImageIndex =
      this.currentImageIndex === this.images.length - 1
        ? 0
        : this.currentImageIndex + 1;
  }
  testClick(): void {
    console.log('L\'image a été cliquée !');
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

  formatLibelle(libelle: string): string {
    return libelle
      .toLowerCase()
      .normalize("NFD") // Supprime les accents
      .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
      .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non alphanumériques par "-"
      .replace(/^-+|-+$/g, ''); // Supprime les tirets en début/fin
  }


  async loadMarques(){
    this.categories.getMarques().subscribe(
      (data) => {
        this.Marques = data;
        console.log("jihen", this.Marques)
      },
      (error) => {
        console.error('Erreur lors du chargement des marques', error);
      }
    );
  }

  navigateToShopByBrand(marque: any): void {
    this.router.navigate([`/marque/${marque.id}/${this.formatLibelle(marque.libelle)}`]);

  }


  addToCart(product: any) {
    this.cartService.addToCart(product,1);

    Swal.fire({
      icon: 'success',
      title: 'Produit ajouté',
      text: 'Le produit a été ajouté à votre panier!',
      timer: 2000,
      showConfirmButton: false,
    });
  }
  async load(): Promise<void> {
    try {
      const requestBody = {
        nbre_page: 1,
        nbre_article: 30,
        order_by: "id",
        search: "",
      };

      console.log("🟡 Chargement des articles...");

      const res: any = await lastValueFrom(this.articleservice.getArticlesPaginated(requestBody));

      console.log("🟢 Articles reçus :", res);

      this.ListArticles = res.articles || res;

      // Vérifie que les articles sont bien récupérés
      if (this.ListArticles.length === 0) {
        console.log("❌ Aucun article trouvé");
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des articles :", error);
    }
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

  // getCategories(): void {
  //   this.categories.getCategories().subscribe(
  //     response => {
  //       console.log('Categories:', response);
  //       this.Categorie = response;
  //       this.initCarousel();
  //     },
  //     error => {
  //       console.error('Could not get categories:', error);
  //     }
  //   );
  // }
  initCarousel(): void {
    this.cdr.detectChanges();
  }
  navigateToCategory(categoryId: number) {
    this.router.navigate(['/shop'], { queryParams: { categoryId: categoryId } }).then(() => {
      window.scrollTo(0, 0);
    });
  }
  getBackgroundImage() {
    return `url(${this.images[this.currentIndex]})`;
  }


}

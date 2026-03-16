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

// Définir une interface pour les catégories
interface Category {
  id: number;
  libelle: string;
}

@Component({
  selector: 'app-categoriespage',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, DialogModule, FormsModule],
  templateUrl: './categoriespage.component.html',
  styleUrl: './categoriespage.component.css'
})
export class CategoriespageComponent implements OnInit {

  constructor(
    private articleservice: ArticleService,
    private categorieService: CAtegorieService,
    private articleSharingService: ArticleSharingService,
    private cartService: CartService,
    private wishlist: WishlistService,
    private route: ActivatedRoute,
    private router: Router,
    private categoriesService: CAtegorieService, // Renommé pour éviter la confusion
    private modalService: NgbModal,
    private articlesService: ArticleService,
    private cdr: ChangeDetectorRef
  ) { }

  // Typage explicite du tableau
  Listcategories: Category[] = [
    {
      "id": 12,
      "libelle": "7ème année",
    },
    {
      "id": 11,
      "libelle": "8ème année",
    },
    {
      "id": 10,
      "libelle": "9ème année",
    },
    {
      "id": 9,
      "libelle": "1ère année",
    },
    {
      "id": 8,
      "libelle": "2ème année",
    },
    {
      "id": 7,
      "libelle": "3ème année",
    },
    {
      "id": 6,
      "libelle": "Bac Sciences",
    },
    {
      "id": 5,
      "libelle": "Bac Economie",
    },
    {
      "id": 4,
      "libelle": "Bac Technique",
    },
    {
      "id": 3,
      "libelle": "Bac Info",
    },
    {
      "id": 2,
      "libelle": "Bac Math",
    },
    {
      "id": 1,
      "libelle": "Bac Lettres",
    }
  ];

  currentPage: number = 1; // Typage explicite

  async ngOnInit(): Promise<void> {
    // Initialisation si nécessaire
  }

  // Méthode appelée quand on clique sur une catégorie
  categorieclicked(categoryId: number, categoryLibelle: string): void {
    console.log('Niveau cliqué:', categoryId, categoryLibelle);

    // Rediriger vers la page des produits avec le filtre de niveau
    const formattedLibelle = categoryLibelle.toLowerCase().replace(/\s+/g, '-');

    // Rediriger vers la page shop avec le filtre
    this.router.navigate(['/shop'], {
      queryParams: {
        niveau: categoryId,
        libelle: categoryLibelle
      }
    });
  }

  goToShop(categoryId: number): void {
    this.route.queryParams.subscribe(params => {
      // On récupère la page actuelle depuis les queryParams
      let currentPageFromParams = params['page'] ? Number(params['page']) : 1;

      // Si la catégorie a changé, on force currentPage à 1
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

        // ✅ Récupère le libellé en utilisant Listcategories au lieu de categories
        const selectedCategory = this.Listcategories.find((cat: Category) => cat.id === categoryId);
        const categoryLabel = selectedCategory ? selectedCategory.libelle : '';

        this.articleSharingService.setSelectedCategoryLabel(categoryLabel); // 🚀 On stocke le libellé ici

        this.setFavicon(false); // ✅ Désactiver le loader

        // ✅ Rediriger vers la page catégorie
        this.router.navigate(['/categorie', categoryId, categoryLabel.replace(/\s+/g, '-').toLowerCase()]);
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des articles :', error);
        this.setFavicon(false);
      }
    );
  }

  // Gestionnaire d'erreur d'image
  handleImageError(event: any): void {
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
      }, 20); // Change d'icône toutes les 20ms
    } else {
      clearInterval(this.faviconInterval);
      const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = '/assets/img/xo.png';
      document.head.appendChild(link);
    }
  }

  // Compter les produits par niveau
  getProductsCountByLevel(levelId: number): number {
    // Simule un nombre de livres par niveau
    const counts: { [key: number]: number } = {
      1: 45,  // Bac Lettres
      2: 52,  // Bac Math
      3: 48,  // Bac Info
      4: 50,  // Bac Technique
      5: 47,  // Bac Economie
      6: 55,  // Bac Sciences
      7: 38,  // 3ème année
      8: 35,  // 2ème année
      9: 32,  // 1ère année
      10: 30, // 9ème année
      11: 28, // 8ème année
      12: 25  // 7ème année
    };

    return counts[levelId] || 20;
  }

  // Obtenir la classe CSS pour le badge niveau
  getLevelClass(levelId: number): string {
    const classes: { [key: number]: string } = {
      1: 'primary',    // Bac Lettres
      2: 'secondary',  // Bac Math
      3: 'success',    // Bac Info
      4: 'warning',    // Bac Technique
      5: 'danger',     // Bac Economie
      6: 'primary',    // Bac Sciences
      7: 'secondary',  // 3ème année
      8: 'success',    // 2ème année
      9: 'warning',    // 1ère année
      10: 'danger',    // 9ème année
      11: 'primary',   // 8ème année
      12: 'secondary'  // 7ème année
    };

    return classes[levelId] || '';
  }
}
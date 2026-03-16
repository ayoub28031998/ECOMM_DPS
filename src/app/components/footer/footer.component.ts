import { Component, OnInit } from '@angular/core';
import { CAtegorieService } from '../../services/categorie.services';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ArticleSharingService } from '../../services/article-sharing.service';
import { ArticleService } from '../../services/article.services';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  categories: any[] = [];
  firstCategories: any[] = [];
  otherCategories: any[] = [];
  constructor(
    private router: Router,
    private categoryService: CAtegorieService,
 private articleSharingService: ArticleSharingService,
     private articlesService: ArticleService,
  ) { }
  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(
      (data: any[]) => {
        this.categories = data.map((category: any) => category);
        this.firstCategories = this.categories.slice(0, 4);
        this.otherCategories = this.categories.slice(4, 8);
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des catégories :', error);
      }
    );
  }
  navigateToCategory(categoryId: any) {

    const requestBody = {
      nbre_page: 1,
      nbre_article: 9,
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
}

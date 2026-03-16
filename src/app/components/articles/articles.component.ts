import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from '../../services/article.services';
import { CAtegorieService } from '../../services/categorie.services';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [ HeaderComponent,CommonModule, FormsModule,FooterComponent],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})
export class ArticlesComponent implements OnInit {
  articles: any[] = [];
  brandId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private categorieService: CAtegorieService

  ) {}

  ngOnInit(): void {
    // Récupère l'ID de la marque depuis les paramètres de la route
    this.route.queryParams.subscribe((params) => {
      this.brandId = params['brandId'];

      if (this.brandId) {
        this.loadArticlesByBrand(this.brandId);
      }
    });
  }

  loadArticlesByBrand(brandId: number): void {
    const requestBody = {
      nbre_page: 1, // Page initiale
      nbre_article: 10, // Nombre d'articles à charger
      order_by: 'id', // Trier par ID (modifiable)
      search: '', // Pas de recherche spécifique
      id_marque: brandId, // ID de la marque
    };

    this.categorieService.getArticlesByBrand(requestBody).subscribe(
      (data) => {
        this.articles = data.articles || data; // Assurez-vous que votre API renvoie un tableau d'articles
        console.log('Articles chargés:', this.articles);
      },
      (error) => {
        console.error('Erreur lors du chargement des articles:', error);
      }
    );
  }
}

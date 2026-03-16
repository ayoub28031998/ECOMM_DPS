import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ArticleService } from '../services/article.services';
import { CartService } from '../services/cart.services';
import Swal from 'sweetalert2';
import { WishlistService } from '../services/wishlist.services';
import { consumerAfterComputation } from '@angular/core/primitives/signals';

@Component({
  selector: 'app-pack',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterModule, FormsModule, CommonModule ,  DialogModule],
  templateUrl: './pack.component.html',
  styleUrl: './pack.component.css'
})
export class PackComponent implements OnInit {
  packs: any[] = [];
  filteredPacks: any[] = [];
  minPrice: number = 0;
  maxPrice: number = 500;
  quantity: number = 1;
  affichdetails: boolean = false;
  selectedPack: any = null;
  ListArticles: any;
  ListArticlesFiltered:any[]=[];

  nbrArticle:any=9;
loader=false;
  totalItems: number = 0;
totalPages: number = 0;
currentPage: number = 1;
isFiltered: boolean = false;
activeFilters: { label: string; type: string; value: any }[] = [];


  constructor(private http: HttpClient, private cartService: CartService,  private wishlist : WishlistService, private articleservice: ArticleService ) {}

  ngOnInit(): void {
    this.loadArticles();
  this.getPacks();
  }

  loadArticles(): void {
    this.articleservice.getArticles().subscribe({
      next: (response: any[]) => {
        this.ListArticles = response;
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération des articles:', err);
      }
    });
  }

  calculatePackPrice(pack: any): void {
    if (!pack || !pack.id) {
      console.error('Erreur : le pack est invalide ou n\'a pas d\'ID.');
      return;
    }

    this.articleservice.getPackLines().subscribe({
      next: (lignes: any) => {
        if (!lignes || lignes.length === 0) {
          console.error(`Erreur : aucune ligne de pack trouvée.`);
          return;
        }

        const lignesDuPack = lignes.filter((ligne: any) => ligne.id_pack === pack.id);

        if (lignesDuPack.length === 0) {
          console.error(`Erreur : le pack avec l'ID ${pack.id} n'a pas de lignes.`);
          return;
        }

        let totalPrice = 0;
        let articleCount = lignesDuPack.length;

        lignesDuPack.forEach((ligne: any) => {
          this.articleservice.getArticlesById(ligne.id_article).subscribe((article) => {
            totalPrice += article.prix_ttc;
            articleCount--;


            if (articleCount === 0) {
              pack.price = totalPrice;
            }
          });
        });
      },
      error: (err: any) => {
        console.error(`Erreur lors de la récupération des lignes du pack :`, err);
      }
    });
  }
  showDetails(pack: any) {
    this.selectedPack = pack;
    console.log(this.selectedPack);
    this.affichdetails=true;
    console.log("hazemmm")
  }
  filterPacks(): void {
    this.filteredPacks = this.packs.filter(pack => pack.price >= this.minPrice && pack.price <= this.maxPrice);
  }

  addPackToCart(pack: any) {
    console.log("Pack object:", pack);
    this.cartService.addToCart(pack, this.quantity);
    this.affichdetails = false;
    console.log("jihen");
    Swal.fire({
      icon: 'success',
      title: 'Pack ajouté',
      text: 'Le pack a été ajouté à votre panier!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  addToWishlist(pack: any): void {
    this.wishlist.addToWishlist(pack);
    Swal.fire({
      icon: 'success',
      title: 'Pack ajouté',
      text: 'Le pack a été ajouté à votre liste de souhaits!',
      timer: 2000,
      showConfirmButton: false,
    });
  }
  getPacks(): void {
    console.log("aliiiiiiiiiiiiiiiiiiiii")
    this.http.get('https://backend.xobeauty.tn/pack/get').subscribe((response: any) => {
      this.packs = response.map((pack: any) => {
        return { ...pack, price: pack.prix };
      });
      this.filteredPacks = this.packs;
      console.log("aliii", this.filteredPacks)
    });
  }
  viewPackDetails(pack: any): void {
    this.selectedPack = pack;
    this.affichdetails = true;
  }

  getArticleById(id_article: number): any {
    return this.ListArticles.find((article: { id: number; }) => article.id === id_article);
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

  this.articleservice.getArticlesByFilters(requestBody).subscribe(
    (response: any) => {
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

  this.applyFilters();
}

}


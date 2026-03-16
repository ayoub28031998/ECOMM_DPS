import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist.services';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { DialogModule } from 'primeng/dialog';
import Swal from 'sweetalert2';
import { CartService } from '../../services/cart.services';
import { FormsModule } from '@angular/forms';
import { Article } from '../../models/article';
import { CAtegorieService } from '../../services/categorie.services';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent,CommonModule, FormsModule,FooterComponent,  DialogModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];
  isModalOpen: boolean = false;
  itemToRemove: number | null = null;
  selectedArticle: any = null;
  quantity: number = 1;
affichdetails=false;
displayedItems: any[] = []; // Articles affichés
itemsPerPage: number = 6; // Nombre d'articles à afficher par page
currentPage: number = 1; // Page courante
filteredItems: Article[] = []; // Articles filtrés
categories: any[] = []; // Liste des catégories dynamiques
selectedCategory: string = '';
  searchKeyword: string = '';
  dropdownOpen: boolean = false; // État du menu déroulant





  constructor(private wishlistService: WishlistService,  private categorieService: CAtegorieService,  private cartService: CartService,private router: Router ) { }

  ngOnInit(): void {
    this.loadCategories();
    console.log('searchKeyword initial :', this.searchKeyword);
    this.loadWishlistItems();
  }
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen; // Basculer entre ouvert et fermé
  }
  loadCategories(): void {
    this.categorieService.getCategories().subscribe((categories: any[]) => {
      this.categories = categories;
      console.log('Catégories chargées :', this.categories);
    });
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
  loadWishlistItems(): void {
    this.wishlistItems = this.wishlistService.getWishlistItems();
    console.log('Articles chargés :', this.wishlistItems);

    this.filteredItems = this.wishlistItems;
    this.updateDisplayedItems();
  }


  updateDisplayedItems(): void {
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;

    // Toujours partir des articles filtrés pour appliquer la pagination
    this.displayedItems = this.filteredItems.slice(startIndex, endIndex);

    console.log('Articles affichés après mise à jour :', this.displayedItems);
  }


  // Charge plus d'articles lorsque l'utilisateur clique sur "Load More"
  loadMore(): void {
    this.currentPage++;
    this.updateDisplayedItems();
  }
  filterItems(): void {
    console.log('Recherche déclenchée :', this.searchKeyword);

    this.currentPage = 1; // Réinitialiser la page à 1 pour la recherche

    if (this.searchKeyword.length >= 3) {
      console.log('Mot-clé valide (3 lettres ou plus) :', this.searchKeyword);

      // Filtrer les articles si le mot-clé contient au moins 3 lettres
      this.filteredItems = this.wishlistItems.filter((item) =>
        item.libelle.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );

      console.log('Articles filtrés :', this.filteredItems);
    } else {
      console.log('Moins de 3 lettres, réinitialisation des articles.');

      // Réinitialiser les articles filtrés si moins de 3 lettres
      this.filteredItems = this.wishlistItems;
    }

    this.updateDisplayedItems(); // Mettre à jour les articles affichés
    console.log('Articles affichés après filtre :', this.displayedItems);
  }
  selectCategory(category: any): void {
    this.selectedCategory = category.libelle; // Utilisez l'attribut correspondant au nom de la catégorie
    console.log('Catégorie sélectionnée :', this.selectedCategory);
    this.filterItems(); // Réappliquez le filtre avec la catégorie sélectionnée
  }

  filterByCategory(category: string): void {
    console.log('Filtrage par catégorie déclenché :', category);

    // Vérifiez si une catégorie est sélectionnée
    if (!category) {
      console.log('Aucune catégorie sélectionnée, réinitialisation des articles.');
      this.filteredItems = this.wishlistItems; // Réinitialisation
    } else {
      this.selectedCategory = category; // Mise à jour de la catégorie sélectionnée

      // Filtrage basé sur l'objet category.libelle
      this.filteredItems = this.wishlistItems.filter(
        (item) => item.category && item.category.libelle === this.selectedCategory
      );

      console.log('Articles filtrés par catégorie :', this.filteredItems);
    }

    this.updateDisplayedItems(); // Appliquer la pagination
  }




  openModal(itemId: number): void {
    this.isModalOpen = true;
    this.itemToRemove = itemId;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.itemToRemove = null;
  }

  confirmRemove(): void {
    if (this.itemToRemove !== null) {
      this.removeFromWishlist(this.itemToRemove);
      this.closeModal();

    }
    Swal.fire({
      icon: 'success',
      title: 'Produit supprimé',
      text: 'Le produit a été supprimé de votre wishlist!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  removeFromWishlist(itemId: number): void {
    this.wishlistService.removeFromWishlist(itemId);
    this.loadWishlistItems();

    if (this.wishlistItems.length === 0) {
      this.router.navigate(['/home']);
    }
  }
  showDetails(article: any) {
    this.selectedArticle = article;
    console.log(this.selectedArticle);
    this.affichdetails=true;
    console.log("hazemmm")
  }

  navigateToProductDetails(productId: number): void {
    this.router.navigate(['/singleproduct', productId]);
  }


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
}

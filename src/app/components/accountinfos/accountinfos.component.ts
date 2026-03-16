import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArticleService } from '../../services/article.services';
import { OrderService } from '../../services/order.services';
import { forkJoin } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from '../../services/user.services';
import Swal from 'sweetalert2';
import { AuthServiceService } from '../../services/auth-service.service';
import { Router } from '@angular/router';

interface EventItem {
  status?: string;
  date?: string;
  icon?: string;
  color?: string;
  image?: string;
}
@Component({
  selector: 'app-accountinfos',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule,  TimelineModule, CardModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './accountinfos.component.html',
  styleUrl: './accountinfos.component.css',

})
export class AccountinfosComponent {
  editForm: FormGroup;
  isModalOpen: boolean = false;
  isCancelModalOpen: boolean = false;
  orders: any[] = [];
  selectedOrder: any = null;
  events: any[] = [];
  userInfo: any = {};
  userId: number = 2;
  isTimelineModalOpen: boolean = false;

  constructor(private fb: FormBuilder,
    private orderService: OrderService,
    private articleservice: ArticleService,
    private authService: AuthServiceService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.editForm = this.fb.group({
      nom: [this.userInfo.nom],
      prenom: [this.userInfo.prenom],
      email: [this.userInfo.email],
      phone: [this.userInfo.phone],
      date_naissance: [this.userInfo.date_naissance],
    });
  }

  ngOnInit(): void {
    const clientId = this.authService.getClientId();
    const guestOrderId = localStorage.getItem('guestOrderId');

    if (clientId) {
        this.loadOrders(clientId); // Chargement normal pour les clients connectés
    } else if (guestOrderId) {
        console.warn("🔹 Mode invité : récupération de la commande", guestOrderId);
        this.loadGuestOrder(guestOrderId); // Chargement pour les invités
    } else {
        console.error('⚠️ Aucune commande trouvée pour cet utilisateur.');
    }

    this.loadUserInfo();
  }
  loadGuestOrder(orderId: string): void {
    this.orderService.getOrderById(orderId).subscribe(
      (data: any) => {
        if (data) {
          this.orders = [data]; // Mettre la commande dans la liste
          console.log('✅ Commande invitée récupérée :', data);
        } else {
          console.warn("⚠️ Aucune commande trouvée avec cet ID :", orderId);
        }
      },
      (error: any) => {
        console.error('❌ Erreur lors de la récupération de la commande invitée :', error);
      }
    );
}isLoggedIn = false;
logout() {
  this.authService.logout();
  localStorage.removeItem('access_token');
  this.isLoggedIn = false;
  this.router.navigate(['/Home']); // Redirige vers la page d'accueil
}

  loadOrders(clientId: number): void {
    this.orderService.getOrdersByClientId(clientId).subscribe(
      (data: any[]) => {
        this.orders = data;
        console.log('Commandes récupérées :', data);
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des commandes :', error);
      }
    );
  }
  openModal(): void {
    console.log("ouvre")
    this.isModalOpen = true;
    console.log("ilef")
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const updatedUserInfo = {
        ...this.userInfo,
        ...this.editForm.value
      };

      this.userService.updateUser(updatedUserInfo).subscribe({
        next: (response) => {
          if (response) {
            console.log('Informations utilisateur mises à jour avec succès :', response);
            this.userInfo = response;
          } else {
            console.warn('Réponse de l\'API est vide ou null');
          }
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Informations modifiés',
            text: 'Informations utilisateur mises à jour avec succès ',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour des informations utilisateur :', error);
        }
      });
    }
  }



  openCancelModal(): void {
    this.isCancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
  }

  cancelOrder(): void {
    this.orderService.cancelOrder(this.selectedOrder.id).subscribe({
      next: () => {
        this.selectedOrder.status = -1;
        this.closeCancelModal();
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation de la commande :', err);
      }
    });
  }
  loadUserInfo(): void {
    const userString = localStorage.getItem('user');
    if (userString) {
      this.userInfo = JSON.parse(userString);
      console.log('User info loaded:', this.userInfo);
    } else {
      console.error('No user information found in localStorage.');
    }
    this.cdr.detectChanges();
  }

  // getProductDetails(lignesCommande: any[]): void {
  //   const productRequests = lignesCommande.map((ligne) =>
  //     this.articleservice.getArticlesById(ligne.id_article)
  //   );

  //   forkJoin(productRequests).subscribe((products) => {
  //     const mappedProducts = products.map((product, index) => ({
  //       name: product.libelle,
  //       quantity: lignesCommande[index].nbr_article,
  //       price: lignesCommande[index].prix_ttc_article
  //     }));

  //     const processingDate = new Date(this.selectedOrder.date_commande);
  //     processingDate.setDate(processingDate.getDate() + 1);
  //     const shippingDate = new Date(this.selectedOrder.date_commande);
  //     shippingDate.setDate(shippingDate.getDate() + 3);
  //     const deliveryDate = new Date(this.selectedOrder.date_commande);
  //     deliveryDate.setDate(shippingDate.getDate() + 5);

  //     let events = [
  //       {
  //         status: 'Ordered',
  //         date: this.selectedOrder.date_commande,
  //         icon: 'pi pi-shopping-cart',
  //         color: '#9C27B0',
  //         products: mappedProducts
  //       },
  //       {
  //         status: 'Processing',
  //         date: processingDate.toLocaleDateString(),
  //         icon: 'pi pi-cog',
  //         color: '#673AB7'
  //       }
  //     ];

  //     if (this.selectedOrder.status === 1) {
  //       events.push(
  //         {
  //           status: 'Shipped',
  //           date: shippingDate.toLocaleDateString(),
  //           icon: 'pi pi-truck',
  //           color: '#FF9800'
  //         },
  //         {
  //           status: 'Delivered',
  //           date: deliveryDate.toLocaleDateString(),
  //           icon: 'pi pi-check',
  //           color: '#607D8B'
  //         }
  //       );
  //     }
  //     else if (this.selectedOrder.status === -1) {
  //       events.push({
  //         status: 'Cancelled',
  //         date: shippingDate.toLocaleDateString(),
  //         icon: 'pi pi-times',
  //         color: '#FF0000'
  //       });
  //     }

  //     this.events = events;
  //   });
  // }


  // viewOrderDetails(order: any): void {
  //   this.selectedOrder = order;
  //   this.getProductDetails(order.lignes_commande);

  // }
  closeTimeline() {
    this.selectedOrder = null;
  }
  viewOrderDetails(order: any): void {
    this.selectedOrder = order;

    this.events = order.historique.map((historique: any) => {
      const etat = this.getEtatById(historique.status);

      return {
        status: etat.libelle,
        date: historique.date,
        color: etat.code_couleur,
        icon: etat.icone,
      };
    });

    console.log('Historique de la commande transformé en événements:', this.events);

    // Ouvrir la modale si l'écran est de taille mobile
    if (window.innerWidth <= 768) {
        this.openTimelineModal();  // Ouvrir la modale pour mobile
    }
}


  getEtatById(statusId: number): any {
    const etats = [
      { id: 2, libelle: "Confirmé", code_couleur: "#008000", icone: "bi-check-circle" },
      { id: 1, libelle: "En attente", code_couleur: "#ffa500", icone: "bi-clock" },
      { id: 3, libelle: "Annulé", code_couleur: "#ff0000", icone: "bi-x-circle" },
      { id: 4, libelle: "Chez livreur", code_couleur: "#0000ff", icone: "bi-truck" },
      { id: 6, libelle: "Retour non reçu", code_couleur: "#ffa500", icone: "bi-arrow-right-circle" },
      { id: 5, libelle: "Reporté", code_couleur: "#696969", icone: "bi-arrow-repeat" },
      { id: 8, libelle: "Payée", code_couleur: "#0000ff", icone: "bi-cash-coin" },
      { id: 7, libelle: "Retour reçu", code_couleur: "#008000", icone: "bi-arrow-left-circle" }
    ];

    return etats.find(etat => etat.id === statusId) || { libelle: "Inconnu", code_couleur: "#000000", icone: "bi-question" };
  }

  openTimelineModal() {
    this.isTimelineModalOpen = true;
  }

  // Fermer la modal de chronologie
  closeTimelineModal() {
    this.isTimelineModalOpen = false;
  }


}

import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [ HeaderComponent, FooterComponent, FormsModule, CommonModule],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.css'
})
export class TrackOrderComponent {

  orderNumber: string = '';
  order: any = null;
  orderNotFound: boolean = false;

  // Simuler un suivi de commande
  trackOrder() {
    // Simuler la recherche d'une commande avec un numéro de commande
    if (this.orderNumber === '123456') {
      this.order = {
        id: '123456',
        status: 2, // 1: Commande passée, 2: Expédiée, 3: Livrée
        date: '2024-09-25',
        shippedDate: '2024-09-27',
        deliveryDate: null, // Livrée si une date de livraison est fournie
        estimatedDelivery: '2024-10-02',
      };
      this.orderNotFound = false;
    } else {
      this.order = null;
      this.orderNotFound = true;
    }
  }
}

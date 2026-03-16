import { AfterViewInit, Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

declare var google: any;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent  {

  contact = {
    subject: 'Service client',
    email: '',
    message: '',
    file: null
  };

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.contact.file = file;
      console.log('Fichier sélectionné :', file.name);
    }
  }

  onSubmit() {
    console.log('Formulaire soumis :', this.contact);
    // Implémentez la logique pour envoyer les données au serveur ici.
    alert('Votre message a été envoyé avec succès !');
  }
}

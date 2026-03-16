import { Component } from '@angular/core';
import { AuthServiceService } from '../../../services/auth-service.service';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, FooterComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  constructor(private authService: AuthServiceService , private router:Router,private toastr: ToastrService,){
  }
  passwordMismatch: boolean = false;
  confirmPassword: string = ''; // Variable séparée pour la confirmation du mot de passe

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  user = {
    email: '',

    nom: '',
    prenom:'',
    telephone:'',
    source:'""',
    date_naissance:'',
    password:'',
    confirmPassword: ''
  };
  errorMessage: string | null = null;


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  registerUser(): void {
    if (this.user.password !== this.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.passwordMismatch = false;

    // Envoyer seulement les données nécessaires au backend (sans confirmPassword)
    this.authService.register(this.user).subscribe(
      response => {
        console.log('User registered successfully:', response);
        this.toastr.success('Inscription réussie !', 'Succès', {
          closeButton: true,
          progressBar: true
        });
        this.router.navigate(['/login']);
      },
      error => {
        console.error('Échec de l\'inscription:', error);
      }
    );
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

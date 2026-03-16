import { Component } from '@angular/core';
import { AuthServiceService } from '../../../services/auth-service.service';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [FormsModule, FooterComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})
export class ForgetPasswordComponent {
  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showPassword: boolean = false;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  resetPassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      this.toastr.error('Les mots de passe ne correspondent pas.', 'Erreur', {
        closeButton: true,
        progressBar: true,
      });
      return;
    }

    let urlApi:string=environment.apiUrl

    const url = urlApi+'/client/su_change_password';
    const requestBody = {
      email: this.email,
      new_password: this.newPassword,
    };
    this.http.post(url, requestBody).subscribe(
      (response: any) => {
        console.log('Password reset successful:', response);
        this.successMessage = "Votre mot de passe a été réinitialisé avec succès.";
        this.toastr.success('Réinitialisation réussie!', 'Succès', {
          closeButton: true,
          progressBar: true,
        });
      },
      (error: any) => {
        console.error('Error resetting password:', error);
        this.errorMessage = "Échec de la réinitialisation. Veuillez réessayer.";
        this.toastr.error('Échec de la réinitialisation.', 'Erreur', {
          closeButton: true,
          progressBar: true,
        });
      }
    );
  }
}

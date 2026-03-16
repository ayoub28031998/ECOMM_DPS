import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../../services/auth-service.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { CartService } from '../../../services/cart.services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private authService: AuthServiceService , private router:Router, private cartService: CartService,)
  {
  }
  showLoading = false;
  userLogin = {
    username: '',
    password: ''
  };
  rememberMe: boolean = false;
  errorMessage: string | null = null;
  showPassword: boolean = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.showLoading = true;
    this.authService.login(this.userLogin).subscribe(
      (response) => {
        console.log('User logged in successfully:', response);

        if (this.rememberMe) {
          localStorage.setItem('access_token', response.access_token);
        } else {
          sessionStorage.setItem('access_token', response.access_token);
        }

        this.router.navigate(['/Home']);
      },
      (error) => {
        console.error('Login failed:', error);
        this.errorMessage = 'Nom d’utilisateur ou mot de passe incorrect.';
        this.showLoading = false;
      }
    );
  }


goToRegister() {
  this.router.navigate(['/register']);
}
}

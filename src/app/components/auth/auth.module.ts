import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ToastrModule } from 'ngx-toastr';



@NgModule({
  declarations: [
    LoginComponent,
  ],
  imports: [
    CommonModule,
    FooterComponent,
    HeaderComponent,
    AuthRoutingModule,
    FormsModule,
    ToastrModule.forRoot({
      timeOut: 50000,
      positionClass: 'toast-top-center',
  }),
  ]
})
export class AuthModule { }

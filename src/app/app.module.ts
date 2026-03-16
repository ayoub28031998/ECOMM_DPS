import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
 import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { AuthModule } from './components/auth/auth.module';
import { ToastrModule } from 'ngx-toastr';
import { LoadingScreenComponent } from './loading-screen/loading-screen.component';
import { FloatingChatComponent } from './floating-chat/floating-chat.component';
import { HeaderComponent } from './components/header/header.component';



@NgModule({
    declarations: [
        AppComponent,
        LoadingScreenComponent,
        FloatingChatComponent,
    ],

    imports: [
      HeaderComponent,
      AuthModule,
      BrowserModule,
      AppRoutingModule,
      RouterModule,
      HttpClientModule,
      BrowserAnimationsModule,
      BrowserModule,
      NgbModule,
      CarouselModule,
      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'custom-toast-top-center',

    }),
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }

    ],
    bootstrap: [AppComponent],

})
export class AppModule { }

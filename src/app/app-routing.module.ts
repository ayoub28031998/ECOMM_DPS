import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'Home',
    pathMatch: 'full',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'cart',
    pathMatch: 'full',
    loadComponent: () => import('./components/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    pathMatch: 'full',
    loadComponent: () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'shop/:subSubId/:subSubLibelle',
    pathMatch: 'full',
    loadComponent: () => import('./components/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'singleproduct/:libelle/:id',
    pathMatch: 'full',
    loadComponent: () => import('./components/singleproduct/singleproduct.component').then(m => m.SingleproductComponent)
  },
  {
    path: 'Contact',
    pathMatch: 'full',
    loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'Blog',
    pathMatch: 'full',
    loadComponent: () => import('./components/blog/blog.component').then(m => m.BlogComponent)
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./components/wishlist/wishlist.component').then(m => m.WishlistComponent)
  },
  {
    path: 'accountinfos',
    loadComponent: () => import('./components/accountinfos/accountinfos.component').then(m => m.AccountinfosComponent)
  },
  {
    path: 'track',
    loadComponent: () => import('./components/track-order/track-order.component').then(m => m.TrackOrderComponent)
  },
  {
    path: 'packs',
    loadComponent: () => import('./pack/pack.component').then(m => m.PackComponent)
  },
  {
    path: 'forget-password',
    loadComponent: () => import('./components/auth/forget-password/forget-password.component').then(m => m.ForgetPasswordComponent)
  },
  {
    path: 'articles',
    loadComponent: () => import('./components/articles/articles.component').then(m => m.ArticlesComponent)
  },
  {
    path: 'promotion',
    loadComponent: () => import('./promotion/promotion.component').then(m => m.PromotionComponent)
  },
  {
    path: 'categorie/:id/:libelle',
    loadComponent: () => import('./components/categorie/categorie.component').then(m => m.CategorieComponent)
  },
  {
    path: 'categorie/:id/:libelle/:subId/:subLibelle',
    loadComponent: () => import('./components/categorie/categorie.component').then(m => m.CategorieComponent)
  },


  {
    path: 'subcategorie/:subId/:subLibelle',
    loadComponent: () => import('./components/subcategorie/subcategorie.component').then(m => m.SubcategorieComponent)
  },
  {
    path: 'subcategorie/:subId/:subLibelle/:subSubId/:subSubLibelle',
    loadComponent: () => import('./components/subcategorie/subcategorie.component').then(m => m.SubcategorieComponent)
  },

  {
    path: 'marque/:marId/:marLibelle',
    loadComponent: () => import('./components/marque/marque.component').then(m => m.MarqueComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./components/search/search.component').then(m => m.SearchComponent)
  },
    {
    path: 'livres',
    loadComponent: () => import('./components/categoriespage/categoriespage.component').then(m => m.CategoriespageComponent)
  },
  {
    path: '**',
    redirectTo: 'notfound'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],

exports: [RouterModule]
})
export class AppRoutingModule { }

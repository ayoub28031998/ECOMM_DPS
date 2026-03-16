import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { lastValueFrom, take } from 'rxjs';
import { ArticleService } from './services/article.services';
import { CAtegorieService } from './services/categorie.services';
import { Title, Meta } from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  showLoading: boolean = true;
  firstLoad: boolean = true;
  ListArticles:any[]=[];
  constructor(private router: Router, private loadingService: LoadingService , private cdr: ChangeDetectorRef, private articleservice:ArticleService , private categoryService: CAtegorieService ,  private titleService: Title,  // 👈 Ajout du service Title
    private metaService: Meta ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
  }
  title = 'xoBeauty';
  ngOnInit(): void {
    this.loadingService.show();


    this.load().then(() => {

      this.loadingService.hide();
      console.log("Loader désactivé");


      this.cdr.detectChanges();
      console.log("Change detection forcée !");
    });

    setTimeout(() => {
      this.showLoading = false;
      this.firstLoad = false;
    }, 3000);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);

        // 🔹 Modifier le SEO en fonction de la page visitée
        if (event.url.includes("/categorie")) {
          this.updateSEO(
            "Nos Produits - DOCUMENTS PILOTE",
            "Découvrez notre large gamme de produits de beauté et de soins par DOCUMENTS PILOTE."
          );
        } else if (event.url.includes("/Contact")) {
          this.updateSEO(
            "Contactez-nous - DOCUMENTS PILOTE",
            "Besoin d'aide ? Contactez DOCUMENTS PILOTE pour toute question sur nos produits et services."
          );
        } else {
          this.updateSEO(
            "DOCUMENTS PILOTE | Parapharmacie & Maquillage en Tunisie",
            "DOCUMENTS PILOTE, votre parapharmacie en ligne en Tunisie ! Découvrez nos produits cosmétiques et de maquillage à prix abordables avec une livraison rapide."
          );
        }
      }
    });
  }
  updateSEO(title: string, description: string) {
    this.titleService.setTitle(title); // Modifier le titre de la page
    this.metaService.updateTag({ name: 'description', content: description }); // Modifier la meta description
  }

  async load(): Promise<void> {
    try {
      const requestBody = {
        nbre_page: 1,
        nbre_article: 42,
        order_by: "id",
        search: "",
      };

      console.log("🟡 Chargement des articles...");

      const res: any = await lastValueFrom(this.articleservice.getArticlesPaginated(requestBody));

      console.log("🟢 Articles reçus :", res);
      this.articleservice.setArticles(res.articles || res);

      const promo: any = await lastValueFrom(this.articleservice.getPromoArticles(requestBody));
      console.log("🟢 Articles reçus :", promo);
      this.articleservice.setArticle(promo.articles || promo);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des articles", error);
      throw error;
    }
  }

}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(true); // Initialiser avec true pour afficher le loader
  loading$ = this.loadingSubject.asObservable();
  private isLoading = true;

  show() {
    if (!this.isLoading) {
      console.log("🔵 Loader activé");
      this.isLoading = true;
      this.loadingSubject.next(true);
    }
  }

  hide() {
    if (this.isLoading) {
      console.log("🟢 Loader désactivé");
      this.isLoading = false;
      this.loadingSubject.next(false);
    }
  }
}

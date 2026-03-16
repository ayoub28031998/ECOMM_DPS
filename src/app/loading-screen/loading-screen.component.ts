import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.css',
})
export class LoadingScreenComponent implements OnInit  {

  loadingProgress = 0;
  ngOnInit(): void {
    this.simulateLoading();
  }

  simulateLoading() {
    const interval = setInterval(() => {
      this.loadingProgress += 10;
      if (this.loadingProgress >= 100) {
        clearInterval(interval);
      }
    }, 500);
  }
}


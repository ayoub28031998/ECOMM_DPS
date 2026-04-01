import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-floating-chat',
  templateUrl: './floating-chat.component.html',
  styleUrl: './floating-chat.component.css'
})
export class FloatingChatComponent  implements OnInit {

  isChatMenuOpen = false;
  icons: string[] = [
    'assets/img/messanger-icon.png',
    'assets/img/whatsapp-icon.png',
    'assets/img/phone-icon.png'
  ];
  currentIcon: string = this.icons[0];
  currentIconIndex = 0;

  ngOnInit() {
    this.currentIcon = this.icons[this.currentIconIndex];

    setInterval(() => {
      this.currentIconIndex = (this.currentIconIndex + 1) % this.icons.length;
      this.currentIcon = this.icons[this.currentIconIndex];
    }, 3000);
  }

  toggleChatMenu() {
    this.isChatMenuOpen = !this.isChatMenuOpen;
  }

  openChat(platform: string) {
    switch(platform) {
      case 'messenger':
        window.open('https://m.me/yourpage', '_blank');
        break;
      case 'whatsapp':
        window.open('https://wa.me/+21644756660', '_blank');
        break;
      case 'call':
        window.location.href = 'tel:+21644756660';
        break;
    }
    this.isChatMenuOpen = false;
  }
}

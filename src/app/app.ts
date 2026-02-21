import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import type { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [MenubarModule, RouterOutlet],
  templateUrl: './app.html'
})
export class App {
  menuItems: MenuItem[] = [
    { label: 'パズル', routerLink: '/' },
    { label: '課題', routerLink: '/assignment' }
  ];
}

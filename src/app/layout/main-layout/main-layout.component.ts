import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartDrawerComponent } from '../cart-drawer/cart-drawer.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { WhatsappFloatComponent } from '../whatsapp-float/whatsapp-float.component';

@Component({
  selector: 'app-main-layout',
  imports: [HeaderComponent, FooterComponent, RouterOutlet, WhatsappFloatComponent, CartDrawerComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {}

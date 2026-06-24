import { Component } from '@angular/core';
import {
  PHONE_NUMBER,
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '../../core/constants/navigation';

@Component({
  selector: 'app-whatsapp-float',
  templateUrl: './whatsapp-float.component.html',
  styleUrl: './whatsapp-float.component.scss',
})
export class WhatsappFloatComponent {
  protected readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  protected readonly phoneUrl = `tel:+${PHONE_NUMBER}`;
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface TrustPillar {
  icon: string;
  title: string;
  description: string;
}

interface PaymentMethod {
  name: string;
  detail?: string;
}

@Component({
  selector: 'app-value-proposition',
  imports: [RouterLink],
  templateUrl: './value-proposition.component.html',
  styleUrl: './value-proposition.component.scss',
})
export class ValuePropositionComponent {
  protected readonly paymentMethods: PaymentMethod[] = [
    { name: 'Addi' },
    { name: 'Sistecrédito' },
    { name: 'Tarjetas' },
    { name: 'Transferencia' },
    { name: 'Efectivo' },
  ];

  protected readonly pillars: TrustPillar[] = [
    {
      icon: 'install',
      title: 'Instalación y puesta en marcha',
      description:
        'Te ayudamos a instalar hornos, extractores y ductos para que tu equipo quede listo para producir.',
    },
    {
      icon: 'factory',
      title: 'Fabricación propia',
      description:
        'Maquinaria en acero inoxidable diseñada y fabricada en Colombia, con respaldo técnico directo.',
    },
    {
      icon: 'support',
      title: 'Asesoría y posventa',
      description:
        'Acompañamiento antes, durante y después de la compra. Cotización rápida y soporte real.',
    },
    {
      icon: 'star',
      title: 'Confianza comprobada',
      description:
        '4.8 estrellas en Google con decenas de reseñas de panaderías y restaurantes en todo el país.',
    },
  ];
}

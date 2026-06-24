export interface GoogleReview {
  author: string;
  text: string;
  rating: number;
  avatarUrl: string;
}

export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/TUNEGOCIO.COM+-+Equipos+Industriales/@4.5944652,-74.1253656,17z/data=!4m8!3m7!1s0x2a04c40a8c7a1aa7:0xd5cc4b44c39a937e!8m2!3d4.5944652!4d-74.1253656!16s%2Fg%2F11thczhlkv';

export const GOOGLE_REVIEWS_SUMMARY = {
  rating: 4.8,
  totalReviews: 29,
  label: 'Excelente',
};

export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    author: 'Tatiana Bernal',
    text: 'He mandado a hacer 2 mesones de acero. Lo hicieron exactamente como lo pedí. Excelente calidad.',
    rating: 5,
    avatarUrl: 'assets/reviews/tatiana-bernal.jpg',
  },
  {
    author: 'Sandra García',
    text: 'Excelente experiencia. Compré mi horno aquí y quedé muy feliz con la compra. La atención fue maravillosa, siempre atentos y dispuestos a resolver cualquier duda de inmediato. Sin duda los recomiendo totalmente.',
    rating: 5,
    avatarUrl: 'assets/reviews/sandra-garcia.jpg',
  },
  {
    author: 'Audrey',
    text: 'Muy responsable con su posventa, y muy cumplido.',
    rating: 5,
    avatarUrl: 'assets/reviews/audrey.jpg',
  },
  {
    author: 'Jhonatan Munive',
    text: 'Excelente atención, satisfecho con el producto, de buena calidad.',
    rating: 5,
    avatarUrl: 'assets/reviews/jhonatan-munive.jpg',
  },
  {
    author: 'Ernesto Che Guevara Susunaga',
    text: 'Muy amables, los precios cómodos, los artículos 100%. Yo le daría 100% de confiabilidad.',
    rating: 5,
    avatarUrl: 'assets/reviews/ernesto-susunaga.jpg',
  },
  {
    author: 'Eduin Diaz',
    text: 'Muy amables y serviciales. Sus productos son muy bien hechos y dan buenos precios.',
    rating: 5,
    avatarUrl: 'assets/reviews/eduin-diaz.jpg',
  },
  {
    author: 'Ricardo Ossa',
    text: 'Buena atención, buenos precios, confiable. Recomendable para tus compras.',
    rating: 5,
    avatarUrl: 'assets/reviews/ricardo-ossa.jpg',
  },
];

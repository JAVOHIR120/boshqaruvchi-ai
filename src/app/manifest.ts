import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boshqaruvchi AI',
    short_name: 'Boshqaruvchi AI',
    description: "Kichik va o'rta bizneslar uchun moliya, soliq va HR boshqaruvi bo'yicha markazlashgan axborot tizimi.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0e14',
    theme_color: '#0b0e14',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  };
}

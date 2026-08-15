import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Robo — Desktop Robot Assistant',
    short_name: 'Robo',
    description:
      'A cute desktop robot companion with animated eyes, Pomodoro, timer, and clock modes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#0d1117',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/icon-dark-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        src: '/apple-icon.png',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'maskable',
      },
    ],
  }
}

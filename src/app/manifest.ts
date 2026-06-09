import type { MetadataRoute } from 'next'

/**
 * Web app manifest — served at /manifest.webmanifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'hags can cook',
    short_name: 'hags can cook',
    description: 'A community recipe site for home cooks.',
    start_url: '/',
    display: 'standalone',
    background_color: '#eae4e3',
    theme_color: '#714b41',
    icons: [
      {
        src: '/logo.png',
        sizes: '430x107',
        type: 'image/png',
      },
    ],
  }
}

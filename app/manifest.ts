import type { MetadataRoute } from 'next'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Ferme d'Arbusson",
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'browser',
    background_color: '#000000',
    theme_color: '#000000',
    lang: 'fr',
    icons: [{ src: '/images/logo.png', type: 'image/png', sizes: '966x740' }],
  }
}

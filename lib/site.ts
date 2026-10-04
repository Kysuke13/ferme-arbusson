export const SITE_NAME = "La Ferme d'Arbusson"
export const SITE_TITLE = "La Ferme d'Arbusson — Microgreens Chef Mix pour restaurateurs"
export const SITE_DESCRIPTION =
  'Micropousses vivantes à Peyrolles-en-Provence pour restaurateurs. Chef Mix pois, tournesol, radis et brocoli : 3,50 € HT dès 10 barquettes, livraison mardi et vendredi.'

export const SITE_EMAIL = 'contact@ferme-arbusson.fr'
export const SITE_PHONE = '+33766012647'
export const SITE_PHONE_DISPLAY = '07 66 01 26 47'

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://ferme-arbusson.fr'
  return raw.replace(/\/+$/, '')
}

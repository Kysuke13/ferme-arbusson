import { SITE_DESCRIPTION, SITE_EMAIL, SITE_NAME, SITE_PHONE, siteUrl } from '@/lib/site'

export function homeJsonLd() {
  const url = siteUrl()
  const organizationId = `${url}/#organization`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'fr-FR',
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}/#webpage`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'fr-FR',
        isPartOf: { '@id': `${url}/#website` },
        about: { '@id': `${url}/#chef-mix` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${url}/images/barquette.jpg`,
          width: 1200,
          height: 900,
        },
      },
      {
        '@type': 'Farm',
        '@id': organizationId,
        name: SITE_NAME,
        url,
        image: `${url}/images/barquette.jpg`,
        logo: `${url}/images/logo.png`,
        email: SITE_EMAIL,
        telephone: SITE_PHONE,
        description: SITE_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Peyrolles-en-Provence',
          postalCode: '13860',
          addressRegion: "Provence-Alpes-Côte d'Azur",
          addressCountry: 'FR',
        },
      },
      {
        '@type': 'Product',
        '@id': `${url}/#chef-mix`,
        name: 'Microgreens Chef Mix',
        description:
          'Barquette 11 × 18 cm de micropousses vivantes : pois, tournesol, radis et brocoli, cultivées sur fibre de coco et livrées encore enracinées.',
        image: `${url}/images/barquette.jpg`,
        brand: { '@id': organizationId },
        category: 'Micropousses',
        audience: {
          '@type': 'BusinessAudience',
          audienceType: 'Restaurateurs',
        },
        offers: {
          '@type': 'Offer',
          url: `${url}/#tarifs`,
          price: '3.50',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '3.50',
            priceCurrency: 'EUR',
            valueAddedTaxIncluded: false,
            unitText: 'barquette',
          },
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            minValue: 10,
            unitText: 'barquette',
          },
          seller: { '@id': organizationId },
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Y a-t-il un minimum de commande ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, 10 barquettes par livraison, que ce soit en commande ponctuelle ou en abonnement.',
            },
          },
        ],
      },
    ],
  }
}

import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { SiteClient } from '@/components/site-client'
import { extractHomeBody } from '@/lib/extract-home'
import { homeJsonLd } from '@/lib/json-ld'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function Page() {
  const html = fs.readFileSync(path.join(process.cwd(), 'site', 'index.html'), 'utf8')
  const jsonLd = JSON.stringify(homeJsonLd()).replace(/</g, '\\u003c')
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <SiteClient html={extractHomeBody(html)} mapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} />
    </>
  )
}

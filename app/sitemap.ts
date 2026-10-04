import fs from 'node:fs'
import path from 'node:path'
import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const home = path.join(process.cwd(), 'site', 'index.html')
  return [
    {
      url: siteUrl(),
      lastModified: fs.statSync(home).mtime,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}

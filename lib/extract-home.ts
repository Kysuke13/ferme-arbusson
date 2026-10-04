export function extractHomeBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!match) throw new Error('Le fichier site/index.html ne contient pas de <body>.')
  return match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/(src|href)="images\//g, '$1="/images/')
    .replace('</header>', '</header><main>')
    .replace('<!-- FOOTER -->', '</main><!-- FOOTER -->')
    .replace('<div data-if="submitted">', '<div data-if="submitted" style="display:none">')
    .trim()
}

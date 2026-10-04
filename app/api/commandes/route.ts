import { NextResponse } from 'next/server'
import { insertCommande, parseCommande } from '@/lib/commandes'
import { notifyOrder } from '@/lib/notify-order'

const hits = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60_000)
  if (recent.length >= 8) return true
  recent.push(now)
  hits.set(ip, recent)
  return false
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(ip)) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une minute.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 })
  }

  const parsed = parseCommande(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (parsed.ignored) return NextResponse.json({ ok: true })

  try {
    await insertCommande(parsed.row)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "L'enregistrement n'a pas abouti. Réessayez dans un instant ou appelez-nous directement." },
      { status: 500 },
    )
  }

  await notifyOrder(parsed.row)
  return NextResponse.json({ ok: true })
}

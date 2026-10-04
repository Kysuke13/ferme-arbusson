import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'

const FORMULE_ABO = 'Abonnement hebdomadaire sans engagement'
const FORMULE_UNIQUE = 'Commande ponctuelle'
const JOURS_ABO = ['Mardi & vendredi', 'Mardi', 'Vendredi'] as const
const JOURS_UNIQUE = 'À convenir (mardi ou vendredi)'
const UNIT = 3.5
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Commande = {
  id: string
  created_at: string
  restaurant: string
  nom: string
  email: string
  telephone: string
  adresse: string
  message: string | null
  formule: string
  barquettes: number
  jours: string
  montant_livraison: number
  total_semaine: number | null
}

export type NewCommande = Omit<Commande, 'id' | 'created_at'>

type ParseResult =
  | { ok: true; ignored: true }
  | { ok: true; ignored: false; row: NewCommande }
  | { ok: false; error: string }

function text(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length < min || trimmed.length > max) return null
  return trimmed
}

function money(barquettes: number, days: number) {
  const perDelivery = Math.round(barquettes * UNIT * 100) / 100
  const perWeek = days > 0 ? Math.round(perDelivery * days * 100) / 100 : null
  return { perDelivery, perWeek }
}

export function parseCommande(input: unknown): ParseResult {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Demande invalide.' }
  const body = input as Record<string, unknown>
  if (typeof body._honey === 'string' && body._honey.trim()) return { ok: true, ignored: true }

  const restaurant = text(body.restaurant, 1, 200)
  const nom = text(body.nom, 1, 200)
  const email = text(body.email, 3, 320)
  const telephone = text(body.telephone, 6, 40)
  const adresse = text(body.adresse, 1, 400)
  const formule = body.formule
  const jours = body.jours
  const barquettes = body.barquettes
  const rawMessage = typeof body.message === 'string' ? body.message.trim() : ''

  if (!restaurant) return { ok: false, error: 'Merci de renseigner le nom du restaurant.' }
  if (!nom) return { ok: false, error: 'Merci de renseigner votre nom.' }
  if (!email || !EMAIL.test(email)) return { ok: false, error: 'Merci de vérifier votre adresse email.' }
  if (!telephone) return { ok: false, error: 'Merci de renseigner votre téléphone.' }
  if (!adresse) return { ok: false, error: "Merci de renseigner l'adresse de livraison." }
  if (rawMessage.length > 2000) return { ok: false, error: 'Le message est trop long.' }
  if (typeof barquettes !== 'number' || !Number.isInteger(barquettes) || barquettes < 10 || barquettes > 500) {
    return { ok: false, error: 'La quantité doit être comprise entre 10 et 500 barquettes.' }
  }
  if (formule !== FORMULE_ABO && formule !== FORMULE_UNIQUE) return { ok: false, error: 'Formule invalide.' }
  if (typeof jours !== 'string') return { ok: false, error: 'Jours de livraison invalides.' }

  const isAbo = formule === FORMULE_ABO
  const allowed = isAbo ? (JOURS_ABO as readonly string[]).includes(jours) : jours === JOURS_UNIQUE
  if (!allowed) return { ok: false, error: 'Jours de livraison invalides.' }

  const days = jours === 'Mardi & vendredi' ? 2 : isAbo ? 1 : 0
  const amounts = money(barquettes, days)

  return {
    ok: true,
    ignored: false,
    row: {
      restaurant,
      nom,
      email,
      telephone,
      adresse,
      message: rawMessage || null,
      formule,
      barquettes,
      jours,
      montant_livraison: amounts.perDelivery,
      total_semaine: isAbo ? amounts.perWeek : null,
    },
  }
}

function readableError(message: string) {
  if (/schema cache|does not exist|PGRST205/i.test(message)) {
    return 'La table commandes est absente. Appliquez la migration Supabase.'
  }
  return message
}

export async function insertCommande(row: NewCommande) {
  const { error } = await supabaseAdmin().from('commandes').insert(row)
  if (error) throw new Error(readableError(error.message))
}

export async function listCommandes(): Promise<Commande[]> {
  const { data, error } = await supabaseAdmin()
    .from('commandes')
    .select('id, created_at, restaurant, nom, email, telephone, adresse, message, formule, barquettes, jours, montant_livraison, total_semaine')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(readableError(error.message))
  return (data ?? []).map((row) => ({
    ...row,
    message: row.message ?? null,
    barquettes: Number(row.barquettes),
    montant_livraison: Number(row.montant_livraison),
    total_semaine: row.total_semaine == null ? null : Number(row.total_semaine),
  }))
}

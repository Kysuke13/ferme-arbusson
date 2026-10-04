import 'server-only'
import { Resend } from 'resend'
import type { NewCommande } from '@/lib/commandes'
import { SITE_EMAIL, SITE_NAME, SITE_PHONE_DISPLAY } from '@/lib/site'

function euro(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € HT'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function fromAddress() {
  const configured = process.env.RESEND_FROM?.trim()
  if (configured) return configured
  return `"${SITE_NAME}" <${SITE_EMAIL}>`
}

type Line = { label: string; value: string }

function lines(row: NewCommande): Line[] {
  const isAbo = row.formule.startsWith('Abonnement')
  const items: Line[] = [
    { label: 'Restaurant', value: row.restaurant },
    { label: 'Contact', value: row.nom },
    { label: 'Email', value: row.email },
    { label: 'Téléphone', value: row.telephone },
    { label: 'Adresse de livraison', value: row.adresse },
    { label: 'Formule', value: row.formule },
    { label: 'Barquettes par livraison', value: String(row.barquettes) },
    { label: 'Jours de livraison', value: row.jours },
    { label: 'Montant par livraison', value: euro(row.montant_livraison) },
  ]
  if (isAbo) {
    items.push({
      label: 'Total par semaine',
      value: row.total_semaine == null ? '—' : euro(row.total_semaine),
    })
  }
  items.push({ label: 'Message', value: row.message || '—' })
  return items
}

function textBody(intro: string, items: Line[]) {
  return [
    intro,
    '',
    ...items.map((item) => `${item.label} : ${item.value}`),
    '',
    SITE_NAME,
    'Peyrolles-en-Provence',
    SITE_EMAIL,
    SITE_PHONE_DISPLAY,
  ].join('\n')
}

function htmlBody(intro: string, items: Line[]) {
  const rows = items
    .map(
      (item) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E7E1D6;color:#5C574E;font-size:14px;width:42%;vertical-align:top">${escapeHtml(item.label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E7E1D6;color:#141412;font-size:15px;vertical-align:top">${escapeHtml(item.value).replaceAll('\n', '<br>')}</td>
      </tr>`,
    )
    .join('')
  const introHtml = escapeHtml(intro).replaceAll('\n', '<br>')
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#F3EEE4;color:#141412">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEE4;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:8px;overflow:hidden">
        <tr><td style="background:#141412;padding:22px 28px">
          <div style="font-family:Georgia,'Times New Roman',serif;letter-spacing:0.14em;font-size:16px;color:#F3EEE4">LA FERME D'ARBUSSON</div>
          <div style="letter-spacing:0.18em;font-size:11px;color:#D4AE62;margin-top:4px">MICROGREENS &amp; AROMATIQUES</div>
        </td></tr>
        <tr><td style="padding:28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#141412">
          <p style="margin:0 0 20px">${introHtml}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E7E1D6">${rows}</table>
          <p style="margin:24px 0 0;font-size:14px;color:#5C574E">Peyrolles-en-Provence<br>${escapeHtml(SITE_EMAIL)} · ${escapeHtml(SITE_PHONE_DISPLAY)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function notifyOrder(row: NewCommande) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_NOTIFY_EMAIL?.trim() || SITE_EMAIL
  if (!apiKey) {
    console.error('RESEND_API_KEY manquante : emails de commande non envoyés.')
    return
  }

  const resend = new Resend(apiKey)
  const isAbo = row.formule.startsWith('Abonnement')
  const kind = isAbo ? "demande d'abonnement" : 'commande'
  const items = lines(row)
  const from = fromAddress()
  const farmIntro = `Nouvelle ${kind} pour ${row.restaurant}.`
  const guestIntro = [
    `Bonjour ${row.nom},`,
    '',
    `Merci, c'est semé. Votre demande est bien partie : nous vous rappelons très vite pour confirmer votre ${isAbo ? 'abonnement' : 'commande'}.`,
    'Aucun paiement en ligne.',
    '',
    'Voici le détail.',
  ].join('\n')

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: [to],
      replyTo: row.email,
      subject: `Nouvelle ${kind} — ${row.restaurant}`,
      text: textBody(farmIntro, items),
      html: htmlBody(farmIntro, items),
      tags: [{ name: 'type', value: 'commande_ferme' }],
    }),
    resend.emails.send({
      from,
      to: [row.email],
      replyTo: SITE_EMAIL,
      subject: `Merci, c'est semé — ${SITE_NAME}`,
      text: textBody(guestIntro, items),
      html: htmlBody(guestIntro, items),
      tags: [{ name: 'type', value: 'commande_client' }],
    }),
  ])

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(result.reason)
      continue
    }
    if (result.value.error) console.error(result.value.error)
  }
}

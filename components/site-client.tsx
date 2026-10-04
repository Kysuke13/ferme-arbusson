'use client'

import { useLayoutEffect, useRef } from 'react'
import { attachAddressAutocomplete } from '@/lib/address-places'

type Mode = 'abo' | 'unique'

export function SiteClient({ html, mapsApiKey }: { html: string; mapsApiKey: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const scope: HTMLDivElement = root

    const s = {
      mode: 'abo' as Mode,
      qty: 20,
      mar: true,
      ven: true,
      submitted: false,
      sending: false,
      formError: '',
    }

    function euro(n: number) {
      return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € HT'
    }
    function optStyle(on: boolean) {
      const base = 'text-align: left; padding: 16px 18px; border-radius: 6px; cursor: pointer; font: inherit; min-height: 76px; transition: all .15s; '
      return on
        ? base + 'background: #D4AE62; color: #0A0A08; border: 1px solid #D4AE62'
        : base + 'background: transparent; color: #F3EEE4; border: 1px solid rgba(243,238,228,0.3)'
    }
    function pillStyle(on: boolean) {
      const base = 'height: 44px; padding: 0 16px; border-radius: 999px; cursor: pointer; font: inherit; font-size: 14px; '
      return on
        ? base + 'background: #F3EEE4; color: #0A0A08; border: 1px solid #F3EEE4'
        : base + 'background: transparent; color: #E4DDD0; border: 1px solid rgba(243,238,228,0.25)'
    }
    function vals() {
      const isAbo = s.mode === 'abo'
      const n = (s.mar ? 1 : 0) + (s.ven ? 1 : 0)
      const per = s.qty * 3.5
      const w = per * n
      const m = (w * 52) / 12
      const days = s.mar && s.ven ? 'Mardi & vendredi' : s.mar ? 'Mardi' : 'Vendredi'
      const line = isAbo ? 'abonnement de ' + s.qty + ' barquettes · ' + days.toLowerCase() : 'commande de ' + s.qty + ' barquettes'
      return {
        qty: String(s.qty),
        isAbo,
        uniquePressed: String(!isAbo),
        aboPressed: String(isAbo),
        uniqueStyle: optStyle(!isAbo),
        aboStyle: optStyle(isAbo),
        marPressed: String(s.mar),
        venPressed: String(s.ven),
        marStyle: optStyle(s.mar),
        venStyle: optStyle(s.ven),
        perDelivery: euro(per),
        weeklyQty: String(s.qty * n),
        perMonth: '≈ ' + euro(m),
        daysLabel: days,
        mainTotal: (isAbo ? euro(w) : euro(per)).replace(' HT', ''),
        mainLabel: isAbo ? 'HT par semaine · sans engagement' : 'HT pour cette commande',
        ctaLabel: isAbo ? 'Démarrer mon abonnement' : 'Passer ma commande',
        summaryLine: line.charAt(0).toUpperCase() + line.slice(1),
        summaryLower: line,
        summaryTotal: isAbo ? euro(w) + ' par semaine' : euro(per),
        submitted: s.submitted,
        notSubmitted: !s.submitted,
        sending: s.sending,
        formError: s.formError,
        submitLabel: s.sending ? 'Envoi en cours…' : 'Envoyer ma commande',
        _n: n,
        _per: per,
        _w: w,
        _days: days,
      }
    }
    function render() {
      const v = vals()
      const view = v as Record<string, string | boolean | number>
      scope.querySelectorAll<HTMLElement>('[data-bind]').forEach((el) => {
        el.textContent = String(view[el.dataset.bind || ''] ?? '')
      })
      scope.querySelectorAll<HTMLElement>('[data-style]').forEach((el) => {
        el.setAttribute('style', String(view[el.dataset.style || ''] ?? ''))
      })
      scope.querySelectorAll<HTMLElement>('[data-pressed]').forEach((el) => {
        el.setAttribute('aria-pressed', String(view[el.dataset.pressed || ''] ?? ''))
      })
      scope.querySelectorAll<HTMLElement>('[data-if]').forEach((el) => {
        el.style.display = view[el.dataset.if || ''] ? '' : 'none'
      })
      scope.querySelectorAll<HTMLButtonElement>('[data-disabled]').forEach((el) => {
        const disabled = Boolean(view[el.dataset.disabled || ''])
        el.disabled = disabled
        el.style.opacity = disabled ? '0.6' : '1'
      })
      scope.querySelectorAll<HTMLElement>('[data-preset]').forEach((el) => {
        el.setAttribute('style', pillStyle(Number(el.dataset.preset) === s.qty))
      })
    }
    function field(name: string) {
      const el = scope.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)
      return el ? el.value.trim() : ''
    }
    function send() {
      if (s.sending) return
      const missing = [
        ['restaurant', 'le nom du restaurant'],
        ['nom', 'votre nom'],
        ['email', 'votre email'],
        ['telephone', 'votre téléphone'],
        ['adresse', "l'adresse de livraison"],
      ].filter(([name]) => !field(name))
      if (missing.length) {
        s.formError = 'Merci de renseigner ' + missing.map((item) => item[1]).join(', ') + '.'
        render()
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field('email'))) {
        s.formError = 'Merci de vérifier votre adresse email.'
        render()
        return
      }
      if (field('_honey')) {
        s.submitted = true
        render()
        return
      }
      const v = vals()
      const isAbo = s.mode === 'abo'
      const row = {
        restaurant: field('restaurant'),
        nom: field('nom'),
        email: field('email'),
        telephone: field('telephone'),
        adresse: field('adresse'),
        message: field('message'),
        formule: isAbo ? 'Abonnement hebdomadaire sans engagement' : 'Commande ponctuelle',
        barquettes: s.qty,
        jours: isAbo ? v._days : 'À convenir (mardi ou vendredi)',
        _honey: field('_honey'),
      }
      s.sending = true
      s.formError = ''
      render()
      fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          if (!response.ok) throw new Error(payload.error || 'Erreur')
        })
        .then(() => {
          s.sending = false
          s.submitted = true
          render()
        })
        .catch((error: unknown) => {
          s.sending = false
          s.formError = error instanceof Error && error.message && error.message !== 'Erreur'
            ? error.message
            : "L'envoi n'a pas abouti. Réessayez dans un instant ou appelez-nous directement."
          render()
        })
    }

    function onClick(event: Event) {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest<HTMLElement>('[data-action]')
      if (!button || !scope.contains(button)) return
      const action = button.dataset.action
      if (action === 'preset') s.qty = Number(button.dataset.preset)
      else if (action === 'setUnique') s.mode = 'unique'
      else if (action === 'setAbo') s.mode = 'abo'
      else if (action === 'inc') s.qty += 1
      else if (action === 'dec') s.qty = Math.max(10, s.qty - 1)
      else if (action === 'toggleMar') {
        if (s.mar && !s.ven) return
        s.mar = !s.mar
      } else if (action === 'toggleVen') {
        if (s.ven && !s.mar) return
        s.ven = !s.ven
      } else if (action === 'submit') send()
      else if (action === 'reset') {
        s.submitted = false
        scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#commande input, #commande textarea').forEach((el) => {
          el.value = ''
          el.dispatchEvent(new Event('input', { bubbles: true }))
        })
      }
      render()
    }

    scope.addEventListener('click', onClick)
    const detachAddress = attachAddressAutocomplete(scope, mapsApiKey)
    render()
    return () => {
      scope.removeEventListener('click', onClick)
      detachAddress()
    }
  }, [html, mapsApiKey])

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: html }} />
}

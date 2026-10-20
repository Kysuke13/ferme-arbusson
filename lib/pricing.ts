export const UNIT_PRICE = 3.5

// Remises sur la quantité commandée (par semaine en abonnement), de la plus forte à la plus faible.
export const DISCOUNTS = [
  { min: 50, rate: 0.15 },
  { min: 30, rate: 0.1 },
  { min: 20, rate: 0.05 },
] as const

export function discountRate(barquettes: number) {
  return DISCOUNTS.find((tier) => barquettes >= tier.min)?.rate ?? 0
}

function cents(n: number) {
  return Math.round(n * 100) / 100
}

export function orderTotal(barquettes: number) {
  return cents(barquettes * UNIT_PRICE * (1 - discountRate(barquettes)))
}

export function perDeliveryAmount(barquettes: number, deliveries: number) {
  return cents(orderTotal(barquettes) / Math.max(1, deliveries))
}

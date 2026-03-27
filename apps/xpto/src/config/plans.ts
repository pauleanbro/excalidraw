export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: "monthly",
    label: "Mensal",
    priceCents: 990,
    priceDisplay: "R$ 9,90",
    perMonth: "R$ 9,90",
    interval: "mês",
    badge: null,
    type: "recurring" as const,
    days: null,
  },
  yearly: {
    id: "yearly",
    label: "Anual",
    priceCents: 8990,
    priceDisplay: "R$ 89,90",
    perMonth: "R$ 7,49",
    interval: "ano",
    badge: "2 meses grátis",
    type: "oneoff" as const,
    days: null,
  },
} as const;

export const ONEOFF_PLANS = {
  "3days": {
    id: "3days",
    label: "3 dias",
    priceCents: 475,
    priceDisplay: "R$ 4,75",
    days: 3,
    type: "oneoff" as const,
  },
  "7days": {
    id: "7days",
    label: "7 dias",
    priceCents: 775,
    priceDisplay: "R$ 7,75",
    days: 7,
    type: "oneoff" as const,
  },
  "15days": {
    id: "15days",
    label: "15 dias",
    priceCents: 1075,
    priceDisplay: "R$ 10,75",
    days: 15,
    type: "oneoff" as const,
  },
  "30days": {
    id: "30days",
    label: "30 dias",
    priceCents: 1575,
    priceDisplay: "R$ 15,75",
    days: 30,
    type: "oneoff" as const,
  },
} as const;

export const ALL_PLANS = { ...SUBSCRIPTION_PLANS, ...ONEOFF_PLANS } as const;

export type PlanInterval = keyof typeof ALL_PLANS;
export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;
export type OneoffPlanKey = keyof typeof ONEOFF_PLANS;

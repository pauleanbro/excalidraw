const WOOVI_API = "https://api.openpix.com.br/api/v1";

const headers = () => ({
  Authorization: process.env.WOOVI_APPID!,
  "Content-Type": "application/json",
});

export type WooviChargeResponse = {
  charge: {
    correlationID: string;
    value: number;
    status: string;
    brCode: string;
    paymentLinkUrl: string;
    qrCodeImage: string;
    expiresIn: number;
    expiresDate: string;
  };
};

/**
 * Create a Pix charge on Woovi/OpenPix.
 */
export async function createCharge(opts: {
  correlationID: string;
  valueCents: number;
  comment: string;
  customer?: {
    name: string;
    email: string;
  };
  expiresIn?: number;
}): Promise<WooviChargeResponse> {
  const body: Record<string, unknown> = {
    correlationID: opts.correlationID,
    value: opts.valueCents,
    comment: opts.comment,
  };

  if (opts.customer) {
    body.customer = opts.customer;
  }

  if (opts.expiresIn) {
    body.expiresIn = opts.expiresIn;
  }

  const res = await fetch(`${WOOVI_API}/charge`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Woovi charge creation failed: ${res.status} – ${err}`);
  }

  return res.json();
}

/**
 * Get charge details by correlationID.
 */
export async function getCharge(
  correlationID: string,
): Promise<WooviChargeResponse> {
  const res = await fetch(`${WOOVI_API}/charge/${correlationID}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Woovi getCharge failed: ${res.status} – ${err}`);
  }

  return res.json();
}

// ── Subscriptions (recurring Pix) ───────────────────────────

export type WooviSubscriptionResponse = {
  subscription: {
    globalID: string;
    value: number;
    dayGenerateCharge: number;
    customer: { name: string; email: string };
  };
  charge?: {
    correlationID: string;
    value: number;
    status: string;
    brCode: string;
    paymentLinkUrl: string;
    qrCodeImage: string;
  };
};

/**
 * Create a recurring Pix subscription on Woovi/OpenPix.
 * Returns the subscription and its first auto-generated charge (with QR code).
 */
export async function createSubscription(opts: {
  value: number;
  customer: { name: string; email: string; taxID?: string };
  dayGenerateCharge?: number;
}): Promise<WooviSubscriptionResponse> {
  const body: Record<string, unknown> = {
    value: opts.value,
    customer: opts.customer,
    dayGenerateCharge: opts.dayGenerateCharge ?? Math.min(new Date().getDate(), 28),
  };

  const res = await fetch(`${WOOVI_API}/subscriptions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Woovi subscription creation failed: ${res.status} – ${err}`);
  }

  return res.json();
}

/**
 * Get subscription details by globalID.
 */
export async function getSubscription(
  globalID: string,
): Promise<WooviSubscriptionResponse> {
  const res = await fetch(`${WOOVI_API}/subscriptions/${globalID}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Woovi getSubscription failed: ${res.status} – ${err}`);
  }

  return res.json();
}

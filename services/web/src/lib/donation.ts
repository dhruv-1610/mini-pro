import { api } from './api';

const MIN_AMOUNT_PAISE = 1000; // ₹10

export { MIN_AMOUNT_PAISE };

/** Create a donation PaymentIntent for a drive. Returns clientSecret for Stripe. */
export async function createDonationIntent(
  driveId: string,
  amountPaise: number
): Promise<{ clientSecret: string }> {
  if (amountPaise < MIN_AMOUNT_PAISE) {
    throw new Error(`Minimum donation is ₹10`);
  }
  const res = await api.post<{ clientSecret: string }>(`/api/drives/${driveId}/donate`, {
    amount: amountPaise,
  });
  return res.data;
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

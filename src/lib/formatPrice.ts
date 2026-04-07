// Simple BDT price formatter — no DB call needed

/**
 * Format a BDT amount.
 */
export function formatPrice(amountInBDT: number): string {
  return `BDT ${amountInBDT.toLocaleString("en-BD")}`;
}

export function getSelectedCurrencyCode(): string {
  return "BDT";
}
